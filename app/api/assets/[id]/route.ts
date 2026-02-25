import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { logAudit, AuditAction } from '@/lib/audit'

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const { data: asset, error } = await supabase
            .from("Asset")
            .select(`
                *,
                Photos:AssetPhoto (*),
                assignments:Assignment (*)
            `)
            .eq("AssetID", params.id)
            .single();

        if (error || !asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
        return NextResponse.json(asset)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 })
    }
}

// PUT: Update asset and assignments
export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const body = await request.json()
        console.log('[PUT /api/assets/id] Received body keys:', Object.keys(body))
        console.log('[PUT /api/assets/id] StorageLocationID:', body.StorageLocationID)
        console.log('[PUT /api/assets/id] AssetName:', body.AssetName)
        console.log('[PUT /api/assets/id] Condition:', body.Condition)

        // 1. Update Asset
        const { error: updateError } = await supabase.from("Asset").update({
            AssetType: body.AssetType,
            AssetName: body.AssetName,
            Brand: body.Brand,
            Model: body.Model,
            SerialNumber: body.SerialNumber,
            DeviceTag: body.DeviceTag,
            Status: body.Status,
            Condition: body.Condition ?? null,
            OperationalState: body.OperationalState ?? null,
            StorageLocationID: body.StorageLocationID || null,
            Location: body.Location || null,
            PurchaseDate: body.PurchaseDate ? new Date(body.PurchaseDate).toISOString() : null,
            Notes: body.Notes,
            // Warranty & Financial
            VendorName: body.VendorName || null,
            VendorContact: body.VendorContact || null,
            PurchasePrice: body.PurchasePrice ? parseFloat(body.PurchasePrice) : null,
            WarrantyExpiryDate: body.WarrantyExpiryDate ? new Date(body.WarrantyExpiryDate).toISOString() : null,
            SupportContractEnd: body.SupportContractEnd ? new Date(body.SupportContractEnd).toISOString() : null,
            updatedAt: new Date().toISOString()
        }).eq("AssetID", params.id);

        if (updateError) throw updateError;

        if (body.newPhotos && body.newPhotos.length > 0) {
            const photosToInsert = body.newPhotos.map((p: any) => ({
                PhotoID: crypto.randomUUID(),
                AssetID: params.id,
                URL: p.URL || p.url,  // support both cases
                Category: p.Category || p.category || 'General',
                UploadedBy: null
            }));
            await supabase.from("AssetPhoto").insert(photosToInsert);
        }

        // 2. Handle Assignment if provided
        if (body.Status === 'Assigned' && body.assignment) {
            // Check if already assigned to this employee
            const { data: currentAssignment } = await supabase
                .from("Assignment")
                .select("*")
                .eq("AssetID", params.id)
                .eq("Status", 'Active')
                .limit(1)
                .maybeSingle();

            if (currentAssignment) {
                // Update existing assignment (Dates, check if employee changed?)
                if (currentAssignment.EmployeeID !== body.assignment.employeeId) {
                    // Employee changed: Close old, create new
                    await supabase.from("Assignment").update({
                        Status: 'Returned',
                        ActualReturnDate: new Date().toISOString()
                    }).eq("AssignmentID", currentAssignment.AssignmentID);

                    // Create new
                    await supabase.from("Assignment").insert({
                        AssignmentID: crypto.randomUUID(),
                        AssetID: params.id,
                        EmployeeID: body.assignment.employeeId,
                        AssignedDate: new Date(body.assignment.assignedDate).toISOString(),
                        ExpectedReturnDate: body.assignment.expectedReturnDate ? new Date(body.assignment.expectedReturnDate).toISOString() : null,
                        Status: 'Active',
                        AssignedByUserID: body.assignment.assignedByUserId,
                        updatedAt: new Date().toISOString()
                    });
                } else {
                    // Same employee, just update dates/notes
                    await supabase.from("Assignment").update({
                        AssignedDate: new Date(body.assignment.assignedDate).toISOString(),
                        ExpectedReturnDate: body.assignment.expectedReturnDate ? new Date(body.assignment.expectedReturnDate).toISOString() : null,
                        updatedAt: new Date().toISOString()
                    }).eq("AssignmentID", currentAssignment.AssignmentID);
                }
            } else {
                // No active assignment, create one
                await supabase.from("Assignment").insert({
                    AssignmentID: crypto.randomUUID(),
                    AssetID: params.id,
                    EmployeeID: body.assignment.employeeId,
                    AssignedDate: new Date(body.assignment.assignedDate).toISOString(),
                    ExpectedReturnDate: body.assignment.expectedReturnDate ? new Date(body.assignment.expectedReturnDate).toISOString() : null,
                    Status: 'Active',
                    AssignedByUserID: body.assignment.assignedByUserId,
                    updatedAt: new Date().toISOString()
                });
            }
        } else if (body.Status !== 'Assigned') {
            // If status changed to something else (e.g. Available), close any active assignment
            const { data: currentAssignment } = await supabase
                .from("Assignment")
                .select("*")
                .eq("AssetID", params.id)
                .eq("Status", 'Active')
                .limit(1)
                .maybeSingle();

            if (currentAssignment) {
                await supabase.from("Assignment").update({
                    Status: 'Returned',
                    ActualReturnDate: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }).eq("AssignmentID", currentAssignment.AssignmentID);

                // Log Return
                await logAudit(params.id, AuditAction.RETURN, `Asset returned/unassigned (Status change to ${body.Status})`)
            }
        }

        // Log Update (Generic for now)
        await logAudit(params.id, AuditAction.UPDATE, `Asset details updated`)

        if (body.Status === 'Assigned' && body.assignment) {
            await logAudit(params.id, AuditAction.ASSIGN, `Assignment updated/created for employee ${body.assignment.employeeId}`)
        }

        // Fetch updated asset to return
        const { data: updatedAsset } = await supabase
            .from("Asset")
            .select(`
                *,
                Photos:AssetPhoto (*),
                assignments:Assignment (*)
            `)
            .eq("AssetID", params.id)
            .single();

        return NextResponse.json(updatedAsset)

    } catch (error: any) {
        console.error('Update failed:', error)
        if (error.code === '23505') {
            const errDetail = error.details || '';
            if (errDetail.includes('SerialNumber')) {
                return NextResponse.json({ error: 'Serial Number already exists' }, { status: 409 })
            }
            if (errDetail.includes('DeviceTag')) {
                return NextResponse.json({ error: 'Device Tag already exists' }, { status: 409 })
            }
            return NextResponse.json({ error: 'Asset identifier already exists' }, { status: 409 })
        }
        return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const { error } = await supabase
            .from("Asset")
            .delete()
            .eq("AssetID", params.id);

        if (error) throw error;

        return NextResponse.json({ message: 'Asset deleted' })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
    }
}
