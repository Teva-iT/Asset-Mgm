import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        let { data: employee, error } = await supabase
            .from("Employee")
            .select(`
                *,
                assignments:Assignment (
                    *,
                    Asset:AssetID (*)
                )
            `)
            .eq("EmployeeID", params.id)
            .maybeSingle();

        if (error || !employee) {
            const { data: slugEmployee } = await supabase
                .from("Employee")
                .select(`*, assignments:Assignment(*, Asset:AssetID(*))`)
                .eq("Slug", params.id)
                .maybeSingle();
            employee = slugEmployee;
        }

        if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

        if (employee.assignments) {
            employee.assignments = employee.assignments.filter((a: any) => a.Status === 'Active');
        }

        return NextResponse.json(employee)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
    }
}

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const body = await request.json()
        const { FirstName, LastName, Email, Department, StartDate, Status, EndDate } = body

        // Fetch current employee to check for transitions
        const { data: currentEmployee } = await supabase
            .from("Employee")
            .select("*, assignments:Assignment(*)")
            .eq("EmployeeID", params.id)
            .single();

        const isTransitioningToLeaving = currentEmployee?.Status !== 'Leaving' && Status === 'Leaving'

        // 1. Update Employee
        const { error: updateError } = await supabase.from("Employee").update({
            FirstName,
            LastName,
            Email,
            Department,
            StartDate: new Date(StartDate).toISOString(),
            Status: Status || undefined,
            EndDate: EndDate ? new Date(EndDate).toISOString() : (Status === 'Active' ? null : undefined),
            updatedAt: new Date().toISOString()
        }).eq("EmployeeID", params.id);

        if (updateError) throw updateError;

        // 2. Handle "Leaving" Transition logic
        if (currentEmployee && isTransitioningToLeaving && EndDate) {
            console.log(`[📧 EMAIL STUB] Sending departure email to ${Email} and IT Dept. Subject: Employee Departure - ${FirstName} ${LastName}`)

            // Update Active Assignments Return Date
            const activeAssignments = (currentEmployee.assignments || []).filter((a: any) => a.Status === 'Active');
            if (activeAssignments.length > 0) {
                await supabase.from("Assignment").update({
                    ExpectedReturnDate: new Date(EndDate).toISOString()
                }).eq("EmployeeID", params.id).eq("Status", "Active");

                console.log(`[📅 ASSETS] Updated ${activeAssignments.length} active assignments with new deadline: ${EndDate}`)
            }
        }

        const { data: updatedEmployee } = await supabase.from("Employee").select("*").eq("EmployeeID", params.id).single();
        return NextResponse.json(updatedEmployee)
    } catch (error) {
        console.error('Error updating employee:', error)
        return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const employeeId = params.id

        // 1. Check for active assignments
        const { data: activeAssignments } = await supabase
            .from("Assignment")
            .select("AssignmentID")
            .eq("EmployeeID", employeeId)
            .eq("Status", 'Active');

        if (activeAssignments && activeAssignments.length > 0) {
            return NextResponse.json(
                { error: 'Cannot delete employee with active asset assignments. Please return all assets first.' },
                { status: 400 }
            )
        }

        // 2. Delete Employee
        // Delete assignments history first
        await supabase.from("Assignment").delete().eq("EmployeeID", employeeId);

        // Delete employee
        const { error: deleteError } = await supabase.from("Employee").delete().eq("EmployeeID", employeeId);

        if (deleteError) throw deleteError;

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting employee:', error)
        return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
    }
}
