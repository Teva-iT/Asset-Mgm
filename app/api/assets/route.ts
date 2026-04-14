import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
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
    const startedAt = Date.now()
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const status = searchParams.get('status')
    const modelId = searchParams.get('modelId')
    const locationId = searchParams.get('locationId')
    const assetId = searchParams.get('assetId')
    const lite = searchParams.get('lite') === '1'

    try {
        let queryBuilder = supabaseAdmin
            .from("Asset")
            .select(
                lite
                    ? "AssetID, AssetName, AssetType, SerialNumber, Status, ModelID, StorageLocationID"
                    : `
                        *,
                        AssetModel:ModelID (
                            *,
                            Manufacturer:ManufacturerID (*)
                        ),
                        assignments:Assignment (
                            *,
                            Employee:EmployeeID (*)
                        )
                    `
            )
            .order("createdAt", { ascending: false });

        if (status) {
            const rawStatuses = status.split(',').map(s => s.trim()).filter(Boolean)
            const statusSet = new Set(rawStatuses)
            if (statusSet.has('Available')) statusSet.add('In Stock')
            const statusList = Array.from(statusSet)
            if (statusList.length === 1) {
                queryBuilder = queryBuilder.eq("Status", statusList[0])
            } else {
                queryBuilder = queryBuilder.in("Status", statusList)
            }
        }

        if (modelId) {
            queryBuilder = queryBuilder.eq("ModelID", modelId);
        }

        if (assetId) {
            queryBuilder = queryBuilder.eq("AssetID", assetId)
        }

        if (locationId) {
            queryBuilder = queryBuilder.eq("StorageLocationID", locationId)
        }

        if (q) {
            queryBuilder = queryBuilder.or(`AssetName.ilike.%${q}%,SerialNumber.ilike.%${q}%,AssetType.ilike.%${q}%,DeviceTag.ilike.%${q}%`);
        }

        if (q || status) {
            queryBuilder = queryBuilder.limit(20);
        }

        const { data: assets, error } = await queryBuilder;
        if (error) throw error;

        if (lite) {
            const response = NextResponse.json(assets || [])
            response.headers.set('x-api-duration-ms', String(Date.now() - startedAt))
            response.headers.set('x-api-route', '/api/assets')
            return response
        }

        // Fetch storage locations separately (avoids PostgREST schema cache FK join issues)
        const { data: locations } = await supabaseAdmin
            .from("StorageLocation")
            .select("LocationID, Name, ParentLocationID");

        const locMap: Record<string, any> = {};
        if (locations) {
            for (const loc of locations) locMap[loc.LocationID] = loc;
        }

        // Merge and filter
        const processedAssets = (assets || []).map((asset: any) => {
            // Filter active assignments only
            if (asset.assignments) {
                asset.assignments = asset.assignments.filter((a: any) => a.Status === 'Active');
            }
            // Attach storage location name
            if (asset.StorageLocationID && locMap[asset.StorageLocationID]) {
                const loc = locMap[asset.StorageLocationID];
                const parent = loc.ParentLocationID ? locMap[loc.ParentLocationID] : null;
                asset.StorageLocation = {
                    ...loc,
                    ParentLocation: parent ? { Name: parent.Name } : null
                };
            } else {
                asset.StorageLocation = null;
            }
            return asset;
        });

        const response = NextResponse.json(processedAssets)
        response.headers.set('x-api-duration-ms', String(Date.now() - startedAt))
        response.headers.set('x-api-route', '/api/assets')
        return response
    } catch (error) {
        console.error('Failed to fetch assets:', error)
        const response = NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 })
        response.headers.set('x-api-duration-ms', String(Date.now() - startedAt))
        response.headers.set('x-api-route', '/api/assets')
        return response
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
            if (!status || status === 'Available') status = 'In Stock'
        }

        const newAssetId = crypto.randomUUID();

        // 1. Create Asset
        const { error: insertError } = await supabase.from("Asset").insert({
            AssetID: newAssetId,
            AssetType: body.AssetType || null,
            OwnershipType: ownershipType,
            Quantity: isStock ? (body.Quantity || 1) : 1,
            Location: isShared ? body.Location : null, // Legacy/Simple
            StorageLocationID: body.StorageLocationID || null, // New structured location
            AssetName: body.AssetName || null,
            Brand: body.Brand || null,
            Model: body.Model || null, // Legacy field
            ModelID: body.ModelID || null, // Reference
            SerialNumber: body.SerialNumber || null,
            DeviceTag: body.DeviceTag || null,
            Status: status,
            Condition: body.Condition || null,
            OperationalState: body.OperationalState || null,
            PurchaseDate: body.PurchaseDate ? new Date(body.PurchaseDate).toISOString() : null,
            Notes: body.Notes || null,
            updatedAt: new Date().toISOString()
        });

        if (insertError) throw insertError;

        if (body.photos && body.photos.length > 0) {
            const photosToInsert = body.photos.map((p: any) => ({
                PhotoID: crypto.randomUUID(),
                AssetID: newAssetId,
                URL: p.url,
                Category: p.category || 'General',
                UploadedBy: assignedByUserId
            }));
            await supabase.from("AssetPhoto").insert(photosToInsert);
        }

        // 2. Create Assignment (Only for Individual Assets)
        if (body.assignment && !isStock && !isShared) {
            await supabase.from("Assignment").insert({
                AssignmentID: crypto.randomUUID(),
                AssetID: newAssetId,
                EmployeeID: body.assignment.employeeId,
                AssignedDate: new Date(body.assignment.assignedDate || new Date()).toISOString(),
                ExpectedReturnDate: body.assignment.expectedReturnDate ? new Date(body.assignment.expectedReturnDate).toISOString() : null,
                Status: 'Active',
                AssignedByUserID: assignedByUserId,
                updatedAt: new Date().toISOString()
            });

            await logAudit(newAssetId, AuditAction.ASSIGN, `Assigned to employee ${body.assignment.employeeId}`, assignedByUserId)
        }

        await logAudit(newAssetId, AuditAction.CREATE, `Asset created via API`, userInfo.id)

        const { data: newAsset } = await supabase.from("Asset").select("*").eq("AssetID", newAssetId).single();
        return NextResponse.json(newAsset, { status: 201 })
    } catch (error: any) {
        console.error('Error creating asset:', error)
        if (error.code === '23505') { // Postgres Unique Constraint Violation
            const errDetail = error.details || '';
            if (errDetail.includes('SerialNumber')) {
                return NextResponse.json({ error: 'Serial Number already exists' }, { status: 409 })
            }
            if (errDetail.includes('DeviceTag')) {
                return NextResponse.json({ error: 'Device Tag already exists' }, { status: 409 })
            }
            return NextResponse.json({ error: 'Asset identifier already exists' }, { status: 409 })
        }
        return NextResponse.json({ error: error.message || 'Failed to create asset' }, { status: 500 })
    }
}
