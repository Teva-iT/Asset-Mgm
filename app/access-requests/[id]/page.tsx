import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AccessRequestActions from '@/components/AccessRequestActions'
import AccessRequestExportOptions from '@/components/AccessRequestExportOptions'
import AccessRequestPrintView from '@/components/AccessRequestPrintView'

export const revalidate = 0

export default async function AccessRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Fetch the request, its creator, and its items all at once
    const { data: requestRaw, error } = await supabase
        .from('access_requests')
        .select(`
            *,
            Creator:User!access_requests_created_by_fkey (Name, Role),
            Items:access_request_items (*),
            Logs:access_request_status_logs (
                created_at, old_status, new_status, comments, 
                User!access_request_status_logs_changed_by_fkey (Name)
            )
        `)
        .eq('id', id)
        .single()

    if (error || !requestRaw) {
        notFound()
    }

    if (requestRaw.employee_id) {
        const { data: employeeData } = await supabase
            .from('Employee')
            .select('FirstName, LastName, Department, Title, Email')
            .eq('EmployeeID', requestRaw.employee_id)
            .maybeSingle()
        if (employeeData) requestRaw.Employee = employeeData
    }

    const req = requestRaw as any
    const items = req.Items || []
    const logs = req.Logs?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []

    const softwareItems = items.filter((i: any) => i.section_name === 'Software / Application Access')
    const folderItems = items.filter((i: any) => i.section_name === 'Folder / Distribution / Special Access')

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div>
                    <Link href="/access-requests" className="text-sm font-medium text-blue-600 hover:text-blue-800 mb-2 inline-flex items-center gap-1">
                        &larr; Back to List
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900 mt-2">Access Request Details</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Request ID: <span className="font-mono text-gray-400 text-xs">{req.id}</span>
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
                    <AccessRequestExportOptions req={req} items={items} />

                    <div className="flex items-center gap-4 print:hidden">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold
                            ${req.status === 'Draft' ? 'bg-gray-100 text-gray-800' : ''}
                            ${req.status === 'Submitted' || req.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-800' : ''}
                            ${req.status === 'Approved' ? 'bg-green-100 text-green-800' : ''}
                            ${req.status === 'Rejected' ? 'bg-red-100 text-red-800' : ''}
                            ${req.status === 'Completed' ? 'bg-blue-100 text-blue-800' : ''}
                        `}>
                            {req.status}
                        </span>

                        <AccessRequestActions requestId={req.id} initialStatus={req.status} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Form Details */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Block 1: Employee Data */}
                    <div className="card shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold bg-gray-50 -mx-6 -mt-6 p-4 border-b rounded-t-xl text-gray-800 mb-4">
                            1. Employee Data
                        </h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="block text-gray-500 uppercase text-xs tracking-wider mb-1">Name</span>
                                <span className="font-medium text-gray-900">{req.Employee?.FirstName} {req.Employee?.LastName}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 uppercase text-xs tracking-wider mb-1">Department</span>
                                <span className="font-medium text-gray-900">{req.Employee?.Department || '-'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 uppercase text-xs tracking-wider mb-1">Email</span>
                                <span className="font-medium text-gray-900">{req.Employee?.Email || '-'}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 uppercase text-xs tracking-wider mb-1">Requested By</span>
                                <span className="font-medium text-gray-900">{req.Creator?.Name || '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Block 2: Software Access */}
                    <div className="card shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold bg-gray-50 -mx-6 -mt-6 p-4 border-b rounded-t-xl text-gray-800 mb-4">
                            2. Software / Application Access
                        </h2>
                        {softwareItems.length === 0 ? (
                            <p className="text-gray-500 text-sm italic">No software access requested.</p>
                        ) : (
                            <ul className="space-y-3">
                                {softwareItems.map((item: any) => (
                                    <li key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="font-semibold text-gray-900">{item.field_name}</div>
                                        {item.justification && (
                                            <div className="text-sm text-gray-600 mt-1 pl-3 border-l-2 border-gray-200">
                                                <span className="text-xs text-gray-400 block mb-0.5">Justification / Detail:</span>
                                                {item.justification}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Block 3: Folder Access */}
                    <div className="card shadow-sm border border-gray-200">
                        <h2 className="text-lg font-bold bg-gray-50 -mx-6 -mt-6 p-4 border-b rounded-t-xl text-gray-800 mb-4">
                            3. Folder / Distribution / Special Access
                        </h2>
                        {folderItems.length === 0 ? (
                            <p className="text-gray-500 text-sm italic">No special access requested.</p>
                        ) : (
                            <ul className="space-y-3">
                                {folderItems.map((item: any) => (
                                    <li key={item.id} className="p-3 bg-indigo-50/30 rounded-lg border border-indigo-100">
                                        <div className="font-semibold text-gray-900">{item.field_name}</div>
                                        {item.justification && (
                                            <div className="text-sm text-gray-600 mt-1 pl-3 border-l-2 border-indigo-200">
                                                <span className="text-xs text-gray-400 block mb-0.5">Path / Email / Detail:</span>
                                                {item.justification}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Right Column: Workflow Context & Logs */}
                <div className="space-y-6">
                    <div className="card shadow-sm border border-gray-200 bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Timeline</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Submitted</span>
                                <span className="font-medium text-gray-900">{req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Approved</span>
                                <span className="font-medium text-gray-900">{req.approved_at ? new Date(req.approved_at).toLocaleDateString() : '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Completed</span>
                                <span className="font-medium text-gray-900">{req.finalized_at ? new Date(req.finalized_at).toLocaleDateString() : '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card shadow-sm border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">Activity Log</h3>
                        <div className="space-y-4">
                            {logs.map((log: any) => (
                                <div key={log.created_at} className="text-sm border-l-2 border-gray-200 pl-3 relative">
                                    <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-gray-300"></div>
                                    <div className="text-xs text-gray-400 mb-0.5">{new Date(log.created_at).toLocaleString()}</div>
                                    <div className="text-gray-800">
                                        <span className="font-semibold">{log.User?.Name || 'System'}</span> changed status to <span className="font-semibold">{log.new_status}</span>
                                    </div>
                                    {log.comments && (
                                        <div className="text-gray-600 mt-1 italic text-xs bg-white p-2 border rounded">"{log.comments}"</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* Print Only View */}
            <AccessRequestPrintView req={req} items={items} />
        </div>
    )
}
