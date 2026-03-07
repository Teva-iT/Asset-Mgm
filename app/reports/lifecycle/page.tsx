'use client'

import { useState, useEffect } from 'react'
import { Clock, TrendingUp, Package, AlertTriangle, RefreshCw, Activity, ShoppingCart, PieChart, Info } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────
interface AgeGroup { label: string; count: number; pct: number }
interface ProcurementPoint { year: string; count: number }
interface StatusItem { status: string; count: number }
interface ChurnAsset { assetId: string; label: string; modelName: string; category: string; reassignments: number }
interface EolForecast { modelId: string; name: string; category: string; ageYears: number; count: number; eolYears: number; urgency: 'critical' | 'soon' | 'approaching' }
interface LifecycleData {
    summary: { totalAssets: number; avgAgeYears: number; eolCount: number; activeCount: number }
    ageDistribution: AgeGroup[]
    procurementTrend: ProcurementPoint[]
    statusDistribution: StatusItem[]
    topChurnAssets: ChurnAsset[]
    eolForecasts: EolForecast[]
    eolTimeline: { next6: number; next12: number; next24: number }
}

const STATUS_COLORS: Record<string, string> = {
    'Assigned': 'bg-green-400', 'Available': 'bg-blue-400', 'In Stock': 'bg-sky-400',
    'Under Repair': 'bg-orange-400', 'Retired': 'bg-gray-400', 'Lost': 'bg-red-400', 'Disposed': 'bg-red-600',
}
const STATUS_TEXT: Record<string, string> = {
    'Assigned': 'text-green-600 bg-green-50', 'Available': 'text-blue-600 bg-blue-50',
    'In Stock': 'text-sky-600 bg-sky-50', 'Under Repair': 'text-orange-600 bg-orange-50',
    'Retired': 'text-gray-600 bg-gray-50', 'Lost': 'text-red-600 bg-red-50', 'Disposed': 'text-red-700 bg-red-50',
}

const URGENCY = {
    critical: { card: 'border-red-200 bg-red-50/40', dot: 'bg-red-500', badge: 'text-red-700 bg-red-100 border-red-200', label: 'Critical' },
    soon: { card: 'border-orange-200 bg-orange-50/30', dot: 'bg-orange-400', badge: 'text-orange-700 bg-orange-100 border-orange-200', label: 'Replace Soon' },
    approaching: { card: 'border-yellow-200 bg-yellow-50/20', dot: 'bg-yellow-400', badge: 'text-yellow-700 bg-yellow-100 border-yellow-200', label: 'Approaching' },
}

// ─── Replacement Wave Detector ───────────────────────────
const EOL_WAVE_YEARS: Record<string, number> = { Laptop: 4, Notebook: 4, Desktop: 5, Monitor: 6, Printer: 7, Tablet: 3, Default: 4 }
function waveYear(yearStr: string, count: number): number | null {
    if (count < 10) return null
    return parseInt(yearStr) + EOL_WAVE_YEARS['Default']
}

// ─── Procurement Bar Chart ─────────────────────────────
function ProcurementChart({ data }: { data: ProcurementPoint[] }) {
    const max = Math.max(...data.map(d => d.count), 1)
    return (
        <>
            <div className="flex items-end gap-2 h-44 mt-4">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 leading-relaxed text-center">
                            <div>{d.count} assets</div>
                            <div className="text-gray-400 text-[9px]">{d.year}</div>
                        </div>
                        {d.count > 0 && <span className="text-[10px] font-bold text-indigo-600">{d.count}</span>}
                        <div className="w-full flex items-end" style={{ height: '110px' }}>
                            <div
                                className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg cursor-default transition-all duration-700"
                                style={{ height: `${Math.max(4, (d.count / max) * 110)}px` }}
                            />
                        </div>
                        <span className="text-xs font-black text-gray-600">{d.year}</span>
                        {d.count >= 10 && (
                            <span className="text-[8px] text-orange-500 font-bold">⚠ wave</span>
                        )}
                    </div>
                ))}
            </div>
            {/* Replacement Wave Predictions */}
            {data.some(d => d.count >= 10) && (
                <div className="mt-4 space-y-2">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest">🔮 Replacement Wave Predictions</p>
                    {data.filter(d => d.count >= 10).map(d => {
                        const wave = waveYear(d.year, d.count)
                        return wave ? (
                            <div key={d.year} className="flex items-center gap-3 px-3 py-2 bg-orange-50 border border-orange-100 rounded-xl">
                                <span className="text-orange-500 text-base">⚠</span>
                                <p className="text-xs font-bold text-orange-700">
                                    <span className="font-black">{d.count} assets</span> purchased in {d.year} — expected replacement wave in <span className="font-black">{wave}</span>
                                </p>
                            </div>
                        ) : null
                    })}
                </div>
            )}
        </>
    )
}

// ─── KPI Card ────────────────────────────────────────────
function KpiCard({ title, value, sub, icon, color, tooltip }: any) {
    const [show, setShow] = useState(false)
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4 hover:shadow-lg transition-all">
            <div className={`p-3 rounded-2xl ${color}`}>{icon}</div>
            <div className="flex-1">
                <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
                    {tooltip && (
                        <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
                            <Info className="h-3 w-3 text-gray-300 cursor-help" />
                            {show && <div className="absolute left-4 top-0 w-52 bg-gray-900 text-white text-xs px-3 py-2 rounded-xl z-50 shadow-xl">{tooltip}</div>}
                        </div>
                    )}
                </div>
                <p className="text-3xl font-black text-gray-900 mt-0.5">{value}</p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">{sub}</p>
            </div>
        </div>
    )
}

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

// ─── Main Page ────────────────────────────────────────────
export default function LifecycleReportsPage() {
    const [data, setData] = useState<LifecycleData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetch('/api/reports/lifecycle')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false) })
            .catch(() => { setError('Failed to load lifecycle data'); setLoading(false) })
    }, [])

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400 font-bold">Analyzing asset lifecycle...</p>
            </div>
        </div>
    )
    if (error || !data) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <p className="text-red-500 font-bold">{error || 'No data'}</p>
        </div>
    )

    const { summary, ageDistribution, procurementTrend, statusDistribution, topChurnAssets, eolForecasts, eolTimeline } = data
    const maxStatus = Math.max(...statusDistribution.map(s => s.count), 1)
    const maxChurn = Math.max(...topChurnAssets.map(c => c.reassignments), 1)
    const maxAge = Math.max(...ageDistribution.map(a => a.count), 1)

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-100 px-8 py-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Lifecycle Reports</h1>
                        <p className="text-gray-400 font-medium mt-1">From procurement to retirement — the full story of your assets.</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-xl">
                        <Activity className="h-4 w-4 text-indigo-500" />
                        Asset Lifecycle Intelligence
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard title="Total Assets" value={summary.totalAssets.toLocaleString()} sub="All statuses"
                        icon={<Package className="h-5 w-5 text-indigo-600" />} color="bg-indigo-50" />
                    <KpiCard title="Avg Asset Age" value={`${summary.avgAgeYears.toFixed(1)} yrs`} sub="Across all assets"
                        tooltip="Average age calculated from PurchaseDate. If PurchaseDate is missing, the asset's creation date is used as a fallback."
                        icon={<Clock className="h-5 w-5 text-blue-600" />} color="bg-blue-50" />
                    <KpiCard title="EOL Warning" value={summary.eolCount.toLocaleString()}
                        sub="Assets at or past EOL threshold" tooltip="EOL varies by category: Laptop=4yr, Monitor=6yr, Printer=7yr, Tablet=3yr"
                        icon={<AlertTriangle className="h-5 w-5 text-red-500" />} color="bg-red-50" />
                    <KpiCard title="Active Assigned" value={summary.activeCount.toLocaleString()} sub="Currently in use"
                        icon={<TrendingUp className="h-5 w-5 text-green-600" />} color="bg-green-50" />
                </div>

                {/* Procurement Trend */}
                <SectionCard
                    title="Procurement Trend"
                    subtitle="Assets purchased per year — bars marked ⚠ wave indicate future replacement surges"
                    icon={<ShoppingCart className="h-5 w-5 text-indigo-600" />}
                >
                    {procurementTrend.length === 0
                        ? <p className="text-gray-400 text-sm">No purchase date data available.</p>
                        : <>
                            <ProcurementChart data={procurementTrend} />
                            <p className="text-xs text-gray-400 mt-3 font-medium">
                                💡 Procurement cost not available in current schema. Add a <code className="bg-gray-100 px-1 rounded">PurchasePrice</code> column to the Asset table to enable financial reporting.
                            </p>
                        </>
                    }
                </SectionCard>

                {/* Age Distribution + Status */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard
                        title="Age of Assets"
                        subtitle="Distribution with percentage — plan your replacement cycle"
                        icon={<Clock className="h-5 w-5 text-blue-600" />}
                    >
                        <div className="space-y-3">
                            {ageDistribution.map(({ label, count, pct }) => (
                                <div key={label}>
                                    <div className="flex justify-between mb-1.5">
                                        <span className="text-sm font-bold text-gray-700">{label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400">{count} assets ({pct}%)</span>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-700 ${label === '<1yr' ? 'bg-green-400' :
                                            label === '1–2yr' ? 'bg-blue-400' :
                                                label === '2–3yr' ? 'bg-yellow-400' :
                                                    label === '3–5yr' ? 'bg-orange-400' : 'bg-red-500'
                                            }`} style={{ width: `${(count / maxAge) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                            <p className="text-xs font-bold text-blue-700">💡 Most companies replace laptops every 3–4 years. Monitor your 3–5yr band closely.</p>
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Asset Status Distribution"
                        subtitle="Where are your assets in their lifecycle right now?"
                        icon={<PieChart className="h-5 w-5 text-purple-600" />}
                    >
                        <div className="space-y-3">
                            {statusDistribution.map(({ status, count }) => (
                                <div key={status} className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_COLORS[status] || 'bg-gray-400'}`} />
                                    <span className="text-sm font-bold text-gray-700 flex-1">{status}</span>
                                    <div className="flex items-center gap-2 w-40">
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${STATUS_COLORS[status] || 'bg-gray-400'}`} style={{ width: `${(count / maxStatus) * 100}%` }} />
                                        </div>
                                        <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${STATUS_TEXT[status] || 'text-gray-600 bg-gray-50'}`}>{count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>

                {/* Churn Assets + EOL Forecast */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SectionCard
                        title="Top Churn Assets"
                        subtitle="Individual assets reassigned most often — high wear indicators"
                        icon={<RefreshCw className="h-5 w-5 text-teal-600" />}
                    >
                        {topChurnAssets.length === 0
                            ? <p className="text-gray-400 text-sm">No multi-assignment assets recorded yet.</p>
                            : (
                                <div className="space-y-3">
                                    {topChurnAssets.map((a, i) => (
                                        <div key={a.assetId} className="flex items-center gap-3">
                                            <span className="text-lg font-black text-gray-200 w-5 shrink-0 text-right">{i + 1}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800 truncate">{a.label}</p>
                                                <p className="text-[10px] text-gray-400">{a.modelName} · {a.category}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-black text-teal-700">Reassigned: {a.reassignments} times</p>
                                                <div className="mt-1 h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-teal-400 rounded-full" style={{ width: `${(a.reassignments / maxChurn) * 100}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        }
                    </SectionCard>

                    <SectionCard
                        title="End-of-Life Forecast"
                        subtitle="Assets approaching category-specific EOL thresholds"
                        icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                    >
                        {/* Timeline Summary */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="p-2.5 bg-yellow-50 rounded-xl border border-yellow-100 text-center">
                                <p className="text-xl font-black text-yellow-600">{eolTimeline.next6}</p>
                                <p className="text-[10px] font-bold text-yellow-400">assets</p>
                                <p className="text-[10px] font-bold text-yellow-500">EOL in 6 months</p>
                            </div>
                            <div className="p-2.5 bg-orange-50 rounded-xl border border-orange-100 text-center">
                                <p className="text-xl font-black text-orange-600">{eolTimeline.next12}</p>
                                <p className="text-[10px] font-bold text-orange-400">assets</p>
                                <p className="text-[10px] font-bold text-orange-500">EOL in 12 months</p>
                            </div>
                            <div className="p-2.5 bg-red-50 rounded-xl border border-red-100 text-center">
                                <p className="text-xl font-black text-red-600">{eolTimeline.next24}</p>
                                <p className="text-[10px] font-bold text-red-400">assets</p>
                                <p className="text-[10px] font-bold text-red-500">EOL in 24 months</p>
                            </div>
                        </div>

                        {eolForecasts.length === 0 ? (
                            <div className="py-4 text-center">
                                <div className="text-3xl mb-1">✅</div>
                                <p className="text-sm font-bold text-green-600">All assets within useful life!</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {eolForecasts.map(e => {
                                    const u = URGENCY[e.urgency]
                                    return (
                                        <div key={e.modelId} className={`flex items-center gap-3 p-3 rounded-xl border ${u.card}`}>
                                            <div className={`w-2 h-2 rounded-full ${u.dot} shrink-0`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800 truncate">{e.name}</p>
                                                <p className="text-[10px] text-gray-500">
                                                    {e.category} · {e.count} units · EOL threshold: {e.eolYears}yr
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-black text-gray-700">{e.ageYears} yrs avg</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${u.badge}`}>{u.label}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </SectionCard>
                </div>

            </div>
        </div>
    )
}
