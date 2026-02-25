'use client'

import { useState, useEffect } from 'react'

import * as XLSX from 'xlsx'
import DepartmentSelect from '../DepartmentSelect'

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

interface ReportData {
    executive: {
        totalAssets: number
        inUseAssets: number
        availableAssets: number
        utilizationRate: number
        overdueCount: number
        overdueRisk: string
        utilizationTrend?: string // Mock
    }
    operational: {
        byStatus: Record<string, number>
        byDepartment: Record<string, number>
        topTypes: { name: string, count: number }[]
    }
    risk: {
        agingAssetsCount: number
        lostAssetsCount: number
        unassignedCount: number
        agingAssetsList: any[]
    }
    raw: any[]
}

interface Department {
    DepartmentID: string
    Name: string
}

export default function EnterpriseReport() {
    const [data, setData] = useState<ReportData | null>(null)
    const [loading, setLoading] = useState(true)

    // Filters
    const [department, setDepartment] = useState('')
    const [status, setStatus] = useState('')

    // Dynamic Departments
    const [departments, setDepartments] = useState<Department[]>([])

    // Fetch Departments on Mount
    useEffect(() => {
        async function fetchDepartments() {
            try {
                const res = await fetch('/api/departments')
                if (res.ok) {
                    const data = await res.json()
                    setDepartments(data)
                }
            } catch (error) {
                console.error('Failed to fetch departments:', error)
            }
        }
        fetchDepartments()
    }, [])

    // Date Range Logic
    const [dateRange, setDateRange] = useState('all')

    function getDateRangeParams(range: string) {
        if (range === 'all') return {}
        const end = new Date()
        const start = new Date()
        if (range === '30d') start.setDate(end.getDate() - 30)
        if (range === '90d') start.setDate(end.getDate() - 90)
        if (range === 'year') start.setFullYear(end.getFullYear(), 0, 1)

        return {
            startDate: start.toISOString(),
            endDate: end.toISOString()
        }
    }

    useEffect(() => {
        fetchReport()
    }, [department, status, dateRange])

    async function fetchReport() {
        setLoading(true)
        const params = new URLSearchParams()
        if (department) params.append('department', department)
        if (status) params.append('status', status)

        const dates = getDateRangeParams(dateRange)
        if (dates.startDate) params.append('startDate', dates.startDate)
        if (dates.endDate) params.append('endDate', dates.endDate)

        try {
            const res = await fetch(`/api/reports/enterprise?${params.toString()}`)
            if (res.ok) {
                const json = await res.json()
                setData(json)
            }
        } catch (error) {
            console.error('Failed to load report', error)
        } finally {
            setLoading(false)
        }
    }

    function downloadExcel() {
        if (!data) return

        const wb = XLSX.utils.book_new()
        const date = new Date().toLocaleString()
        const filters = `Dept: ${department || 'All'}, Status: ${status || 'All'}, Range: ${dateRange}`
        const user = "Admin User" // Placeholder until we have user context

        function createSheetWithHeader(data: any[], title: string) {
            const ws = XLSX.utils.json_to_sheet([])
            XLSX.utils.sheet_add_aoa(ws, [
                [`Report: ${title}`],
                [`Generated On: ${date}`],
                [`Filters: ${filters}`],
                [`User: ${user}`],
                [''] // Empty row
            ], { origin: 'A1' })

            XLSX.utils.sheet_add_json(ws, data, { origin: 'A6', skipHeader: false })
            return ws
        }

        // Sheet 1: Executive Summary
        const execData = [
            { Metric: 'Total Inventory', Value: data.executive.totalAssets },
            { Metric: 'Asset Usage Rate', Value: `${data.executive.utilizationRate}%` },
            { Metric: 'Available Stock', Value: data.executive.availableAssets },
            { Metric: 'Overdue Returns', Value: data.executive.overdueCount },
            { Metric: 'Compliance Score', Value: data.executive.overdueRisk }
        ]
        const wsExec = createSheetWithHeader(execData, "Executive Summary")
        XLSX.utils.book_append_sheet(wb, wsExec, "Executive Summary")

        // Sheet 2: Asset Distribution (Status & Type)
        const distData = [
            ...Object.entries(data.operational.byStatus).map(([k, v]) => ({ Category: 'Status', Name: k, Count: v })),
            ...data.operational.topTypes.map((t: any) => ({ Category: 'Asset Type', Name: t.name, Count: t.count }))
        ]
        const wsDist = createSheetWithHeader(distData, "Asset Distribution")
        XLSX.utils.book_append_sheet(wb, wsDist, "Asset Distribution")

        // Sheet 3: Risk & Control
        const riskData = [
            { RiskType: 'Aging Assets (>3 Years)', Count: data.risk.agingAssetsCount, Details: 'Assets older than 3 years' },
            { RiskType: 'Lost Assets', Count: data.risk.lostAssetsCount, Details: 'Marked as Lost' },
            { RiskType: 'Unassigned Assets', Count: data.risk.unassignedCount, Details: 'Available/Idle inventory' }
        ]
        const wsRisk = createSheetWithHeader(riskData, "Risk & Control")
        XLSX.utils.book_append_sheet(wb, wsRisk, "Risk & Control")

        // Sheet 4: Detailed Assets
        const wsRaw = createSheetWithHeader(data.raw, "Detailed Assets")
        XLSX.utils.book_append_sheet(wb, wsRaw, "Detailed Assets")

        XLSX.writeFile(wb, `Enterprise_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
    }

    if (loading && !data) return <div className="p-8 text-center text-gray-500">Loading Enterprise Data...</div>
    if (!data) return <div className="p-8 text-center text-red-500">Failed to load data.</div>

    // Prepare chart data
    const statusChartData = Object.entries(data.operational.byStatus).map(([name, value]) => ({ name, value }))
    const totalTypeCount = data.operational.topTypes.reduce((acc: number, curr: any) => acc + curr.count, 0)

    // Adaptive UI Logic
    const showStatusChart = statusChartData.length > 1 || (statusChartData.length === 1 && statusChartData[0].name !== 'Assigned')
    const allAssigned = statusChartData.length === 1 && statusChartData[0].name === 'Assigned'

    return (
        <div className="space-y-8">
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-4">
                    <div className="flex flex-col">
                        <label className="filter-label">Time Period</label>
                        <select
                            className="filter-control"
                            style={{ width: '160px' }}
                            value={dateRange}
                            onChange={e => setDateRange(e.target.value)}
                        >
                            <option value="all">All Time</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last Quarter</option>
                            <option value="year">This Year</option>
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="filter-label">Department</label>
                        <DepartmentSelect
                            value={department}
                            onChange={setDepartment}
                            departments={departments}
                            placeholder="All Departments"
                            className="w-[180px]"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="filter-label">Status</label>
                        <select
                            className="filter-control"
                            style={{ width: '150px' }}
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Available">Available</option>
                            <option value="Assigned">Assigned</option>
                            <option value="Lost">Lost</option>
                            <option value="Damaged">Damaged</option>
                        </select>
                    </div>
                </div>
                <button
                    onClick={downloadExcel}
                    className="btn btn-outline flex items-center gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Export to Excel
                </button>
            </div>

            {/* Layer 1: Executive Summary */}
            <section>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Executive Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <MetricCard
                        label="Total Inventory"
                        value={data.executive.totalAssets}
                        subtext={`${data.executive.availableAssets} items available in stock`}
                        tooltip="Total number of assets tracked in the system."
                        trend={(data.executive as any).trends?.inventory}
                    />
                    <MetricCard
                        label="Asset Usage Rate"
                        value={`${data.executive.utilizationRate}%`}
                        subtext={`${data.executive.inUseAssets} assigned / ${data.executive.totalAssets} total`}
                        color={data.executive.utilizationRate > 80 ? 'green' : 'blue'}
                        tooltip="Percentage of inventory currently assigned to employees. Higher is better."
                        trend={(data.executive as any).trends?.utilization}
                    />
                    <MetricCard
                        label="Overdue Returns"
                        value={data.executive.overdueCount}
                        subtext={data.executive.overdueCount > 0 ? "Items late for return" : "All items returned on time"}
                        color={data.executive.overdueCount > 0 ? 'red' : 'green'}
                        tooltip="Count of active assignments past their expected return date."
                        trend={(data.executive as any).trends?.overdue}
                    />
                    <MetricCard
                        label="Compliance Score"
                        value={data.executive.overdueRisk === 'Low' ? '100% (High)' : (data.executive.overdueRisk === 'Medium' ? 'Warning' : 'Critical')}
                        subtext={data.executive.overdueRisk === 'Low' ? 'No overdue risks detected' : 'Action required on overdue items'}
                        color={data.executive.overdueRisk === 'Low' ? 'green' : (data.executive.overdueRisk === 'High' ? 'red' : 'yellow')}
                        tooltip="Risk assessment based on overdue assignments. 'High' indicates >10% of inventory is overdue."
                    />
                </div>
            </section>

            {/* Layer 2: Operational Intelligence */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="card h-96 flex flex-col">
                    <h3 className="text-lg font-semibold mb-4">Assets by Status</h3>
                    <div className="flex-grow flex items-center justify-center py-4">
                        {allAssigned ? (
                            <div className="flex flex-col items-center justify-center text-center p-6 bg-green-50 rounded-lg border border-green-100 w-full h-full">
                                <div className="text-4xl mb-2">🎉</div>
                                <h4 className="text-green-800 font-bold text-lg mb-1">100% Optimization</h4>
                                <p className="text-green-600 text-sm">All assets are currently assigned and generative value. No idle inventory.</p>
                            </div>
                        ) : (
                            <CSSPieChart data={statusChartData} />
                        )}
                    </div>
                </div>

                <div className="card h-96">
                    <h3 className="text-lg font-semibold mb-4">Top 5 Asset Types</h3>
                    <div className="flex flex-col justify-center h-full space-y-4 px-2 overflow-y-auto">
                        {data.operational.topTypes.map((item: any, index: number) => {
                            const percent = totalTypeCount > 0 ? (item.count / totalTypeCount) * 100 : 0;
                            return (
                                <div key={item.name} className="flex items-center gap-4">
                                    <div className="w-24 text-sm text-gray-600 text-right font-medium truncate" title={item.name}>
                                        {item.name}
                                    </div>
                                    <div className="flex-1 h-8 bg-gray-100 rounded-r-lg relative group">
                                        <div
                                            className="h-full rounded-r-lg transition-all duration-500 ease-out flex items-center pl-2"
                                            style={{
                                                width: `${Math.max(percent, 2)}%`,
                                                backgroundColor: COLORS[index % COLORS.length]
                                            }}
                                        >
                                            <span className="text-xs font-bold text-white drop-shadow-md">{item.count}</span>
                                        </div>
                                        {/* Simple Tooltip */}
                                        <div className="absolute left-1/2 top-full mt-1 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none z-10 whitespace-nowrap">
                                            {item.name}: {item.count} ({Math.round(percent)}%)
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        {data.operational.topTypes.length === 0 && (
                            <div className="text-center text-gray-400 py-10">No asset types found</div>
                        )}
                    </div>
                </div>
            </section>

            {/* Layer 3: Risk & Control */}
            <section>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Risk & Control</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <RiskCard
                        title="Aging Assets (>3 Years)"
                        count={data.risk.agingAssetsCount}
                        description="Assets past standard depreciation lifecycle."
                        actionLabel="View Assets"
                        actionLink="/assets"
                    />
                    <RiskCard
                        title="Lost Assets (Total)"
                        count={data.risk.lostAssetsCount}
                        description="Total assets marked as 'Lost' in system."
                        severity="high"
                        actionLabel="Review Lost"
                        actionLink="/assets?status=Lost"
                    />
                    <RiskCard
                        title="Unassigned Idle Assets"
                        count={data.risk.unassignedCount}
                        description="Available assets sitting in inventory."
                        severity="low"
                        actionLabel="Assign Now"
                        actionLink="/assets/new"
                    />
                </div>
            </section>
        </div>
    )
}

function MetricCard({ label, value, subtext, color = 'blue', tooltip, trend }: any) {
    const colorClasses: any = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        red: 'text-red-600',
        yellow: 'text-yellow-600',
        gray: 'text-gray-600'
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-36 relative group">
            <div>
                <div className="flex items-center gap-1">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wide">{label}</h3>
                    {tooltip && (
                        <div className="relative">
                            <svg className="w-4 h-4 text-gray-300 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                                {tooltip}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                            </div>
                        </div>
                    )}
                </div>
                <div className={`text-3xl font-bold mt-2 ${colorClasses[color] || 'text-gray-900'}`}>{value}</div>
            </div>

            {/* Trend Indicator */}
            {trend && (
                <div className="flex items-center gap-1 mt-1">
                    <span className={`text-xs font-bold ${trend.direction === 'up' ? 'text-green-600' : (trend.direction === 'down' ? 'text-red-600' : 'text-gray-400')}`}>
                        {trend.direction === 'up' ? '▲' : (trend.direction === 'down' ? '▼' : '—')} {trend.value}
                    </span>
                    <span className="text-xs text-gray-400">{trend.label}</span>
                </div>
            )}

            {subtext && !trend && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
            {subtext && trend && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    )
}

function RiskCard({ title, count, description, severity = 'medium', actionLabel, actionLink }: any) {
    const severityColor: any = {
        low: 'border-l-4 border-yellow-400',
        medium: 'border-l-4 border-orange-500',
        high: 'border-l-4 border-red-600'
    }

    return (
        <div className={`bg-white p-6 rounded-r-xl shadow-sm border border-gray-100 ${severityColor[severity]} flex flex-col justify-between`}>
            <div>
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800">{title}</h3>
                    <span className="bg-gray-100 text-gray-800 text-xs font-bold px-2 py-1 rounded-full">{count}</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">{description}</p>
            </div>

            {actionLabel && (
                <div className="mt-4 pt-3 border-t border-gray-50">
                    <a href={actionLink || '#'} className="text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center gap-1">
                        {actionLabel} <span className="text-lg">›</span>
                    </a>
                </div>
            )}
        </div>
    )
}

function CSSPieChart({ data }: { data: any[] }) {
    if (!data || data.length === 0) return <div className="text-gray-400 text-sm">No Data</div>;

    const total = data.reduce((acc: number, curr: any) => acc + curr.value, 0);
    let currentDeg = 0;
    const gradientParts: string[] = [];

    data.forEach((item: any, index: number) => {
        if (item.value === 0) return;
        const percent = item.value / total;
        const deg = percent * 360;
        const endDeg = currentDeg + deg;
        gradientParts.push(`${COLORS[index % COLORS.length]} ${currentDeg}deg ${endDeg}deg`);
        currentDeg = endDeg;
    });

    const gradientString = `conic-gradient(${gradientParts.join(', ')})`;

    return (
        <div className="flex flex-col items-center justify-center w-full h-full">
            <div
                className="rounded-full relative shadow-sm"
                style={{
                    width: '200px',
                    height: '200px',
                    background: gradientString,
                }}
            >
                {/* Donut Hole */}
                <div className="absolute inset-0 m-auto bg-white rounded-full w-[120px] h-[120px] flex items-center justify-center shadow-inner">
                    <div className="text-center">
                        <span className="block text-2xl font-bold text-gray-800">{total}</span>
                        <span className="text-xs text-gray-500 uppercase">Total</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6 max-w-xs">
                {data.map((entry: any, index: number) => (
                    entry.value > 0 && (
                        <div key={index} className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            <span className="text-xs text-gray-600 font-medium">{entry.name} ({Math.round(entry.value / total * 100)}%)</span>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}
