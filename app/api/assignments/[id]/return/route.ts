import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    const AssignmentID = params.id

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Assignment
            const assignment = await tx.assignment.findUnique({
                where: { AssignmentID },
                include: { Asset: true }
            })

            if (!assignment) throw new Error('Assignment not found')
            if (assignment.Status === 'Returned') throw new Error('Assignment already returned')

            // 2. Update Assignment
            const updatedAssignment = await tx.assignment.update({
                where: { AssignmentID },
                data: {
                    Status: 'Returned',
                    ActualReturnDate: new Date(),
                }
            })

            // 3. Update Asset Status
            await tx.asset.update({
                where: { AssetID: assignment.AssetID },
                data: { Status: 'Available' }
            })

            return updatedAssignment
        })

        return NextResponse.json(result)
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to return asset' },
            { status: 500 }
        )
    }
}
