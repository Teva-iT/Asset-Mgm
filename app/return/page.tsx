import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import ReturnButton from '@/components/ReturnButton'

export const dynamic = 'force-dynamic'

export default async function ReturnPortalPage() {
    const { data: activeAssignmentsRaw } = await supabase
        .from("Assignment")
        .select("*, Asset(*), Employee(*)")
        .eq("Status", "Active")
        .order("AssignedDate", { ascending: false });

    const activeAssignments = activeAssignmentsRaw || [];
    return (
        <div className="container py-8">
            <h1 className="text-2xl font-bold mb-6">Return Asset Portal</h1>
            <p className="mb-6 text-gray-600">Select an asset to return from the list of currently active assignments.</p>

            <div className="card">
                {activeAssignments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No active assignments found.</p>
                ) : (
                    <div className="table-container">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>Asset</th>
                                    <th>Employee</th>
                                    <th>Assigned Date</th>
                                    <th>Expected Return</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeAssignments.map((assignment) => (
                                    <tr key={assignment.AssignmentID}>
                                        <td>
                                            <div className="font-medium">{assignment.Asset.AssetName}</div>
                                            <div className="text-sm text-gray-500">{assignment.Asset.SerialNumber}</div>
                                        </td>
                                        <td>
                                            <div className="font-medium">{assignment.Employee.FirstName} {assignment.Employee.LastName}</div>
                                            <div className="text-sm text-gray-500">{assignment.Employee.Department}</div>
                                        </td>
                                        <td>{new Date(assignment.AssignedDate).toLocaleDateString()}</td>
                                        <td>
                                            {assignment.ExpectedReturnDate
                                                ? new Date(assignment.ExpectedReturnDate).toLocaleDateString()
                                                : '-'}
                                        </td>
                                        <td>
                                            <ReturnButton assignmentId={assignment.AssignmentID} assetId={assignment.AssetID} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="mt-6">
                <Link href="/" className="btn btn-outline">Back to Dashboard</Link>
            </div>
        </div>
    )
}
