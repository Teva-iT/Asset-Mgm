import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: Single license with full assignment details
export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params
    try {
        const { data, error } = await supabase
            .from('License')
            .select('*, assignments:LicenseAssignment(*, Employee:EmployeeID(EmployeeID, FirstName, LastName, Email, Department), Asset:AssetID(AssetID, AssetName, SerialNumber, AssetType))')
            .eq('LicenseID', id)
            .single()

        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'License not found' }, { status: 404 })
    }
}

// PUT: Update license
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params
    try {
        const body = await request.json()
        const { data, error } = await supabase.from('License').update({
            ProductName: body.ProductName,
            VendorName: body.VendorName || null,
            LicenseKey: body.LicenseKey || null,
            LicenseType: body.LicenseType || 'Per Seat',
            TotalSeats: body.TotalSeats ? parseInt(body.TotalSeats) : null,
            ExpiryDate: body.ExpiryDate ? new Date(body.ExpiryDate).toISOString() : null,
            PurchaseDate: body.PurchaseDate ? new Date(body.PurchaseDate).toISOString() : null,
            CostPerYear: body.CostPerYear ? parseFloat(body.CostPerYear) : null,
            Notes: body.Notes || null,
            Status: body.Status || 'Active',
            updatedAt: new Date().toISOString(),
        }).eq('LicenseID', id).select().single()

        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update license' }, { status: 500 })
    }
}

// DELETE: Remove license (cascades assignments)
export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params
    try {
        const { error } = await supabase.from('License').delete().eq('LicenseID', id)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete license' }, { status: 500 })
    }
}
