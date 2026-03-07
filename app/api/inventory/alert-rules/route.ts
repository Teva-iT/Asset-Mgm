import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        const { data, error } = await supabase
            .from("InventoryAlertRule")
            .select(`
                *,
                AssetModel (Name)
            `)
            .order('CreatedAt', { ascending: false })

        if (error) throw error
        return NextResponse.json(data)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { modelId, category, lowThreshold, criticalThreshold, forecastWindowDays, predictiveThresholdDays, leadTimeDays, isEnabled } = body

        const { data, error } = await supabase
            .from("InventoryAlertRule")
            .upsert({
                ModelID: modelId || null,
                Category: category || null,
                LowThreshold: lowThreshold,
                CriticalThreshold: criticalThreshold,
                ForecastWindowDays: forecastWindowDays || 30,
                PredictiveThresholdDays: predictiveThresholdDays || 10,
                LeadTimeDays: leadTimeDays || 3,
                IsEnabled: isEnabled !== undefined ? isEnabled : true,
                UpdatedAt: new Date().toISOString()
            })
            .select()

        if (error) throw error
        return NextResponse.json(data[0])
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) throw new Error("ID required")

        const { error } = await supabase
            .from("InventoryAlertRule")
            .delete()
            .eq("RuleID", id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
