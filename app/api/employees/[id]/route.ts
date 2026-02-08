import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        let employee = await prisma.employee.findUnique({
            where: { EmployeeID: params.id },
            include: {
                assignments: {
                    where: { Status: 'Active' },
                    include: { Asset: true }
                }
            }
        })

        if (!employee) {
            employee = await prisma.employee.findUnique({
                where: { Slug: params.id },
                include: {
                    assignments: {
                        where: { Status: 'Active' },
                        include: { Asset: true }
                    }
                }
            })
        }
        if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
        return NextResponse.json(employee)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { FirstName, LastName, Email, Department, StartDate, Status, EndDate } = body

        // Fetch current employee to check for transitions
        const currentEmployee = await prisma.employee.findUnique({
            where: { EmployeeID: params.id },
            include: { assignments: { where: { Status: 'Active' } } }
        })

        const isTransitioningToLeaving = currentEmployee?.Status !== 'Leaving' && Status === 'Leaving'

        // Transaction: Update Employee AND (Optionally) Asset Deadlines
        const employee = await prisma.$transaction(async (tx) => {
            // 1. Update Employee
            const updatedEmployee = await tx.employee.update({
                where: { EmployeeID: params.id },
                data: {
                    FirstName,
                    LastName,
                    Email,
                    Department,
                    StartDate: new Date(StartDate),
                    Status: Status || undefined,
                    EndDate: EndDate ? new Date(EndDate) : (Status === 'Active' ? null : undefined),
                }
            })

            // 2. Handle "Leaving" Transition logic
            if (isTransitioningToLeaving && EndDate) {
                console.log(`[📧 EMAIL STUB] Sending departure email to ${Email} and IT Dept. Subject: Employee Departure - ${FirstName} ${LastName}`)

                // Update Active Assignments Return Date
                if (currentEmployee.assignments.length > 0) {
                    await tx.assignment.updateMany({
                        where: {
                            EmployeeID: params.id,
                            Status: 'Active'
                        },
                        data: {
                            ExpectedReturnDate: new Date(EndDate)
                        }
                    })
                    console.log(`[📅 ASSETS] Updated ${currentEmployee.assignments.length} active assignments with new deadline: ${EndDate}`)
                }
            }

            return updatedEmployee
        })

        return NextResponse.json(employee)
    } catch (error) {
        console.error('Error updating employee:', error)
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const employeeId = params.id

        // 1. Check for active assignments
        const activeAssignments = await prisma.assignment.findMany({
            where: {
                EmployeeID: employeeId,
                Status: 'Active'
            }
        })

        if (activeAssignments.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete employee with active asset assignments. Please return all assets first.' },
                { status: 400 }
            )
        }

        // 2. Delete Employee (Cascading delete of history might be needed depending on DB constraints, 
        // but Prisma usually needs explicit cascade in schema or manual deletion. 
        // For now, we assume we might need to delete history or just delete employee if schema supports it or if history is allowed to remain or deleted via cascade)

        // To be safe and clean, let's delete assignments history first if we want to completely wipe them, 
        // OR if the user just wants to remove the employee record. 
        // Given the requirement "Delete Employee", usually implies removing their record.
        // Let's rely on Prisma's behavior or delete related records if schema doesn't cascade. 
        // The schema doesn't show `onDelete: Cascade`. So we should delete assignments first.

        await prisma.$transaction(async (tx) => {
            // Delete all assignments (history)
            await tx.assignment.deleteMany({
                where: { EmployeeID: employeeId }
            })

            // Delete employee
            await tx.employee.delete({
                where: { EmployeeID: employeeId }
            })
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting employee:', error)
        return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
    }
}
