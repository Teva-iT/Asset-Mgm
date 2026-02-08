import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { AssetID, EmployeeID, ExpectedReturnDate, Notes } = body

        // Transaction: Create Assignment AND Update Asset Status
        const result = await prisma.$transaction(async (tx) => {
            // 1. Validate Asset Availability & Employee Status
            const asset = await tx.asset.findUnique({ where: { AssetID } })
            if (!asset || asset.Status !== 'Available') {
                throw new Error('Asset is not available')
            }

            const employee = await tx.employee.findUnique({ where: { EmployeeID } })
            if (!employee || employee.Status !== 'Active') {
                throw new Error(`Cannot assign assets to employee with status: ${employee?.Status}. Asset assignment is restricted to Active employees.`)
            }

            // 2. Create Assignment
            const assignment = await tx.assignment.create({
                data: {
                    AssetID,
                    EmployeeID,
                    ExpectedReturnDate: ExpectedReturnDate ? new Date(ExpectedReturnDate) : null,
                    Notes,
                    Status: 'Active'
                }
            })

            // 3. Update Asset Status
            await tx.asset.update({
                where: { AssetID },
                data: { Status: 'Assigned' }
            })

            return assignment
        })

        return NextResponse.json(result, { status: 201 })
    } catch (error: any) {
        console.error('Error creating assignment:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create assignment' },
            { status: 500 }
        )
    }
}
