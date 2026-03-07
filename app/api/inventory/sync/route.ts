import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST() {
    try {
        // Directly update all AssetModel records to trigger the alert triggers
        // This avoids needing the `sync_inventory_alerts` RPC in the schema cache
        const { data: models, error: fetchError } = await supabaseAdmin
            .from('AssetModel')
            .select('ModelID, AvailableStock')

        if (fetchError) throw fetchError

        // Touch each model to fire any DB triggers
        for (const model of (models || [])) {
            await supabaseAdmin
                .from('AssetModel')
                .update({ AvailableStock: model.AvailableStock })
                .eq('ModelID', model.ModelID)
        }

        return NextResponse.json({ success: true, message: "Inventory scan completed. Alerts have been refreshed." })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
