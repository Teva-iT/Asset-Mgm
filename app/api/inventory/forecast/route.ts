import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
    try {
        // 1. Fetch all models
        const { data: models, error: modelsError } = await supabaseAdmin
            .from("AssetModel")
            .select("ModelID, Name, AvailableStock, createdAt")

        if (modelsError) throw modelsError

        // 2. Fetch all alert rules to get custom settings
        const { data: rules, error: rulesError } = await supabaseAdmin
            .from("InventoryAlertRule")
            .select("ModelID, Category, ForecastWindowDays, PredictiveThresholdDays, LeadTimeDays")
            .eq("IsEnabled", true)

        if (rulesError) throw rulesError

        // 3. Fetch maximum window needed (to fetch enough history)
        const maxWindow = Math.max(30, ...rules.map(r => r.ForecastWindowDays || 30))
        const windowStartDate = new Date()
        windowStartDate.setDate(windowStartDate.getDate() - maxWindow)

        // 4. Fetch assignment history
        const { data: history, error: historyError } = await supabaseAdmin
            .from("InventoryRecord")
            .select("ModelID, Quantity, CreatedAt")
            .eq("ActionType", "ASSIGN")
            .gte("CreatedAt", windowStartDate.toISOString())

        if (historyError) throw historyError

        // 5. Process data per model
        const forecasts = models.map(model => {
            const modelCategory = (model as any).Category

            // Find rule for this model or its category
            const rule = rules.find(r => r.ModelID === model.ModelID) ||
                rules.find(r => r.Category === modelCategory && !r.ModelID)

            const customWindow = rule?.ForecastWindowDays || 30
            const startDate = new Date()
            startDate.setDate(startDate.getDate() - customWindow)

            const modelHistory = history.filter(h => h.ModelID === model.ModelID && new Date(h.CreatedAt) >= startDate)

            // Calculate total consumption (assignments are negative quantities)
            const totalConsumption = Math.abs(modelHistory.reduce((sum, h) => sum + (h.Quantity || 0), 0))

            // Calculate window days (min customWindow or days since model creation)
            const createdAt = new Date(model.createdAt)
            const now = new Date()
            const daysSinceCreated = Math.max(1, Math.ceil((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)))
            const windowDays = Math.min(customWindow, daysSinceCreated)

            // 1. Daily Consumption (already filtered by window)
            const dailyConsumption = totalConsumption / windowDays

            // 2. Volatility Detection (Standard Deviation of daily usage)
            // Group usage by day to get daily points
            const dailyPoints: { [date: string]: number } = {}
            modelHistory.forEach(h => {
                const date = new Date(h.CreatedAt).toISOString().split('T')[0]
                dailyPoints[date] = (dailyPoints[date] || 0) + Math.abs(h.Quantity || 0)
            })

            const points = Object.values(dailyPoints)
            const mean = points.length > 0 ? points.reduce((a, b) => a + b, 0) / windowDays : 0
            const variance = points.length > 0 ? points.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / windowDays : 0
            const stdDev = Math.sqrt(variance)
            const cv = mean > 0 ? stdDev / mean : 0 // Coefficient of Variation
            const confidence: 'high' | 'medium' | 'low' = cv > 0.8 ? 'low' : cv > 0.4 ? 'medium' : 'high'

            // 3. Recommended Reorder Quantity (RRQ)
            // Formula: (Daily Usage * (Lead Time + Safety Window))
            const leadTime = rule?.LeadTimeDays || 3
            const safetyWindow = 7 // 1 week safety stock
            const recommendedQty = Math.ceil(dailyConsumption * (leadTime + safetyWindow))

            const predictiveThreshold = rule?.PredictiveThresholdDays || 10
            let estimatedDaysLeft: number | null = null
            let forecastStatus: 'STABLE' | 'FOLLOWING TREND' | 'DEPLETION RISK' = 'STABLE'

            if (dailyConsumption > 0) {
                estimatedDaysLeft = Math.floor((model.AvailableStock || 0) / dailyConsumption)
                forecastStatus = estimatedDaysLeft < predictiveThreshold ? 'DEPLETION RISK' : 'FOLLOWING TREND'
            } else {
                estimatedDaysLeft = 999
                forecastStatus = 'STABLE'
            }

            return {
                modelId: model.ModelID,
                name: model.Name,
                available: model.AvailableStock || 0,
                assignments_period: totalConsumption,
                period_days: customWindow,
                daily_consumption: parseFloat(dailyConsumption.toFixed(2)),
                estimated_days_left: estimatedDaysLeft,
                status: forecastStatus,
                confidence: confidence,
                volatility_score: parseFloat(cv.toFixed(2)),
                recommended_reorder_qty: recommendedQty > 0 ? recommendedQty : 5
            }
        })

        return NextResponse.json(forecasts)
    } catch (error: any) {
        console.error('Forecasting error:', error)
        return NextResponse.json({ error: 'Failed to calculate forecast' }, { status: 500 })
    }
}
