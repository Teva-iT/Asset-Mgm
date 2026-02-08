import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const asset = await prisma.asset.findUnique({
            where: { AssetID: params.id },
        })
        if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
        return NextResponse.json(asset)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const asset = await prisma.asset.update({
            where: { AssetID: params.id },
            data: {
                AssetType: body.AssetType,
                AssetName: body.AssetName,
                Brand: body.Brand,
                Model: body.Model,
                SerialNumber: body.SerialNumber,
                DeviceTag: body.DeviceTag,
                Status: body.Status,
                PurchaseDate: body.PurchaseDate ? new Date(body.PurchaseDate) : undefined,
                Notes: body.Notes,
            },
        })
        return NextResponse.json(asset)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.asset.delete({
            where: { AssetID: params.id },
        })
        return NextResponse.json({ message: 'Asset deleted' })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
    }
}
