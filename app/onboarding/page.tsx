import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import DeleteOnboardingButton from '@/components/DeleteOnboardingButton'

export const revalidate = 0

export default async function OnboardingRequestsPage() {
    const { data: requestsRaw } = await supabase
        .from('onboarding_requests')
        .select('*')
        .order('created_at', { ascending: false })

    const requests = requestsRaw || []

    // Map employees manually
    if (requests.length > 0) {
        const empIds = [...new Set(requests.map(r => r.employee_id))]
        const { data: emps } = await supabase.from('Employee').select('EmployeeID, FirstName, LastName').in('EmployeeID', empIds)
        if (emps) {
            const empMap = new Map(emps.map(e => [e.EmployeeID, e]))
            requests.forEach(r => r.employee = empMap.get(r.employee_id))
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Onboarding Requests</h1>
                    <p className="text-gray-500 mt-1">Manage global onboarding orchestration and pipelines.</p>
                </div>
                <Link
                    href="/onboarding/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm font-medium flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    New Onboarding Request
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold">Employee</th>
                            <th className="p-4 font-semibold">Start Date</th>
                            <th className="p-4 font-semibold">Workflow Status</th>
                            <th className="p-4 font-semibold">Orchestration</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400">
                                    No onboarding requests found.
                                </td>
                            </tr>
                        ) : (
                            requests.map((req: any) => (
                                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium text-gray-900">
                                        {req.employee?.FirstName} {req.employee?.LastName}
                                    </td>
                                    <td className="p-4 text-sm text-gray-700">
                                        {req.start_date ? new Date(req.start_date).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${req.status === 'Draft' ? 'bg-gray-100 text-gray-800' : ''}
                                            ${req.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : ''}
                                            ${req.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}
                                            ${req.status === 'Cancelled' ? 'bg-red-100 text-red-800' : ''}
                                        `}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-gray-500">
                                        {req.include_access && <span className="mr-2 px-2 py-1 bg-purple-50 text-purple-700 rounded border border-purple-100">Access</span>}
                                        {req.include_hardware && <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-100">Hardware</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <Link
                                                href={`/onboarding/${req.id}`}
                                                className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                            >
                                                View Dashboard
                                            </Link>
                                            <DeleteOnboardingButton
                                                id={req.id}
                                                employeeName={`${req.employee?.FirstName} ${req.employee?.LastName}`}
                                                isIconOnly={true}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
