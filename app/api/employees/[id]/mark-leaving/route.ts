import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const body = await request.json()
        const { endDate, revert } = body

        const employeeId = params.id

        // Handle Revert to Active
        if (revert) {
            const { error: updateError } = await supabase.from("Employee").update({
                Status: 'Active',
                EndDate: null,
                updatedAt: new Date().toISOString()
            }).eq("EmployeeID", employeeId);

            if (updateError) throw updateError;

            // Clear ExpectedReturnDate for active assignments
            const { data: assignmentsUpdated } = await supabase.from("Assignment").update({
                ExpectedReturnDate: null,
                updatedAt: new Date().toISOString()
            }).eq("EmployeeID", employeeId).eq("Status", 'Active').select("AssignmentID");

            const { data: updatedEmployee } = await supabase.from("Employee").select("*").eq("EmployeeID", employeeId).single();

            return NextResponse.json({
                success: true,
                message: `Employee reverted to Active. Return dates cleared for ${assignmentsUpdated?.length || 0} active assets.`,
                data: {
                    employee: updatedEmployee,
                    assignmentsUpdated: assignmentsUpdated?.length || 0
                }
            })
        }

        // Handle Mark as Leaving (Original Logic)
        if (!endDate) {
            return NextResponse.json(
                { error: 'End date is required' },
                { status: 400 }
            )
        }

        const newEndDateStr = new Date(endDate).toISOString()

        // 1. Get current employee status
        const { data: currentEmployee, error: fetchError } = await supabase.from("Employee").select("Status").eq("EmployeeID", employeeId).single();

        if (fetchError || !currentEmployee) {
            throw new Error('Employee not found')
        }

        // 2. Update Employee
        const newStatus = currentEmployee.Status === 'Active' ? 'Leaving' : currentEmployee.Status

        const { error: updateEmpError } = await supabase.from("Employee").update({
            Status: newStatus,
            EndDate: newEndDateStr,
            updatedAt: new Date().toISOString()
        }).eq("EmployeeID", employeeId);

        if (updateEmpError) throw updateEmpError;

        // 3. Update all active assignments' ExpectedReturnDate to match the NEW EndDate
        const { data: assignmentsUpdated } = await supabase.from("Assignment").update({
            ExpectedReturnDate: newEndDateStr,
            updatedAt: new Date().toISOString()
        }).eq("EmployeeID", employeeId).eq("Status", 'Active').select("AssignmentID");

        const { data: finalEmployee } = await supabase.from("Employee").select("*").eq("EmployeeID", employeeId).single();

        return NextResponse.json({
            success: true,
            message: `Employee departure updated. ${assignmentsUpdated?.length || 0} active asset(s) scheduled for return on ${new Date(endDate).toLocaleDateString()}.`,
            data: {
                employee: finalEmployee,
                assignmentsUpdated: assignmentsUpdated?.length || 0
            }
        })

    } catch (error) {
        console.error('Error marking employee as leaving:', error)
        return NextResponse.json(
            { error: 'Failed to update departure information' },
            { status: 500 }
        )
    }
}
