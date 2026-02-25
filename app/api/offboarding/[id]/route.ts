import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET Single Checklist
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    try {
        const { data: checklist } = await supabase.from("OffboardingChecklist").select("*, Employee(*)").eq("ChecklistID", resolvedParams.id).single();

        if (!checklist) {
            return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
        }

        return NextResponse.json(checklist)
    } catch (error) {
        console.error('Error fetching checklist:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// PUT Update Checklist
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    try {
        const body = await request.json()
        const { employeeId, exitDate, language, createdBy, status, checklistData } = body

        // Fetch existing first for audit comparison
        const { data: existing } = await supabase.from("OffboardingChecklist").select("Status").eq("ChecklistID", resolvedParams.id).single();

        if (!existing) {
            return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
        }

        const dataToUpdate: any = {};
        if (employeeId) dataToUpdate.EmployeeID = employeeId;
        if (exitDate) dataToUpdate.ExitDate = new Date(exitDate).toISOString();
        if (language) dataToUpdate.Language = language;
        if (status) dataToUpdate.Status = status;
        if (checklistData) dataToUpdate.ChecklistData = checklistData;

        const { data: updatedChecklist, error: updateError } = await supabase.from("OffboardingChecklist").update(dataToUpdate).eq("ChecklistID", resolvedParams.id).select().single();

        if (updateError) throw updateError;

        // Audit Logging
        // Log Status Change
        if (status && status !== existing.Status) {
            await supabase.from("OffboardingAudit").insert({
                ChecklistID: resolvedParams.id,
                Action: status,
                UserID: createdBy || 'System',
                Timestamp: new Date().toISOString()
            });
        } else {
            // General Update
            await supabase.from("OffboardingAudit").insert({
                ChecklistID: resolvedParams.id,
                Action: 'Updated',
                UserID: createdBy || 'System',
                Timestamp: new Date().toISOString()
            });
        }

        return NextResponse.json(updatedChecklist)
    } catch (error) {
        console.error('Error updating checklist:', error)
        return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 })
    }
}

// DELETE Checklist
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const resolvedParams = await params;
    try {
        const { error } = await supabase.from("OffboardingChecklist").delete().eq("ChecklistID", resolvedParams.id);

        if (error) throw error;

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting checklist:', error)
        return NextResponse.json({ error: 'Failed to delete checklist' }, { status: 500 })
    }
}
