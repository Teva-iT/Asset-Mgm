import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { AssetID, EmployeeID, ExpectedReturnDate, Notes } = body

        // 1. Validate inputs
        if (!AssetID || !EmployeeID) {
            return NextResponse.json({ error: 'AssetID and EmployeeID are required' }, { status: 400 })
        }

        // 2. Validate Asset
        const { data: asset, error: assetError } = await supabase.from("Asset").select("*").eq("AssetID", AssetID).single();
        if (assetError || !asset) throw new Error('Asset not found')
        if (asset.Status !== 'Available') throw new Error('Asset is not available for assignment')

        // 3. Validate Employee
        const { data: employee, error: empError } = await supabase.from("Employee").select("*").eq("EmployeeID", EmployeeID).single();
        if (empError || !employee || employee.Status !== 'Active') {
            throw new Error(`Cannot assign to employee with status: ${employee?.Status || 'unknown'}`)
        }

        // --- GUARD: Check AvailableStock before assigning ---
        if (asset.ModelID) {
            const { data: model, error: modelError } = await supabase
                .from("AssetModel")
                .select("AvailableStock, Name, ReorderLevel")
                .eq("ModelID", asset.ModelID)
                .single();

            if (modelError || !model) {
                console.error("Model fetch error during assignment guard:", modelError);
            } else if ((model.AvailableStock || 0) <= 0) {
                return NextResponse.json(
                    { error: `Insufficient stock for model "${model.Name}". Available units: ${model.AvailableStock || 0}. Please add stock before assigning.` },
                    { status: 409 }
                )
            }
        }

        const newAssignmentId = crypto.randomUUID();

        // 4. Try atomic RPC first (requires the SQL function to be created in Supabase)
        const { data: rpcResult, error: rpcError } = await supabase.rpc('assign_asset_atomic', {
            p_assignment_id: newAssignmentId,
            p_asset_id: AssetID,
            p_employee_id: EmployeeID,
            p_expected_return_date: ExpectedReturnDate ? new Date(ExpectedReturnDate).toISOString() : null,
            p_notes: Notes || null,
            p_assigned_by_user_id: null
        })

        // If RPC succeeded
        if (!rpcError && rpcResult?.success === true) {
            const { data: assignment } = await supabase.from("Assignment").select("*").eq("AssignmentID", newAssignmentId).single();
            // Log stock movement
            if (asset.ModelID) {
                await supabase.from("InventoryRecord").insert({
                    RecordID: crypto.randomUUID(),
                    ModelID: asset.ModelID,
                    Quantity: -1,
                    ActionType: 'ASSIGN',
                    Notes: `Assigned to employee ${EmployeeID} (Assignment: ${newAssignmentId})`,
                    CreatedAt: new Date().toISOString()
                })
            }
            return NextResponse.json(assignment, { status: 201 })
        }

        if (rpcResult?.success === false) {
            return NextResponse.json({ error: rpcResult.error }, { status: 409 })
        }

        // 5. Fallback: sequential (if RPC function not yet created)
        console.warn("RPC assign_asset_atomic not available, falling back to sequential:", rpcError?.message)

        const { error: assignError } = await supabase.from("Assignment").insert({
            AssignmentID: newAssignmentId,
            AssetID,
            EmployeeID,
            ExpectedReturnDate: ExpectedReturnDate ? new Date(ExpectedReturnDate).toISOString() : null,
            Notes,
            Status: 'Active',
            updatedAt: new Date().toISOString()
        })
        if (assignError) throw assignError

        await supabase.from("Asset").update({ Status: 'Assigned' }).eq("AssetID", AssetID)

        if (asset.ModelID) {
            const { data: model } = await supabase.from("AssetModel").select("AvailableStock, AssignedStock").eq("ModelID", asset.ModelID).single();
            if (model) {
                await supabase.from("AssetModel").update({
                    AvailableStock: Math.max(0, (model.AvailableStock || 0) - 1),
                    AssignedStock: (model.AssignedStock || 0) + 1
                }).eq("ModelID", asset.ModelID)
                // Log stock movement
                await supabase.from("InventoryRecord").insert({
                    RecordID: crypto.randomUUID(),
                    ModelID: asset.ModelID,
                    Quantity: -1,
                    ActionType: 'ASSIGN',
                    Notes: `Assigned to employee ${EmployeeID} (Assignment: ${newAssignmentId})`,
                    CreatedAt: new Date().toISOString()
                })
            }
        }

        const { data: assignment } = await supabase.from("Assignment").select("*").eq("AssignmentID", newAssignmentId).single();
        return NextResponse.json(assignment, { status: 201 })

    } catch (error: any) {
        console.error('Error creating assignment:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create assignment' },
            { status: 500 }
        )
    }
}
