import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
    try {
        // 1. All AssetModels
        const { data: models, error: modelsError } = await supabaseAdmin
            .from('AssetModel')
            .select('ModelID, Name, Category, AvailableStock, ReorderLevel, createdAt')
        if (modelsError) throw modelsError

        // 2. All Assets
        const { data: assets, error: assetsError } = await supabaseAdmin
            .from('Asset')
            .select('AssetID, ModelID, Status, createdAt')
        if (assetsError) throw assetsError

        // 3. All Assignments (for turnover + idle severity)
        const { data: allAssignments, error: assignErr } = await supabaseAdmin
            .from('Assignment')
            .select('AssignmentID, AssetID, Status, AssignedDate, updatedAt')
        if (assignErr) throw assignErr

        // 4. Last 12 months for trend
        const twelveMonthsAgo = new Date()
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
        const { data: recentAssignments, error: recentErr } = await supabaseAdmin
            .from('Assignment')
            .select('AssignedDate')
            .gte('AssignedDate', twelveMonthsAgo.toISOString())
        if (recentErr) throw recentErr

        // --- Build model map ---
        const modelMap = new Map<string, any>()
        for (const m of (models || [])) {
            modelMap.set(m.ModelID, { ...m, assignedCount: 0, totalAssignments: 0, returnedCount: 0 })
        }

        // Active assignment asset IDs + last assigned date per model
        const activeAssignmentAssets = new Set(
            (allAssignments || []).filter(a => a.Status === 'Active').map(a => a.AssetID)
        )

        // Last assigned date per model (most recent assignment of any status)
        const lastAssignedPerModel: Record<string, Date> = {}
        const assetModelMap = new Map<string, string>()
        for (const asset of (assets || [])) {
            if (asset.ModelID) assetModelMap.set(asset.AssetID, asset.ModelID)
        }
        for (const a of (allAssignments || [])) {
            const modelId = assetModelMap.get(a.AssetID)
            if (!modelId) continue
            const d = new Date(a.AssignedDate)
            if (!lastAssignedPerModel[modelId] || d > lastAssignedPerModel[modelId]) {
                lastAssignedPerModel[modelId] = d
            }
        }

        for (const asset of (assets || [])) {
            const m = modelMap.get(asset.ModelID)
            if (!m) continue
            if (activeAssignmentAssets.has(asset.AssetID)) m.assignedCount++
        }

        for (const a of (allAssignments || [])) {
            const modelId = assetModelMap.get(a.AssetID)
            const m = modelId ? modelMap.get(modelId) : null
            if (!m) continue
            m.totalAssignments++
            if (a.Status === 'Returned') m.returnedCount++
        }

        const now = new Date()

        const modelStats = Array.from(modelMap.values()).map(m => {
            const lastAssigned = lastAssignedPerModel[m.ModelID]
            const idleDays = lastAssigned
                ? Math.floor((now.getTime() - lastAssigned.getTime()) / (1000 * 60 * 60 * 24))
                : null // null = never assigned
            const stock = m.AvailableStock || 0
            const usageRate = stock > 0 ? Math.round((m.assignedCount / stock) * 100) : 0

            return {
                modelId: m.ModelID,
                name: m.Name,
                category: m.Category,
                availableStock: stock,
                assignedCount: m.assignedCount,
                totalAssignments: m.totalAssignments,
                turnoverRate: m.returnedCount,
                idleStock: Math.max(0, stock - m.assignedCount),
                idleDays,       // days since last assignment (null = never assigned)
                usageRate       // assigned / stock %
            }
        })

        const mostUsed = [...modelStats].sort((a, b) => b.totalAssignments - a.totalAssignments).slice(0, 8)

        const leastUsed = [...modelStats]
            .filter(m => m.availableStock > 0)
            .sort((a, b) => a.totalAssignments - b.totalAssignments)
            .slice(0, 8)

        // Idle includes idleDays for severity
        const idle = [...modelStats]
            .filter(m => m.availableStock > 0 && m.assignedCount === 0)
            .sort((a, b) => (b.idleDays ?? 9999) - (a.idleDays ?? 9999))
            .slice(0, 8)

        const topTurnover = [...modelStats].sort((a, b) => b.turnoverRate - a.turnoverRate).slice(0, 8)

        // 12-month trend
        const trendMap: Record<string, number> = {}
        for (let i = 11; i >= 0; i--) {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
            trendMap[key] = 0
        }
        for (const a of (recentAssignments || [])) {
            const d = new Date(a.AssignedDate)
            const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
            if (trendMap[key] !== undefined) trendMap[key]++
        }
        const trend = Object.entries(trendMap).map(([month, count]) => ({ month, count }))

        const totalAssets = assets?.length || 0
        const totalAssigned = activeAssignmentAssets.size
        const totalIdle = modelStats.filter(m => m.availableStock > 0 && m.assignedCount === 0).length
        // Utilization = Assigned assets / Total assets
        const utilizationRate = totalAssets > 0 ? Math.round((totalAssigned / totalAssets) * 100) : 0

        return NextResponse.json({
            summary: { totalAssets, totalAssigned, totalIdle, utilizationRate },
            mostUsed, leastUsed, idle, topTurnover, trend
        })
    } catch (error: any) {
        console.error('Asset usage error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
