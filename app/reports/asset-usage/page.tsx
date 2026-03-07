'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Package, RefreshCw, BarChart3, AlertTriangle, Activity, Zap, Info } from 'lucide-react'

interface ModelStat {
    modelId: string; name: string; category: string
    availableStock: number; assignedCount: number; totalAssignments: number
    turnoverRate: number; idleStock: number; idleDays: number | null; usageRate: number
}
interface TrendPoint { month: string; count: number }
interface UsageData {
    summary: { totalAssets: number; totalAssigned: number; totalIdle: number; utilizationRate: number }
    mostUsed: ModelStat[]; leastUsed: ModelStat[]; idle: ModelStat[]
    topTurnover: ModelStat[]; trend: TrendPoint[]
}

// ─── Idle Severity ───────────────────────────────────────
function idleSeverity(days: number | null) {
    if (days === null) return { label: 'Never Used', color: 'text-red-700 bg-red-100 border-red-200', dot: 'bg-red-500', card: 'border-red-200 bg-red-50/40' }
    if (days >= 180) return { label: `${days}d — Critical`, color: 'text-red-600 bg-red-50 border-red-200', dot: 'bg-red-500', card: 'border-red-200 bg-red-50/30' }
    if (days >= 90) return { label: `${days}d — Warning`, color: 'text-amber-600 bg-amber-50 border-amber-200', dot: 'bg-amber-400', card: 'border-amber-200 bg-amber-50/30' }
    return { label: `${days}d idle`, color: 'text-gray-500 bg-gray-50 border-gray-200', dot: 'bg-gray-300', card: 'border-gray-100 bg-gray-50/30' }
}

// ─── Mini Bar ────────────────────────────────────────────
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
    return (
        <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-black text-gray-700 w-6 text-right">{value}</span>
        </div>
    )
}

// ─── 12-Month Trend ───────────────────────────────────────
function TrendChart({ data }: { data: TrendPoint[] }) {
    const max = Math.max(...data.map(d => d.count), 1)
    return (
        <div className="flex items-end gap-2 h-36 mt-4">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Hover tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 text-center leading-relaxed pointer-events-none">
                        <div className="text-gray-300">{d.month}</div>
                        <div>Assignments: {d.count}</div>
                    </div>
                    {d.count > 0 && <span className="text-[10px] font-bold text-blue-600">{d.count}</span>}
                    <div className="w-full flex items-end" style={{ height: '90px' }}>
                        <div
                            className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg cursor-default"
                            style={{ height: `${max > 0 ? Math.max(4, (d.count / max) * 90) : 4}px` }}
                        />
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 leading-none">{d.month.split(' ')[0]}</span>
                    <span className="text-[9px] text-gray-300">{d.month.split(' ')[1]}</span>
                </div>
            ))}
        </div>
    )
}

// ─── KPI Card with optional tooltip ──────────────────────
function KpiCard({ title, value, sub, icon, color, tooltip }: any) {
    const [show, setShow] = useState(false)
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4 hover:shadow-lg transition-all relative">
            <div className={`p-3 rounded-2xl ${color}`}>{icon}</div>
            <div className="flex-1">
                <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
                    {tooltip && (
                        <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
                            <Info className="h-3 w-3 text-gray-300 cursor-help" />
                            {show && (
                                <div className="absolute left-4 top-0 w-52 bg-gray-900 text-white text-xs font-medium px-3 py-2 rounded-xl z-50 shadow-xl leading-relaxed">
                                    {tooltip}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <p className="text-3xl font-black text-gray-900 mt-0.5">{value}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{sub}</p>
            </div>
        </div>
    )
}

// ─── Section Card ────────────────────────────────────────
function SectionCard({ title, subtitle, icon, children }: any) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-gray-50 rounded-xl">{icon}</div>
                <div>
                    <h3 className="font-black text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
                </div>
            </div>
            {children}
        </div>
    )
}

// ─── Main Page ───────────────────────────────────────────
export default function AssetUsagePage() {
    const [data, setData] = useState<UsageData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [idleSort, setIdleSort] = useState<'mostIdle' | 'oldestIdle' | 'mostCritical'>('mostIdle')

    useEffect(() => {
        fetch('/api/reports/asset-usage')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false) })
            .catch(() => { setError('Failed to load data'); setLoading(false) })
    }, [])

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 font-bold">Loading asset analytics...</p>
            </div>
        </div>
    )
    if (error || !data) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p className="text-red-500 font-bold">{error || 'No data'}</p>
        </div>
    )

    const { summary, mostUsed, leastUsed, idle, topTurnover, trend } = data
    const maxMostUsed = Math.max(...mostUsed.map(m => m.totalAssignments), 1)
    const maxTurnover = Math.max(...topTurnover.map(m => m.turnoverRate), 1)

    const sortedIdle = [...idle].sort((a, b) => {
        if (idleSort === 'mostIdle') return b.availableStock - a.availableStock
        if (idleSort === 'mostCritical') {
            // null (never used) = 99999 → sorts first (most critical)
            const da = a.idleDays ?? 99999
            const db = b.idleDays ?? 99999
            return db - da
        }
        // oldestIdle: same as mostCritical but label differs — oldest last-assigned
        const da = a.idleDays ?? 99999
        const db = b.idleDays ?? 99999
        return db - da
    })

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Asset Usage</h1>
                        <p className="text-gray-400 font-medium mt-1">How are your assets really being used?</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-xl">
                        <Activity className="h-4 w-4 text-green-500" />
                        Live Analytics
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                        title="Total Assets"
                        value={summary.totalAssets.toLocaleString()}
                        sub="Physical devices (not models)"
                        icon={<Package className="h-5 w-5 text-blue-600" />}
                        color="bg-blue-50"
                        tooltip="Counts individual physical assets (each device, unit, or item), not asset model types. Example: 20 Dell Latitude laptops = 20 assets, 1 model."
                    />
                    <KpiCard
                        title="Currently Assigned"
                        value={summary.totalAssigned.toLocaleString()}
                        sub="Active assignments"
                        icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                        color="bg-green-50"
                    />
                    <KpiCard
                        title="Idle Models"
                        value={summary.totalIdle.toLocaleString()}
                        sub="Models with stock but no active assignments"
                        icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
                        color="bg-amber-50"
                        tooltip="Asset models that have available stock in inventory but zero active assignments. These are sitting unused — candidates for reallocation or reduction."
                    />
                    <KpiCard
                        title="Utilization Rate"
                        value={`${summary.utilizationRate}%`}
                        sub={`${summary.totalAssigned} assigned / ${summary.totalAssets} total`}
                        icon={<Zap className="h-5 w-5 text-purple-600" />}
                        color="bg-purple-50"
                        tooltip={`Formula: Active Assignments ÷ Total Physical Assets\n\nSome systems measure Assigned ÷ Available only, but this counts all devices to give a realistic occupancy rate.\n\n${summary.totalAssigned} assigned ÷ ${summary.totalAssets} total = ${summary.utilizationRate}%`}
                    />
                </div>

                {/* 12-Month Trend */}
                <SectionCard
                    title="Assignment Trend — Last 12 Months"
                    subtitle="Number of new assignments per month. Hover over bars for details."
                    icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
                >
                    <TrendChart data={trend} />
                </SectionCard>

                {/* Most Used + Least Used */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard
                        title="Top 5 Most Used Models"
                        subtitle="Asset models with the highest total assignment count — demand leaders"
                        icon={<TrendingUp className="h-5 w-5 text-green-600" />}
                    >
                        <div className="space-y-3">
                            {mostUsed.length === 0 && <p className="text-gray-400 text-sm">No assignment data yet.</p>}
                            {mostUsed.slice(0, 5).map((m, i) => (
                                <div key={m.modelId} className="flex items-center gap-3">
                                    <span className="text-lg font-black text-gray-200 w-5 text-right shrink-0">{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate">{m.name}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{m.category}</p>
                                    </div>
                                    <div className="flex items-center gap-2 w-36">
                                        <MiniBar value={m.totalAssignments} max={maxMostUsed} color="bg-green-400" />
                                    </div>
                                    <span className="text-[10px] text-gray-400 shrink-0 w-16 text-right">{m.totalAssignments} times</span>
                                </div>
                            ))}
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Least Used Assets"
                        subtitle="Have stock but rarely assigned — possible overstock"
                        icon={<TrendingDown className="h-5 w-5 text-orange-500" />}
                    >
                        <div className="space-y-3">
                            {leastUsed.length === 0 && <p className="text-gray-400 text-sm">No data available.</p>}
                            {leastUsed.map((m, i) => (
                                <div key={m.modelId} className="flex items-center gap-3">
                                    <span className="text-lg font-black text-gray-200 w-5 text-right shrink-0">{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate">{m.name}</p>
                                        <p className="text-[10px] text-gray-400">{m.category}</p>
                                    </div>
                                    <div className="text-right shrink-0 space-y-0.5">
                                        <p className="text-xs font-black text-gray-700">Stock: {m.availableStock}</p>
                                        <p className="text-[10px] text-orange-500 font-bold">Used: {m.totalAssignments}× · {m.usageRate}%</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>

                {/* Idle Assets + Turnover */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard
                        title={`Idle Assets${idle.length > 0 ? ` (${idle.length})` : ''}`}
                        subtitle="Models with stock but no active assignments — with severity indicators"
                        icon={<Package className="h-5 w-5 text-amber-500" />}
                    >
                        {idle.length === 0 ? (
                            <div className="py-6 text-center">
                                <div className="text-4xl mb-2">🎉</div>
                                <p className="text-sm font-bold text-green-600">All stocked models have active assignments!</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Sort Controls */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex gap-3 text-[10px] font-bold">
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />≥180d Critical</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />≥90d Warning</span>
                                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />Normal</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setIdleSort('mostIdle')}
                                            className={`text-[10px] font-black px-2 py-1 rounded-lg transition-all ${idleSort === 'mostIdle' ? 'bg-amber-100 text-amber-700' : 'text-gray-400 hover:bg-gray-100'}`}
                                        >Most Stock</button>
                                        <button
                                            onClick={() => setIdleSort('oldestIdle')}
                                            className={`text-[10px] font-black px-2 py-1 rounded-lg transition-all ${idleSort === 'oldestIdle' ? 'bg-orange-100 text-orange-700' : 'text-gray-400 hover:bg-gray-100'}`}
                                        >Oldest Idle</button>
                                        <button
                                            onClick={() => setIdleSort('mostCritical')}
                                            className={`text-[10px] font-black px-2 py-1 rounded-lg transition-all ${idleSort === 'mostCritical' ? 'bg-red-100 text-red-700' : 'text-gray-400 hover:bg-gray-100'}`}
                                        >Most Critical</button>
                                    </div>
                                </div>
                                {sortedIdle.map(m => {
                                    const s = idleSeverity(m.idleDays)
                                    return (
                                        <div key={m.modelId} className={`flex items-center gap-3 p-3 rounded-xl border ${s.card}`}>
                                            <div className={`w-2 h-2 rounded-full ${s.dot} shrink-0`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800 truncate">{m.name}</p>
                                                <p className="text-[10px] text-gray-400">{m.category}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-black text-gray-700">{m.availableStock} in stock</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${s.color}`}>{s.label}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title="Asset Turnover Rate"
                        subtitle="Times a model's assets were assigned → returned → reassigned"
                        icon={<RefreshCw className="h-5 w-5 text-purple-600" />}
                    >
                        <div className="space-y-3">
                            {topTurnover.filter(m => m.turnoverRate > 0).length === 0 && (
                                <p className="text-gray-400 text-sm">No returned assignments recorded yet.</p>
                            )}
                            {topTurnover.filter(m => m.turnoverRate > 0).map((m, i) => (
                                <div key={m.modelId} className="flex items-center gap-3">
                                    <span className="text-lg font-black text-gray-200 w-5 text-right shrink-0">{i + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 truncate">{m.name}</p>
                                        <p className="text-[10px] text-gray-400">{m.category}</p>
                                    </div>
                                    <div className="flex items-center gap-2 w-32">
                                        <MiniBar value={m.turnoverRate} max={maxTurnover} color="bg-purple-400" />
                                    </div>
                                    <span className="text-[10px] text-purple-600 font-bold shrink-0">×{m.turnoverRate}</span>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>

            </div>
        </div>
    )
}
