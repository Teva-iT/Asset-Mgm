import { PrismaClient } from '@prisma/client'
import InventoryScanner from '@/components/InventoryScanner'

const prisma = new PrismaClient()

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'

async function getInventoryData() {
    // Fetch all assets with their type and status
    // We want assets that are NOT currently assigned to an active assignment
    const assets = await prisma.asset.findMany({
        include: {
            assignments: {
                where: {
                    Status: 'Active'
                }
            }
        }
    })

    // Filter for unassigned assets (in stock)
    const inStockAssets = assets.filter(asset => asset.assignments.length === 0)

    return inStockAssets
}

export default async function InventoryPage() {
    const assets = await getInventoryData()

    // --- Calculate Summary Stats ---
    const totalAssets = assets.length

    // Logic Refinement:
    // Brand New (Unboxed): Condition = "New (Unboxed)" AND Not Assigned (implied by this list)
    const brandNew = assets.filter(a => a.Condition === 'New (Unboxed)').length

    // New & Ready: Condition = "New (Unboxed)" AND OperationalState = "Imaged (Ready)"
    // (Note: Usually "New (Unboxed)" implies not imaged yet, but if you have a workflow where it's unboxed just for imaging then re-boxed?? 
    // Actually, "New & Ready" might mean "New (Unboxed)" OR "Used (Good)"? 
    // User said: "New & Ready: Condition = New AND OperationalState = Imaged (Ready)"
    const newAndReady = assets.filter(a => a.Condition === 'New (Unboxed)' && a.OperationalState === 'Imaged (Ready)').length

    // Re-imaged Ready: Condition = "Used (Good)" AND OperationalState = "Imaged (Ready)"
    const reimagedReady = assets.filter(a =>
        (a.Condition === 'Used (Good)' || a.Condition === 'Re-imaged') // Handle legacy 'Re-imaged' condition if exists
        && a.OperationalState === 'Imaged (Ready)'
    ).length

    // Not Ready: OperationalState != 'Imaged (Ready)'
    const notReady = assets.filter(a => a.OperationalState !== 'Imaged (Ready)').length

    // Accessories (Simple count for now)
    const accessoryTypes = ['Mouse', 'Keyboard', 'Headset', 'Docking Station', 'Charger']
    const accessoriesCount = assets.filter(a => accessoryTypes.includes(a.AssetType || '')).length

    // --- Group by Category ---
    const categoryGroups: Record<string, typeof assets> = {}
    assets.forEach(asset => {
        const type = asset.AssetType || 'Unknown'
        if (!categoryGroups[type]) {
            categoryGroups[type] = []
        }
        categoryGroups[type].push(asset)
    })

    // Sort categories alphabetically
    const sortedCategories = Object.keys(categoryGroups).sort()

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">IT Inventory</h1>
                    <p className="text-gray-500 mt-1">Real-time stock levels and asset conditions.</p>
                </div>
            </div>

            {/* Inventory Scanner Input */}
            <InventoryScanner />

            {/* 1. Inventory Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-10">
                <SummaryCard title="Total Devices" count={totalAssets} icon="box" color="blue" />
                <SummaryCard title="Brand New" count={brandNew} icon="sparkles" color="purple" />
                <SummaryCard title="New & Ready" count={newAndReady} icon="check-circle" color="green" />
                <SummaryCard title="Re-imaged Ready" count={reimagedReady} icon="refresh-cw" color="indigo" />
                <SummaryCard title="Not Ready" count={notReady} icon="alert-circle" color="amber" />
                {/* <SummaryCard title="Accessories" count={accessoriesCount} icon="headphones" color="gray" /> */}
                {/* 5 columns max grid, removed accessories for now or need 6 columns? 
                    User asked for "Total, Ready, New, Re-imaged"... 
                    Let's stick to the 5 key ones for Lifecycle.
                    If Accessories is critical, we can make it grid-cols-6 or separate row.
                */}
            </div>

            {/* 2. Inventory by Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedCategories.map(category => (
                    <CategoryCard key={category} category={category} assets={categoryGroups[category]} />
                ))}
            </div>
        </div>
    )
}

// --- Components ---

function SummaryCard({ title, count, icon, color }: { title: string, count: number, icon: string, color: string }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        amber: 'bg-amber-50 text-amber-600',
        gray: 'bg-gray-50 text-gray-600',
    }[color] || 'bg-gray-50 text-gray-600'

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${colorClasses}`}>
                {/* Simple Icon mapping based on string name for now */}
                {icon === 'box' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>}
                {icon === 'check-circle' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>}
                {icon === 'sparkles' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>}
                {icon === 'refresh-cw' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>}
                {icon === 'alert-circle' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>}
                {icon === 'headphones' && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
            </div>
        </div>
    )
}

function CategoryCard({ category, assets }: { category: string, assets: any[] }) {
    const total = assets.length

    // Calculate breakdown by Operational State & Condition
    const pNewUnboxed = assets.filter(a => a.Condition === 'New (Unboxed)').length
    const pReady = assets.filter(a => a.OperationalState === 'Imaged (Ready)').length
    const pInPrep = assets.filter(a => a.OperationalState === 'In Preparation').length
    const pNotImaged = assets.filter(a => a.OperationalState === 'Not Imaged').length
    const pNeedsCheck = assets.filter(a => a.Condition === 'Used (Needs Check)').length

    // Fallback
    // const other = total - (pNewUnboxed + pReady + pInPrep + pNotImaged + pNeedsCheck) 
    // Overlap exists (e.g. New Unboxed could be Not Imaged), so don't just subtract.
    // Just show the key metrics requested.

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900 text-lg">{category}</h3>
                <span className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    Total: {total}
                </span>
            </div>

            <div className="p-5 flex-grow">
                <div className="space-y-3">
                    <StatRow label="New (Unboxed)" count={pNewUnboxed} color="bg-purple-100 text-purple-700" />
                    <StatRow label="Imaged (Ready)" count={pReady} color="bg-green-100 text-green-700" />
                    <StatRow label="In Preparation" count={pInPrep} color="bg-blue-100 text-blue-700" />
                    <StatRow label="Not Imaged" count={pNotImaged} color="bg-gray-100 text-gray-700" />
                    <StatRow label="Needs Check" count={pNeedsCheck} color="bg-amber-100 text-amber-700" />
                </div>
            </div>

            {/* Optional footer for actions if needed later */}
            {/* <div className="p-3 bg-gray-50 text-center text-xs text-gray-400 border-t border-gray-100">
        Stock Only • No Assignments
      </div> */}
        </div>
    )
}

function StatRow({ label, count, color }: { label: string, count: number, color: string }) {
    if (count === 0) return null // Hide rows with 0 count for cleaner UI? Or show as disabled? 
    // User asked for "Total Count, New, Used..." explicitly. Let's keep 0s but maybe lighter or just hide if excessive.
    // Actually, cleaner to show only present items, but "New/Used" are key metrics. 
    // Let's show all for now to give complete picture, or maybe just non-zero to reduce clutter.
    // "Inventory page... for each: Total Count, New, Used, Ready...". 
    // Let's hide 0s to keep it clean, but if ALL are 0 (except total), show something?
    // If total > 0 but all specific conditions are 0 (e.g. unclassified), 'Unspecified' covers it.

    return (
        <div className="flex justify-between items-center">
            <span className="text-gray-500 text-sm">{label}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>
                {count}
            </span>
        </div>
    )
}
