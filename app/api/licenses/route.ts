import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: List all licenses with seat usage
export async function GET() {
    try {
        const { data: licenses, error } = await supabase
            .from('License')
            .select('*, assignments:LicenseAssignment(AssignmentID, EmployeeID, AssetID, Employee:EmployeeID(FirstName, LastName))')
            .order('ExpiryDate', { ascending: true, nullsFirst: false })

        if (error) throw error

        const enriched = (licenses || []).map((l: any) => ({
            ...l,
            usedSeats: l.assignments?.length || 0,
            availableSeats: l.TotalSeats != null ? Math.max(0, l.TotalSeats - (l.assignments?.length || 0)) : null,
            isOverAllocated: l.TotalSeats != null && (l.assignments?.length || 0) > l.TotalSeats,
        }))

        return NextResponse.json(enriched)
    } catch (error) {
        console.error('License GET error:', error)
        return NextResponse.json({ error: 'Failed to fetch licenses' }, { status: 500 })
    }
}

// POST: Create a new license
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { ProductName, VendorName, LicenseKey, LicenseType, TotalSeats, ExpiryDate, PurchaseDate, CostPerYear, Notes, Status } = body

        if (!ProductName) {
            return NextResponse.json({ error: 'ProductName is required' }, { status: 400 })
        }

        const { data, error } = await supabase.from('License').insert({
            LicenseID: crypto.randomUUID(),
            ProductName,
            VendorName: VendorName || null,
            LicenseKey: LicenseKey || null,
            LicenseType: LicenseType || 'Per Seat',
            TotalSeats: TotalSeats ? parseInt(TotalSeats) : null,
            ExpiryDate: ExpiryDate ? new Date(ExpiryDate).toISOString() : null,
            PurchaseDate: PurchaseDate ? new Date(PurchaseDate).toISOString() : null,
            CostPerYear: CostPerYear ? parseFloat(CostPerYear) : null,
            Notes: Notes || null,
            Status: Status || 'Active',
            updatedAt: new Date().toISOString(),
        }).select().single()

        if (error) throw error
        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error('License POST error:', error)
        return NextResponse.json({ error: 'Failed to create license' }, { status: 500 })
    }
}
