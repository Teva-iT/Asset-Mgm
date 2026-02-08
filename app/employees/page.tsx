import Link from 'next/link'
import { prisma } from '@/lib/db'
import EmployeePageActions from '@/components/EmployeePageActions'
import EmployeeSearch from '@/components/EmployeeSearch'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage({
    searchParams,
}: {
    searchParams?: {
        q?: string
    }
}) {
    const query = searchParams?.q || ''

    const employees = await prisma.employee.findMany({
        where: {
            OR: query ? [
                { FirstName: { contains: query, mode: 'insensitive' } },
                { LastName: { contains: query, mode: 'insensitive' } },
                { Email: { contains: query, mode: 'insensitive' } },
            ] : undefined
        },
        orderBy: { LastName: 'asc' },
        include: {
            _count: {
                select: { assignments: { where: { Status: 'Active' } } }
            }
        }
    })

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Employees</h1>
                    <p className="text-gray-500 mt-1">Manage employee records and asset assignments.</p>
                </div>
                <EmployeePageActions employees={employees} />
            </div>

            {/* Smart Search Bar */}
            <div className="mb-8">
                <EmployeeSearch placeholder="Search employees by name or email..." />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned Assets</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {employees.map(emp => (
                            <tr key={emp.EmployeeID} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{emp.FirstName} {emp.LastName}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {emp.Department}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500">{emp.Email}</td>
                                <td className="px-6 py-4">
                                    {emp._count.assignments > 0 ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                            {emp._count.assignments} Devices
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={`/employees/${emp.Slug || emp.EmployeeID}`}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                                    >
                                        View Details
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        {employees.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <p className="text-lg font-medium text-gray-900">No employees found</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {query ? `No match for "${query}"` : 'Get started by adding a new employee.'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
