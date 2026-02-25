import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { AssetID, EmployeeID, ExpectedReturnDate, Notes } = body

        // 1. Validate Asset Availability & Employee Status
        const { data: asset, error: assetError } = await supabase.from("Asset").select("*").eq("AssetID", AssetID).single();
        if (assetError || !asset || asset.Status !== 'Available') {
            throw new Error('Asset is not available')
        }

        const { data: employee, error: empError } = await supabase.from("Employee").select("*").eq("EmployeeID", EmployeeID).single();
        if (empError || !employee || employee.Status !== 'Active') {
            throw new Error(`Cannot assign assets to employee with status: ${employee?.Status}. Asset assignment is restricted to Active employees.`)
        }

        const newAssignmentId = crypto.randomUUID();

        // 2. Create Assignment
        const { error: assignError } = await supabase.from("Assignment").insert({
            AssignmentID: newAssignmentId,
            AssetID,
            EmployeeID,
            ExpectedReturnDate: ExpectedReturnDate ? new Date(ExpectedReturnDate).toISOString() : null,
            Notes,
            Status: 'Active',
            updatedAt: new Date().toISOString()
        });

        if (assignError) throw assignError;

        // 3. Update Asset Status
        await supabase.from("Asset").update({ Status: 'Assigned' }).eq("AssetID", AssetID);

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
