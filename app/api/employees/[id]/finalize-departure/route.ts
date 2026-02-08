import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const employeeId = params.id
        const today = new Date()

        // Start a transaction to finalize departure
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update Employee Status to 'Left'
            const updatedEmployee = await tx.employee.update({
                where: { EmployeeID: employeeId },
                data: {
                    Status: 'Left'
                }
            })

            // 2. Find assignments that are overdue (not returned and past expected return date)
            const overdueAssignments = await tx.assignment.findMany({
                where: {
                    EmployeeID: employeeId,
                    ActualReturnDate: null,
                    ExpectedReturnDate: {
                        lt: today
                    }
                }
            })

            // 3. Mark overdue assignments (optional - you can add a separate Overdue status if needed)
            // For now, we'll just count them and they'll show as overdue in the dashboard

            return {
                employee: updatedEmployee,
                overdueCount: overdueAssignments.length,
                overdueAssignments
            }
        })

        return NextResponse.json({
            success: true,
            message: `Employee departure finalized. ${result.overdueCount} overdue assignment(s) found.`,
            data: result
        })

    } catch (error) {
        console.error('Error finalizing employee departure:', error)
        return NextResponse.json(
            { error: 'Failed to finalize employee departure' },
            { status: 500 }
        )
    }
}
