import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        // 1. Fetch active alerts
        const { data: alerts, error: alertsError } = await supabase
            .from("InventoryAlert")
            .select(`
                *,
                AssetModel (
                    Name,
                    Manufacturer (Name),
                    Category
                )
            `)
            .eq("IsResolved", false)

        if (alertsError) throw alertsError

        // 2. Fetch all models for summary and forecasting
        const { data: models, error: modelsError } = await supabase
            .from("AssetModel")
            .select("ModelID, Name, AvailableStock, ReorderLevel, CriticalThreshold, CreatedAt, Manufacturer(Name), Category")

        if (modelsError) throw modelsError

        // 3. Predictive Logic (Simple version for summary)
        // In a real app, this would use the logic from /forecast/route.ts
        // For now, let's identify existing depletion risks if we can

        const summary = {
            lowStock: models.filter(m => m.AvailableStock <= (m.ReorderLevel || 5) && m.AvailableStock > (m.CriticalThreshold || 2) && m.AvailableStock > 0).length,
            criticalStock: models.filter(m => m.AvailableStock <= (m.CriticalThreshold || 2) && m.AvailableStock > 0).length,
            outOfStock: models.filter(m => m.AvailableStock === 0).length,
            totalModels: models.length
        }

        // 4. Combine Active Alerts with Summary (we already have alerts from step 1)
        return NextResponse.json({ alerts, summary })
    } catch (error: any) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }
}

// Handle resolving/snoozing alerts
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { alertId, action, snoozeUntil } = body

        if (action === 'resolve') {
            const { error } = await supabase
                .from("InventoryAlert")
                .update({ IsResolved: true, ResolvedAt: new Date().toISOString() })
                .eq("AlertID", alertId)
            if (error) throw error
        } else if (action === 'snooze') {
            const { error } = await supabase
                .from("InventoryAlert")
                .update({
                    IsSnoozed: true,
                    SnoozedUntil: snoozeUntil || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                })
                .eq("AlertID", alertId)
            if (error) throw error
        } else if (action === 'acknowledge') {
            const { error } = await supabase
                .from("InventoryAlert")
                .update({
                    IsAcknowledged: true,
                    AcknowledgedAt: new Date().toISOString()
                })
                .eq("AlertID", alertId)
            if (error) throw error
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
