import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { jwtVerify } from 'jose'

// Helper to get User Info from token
async function getUserInfo(request: NextRequest): Promise<{ id: string, role: string } | null> {
    const token = request.cookies.get('auth_token')?.value
    if (!token) return null
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
        const { payload } = await jwtVerify(token, secret)
        return { id: payload.userId as string, role: payload.role as string }
    } catch {
        return null
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const status = searchParams.get('status')
    // ... (unchanged)
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

export async function POST(request: NextRequest) {
    try {
        const userInfo = await getUserInfo(request)
        if (!userInfo) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Determine Assigned By
        let assignedByUserId = userInfo.id
        // Only Admin can override
        if (userInfo.role === 'ADMIN' && body.assignment?.assignedByUserId) {
            assignedByUserId = body.assignment.assignedByUserId
        }

        const asset = await prisma.$transaction(async (tx) => {
            // 1. Create Asset
            const newAsset = await tx.asset.create({
                data: {
                    AssetType: body.AssetType || null,
                    AssetName: body.AssetName || null,
                    Brand: body.Brand || null,
                    Model: body.Model || null,
                    SerialNumber: body.SerialNumber || null, // Handle unique constraint for empty strings
                    DeviceTag: body.DeviceTag || null,
                    Status: body.assignment ? 'Assigned' : (body.Status || 'Available'),
                    PurchaseDate: body.PurchaseDate ? new Date(body.PurchaseDate) : null,
                    Notes: body.Notes || null,
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
                        AssignedByUserID: assignedByUserId, // Validated Audit Field
                    }
                })
            }

            return newAsset
        })
        return NextResponse.json(asset, { status: 201 })
    } catch (error: any) {
        console.error('Error creating asset:', error)
        return NextResponse.json({ error: error.message || 'Failed to create asset' }, { status: 500 })
    }
}
