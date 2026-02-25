import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const employeeId = params.id
        const today = new Date().toISOString()

        // 1. Update Employee Status to 'Left'
        const { error: updateError } = await supabase.from("Employee").update({
            Status: 'Left',
            updatedAt: new Date().toISOString()
        }).eq("EmployeeID", employeeId);

        if (updateError) throw updateError;

        // 2. Find assignments that are overdue (not returned and past expected return date)
        const { data: overdueAssignments } = await supabase.from("Assignment")
            .select("*")
            .eq("EmployeeID", employeeId)
            .is("ActualReturnDate", null)
            .lt("ExpectedReturnDate", today);

        const { data: updatedEmployee } = await supabase.from("Employee").select("*").eq("EmployeeID", employeeId).single();

        return NextResponse.json({
            success: true,
            message: `Employee departure finalized. ${overdueAssignments?.length || 0} overdue assignment(s) found.`,
            data: {
                employee: updatedEmployee,
                overdueCount: overdueAssignments?.length || 0,
                overdueAssignments: overdueAssignments || []
            }
        })

    } catch (error) {
        console.error('Error finalizing employee departure:', error)
        return NextResponse.json(
            { error: 'Failed to finalize employee departure' },
            { status: 500 }
        )
    }
}
