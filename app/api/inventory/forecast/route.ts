import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        // 1. Fetch all models
        const { data: models, error: modelsError } = await supabase
            .from("AssetModel")
            .select("ModelID, Name, AvailableStock, CreatedAt")

        if (modelsError) throw modelsError

        // 2. Fetch assignment history for the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: history, error: historyError } = await supabase
            .from("InventoryRecord")
            .select("ModelID, Quantity, CreatedAt")
            .eq("ActionType", "ASSIGN")
            .gte("CreatedAt", thirtyDaysAgo.toISOString())

        if (historyError) throw historyError

        // 3. Process data per model
        const forecasts = models.map(model => {
            const modelHistory = history.filter(h => h.ModelID === model.ModelID)

            // Calculate total consumption (assignments are negative quantities)
            const totalConsumption = Math.abs(modelHistory.reduce((sum, h) => sum + (h.Quantity || 0), 0))

            // Calculate window days (min 30 days or days since model creation)
            const createdAt = new Date(model.CreatedAt)
            const now = new Date()
            const daysSinceCreated = Math.max(1, Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
            const windowDays = Math.min(30, daysSinceCreated)

            const dailyConsumption = totalConsumption / windowDays

            let estimatedDaysLeft: number | null = null
            if (dailyConsumption > 0) {
                estimatedDaysLeft = Math.floor((model.AvailableStock || 0) / dailyConsumption)
            }

            return {
                modelId: model.ModelID,
                name: model.Name,
                available: model.AvailableStock || 0,
                assignments_30d: totalConsumption,
                daily_consumption: parseFloat(dailyConsumption.toFixed(2)),
                estimated_days_left: estimatedDaysLeft
            }
        })

        return NextResponse.json(forecasts)
    } catch (error: any) {
        console.error('Forecasting error:', error)
        return NextResponse.json({ error: 'Failed to calculate forecast' }, { status: 500 })
    }
}
