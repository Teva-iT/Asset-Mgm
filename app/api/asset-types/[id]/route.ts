
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params
        const { name } = await req.json()

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
        }

        // 1. Get current type to find old name
        const currentType = await prisma.assetType.findUnique({
            where: { TypeID: id }
        })

        if (!currentType) {
            return NextResponse.json({ error: 'Type not found' }, { status: 404 })
        }

        // 2. Update AssetType record
        // This transaction ensures we don't have partial updates
        await prisma.$transaction(async (tx) => {
            // Rename the type
            await tx.assetType.update({
                where: { TypeID: id },
                data: { Name: name }
            })

            // 3. Update all Assets using this type 
            // Only if the name actually changed
            if (currentType.Name !== name) {
                await tx.asset.updateMany({
                    where: { AssetType: currentType.Name },
                    data: { AssetType: name }
                })
            }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error updating asset type:', error)
        // Check for unique constraint violation (duplicate name)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Type name already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to update asset type' }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params

        const typeToDelete = await prisma.assetType.findUnique({
            where: { TypeID: id }
        })

        if (!typeToDelete) {
            return NextResponse.json({ error: 'Type not found' }, { status: 404 })
        }

        // 1. Check if ANY assets are using this type
        const usageCount = await prisma.asset.count({
            where: { AssetType: typeToDelete.Name }
        })

        if (usageCount > 0) {
            return NextResponse.json({
                error: `Cannot delete. Used by ${usageCount} asset(s). Please reassign them first.`
            }, { status: 400 })
        }

        // 2. Delete the type
        await prisma.assetType.delete({
            where: { TypeID: id }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting asset type:', error)
        return NextResponse.json({ error: 'Failed to delete asset type' }, { status: 500 })
    }
}
