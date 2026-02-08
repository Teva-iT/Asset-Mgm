import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
    const today = new Date()

    // 1. Overdue Assets
    const overdueAssignments = await prisma.assignment.findMany({
        where: {
            ExpectedReturnDate: { lt: today },
            ActualReturnDate: null,
            Status: 'Active'
        },
        include: { Asset: true, Employee: true }
    })

    // 2. Lost Assets
    const lostAssets = await prisma.asset.findMany({
        where: { Status: 'Lost' }
    })

    // 3. Assets by Department
    // Prisma groupBy is good for simple counts
    const assetsByDept = await prisma.employee.groupBy({
        by: ['Department'],
        _count: {
            Department: true // This counts employees, not assets directly. 
            // To count assets per department, we need to join assignments.
            // Prisma doesn't support deep relation aggregation easily in groupBy.
            // We'll fetch employees with active assignments and aggregate manually or use raw query.
            // Manual aggregation for simplicity and type safety:
        }
    })

    // Alternative: Fetch all active assignments and group by Employee.Department
    const allActiveAssignments = await prisma.assignment.findMany({
        where: { Status: 'Active' },
        include: { Employee: true }
    })

    const deptStats: Record<string, number> = {}
    allActiveAssignments.forEach(a => {
        const dept = a.Employee.Department
        deptStats[dept] = (deptStats[dept] || 0) + 1
    })

    return (
        <div className="container">
            <div className="header">
                <h1>Reports</h1>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                {/* Overdue Report */}
                <div className="card">
                    <h2 style={{ color: '#b91c1c', marginTop: 0 }}>Overdue Assets ({overdueAssignments.length})</h2>
                    {overdueAssignments.length === 0 ? (
                        <p>No overdue assets.</p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Asset</th>
                                    <th>Employee</th>
                                    <th>Due Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overdueAssignments.map(a => (
                                    <tr key={a.AssignmentID}>
                                        <td>{a.Asset.AssetName}</td>
                                        <td>{a.Employee.LastName}</td>
                                        <td style={{ color: '#b91c1c', fontWeight: 'bold' }}>
                                            {new Date(a.ExpectedReturnDate!).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Lost Assets Report */}
                <div className="card">
                    <h2 style={{ color: '#b45309', marginTop: 0 }}>Lost Assets ({lostAssets.length})</h2>
                    {lostAssets.length === 0 ? (
                        <p>No lost assets reported.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {lostAssets.map(a => (
                                <li key={a.AssetID} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                    <strong>{a.AssetName}</strong> ({a.SerialNumber})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Department Stats */}
                <div className="card">
                    <h2 style={{ marginTop: 0 }}>Active Assets by Department</h2>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Department</th>
                                <th>Count</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(deptStats).map(([dept, count]) => (
                                <tr key={dept}>
                                    <td>{dept}</td>
                                    <td><strong>{count}</strong></td>
                                </tr>
                            ))}
                            {Object.keys(deptStats).length === 0 && (
                                <tr><td colSpan={2}>No active assignments.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    )
}
