import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

// PUT: Admin approves or rejects a request
export async function PUT(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params
    try {
        const body = await request.json()
        const { Status, ReviewNotes, ReviewedByID, FulfilledAssetID } = body

        if (!['Approved', 'Rejected', 'Fulfilled', 'Pending'].includes(Status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
        }

        const updateData: any = {
            Status,
            ReviewNotes: ReviewNotes || null,
            ReviewedByID: ReviewedByID || null,
            updatedAt: new Date().toISOString(),
        }

        if (FulfilledAssetID) {
            updateData.FulfilledAssetID = FulfilledAssetID
            updateData.Status = 'Fulfilled'
        }

        const { data, error } = await supabase.from('AssetRequest')
            .update(updateData).eq('RequestID', id).select().single()

        if (error) throw error
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
    }
}

// DELETE: Cancel/delete a request
export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const { id } = await props.params
    try {
        const { error } = await supabase.from('AssetRequest').delete().eq('RequestID', id)
        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 })
    }
}
