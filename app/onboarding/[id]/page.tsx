import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import DeleteOnboardingButton from '@/components/DeleteOnboardingButton'

export const revalidate = 0

export default async function OnboardingDashboardPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // 1. Fetch Onboarding Record with Employee
    const { data: onboarding, error } = await supabase
        .from('onboarding_requests')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !onboarding) {
        notFound()
    }

    // 1.5 Fetch Employee Manually to bypass PostgREST schema cache issues on joins
    if (onboarding.employee_id) {
        const { data: employeeData } = await supabase
            .from('Employee')
            .select('FirstName, LastName, Department, Email')
            .eq('EmployeeID', onboarding.employee_id)
            .maybeSingle()
        if (employeeData) onboarding.Employee = employeeData
    }

    // 2. Fetch Child Access Requests
    const { data: accessRequests } = await supabase
        .from('access_requests')
        .select('id, status, created_at')
        .eq('onboarding_request_id', id)

    // 3. Fetch Child Hardware Requests
    const { data: hardwareRequests } = await supabase
        .from('hardware_requests')
        .select('id, request_type, status, created_at')
        .eq('onboarding_request_id', id)

    return (
        <div className="container mx-auto p-6 max-w-5xl space-y-6">
            <Link href="/onboarding" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
                <span>&larr;</span> Back to Onboarding List
            </Link>

            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Onboarding: {onboarding.Employee?.FirstName} {onboarding.Employee?.LastName}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {onboarding.Employee?.Department} • Start Date: {new Date(onboarding.start_date).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                            ${onboarding.status === 'Draft' ? 'bg-gray-100 text-gray-800' : ''}
                            ${onboarding.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : ''}
                            ${onboarding.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}
                        `}>
                            {onboarding.status}
                        </span>
                    </div>
                </div>
                <div className="flex justify-end mt-4 gap-2">
                    <Link
                        href={`/onboarding/${onboarding.id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg shadow-sm font-medium text-sm hover:bg-gray-50 transition-colors"
                    >
                        Edit Workflow
                    </Link>
                    <DeleteOnboardingButton
                        id={onboarding.id}
                        employeeName={`${onboarding.Employee?.FirstName} ${onboarding.Employee?.LastName}`}
                    />
                </div>
                {onboarding.notes && (
                    <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-100 text-sm">
                        <strong className="block mb-1">Notes:</strong>
                        {onboarding.notes}
                    </div>
                )}
            </div>

            {/* Orchestration Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Logical Access Card */}
                {onboarding.include_access && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="bg-purple-50 border-b border-gray-100 p-4">
                            <h2 className="text-lg font-semibold text-purple-900">Logical Access</h2>
                            <p className="text-xs text-purple-700 mt-1">AD Accounts, Software, Permissions</p>
                        </div>
                        <div className="p-4 flex-1">
                            {accessRequests && accessRequests.length > 0 ? (
                                <ul className="space-y-3">
                                    {accessRequests.map((req: any) => (
                                        <li key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">Access Request</div>
                                                <div className="text-xs text-gray-500">Status: {req.status}</div>
                                            </div>
                                            <Link
                                                href={`/access-requests/${req.id}`}
                                                className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded shadow-sm hover:bg-gray-50 transition-colors"
                                            >
                                                Manage
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Expected to generate, but missing.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Physical Hardware Card */}
                {onboarding.include_hardware && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="bg-amber-50 border-b border-gray-100 p-4">
                            <h2 className="text-lg font-semibold text-amber-900">Physical Hardware</h2>
                            <p className="text-xs text-amber-700 mt-1">Laptops, Phones, Workstation setup</p>
                        </div>
                        <div className="p-4 flex-1">
                            {hardwareRequests && hardwareRequests.length > 0 ? (
                                <ul className="space-y-3">
                                    {hardwareRequests.map((req: any) => (
                                        <li key={req.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{req.request_type} Request</div>
                                                <div className="text-xs text-gray-500">Status: {req.status}</div>
                                            </div>
                                            <Link
                                                href={`/hardware-requests/${req.id}`}
                                                className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded shadow-sm hover:bg-gray-50 transition-colors"
                                            >
                                                Manage
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Expected to generate, but missing.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>
    )
}
