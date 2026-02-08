import Link from 'next/link'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
    const employees = await prisma.employee.findMany({
        orderBy: { LastName: 'asc' },
        include: {
            _count: {
                select: { assignments: { where: { Status: 'Active' } } }
            }
        }
    })

    return (
        <div className="container">
            <div className="header">
                <h1>Employees</h1>
                <Link href="/employees/new" className="btn btn-primary">+ Add Employee</Link>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Email</th>
                            <th>Assigned Assets</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.EmployeeID}>
                                <td style={{ fontWeight: 500 }}>{emp.FirstName} {emp.LastName}</td>
                                <td><span className="badge badge-returned">{emp.Department}</span></td>
                                <td>{emp.Email}</td>
                                <td>
                                    {emp._count.assignments > 0 ? (
                                        <span className="badge badge-assigned">{emp._count.assignments} Devices</span>
                                    ) : (
                                        <span style={{ color: '#888' }}>-</span>
                                    )}
                                </td>
                                <td>
                                    <Link href={`/employees/${emp.Slug || emp.EmployeeID}`} className="btn btn-outline" style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}>
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {employees.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>No employees found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
