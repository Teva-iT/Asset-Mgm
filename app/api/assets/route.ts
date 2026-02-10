import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { jwtVerify } from 'jose'
import { logAudit, AuditAction } from '@/lib/audit'

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

        // Ownership Logic
        const ownershipType = body.OwnershipType || 'Individual'
        const isStock = ownershipType === 'Stock'
        const isShared = ownershipType === 'Shared'

        // Status Logic
        let status = body.Status || 'Available'
        if (body.assignment && !isStock && !isShared) {
            status = 'Assigned'
        } else if (isStock) {
            // Stock items generally 'In Stock' or 'Available'
            // User request: "Used / New / In Stock" -> "In Stock" seems appropriate for status if quantity > 0
            if (!status || status === 'Available') status = 'In Stock'
        }

        const asset = await prisma.$transaction(async (tx) => {
            // 1. Create Asset
            const newAsset = await tx.asset.create({
                data: {
                    AssetType: body.AssetType || null,
                    OwnershipType: ownershipType,
                    Quantity: isStock ? (body.Quantity || 1) : 1,
                    Location: isShared ? body.Location : null,
                    AssetName: body.AssetName || null,
                    Brand: body.Brand || null,
                    Model: body.Model || null,
                    SerialNumber: body.SerialNumber || null,
                    DeviceTag: body.DeviceTag || null,
                    Status: status,
                    Condition: body.Condition || null,
                    OperationalState: body.OperationalState || null,
                    PurchaseDate: body.PurchaseDate ? new Date(body.PurchaseDate) : null,
                    Notes: body.Notes || null,
                    Photos: {
                        create: body.photos?.map((p: any) => ({
                            URL: p.url,
                            Category: p.category || 'General',
                            UploadedBy: body.assignment?.assignedBy || null // or use session user
                        }))
                    }
                },
            })

            // 2. Create Assignment (Only for Individual Assets)
            if (body.assignment && !isStock && !isShared) {
                await tx.assignment.create({
                    data: {
                        AssetID: newAsset.AssetID,
                        EmployeeID: body.assignment.employeeId,
                        AssignedDate: new Date(body.assignment.assignedDate || new Date()),
                        ExpectedReturnDate: body.assignment.expectedReturnDate ? new Date(body.assignment.expectedReturnDate) : null,
                        Status: 'Active',
                        AssignedByUserID: assignedByUserId,
                    }
                })

                await logAudit(newAsset.AssetID, AuditAction.ASSIGN, `Assigned to employee ${body.assignment.employeeId}`, assignedByUserId)
            }

            await logAudit(newAsset.AssetID, AuditAction.CREATE, `Asset created via API`, userInfo.id)


            return newAsset
        })
        return NextResponse.json(asset, { status: 201 })
    } catch (error: any) {
        console.error('Error creating asset:', error)
        if (error.code === 'P2002') {
            const target = error.meta?.target || []
            if (target.includes('SerialNumber')) {
                return NextResponse.json({ error: 'Serial Number already exists' }, { status: 409 })
            }
            if (target.includes('DeviceTag')) {
                return NextResponse.json({ error: 'Device Tag already exists' }, { status: 409 })
            }
            return NextResponse.json({ error: 'Asset identifier already exists' }, { status: 409 })
        }
        return NextResponse.json({ error: error.message || 'Failed to create asset' }, { status: 500 })
    }
}
