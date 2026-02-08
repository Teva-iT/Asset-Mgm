import { prisma } from '@/lib/db'
import EmployeeForm from '@/components/EmployeeForm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EmployeeCriticalActions from '@/components/EmployeeCriticalActions'

export const dynamic = 'force-dynamic'

export default async function EditEmployeePage({ params }: { params: { id: string } }) {
    const employee = await prisma.employee.findUnique({
        where: { EmployeeID: params.id }
    })

    if (!employee) notFound()

    return (
        <div className="container">
            <div className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ margin: 0 }}>Edit Employee</h1>
                </div>
                <Link href={`/employees/${employee.EmployeeID}`} className="btn btn-outline" style={{ backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                    Back
                </Link>
            </div>
            <div style={{ maxWidth: '800px', margin: '2rem auto' }}>
                <EmployeeForm employee={employee} />
                <EmployeeCriticalActions employee={employee} />
            </div>
        </div>
    )
}
