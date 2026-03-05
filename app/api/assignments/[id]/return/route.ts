import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const AssignmentID = params.id

    try {
        // 1. Get Assignment
        const { data: assignment, error: assignError } = await supabase
            .from("Assignment")
            .select("*, Asset:AssetID (*)")
            .eq("AssignmentID", AssignmentID)
            .single();

        if (assignError || !assignment) throw new Error('Assignment not found')
        if (assignment.Status === 'Returned') throw new Error('Assignment already returned')

        // 2. Update Assignment
        const { error: updateAssignError } = await supabase.from("Assignment").update({
            Status: 'Returned',
            ActualReturnDate: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }).eq("AssignmentID", AssignmentID);

        if (updateAssignError) throw updateAssignError;

        // 3. Update Asset Status
        await supabase.from("Asset").update({ Status: 'Available' }).eq("AssetID", assignment.AssetID);

        const assetModelID = assignment.Asset?.ModelID;
        if (assetModelID) {
            const { data: model } = await supabase.from("AssetModel").select("AvailableStock, AssignedStock").eq("ModelID", assetModelID).single();
            if (model) {
                await supabase.from("AssetModel").update({
                    AvailableStock: (model.AvailableStock || 0) + 1,
                    AssignedStock: Math.max(0, (model.AssignedStock || 0) - 1)
                }).eq("ModelID", assetModelID);
                // Log stock movement
                await supabase.from("InventoryRecord").insert({
                    RecordID: crypto.randomUUID(),
                    ModelID: assetModelID,
                    Quantity: 1,
                    ActionType: 'RETURN',
                    Notes: `Returned from assignment ${AssignmentID}`,
                    CreatedAt: new Date().toISOString()
                })
            }
        }

        const { data: updatedAssignment } = await supabase.from("Assignment").select("*").eq("AssignmentID", AssignmentID).single();

        return NextResponse.json(updatedAssignment)
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to return asset' },
            { status: 500 }
        )
    }
}
