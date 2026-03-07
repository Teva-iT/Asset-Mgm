import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Category-based EOL thresholds (years)
const EOL_THRESHOLDS: Record<string, number> = {
    'Laptop': 4,
    'Notebook': 4,
    'Desktop': 5,
    'Monitor': 6,
    'Display': 6,
    'Printer': 7,
    'Scanner': 7,
    'Tablet': 3,
    'Phone': 2,
    'Default': 4
}

function eolThreshold(category: string): number {
    for (const key of Object.keys(EOL_THRESHOLDS)) {
        if (category?.toLowerCase().includes(key.toLowerCase())) return EOL_THRESHOLDS[key]
    }
    return EOL_THRESHOLDS['Default']
}

export async function GET() {
    try {
        // 1. All assets with name for churn tracking
        const { data: assets, error: assetsErr } = await supabaseAdmin
            .from('Asset')
            .select('AssetID, ModelID, Status, PurchaseDate, createdAt, AssetName, SerialNumber, DeviceTag')
        if (assetsErr) throw assetsErr

        // 2. All assignments for churn analysis
        const { data: assignments, error: assignErr } = await supabaseAdmin
            .from('Assignment')
            .select('AssignmentID, AssetID, Status, AssignedDate')
        if (assignErr) throw assignErr

        // 3. AssetModels
        const { data: models, error: modelsErr } = await supabaseAdmin
            .from('AssetModel')
            .select('ModelID, Name, Category')
        if (modelsErr) throw modelsErr

        const modelMap = new Map((models || []).map(m => [m.ModelID, m]))
        const now = new Date()
        const totalAssets = assets?.length || 0

        // ─── Age Distribution with percentages ─────────────────────
        const ageGroups: Record<string, number> = { '<1yr': 0, '1–2yr': 0, '2–3yr': 0, '3–5yr': 0, '>5yr': 0 }
        for (const a of (assets || [])) {
            const d = a.PurchaseDate ? new Date(a.PurchaseDate) : new Date(a.createdAt)
            const age = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365)
            if (age < 1) ageGroups['<1yr']++
            else if (age < 2) ageGroups['1–2yr']++
            else if (age < 3) ageGroups['2–3yr']++
            else if (age < 5) ageGroups['3–5yr']++
            else ageGroups['>5yr']++
        }
        const ageDistribution = Object.entries(ageGroups).map(([label, count]) => ({
            label, count,
            pct: totalAssets > 0 ? Math.round((count / totalAssets) * 100) : 0
        }))

        // ─── Procurement Trend (by year + note about cost) ─────────
        const procurementMap: Record<string, number> = {}
        for (const a of (assets || [])) {
            const d = a.PurchaseDate ? new Date(a.PurchaseDate) : new Date(a.createdAt)
            const year = d.getFullYear().toString()
            procurementMap[year] = (procurementMap[year] || 0) + 1
        }
        const procurementTrend = Object.entries(procurementMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([year, count]) => ({ year, count }))

        // ─── Status Distribution ─────────────────────────────────
        const statusMap: Record<string, number> = {}
        for (const a of (assets || [])) {
            const s = a.Status || 'Unknown'
            statusMap[s] = (statusMap[s] || 0) + 1
        }
        const statusDistribution = Object.entries(statusMap)
            .sort(([, a], [, b]) => b - a)
            .map(([status, count]) => ({ status, count }))

        // ─── Top Churn Assets (individual assets with most re-assignments) ──
        const assignCountPerAsset: Record<string, number> = {}
        for (const a of (assignments || [])) {
            assignCountPerAsset[a.AssetID] = (assignCountPerAsset[a.AssetID] || 0) + 1
        }

        const topChurnAssets = (assets || [])
            .filter(a => (assignCountPerAsset[a.AssetID] || 0) > 1)
            .map(a => {
                const m = modelMap.get(a.ModelID)
                const label = a.AssetName || a.DeviceTag || a.SerialNumber || a.AssetID.slice(0, 8)
                return {
                    assetId: a.AssetID,
                    label,
                    modelName: m?.Name || 'Unknown',
                    category: m?.Category || '',
                    reassignments: assignCountPerAsset[a.AssetID] || 0
                }
            })
            .sort((a, b) => b.reassignments - a.reassignments)
            .slice(0, 10)

        // ─── EOL Forecast with category-based thresholds + timeline ─
        type EolItem = {
            modelId: string; name: string; category: string
            ageYears: number; count: number; eolYears: number
            urgency: 'critical' | 'soon' | 'approaching'
        }
        const eolMap: Record<string, { model: any; count: number; totalAge: number; eolYears: number }> = {}
        let next6 = 0, next12 = 0, next24 = 0

        for (const a of (assets || [])) {
            if (!a.ModelID) continue
            const m = modelMap.get(a.ModelID)
            const cat = m?.Category || ''
            const threshold = eolThreshold(cat)
            const d = a.PurchaseDate ? new Date(a.PurchaseDate) : new Date(a.createdAt)
            const ageYears = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365)

            // Timeline: how many reach EOL in next 6 / 12 / 24 months
            const yearsToEol = threshold - ageYears
            if (yearsToEol <= 0.5 && yearsToEol > 0) next6++
            if (yearsToEol <= 1 && yearsToEol > 0) next12++
            if (yearsToEol <= 2 && yearsToEol > 0) next24++
            // Already past EOL threshold
            if (ageYears >= threshold - 1) {
                if (!eolMap[a.ModelID]) eolMap[a.ModelID] = { model: m, count: 0, totalAge: 0, eolYears: threshold }
                eolMap[a.ModelID].count++
                eolMap[a.ModelID].totalAge += ageYears
            }
        }

        const eolForecasts: EolItem[] = Object.entries(eolMap).map(([modelId, val]) => {
            const avg = parseFloat((val.totalAge / val.count).toFixed(1))
            const diff = avg - val.eolYears
            const urgency: 'critical' | 'soon' | 'approaching' = diff >= 1 ? 'critical' : diff >= 0 ? 'soon' : 'approaching'
            return {
                modelId,
                name: val.model?.Name || 'Unknown',
                category: val.model?.Category || '',
                ageYears: avg,
                count: val.count,
                eolYears: val.eolYears,
                urgency
            }
        }).sort((a, b) => b.ageYears - a.ageYears)

        // ─── Summary KPIs ─────────────────────────────────────────
        const avgAgeSum = (assets || []).reduce((sum, a) => {
            const d = a.PurchaseDate ? new Date(a.PurchaseDate) : new Date(a.createdAt)
            return sum + (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365)
        }, 0)
        const avgAge = totalAssets ? parseFloat((avgAgeSum / totalAssets).toFixed(1)) : 0
        const eolCount = eolForecasts.filter(e => e.urgency === 'critical' || e.urgency === 'soon').reduce((s, e) => s + e.count, 0)
        const activeCount = statusMap['Assigned'] || statusMap['Active'] || 0

        return NextResponse.json({
            summary: { totalAssets, avgAgeYears: avgAge, eolCount, activeCount },
            ageDistribution,
            procurementTrend,
            statusDistribution,
            topChurnAssets,
            eolForecasts: eolForecasts.slice(0, 10),
            eolTimeline: { next6, next12, next24 }
        })
    } catch (error: any) {
        console.error('Lifecycle error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
