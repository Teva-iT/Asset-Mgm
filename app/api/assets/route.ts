import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const status = searchParams.get('status')

    try {
        const where: any = {}

        if (status) {
            where.Status = status
        }

        if (q) {
            where.OR = [
                { AssetName: { contains: q, mode: 'insensitive' } },
                { SerialNumber: { contains: q, mode: 'insensitive' } },
                { AssetType: { contains: q, mode: 'insensitive' } },
                { DeviceTag: { contains: q, mode: 'insensitive' } },
            ]
        }

        const assets = await prisma.asset.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: (q || status) ? 20 : undefined, // Limit results for autocomplete/filtered views
        })
        return NextResponse.json(assets)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const asset = await prisma.$transaction(async (tx) => {
            // 1. Create Asset
            const newAsset = await tx.asset.create({
                data: {
                    AssetType: body.AssetType,
                    AssetName: body.AssetName,
                    Brand: body.Brand,
                    Model: body.Model,
                    SerialNumber: body.SerialNumber,
                    DeviceTag: body.DeviceTag,
                    Status: body.assignment ? 'Assigned' : (body.Status || 'Available'),
                    PurchaseDate: new Date(body.PurchaseDate),
                    Notes: body.Notes,
                },
            })

            // 2. Create Assignment (if provided)
            if (body.assignment) {
                await tx.assignment.create({
                    data: {
                        AssetID: newAsset.AssetID,
                        EmployeeID: body.assignment.employeeId,
                        AssignedDate: new Date(body.assignment.assignedDate || new Date()),
                        ExpectedReturnDate: body.assignment.expectedReturnDate ? new Date(body.assignment.expectedReturnDate) : null,
                        Status: 'Active',
                    }
                })
            }

            return newAsset
        })
        return NextResponse.json(asset, { status: 201 })
    } catch (error) {
        console.error('Error creating asset:', error)
        return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
    }
}
