import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { endDate, revert } = body

        const employeeId = params.id

        // Handle Revert to Active
        if (revert) {
            const result = await prisma.$transaction(async (tx) => {
                // 1. Update Employee
                const updatedEmployee = await tx.employee.update({
                    where: { EmployeeID: employeeId },
                    data: {
                        Status: 'Active',
                        EndDate: null
                    }
                })

                // 2. Clear ExpectedReturnDate for active assignments
                const activeAssignments = await tx.assignment.findMany({
                    where: { EmployeeID: employeeId, Status: 'Active' }
                })

                if (activeAssignments.length > 0) {
                    await tx.assignment.updateMany({
                        where: { EmployeeID: employeeId, Status: 'Active' },
                        data: { ExpectedReturnDate: null }
                    })
                }

                return {
                    employee: updatedEmployee,
                    assignmentsUpdated: activeAssignments.length
                }
            })

            return NextResponse.json({
                success: true,
                message: `Employee reverted to Active. Return dates cleared for ${result.assignmentsUpdated} active assets.`,
                data: result
            })
        }

        // Handle Mark as Leaving (Original Logic)
        if (!endDate) {
            return NextResponse.json(
                { error: 'End date is required' },
                { status: 400 }
            )
        }

        const newEndDate = new Date(endDate)

        // Start a transaction to update employee and all assignments
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get current employee status
            const currentEmployee = await tx.employee.findUnique({
                where: { EmployeeID: employeeId },
                select: { Status: true }
            })

            if (!currentEmployee) {
                throw new Error('Employee not found')
            }

            // 2. Update Employee
            // If currently Active, set to Leaving.
            // If already Leaving/Left, just update the EndDate (and ensure Status is at least Leaving)
            const newStatus = currentEmployee.Status === 'Active' ? 'Leaving' : currentEmployee.Status

            const updatedEmployee = await tx.employee.update({
                where: { EmployeeID: employeeId },
                data: {
                    Status: newStatus,
                    EndDate: newEndDate
                }
            })

            // 3. Find all active assignments for this employee
            const activeAssignments = await tx.assignment.findMany({
                where: {
                    EmployeeID: employeeId,
                    Status: 'Active'
                }
            })

            // 4. Update all active assignments' ExpectedReturnDate to match the NEW EndDate
            // This ensures that even if we are just "Editing" the date, the assets sync up.
            if (activeAssignments.length > 0) {
                await tx.assignment.updateMany({
                    where: {
                        EmployeeID: employeeId,
                        Status: 'Active'
                    },
                    data: {
                        ExpectedReturnDate: newEndDate
                    }
                })
            }

            return {
                employee: updatedEmployee,
                assignmentsUpdated: activeAssignments.length
            }
        })

        return NextResponse.json({
            success: true,
            message: `Employee departure updated. ${result.assignmentsUpdated} active asset(s) scheduled for return on ${newEndDate.toLocaleDateString()}.`,
            data: result
        })

    } catch (error) {
        console.error('Error marking employee as leaving:', error)
        return NextResponse.json(
            { error: 'Failed to update departure information' },
            { status: 500 }
        )
    }
}
