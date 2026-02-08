import Link from 'next/link'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
    const [
        assetCount,
        availableCount,
        assignedCount,
        overdueCount,
        recentAssignments,
        topEmployees,
        overdueAssets
    ] = await Promise.all([
        prisma.asset.count(),
        prisma.asset.count({ where: { Status: 'Available' } }),
        prisma.asset.count({ where: { Status: 'Assigned' } }),
        prisma.assignment.count({
            where: {
                ExpectedReturnDate: { lt: new Date() },
                ActualReturnDate: null,
                Status: 'Active'
            }
        }),
        // Recent Assignments (Last 7 days)
        prisma.assignment.findMany({
            where: { AssignedDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
            include: { Asset: true, Employee: true },
            orderBy: { AssignedDate: 'desc' },
            take: 5
        }),
        // Top Employees (approximated by finding all and sorting in JS for now, Prisma group-by is strictly typed)
        prisma.employee.findMany({
            include: {
                _count: {
                    select: { assignments: { where: { Status: 'Active' } } }
                }
            },
            take: 100 // Limit for safety
        }).then(emps => emps
            .filter(e => e._count.assignments > 0)
            .sort((a, b) => b._count.assignments - a._count.assignments)
            .slice(0, 5)
        ),
        // Overdue Assets Detailed
        prisma.assignment.findMany({
            where: {
                ExpectedReturnDate: { lt: new Date() },
                ActualReturnDate: null,
                Status: 'Active'
            },
            include: { Asset: true, Employee: true },
            take: 5
        })
    ])

    return (
        <div className="container">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard</h1>

            {/* 1. Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <DashboardCard title="Total Assets" value={assetCount} color="#2563eb" />
                <DashboardCard title="Available" value={availableCount} color="#059669" />
                <DashboardCard title="Assigned" value={assignedCount} color="#7c3aed" />
                <DashboardCard title="Overdue" value={overdueCount} color="#dc2626" />
            </div>



            {/* 3. Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Overdue Alerts */}
                <div className="card border-l-4 border-red-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-red-700">⚠️ Overdue Assets</h3>
                        <Link href="/reports" className="text-sm text-blue-600 hover:underline">View All</Link>
                    </div>
                    {overdueAssets.length === 0 ? (
                        <p className="text-gray-500">No overdue assets.</p>
                    ) : (
                        <ul className="space-y-3">
                            {overdueAssets.map(a => (
                                <li key={a.AssignmentID} className="flex justify-between items-start border-b pb-2 last:border-0">
                                    <div>
                                        <div className="font-medium text-gray-900">{a.Asset.AssetName}</div>
                                        <div className="text-sm text-gray-500">Assigned to: {a.Employee.FirstName} {a.Employee.LastName}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-red-600 font-medium text-sm">
                                            Due: {a.ExpectedReturnDate ? new Date(a.ExpectedReturnDate).toLocaleDateString() : 'N/A'}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* High Possession */}
                <div className="card">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">High Possession Employees</h3>
                    {topEmployees.length === 0 ? (
                        <p className="text-gray-500">No active assignments.</p>
                    ) : (
                        <ul className="space-y-3">
                            {topEmployees.map(e => (
                                <li key={e.EmployeeID} className="flex justify-between items-center border-b pb-2 last:border-0">
                                    <div className="font-medium text-gray-900">{e.FirstName} {e.LastName}</div>
                                    <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                                        {e._count.assignments} Assets
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="card lg:col-span-2">
                    <h3 className="text-lg font-bold mb-4 text-gray-700">Recent Assignments (Last 7 Days)</h3>
                    {recentAssignments.length === 0 ? (
                        <p className="text-gray-500">No recent activity.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-600 border-b">
                                        <th className="p-3">Asset</th>
                                        <th className="p-3">Employee</th>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentAssignments.map(a => (
                                        <tr key={a.AssignmentID} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="p-3">
                                                <div className="font-medium">{a.Asset.AssetName}</div>
                                                <div className="text-xs text-gray-500">{a.Asset.SerialNumber}</div>
                                            </td>
                                            <td className="p-3">{a.Employee.FirstName} {a.Employee.LastName}</td>
                                            <td className="p-3">{new Date(a.AssignedDate).toLocaleDateString()}</td>
                                            <td className="p-3">
                                                <Link href={`/assets/${a.AssetID}`} className="text-blue-600 hover:underline text-sm">View</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function DashboardCard({ title, value, color }: { title: string, value: number, color: string }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border-t-4" style={{ borderColor: color }}>
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</h3>
            <p className="text-4xl font-bold" style={{ color: color }}>{value}</p>
        </div>
    )
}
