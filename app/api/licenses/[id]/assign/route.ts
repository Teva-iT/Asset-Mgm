import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST: Assign license to an employee or asset
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params
    try {
        const body = await request.json()
        const { EmployeeID, AssetID, Notes } = body

        if (!EmployeeID && !AssetID) {
            return NextResponse.json({ error: 'Must specify EmployeeID or AssetID' }, { status: 400 })
        }

        // Check seat availability
        const { data: license } = await supabase.from('License').select('TotalSeats').eq('LicenseID', id).single()
        if (license?.TotalSeats != null) {
            const { count } = await supabase.from('LicenseAssignment').select('*', { count: 'exact', head: true }).eq('LicenseID', id)
            if ((count || 0) >= license.TotalSeats) {
                return NextResponse.json({ error: `All ${license.TotalSeats} seats are already assigned` }, { status: 400 })
            }
        }

        const { data, error } = await supabase.from('LicenseAssignment').insert({
            AssignmentID: crypto.randomUUID(),
            LicenseID: id,
            EmployeeID: EmployeeID || null,
            AssetID: AssetID || null,
            Notes: Notes || null,
            AssignedDate: new Date().toISOString(),
        }).select().single()

        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error('License assign error:', error)
        return NextResponse.json({ error: 'Failed to assign license' }, { status: 500 })
    }
}

// DELETE: Unassign (by AssignmentID passed in body)
export async function DELETE(request: NextRequest) {
    try {
        const { AssignmentID } = await request.json()
        const { error } = await supabase.from('LicenseAssignment').delete().eq('AssignmentID', AssignmentID)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 })
    }
}
