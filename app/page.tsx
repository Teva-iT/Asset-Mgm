import { prisma } from '@/lib/db'
import RecentAuditLog from '@/components/dashboard/RecentAuditLog'
import AssetTypeDistribution from '@/components/dashboard/AssetTypeDistribution'

export const revalidate = 30 // Cache for 30 seconds

export default async function Dashboard() {
    const [
        availableCount,
        assignedCount,
        overdueCount,
        recentLogs,
        lostCount,
        damagedCount,
        assetTypesData,
        lowStockCount
    ] = await Promise.all([
        prisma.asset.count({ where: { Status: 'Available' } }),
        prisma.asset.count({ where: { Status: 'Assigned' } }),
        prisma.assignment.count({
            where: {
                ExpectedReturnDate: { lt: new Date() },
                ActualReturnDate: null,
                Status: 'Active'
            }
        }),
        // Recent Audit Logs
        prisma.auditLog.findMany({
            orderBy: { Timestamp: 'desc' },
            take: 5,
            include: {
                User: { select: { Username: true } },
                Asset: { select: { AssetName: true, AssetType: true, AssetID: true } }
            }
        }),
        prisma.asset.count({ where: { Status: 'Lost' } }),
        prisma.asset.count({ where: { Status: 'Damaged' } }),
        prisma.asset.groupBy({
            by: ['AssetType'],
            _count: {
                AssetType: true
            },
            orderBy: {
                _count: {
                    AssetType: 'desc'
                }
            },
            take: 5
        }),
        prisma.asset.count({
            where: {
                OwnershipType: 'Stock',
                Quantity: { lt: 5 } // Low stock threshold
            }
        })
    ])

    const totalAssets = availableCount + assignedCount + lostCount + damagedCount
    const assignedHealthy = Math.max(0, assignedCount - overdueCount)



    // Calculate percentages for the bar
    const getPercent = (val: number) => totalAssets > 0 ? (val / totalAssets) * 100 : 0

    // Format Type Data
    const formattedTypeData = assetTypesData.map(item => ({
        type: item.AssetType || 'Uncategorized',
        count: item._count.AssetType
    }))

    return (
        <div className="container mx-auto p-4 md:p-6 max-w-6xl space-y-6 md:space-y-8">
            <header className="mb-4 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                <p className="text-sm md:text-base text-gray-500 mt-1">Overview of your asset inventory</p>
            </header>

            {/* Main Stats with Visual Bar (No Chart Library) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 md:mb-6 border-b pb-2">Asset Status Overview</h2>

                {/* Visual Stacked Bar */}
                <div className="w-full h-6 md:h-8 flex rounded-full overflow-hidden mb-6">
                    {availableCount > 0 && <div style={{ width: `${getPercent(availableCount)}%` }} className="bg-green-500 h-full" title="Available" />}
                    {assignedHealthy > 0 && <div style={{ width: `${getPercent(assignedHealthy)}%` }} className="bg-purple-500 h-full" title="Assigned" />}
                    {overdueCount > 0 && <div style={{ width: `${getPercent(overdueCount)}%` }} className="bg-red-500 h-full" title="Overdue" />}
                    {lostCount > 0 && <div style={{ width: `${getPercent(lostCount)}%` }} className="bg-yellow-500 h-full" title="Lost" />}
                    {damagedCount > 0 && <div style={{ width: `${getPercent(damagedCount)}%` }} className="bg-gray-500 h-full" title="Damaged" />}
                </div>

                {/* Legend / Stats Grid */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-4">
                    <StatItem label="Available" value={availableCount} color="bg-green-500" />
                    <StatItem label="Assigned" value={assignedHealthy} color="bg-purple-500" />
                    <StatItem label="Overdue" value={overdueCount} color="bg-red-500" />
                    <StatItem label="Lost" value={lostCount} color="bg-yellow-500" />
                    <StatItem label="Damaged" value={damagedCount} color="bg-gray-500" />
                </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">

                {/* Card 1: Key Metrics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Key Metrics</h2>
                    <div className="grid grid-cols-1 gap-3 md:gap-4 flex-grow content-start">
                        <MetricBox label="Total Assets" value={totalAssets} />
                        <MetricBox label="Low Stock Items" value={lowStockCount} color={lowStockCount > 0 ? "text-yellow-600" : "text-green-600"} />
                    </div>
                </div>

                {/* Card 2: Asset Types */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Asset Distribution</h2>
                    <div className="flex-grow">
                        <AssetTypeDistribution data={formattedTypeData} />
                    </div>
                </div>

                {/* Card 3: Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
                    <div className="flex-grow">
                        <RecentAuditLog logs={recentLogs} />
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatItem({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    )
}

function MetricBox({ label, value, color = "text-gray-900" }: { label: string, value: number, color?: string }) {
    return (
        <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center justify-center text-center">
            <span className="text-sm text-gray-500 font-medium mb-1">{label}</span>
            <span className={`text-2xl font-bold ${color}`}>{value}</span>
        </div>
    )
}
