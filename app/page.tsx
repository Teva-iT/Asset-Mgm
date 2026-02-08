import { prisma } from '@/lib/db'
import AssetStatusChart from '@/components/dashboard/AssetStatusChart'
import RecentActivityList from '@/components/dashboard/RecentActivityList'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
    const [
        availableCount,
        assignedCount,
        overdueCount,
        recentAssignments,
        lostCount,
        damagedCount,
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
        // Recent Assignments (Last 7 days)
        prisma.assignment.findMany({
            where: { AssignedDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
            include: { Asset: true, Employee: true },
            orderBy: { AssignedDate: 'desc' },
            take: 5
        }),
        prisma.asset.count({ where: { Status: 'Lost' } }),
        prisma.asset.count({ where: { Status: 'Damaged' } }),
    ])

    const chartData = [
        { name: 'Available', value: availableCount },
        { name: 'Assigned', value: assignedCount },
        { name: 'Overdue', value: overdueCount }, // Technically Overdue isn't a Status on Asset, but an Assignment state. 
        // For the Chart, let's stick to Asset Statuses + maybe Overdue as a separate slice if we want, 
        // or just Available/Assigned/Other. 
        // Let's do: Available, Assigned, Lost, Damaged. Overdue is a subset of Assigned usually.
    ]

    // Better Chart Data: Asset Statuses
    // Split Assigned into "Assigned (Healthy)" and "Overdue" for better visualization
    const assignedHealthy = Math.max(0, assignedCount - overdueCount)

    const statusData = [
        { name: 'Available', value: availableCount },
        { name: 'Assigned', value: assignedHealthy },
        { name: 'Overdue', value: overdueCount },
        { name: 'Lost', value: lostCount },
        { name: 'Damaged', value: damagedCount },
    ]

    return (
        <div className="container mx-auto p-6 max-w-6xl space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                <p className="text-gray-500 mt-1">Overview of your asset inventory</p>
            </header>

            {/* Main Chart Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-2">Asset Status Distribution</h2>
                <div className="w-full">
                    <AssetStatusChart data={statusData} />
                </div>
            </div>

            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Card 1: Key Metrics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Key Metrics</h2>
                    <div className="grid grid-cols-2 gap-4 flex-grow content-start">
                        <MetricBox label="Total Assets" value={availableCount + assignedCount + lostCount + damagedCount} />
                        <MetricBox label="Available" value={availableCount} color="text-green-600" />
                        <MetricBox label="Assigned" value={assignedCount} color="text-purple-600" />
                        <MetricBox label="Overdue" value={overdueCount} color="text-red-600" />
                    </div>
                </div>

                {/* Card 2: Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Assignments</h2>
                    <div className="flex-grow">
                        <RecentActivityList assignments={recentAssignments as any} />
                    </div>
                </div>
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
