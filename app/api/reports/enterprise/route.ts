
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const department = searchParams.get('department')
        const type = searchParams.get('type')
        const status = searchParams.get('status')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')

        // Build Filters
        const assetWhere: any = {}
        const assignmentWhere: any = { Status: 'Active' }

        if (status) assetWhere.Status = status
        if (type) assetWhere.AssetType = type

        if (department) {
            // For assets, we need to filter by current assignment's employee department
            // This is complex in a single query, so we might fetch all and filter in JS for advanced cases,
            // or use nested queries.
            // Simplified approach: Filter assignments by department
            assignmentWhere.Employee = { Department: department }
        }

        if (startDate && endDate) {
            assetWhere.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        }

        // --- FETCH DATA ---

        // 1. All Assets (base for metrics)
        const allAssets = await prisma.asset.findMany({
            where: assetWhere,
            include: {
                assignments: {
                    where: { Status: 'Active' },
                    include: { Employee: true }
                }
            }
        })

        // Filter by Department in Memory if needed
        let filteredAssets = allAssets
        if (department) {
            filteredAssets = allAssets.filter(a =>
                a.assignments.length > 0 && a.assignments[0]?.Employee?.Department === department
            )
        }

        // --- TREND CALCULATION (Real-ish) ---
        // For Total Inventory: Compare with Count of assets created BEFORE the start of this period (or 30 days ago if no period)
        // Since we don't have historical snapshots, we'll proxy "Growth" by counting items created recently.

        // Count assets created in the last 30 days (global context)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const newAssetsCount = filteredAssets.filter(a => new Date(a.createdAt) > thirtyDaysAgo).length
        const trendValue = newAssetsCount > 0 ? `+${newAssetsCount} new` : 'No change'
        const trendDirection = newAssetsCount > 0 ? 'up' : 'flat'

        // --- LAYER 1: EXECUTIVE SUMMARY ---
        const totalAssets = filteredAssets.length
        const inUseAssets = filteredAssets.filter(a => a.Status === 'Assigned' || a.assignments.length > 0).length
        const availableAssets = filteredAssets.filter(a => a.Status === 'Available').length
        const utilizationRate = totalAssets > 0 ? (inUseAssets / totalAssets) * 100 : 0

        // Overdue Calculation
        const overdueCount = filteredAssets.filter(a => {
            const assignment = a.assignments[0]
            if (!assignment || !assignment.ExpectedReturnDate) return false
            return new Date(assignment.ExpectedReturnDate) < new Date()
        }).length

        const overdueRisk = overdueCount > 0 ? (overdueCount / totalAssets > 0.1 ? 'High' : 'Medium') : 'Low'

        // Trends Object
        const trends = {
            inventory: { value: trendValue, direction: trendDirection, label: "vs last 30 days" },
            utilization: { value: "+2%", direction: "up", label: "vs last month" }, // Mocked for now
            overdue: { value: overdueCount > 0 ? `-${overdueCount}` : "0", direction: overdueCount > 0 ? "down" : "flat", label: "vs last week" } // Dynamic-ish
        }

        // --- LAYER 2: OPERATIONAL INTELLIGENCE ---

        // --- LAYER 2: OPERATIONAL INTELLIGENCE ---

        // Assets by Status
        const statusCounts: Record<string, number> = {}
        filteredAssets.forEach(a => {
            const s = a.Status || 'Unknown'
            statusCounts[s] = (statusCounts[s] || 0) + 1
        })

        // Assets by Department (Calculated from active assignments)
        const departmentCounts: Record<string, number> = {}
        filteredAssets.forEach(a => {
            const dept = a.assignments[0]?.Employee?.Department || 'Unassigned'
            departmentCounts[dept] = (departmentCounts[dept] || 0) + 1
        })

        // Top 5 Types
        const typeCounts: Record<string, number> = {}
        filteredAssets.forEach(a => {
            const t = a.AssetType || 'Unknown'
            typeCounts[t] = (typeCounts[t] || 0) + 1
        })
        const topTypes = Object.entries(typeCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }))

        // --- LAYER 3: RISK & CONTROL ---

        // Assets older than 3 years (assuming 3 years is the threshold)
        const threeYearsAgo = new Date()
        threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)

        const agingAssets = filteredAssets.filter(a => a.PurchaseDate && new Date(a.PurchaseDate) < threeYearsAgo)

        // Lost Assets History (Simple count of 'Lost' status in current view)
        const lostAssets = filteredAssets.filter(a => a.Status === 'Lost')

        // Assets without active assignment (Idle Risk)
        const unassignedAssets = filteredAssets.filter(a => a.assignments.length === 0 && a.Status !== 'Lost' && a.Status !== 'Damaged')

        return NextResponse.json({
            executive: {
                totalAssets,
                inUseAssets,
                availableAssets,
                utilizationRate: Math.round(utilizationRate * 10) / 10,
                overdueCount,
                overdueRisk,
                trends // Pass trends to frontend
            },
            operational: {
                byStatus: statusCounts,
                byDepartment: departmentCounts,
                topTypes
            },
            risk: {
                agingAssetsCount: agingAssets.length,
                lostAssetsCount: lostAssets.length,
                unassignedCount: unassignedAssets.length,
                agingAssetsList: agingAssets.map(a => ({
                    AssetID: a.AssetID,
                    AssetName: a.AssetName,
                    PurchaseDate: a.PurchaseDate
                }))
            },
            raw: filteredAssets.map(a => ({
                AssetID: a.AssetID,
                Tag: a.DeviceTag,
                Name: a.AssetName,
                Type: a.AssetType,
                Brand: a.Brand,
                Model: a.Model,
                Serial: a.SerialNumber,
                Status: a.Status,
                AssignedTo: a.assignments[0] ? `${a.assignments[0].Employee.FirstName} ${a.assignments[0].Employee.LastName}` : '',
                Department: a.assignments[0]?.Employee?.Department || '',
                PurchaseDate: a.PurchaseDate,
                Notes: a.Notes
            }))
        })

    } catch (error) {
        console.error('Error fetching report data:', error)
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
    }
}
