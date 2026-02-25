import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export const revalidate = 0 // Never cache this page to show live status

export default async function AccessRequestsPage() {
    // Basic fetch for MVP listing
    const { data: requestsRaw } = await supabase
        .from('access_requests')
        .select(`
            *,
            Employee (FirstName, LastName)
        `)
        .order('created_at', { ascending: false })

    const requests = requestsRaw || []

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Access Requests</h1>
                    <p className="text-gray-500 mt-1">Manage digital access forms and permissions.</p>
                </div>
                <Link
                    href="/access-requests/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition-colors text-sm font-medium flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    New Request
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                            <th className="p-4 font-semibold">Employee</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold">Submitted</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-400">
                                    No access requests found.
                                </td>
                            </tr>
                        ) : (
                            requests.map((req: any) => (
                                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium text-gray-900">
                                        {req.Employee?.FirstName} {req.Employee?.LastName}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                            ${req.status === 'Draft' ? 'bg-gray-100 text-gray-800' : ''}
                                            ${req.status === 'Pending Approval' ? 'bg-yellow-100 text-yellow-800' : ''}
                                            ${req.status === 'Approved' ? 'bg-green-100 text-green-800' : ''}
                                            ${req.status === 'Rejected' ? 'bg-red-100 text-red-800' : ''}
                                            ${req.status === 'Completed' ? 'bg-blue-100 text-blue-800' : ''}
                                        `}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link
                                            href={`/access-requests/${req.id}`}
                                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                        >
                                            View
                                        </Link>
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
