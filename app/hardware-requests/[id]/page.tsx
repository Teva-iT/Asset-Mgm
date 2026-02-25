import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'

export const revalidate = 0

export default async function HardwareRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Fetch Hardware Request Record with Employee and Onboarding context
    const { data: request, error } = await supabase
        .from('hardware_requests')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !request) {
        notFound()
    }

    if (request.employee_id) {
        const { data: employeeData } = await supabase
            .from('Employee')
            .select('FirstName, LastName, Department, Email')
            .eq('EmployeeID', request.employee_id)
            .maybeSingle()
        if (employeeData) request.employee = employeeData
    }

    // Fetch Standard Items
    const { data: standardItems } = await supabase
        .from('hardware_standard_items')
        .select('*')
        .eq('hardware_request_id', id)
        .order('created_at')

    // Fetch Additional Items
    const { data: additionalItems } = await supabase
        .from('hardware_additional_items')
        .select('*')
        .eq('hardware_request_id', id)
        .order('created_at')

    return (
        <div className="container mx-auto p-6 max-w-4xl space-y-6">

            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-4 items-center">
                    {request.onboarding_request_id && (
                        <Link href={`/onboarding/${request.onboarding_request_id}`} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1">
                            <span>&larr;</span> Back to Onboarding
                        </Link>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        Hardware Request
                        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {request.request_type}
                        </span>
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Requested for: <strong>{request.employee?.FirstName} {request.employee?.LastName}</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                        {request.employee?.Department} • {request.employee?.Email}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                        ${request.status === 'Draft' ? 'bg-gray-100 text-gray-800' : ''}
                        ${request.status === 'Pending IT Review' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${request.status === 'Ordered' ? 'bg-blue-100 text-blue-800' : ''}
                        ${request.status === 'Ready for Pickup' ? 'bg-purple-100 text-purple-800' : ''}
                        ${request.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                        {request.status}
                    </span>
                    <span className="text-xs text-gray-400">Created {new Date(request.created_at).toLocaleDateString()}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Standard Bundle Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-100 p-4">
                        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Standard Bundle Items</h2>
                    </div>
                    <div className="p-4">
                        {standardItems && standardItems.length > 0 ? (
                            <ul className="space-y-2">
                                {standardItems.map((item: any) => (
                                    <li key={item.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                        <span className="font-medium text-gray-800">{item.item_name} <span className="text-gray-500 text-xs ml-2">({item.item_category})</span></span>
                                        <span className={item.is_requested ? 'text-green-600' : 'text-gray-400'}>
                                            {item.is_requested ? 'Requested' : 'Not Needed'}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 italic text-center py-4">No standard items configured.</p>
                        )}

                        {/* Placeholder for Edit/Add Form in future iteration */}
                        {request.status === 'Draft' && (
                            <button className="mt-4 w-full py-2 border border-dashed border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                                + Configure Standard Bundle
                            </button>
                        )}
                    </div>
                </div>

                {/* Additional Needs Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-100 p-4">
                        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Additional Requirements</h2>
                    </div>
                    <div className="p-4">
                        {additionalItems && additionalItems.length > 0 ? (
                            <ul className="space-y-3">
                                {additionalItems.map((item: any) => (
                                    <li key={item.id} className="text-sm p-3 bg-amber-50 rounded border border-amber-100">
                                        <div className="font-medium text-amber-900">{item.item_description}</div>
                                        {item.business_justification && (
                                            <div className="text-xs text-amber-700 mt-1">{item.business_justification}</div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500 italic text-center py-4">No additional hardware requested.</p>
                        )}

                        {/* Placeholder for Edit/Add Form in future iteration */}
                        {request.status === 'Draft' && (
                            <button className="mt-4 w-full py-2 border border-dashed border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                                + Add Custom Hardware
                            </button>
                        )}
                    </div>
                </div>

            </div>

        </div>
    )
}
