'use client'

import { useState, useEffect } from 'react'
import { useModalDismiss } from '@/hooks/useModalDismiss'
import {
    AlertTriangle,
    ArrowRight,
    Bell,
    CheckCircle2,
    ChevronRight,
    Clock,
    Filter,
    MoreVertical,
    Plus,
    PlusCircle,
    Search,
    Settings,
    ShieldAlert,
    TrendingDown,
    TrendingUp,
    LayoutDashboard,
    ListFilter,
    Settings2,
    Database,
    MoreHorizontal,
    CheckCircle,
    CheckCheck,
    Info
} from 'lucide-react'

// Dummy/Placeholder for Pie Chart (until integrated with real charting or manual CSS)
function InventoryPieChart({ data }: { data: any }) {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="w-48 h-48 rounded-full border-8 border-gray-100 flex items-center justify-center relative overflow-hidden">
                {/* Simplified CSS Mock for Pie Chart */}
                <div className="absolute inset-0 bg-green-500" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 0)' }}></div>
                <div className="absolute inset-0 bg-yellow-500" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 30%, 50% 50%)' }}></div>
                <div className="absolute inset-0 bg-orange-500" style={{ clipPath: 'polygon(50% 50%, 100% 30%, 100% 50%, 50% 50%)' }}></div>
                <div className="absolute inset-0 bg-red-500" style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 60%, 50% 50%)' }}></div>
                <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center shadow-inner">
                    <div className="text-center">
                        <span className="block text-3xl font-bold text-gray-800">{data.total}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Total Models</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-6">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500"></div><span className="text-xs text-gray-500 font-medium">Healthy ({Math.round(data.healthy * 100 / data.total)}%)</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div><span className="text-xs text-gray-500 font-medium">Low ({Math.round(data.low * 100 / data.total)}%)</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div><span className="text-xs text-gray-500 font-medium">Critical ({Math.round(data.critical * 100 / data.total)}%)</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div><span className="text-xs text-gray-500 font-medium">Out ({Math.round(data.out * 100 / data.total)}%)</span></div>
            </div>
        </div>
    )
}

export default function InventoryHealthDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [forecasts, setForecasts] = useState<any[]>([])
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null)

    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }

    const fetchData = async () => {
        try {
            const [alertsRes, forecastRes] = await Promise.all([
                fetch('/api/inventory/alerts'),
                fetch('/api/inventory/forecast')
            ])
            if (alertsRes.ok && forecastRes.ok) {
                const alertsData = await alertsRes.json()
                const forecastData = await forecastRes.json()
                setData(alertsData)
                setForecasts(forecastData)
            }
        } catch (error) {
            console.error('Failed to load dashboard data', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAlertAction = async (alertId: string, action: string) => {
        if (action === 'view') {
            console.log('Viewing alert:', alertId)
        } else if (action === 'acknowledge') {
            try {
                const res = await fetch('/api/inventory/alerts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ alertId, action: 'acknowledge' })
                })
                if (res.ok) {
                    showToast('Alert acknowledged')
                    fetchData()
                }
            } catch (err) {
                console.error('Failed to acknowledge alert:', err)
            }
        } else if (action === 'resolve') {
            if (confirm('Resolve this alert? This assumes you have restocked or corrected the stock level.')) {
                try {
                    const res = await fetch('/api/inventory/alerts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ alertId, action: 'resolve' })
                    })
                    if (res.ok) fetchData()
                } catch (err) {
                    console.error('Failed to resolve alert:', err)
                }
            }
        } else if (action === 'snooze') {
            try {
                const res = await fetch('/api/inventory/alerts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ alertId, action: 'snooze' })
                })
                if (res.ok) fetchData()
            } catch (err) {
                console.error('Failed to snooze alert:', err)
            }
        }
    }

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchData, 30000)
        return () => clearInterval(interval)
    }, [])

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    )

    const summary = data?.summary || { lowStock: 0, criticalStock: 0, outOfStock: 0, totalModels: 0 }
    const healthyStock = summary.totalModels - (summary.lowStock + summary.criticalStock + summary.outOfStock)

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                        Inventory Health & Alerts
                        <span className="bg-blue-100 text-blue-600 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">Beta</span>
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium">Real-time stock monitoring and replenishment intelligence.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.location.href = '/inventory'}
                        className="flex items-center gap-2 px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold transition-all"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Quick Reorder
                    </button>
                    <button
                        onClick={async () => {
                            const res = await fetch('/api/inventory/sync', { method: 'POST' })
                            if (res.ok) {
                                showToast('Manual scan triggered successfully')
                                fetchData()
                            } else {
                                const err = await res.json()
                                showToast(err.error || 'Scan failed', 'error')
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-lg shadow-blue-200 transition-all active:scale-95 group relative"
                    >
                        <Database className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
                        Run Scan
                        {/* Tooltip explanation */}
                        <div className="absolute top-full mt-2 right-0 w-48 p-2 bg-gray-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                            Forces a full system scan of current stock levels against visibility rules to generate fresh alerts.
                        </div>
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl w-fit mb-8 border border-gray-100">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                </button>
                <button
                    onClick={() => setActiveTab('rules')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'rules' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Settings2 className="h-4 w-4" />
                    Alert Rules
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Bell className="h-4 w-4" />
                    Notification Settings
                </button>
            </div>

            {activeTab === 'dashboard' && (
                <div className="space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <SummaryCard
                            title="Low Stock Items"
                            value={summary.lowStock}
                            subtext="Models near threshold"
                            color="yellow"
                            icon={<TrendingDown className="h-8 w-8 text-yellow-500" />}
                        />
                        <SummaryCard
                            title="Critical Stock"
                            value={summary.criticalStock}
                            subtext="Action required now"
                            color="orange"
                            icon={<ShieldAlert className="h-8 w-8 text-orange-500" />}
                        />
                        <SummaryCard
                            title="Out of Stock"
                            value={summary.outOfStock}
                            subtext="Immediate restock needed"
                            color="red"
                            icon={<AlertTriangle className="h-8 w-8 text-red-500" />}
                        />
                        <SummaryCard
                            title="Predictive Risks"
                            value={forecasts.filter(f => f.status === 'DEPLETION RISK').length}
                            subtext="Forecasted out within 10d"
                            color="orange"
                            icon={<TrendingDown className="h-8 w-8 text-orange-500" />}
                        />
                        <SummaryCard
                            title="Healthy Models"
                            value={healthyStock}
                            subtext="Stock levels looking good"
                            color="green"
                            icon={<CheckCircle2 className="h-8 w-8 text-green-500" />}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Distribution Chart */}
                        <div className="lg:col-span-1 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Inventory Status Distribution</h3>
                            <InventoryPieChart data={{
                                total: summary.totalModels,
                                healthy: healthyStock,
                                low: summary.lowStock,
                                critical: summary.criticalStock,
                                out: summary.outOfStock
                            }} />
                        </div>

                        {/* Recent Alerts / Updates */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900">Active Inventory Alerts</h3>
                                <button className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1">
                                    View History
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-8 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Model</th>
                                            <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Stock</th>
                                            <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Threshold</th>
                                            <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                            <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Forecast</th>
                                            <th className="px-4 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next Reorder</th>
                                            <th className="px-8 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {data?.alerts?.length > 0 ? (
                                            data.alerts.map((alert: any) => {
                                                const forecast = forecasts.find(f => f.modelId === alert.ModelID)
                                                return (
                                                    <tr key={alert.AlertID} className="group hover:bg-gray-50/50 transition-all">
                                                        <td className="px-8 py-5">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{alert.AssetModel?.Name}</span>
                                                                <span className="text-xs text-gray-400 font-medium">Category: {alert.AssetModel?.Category}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-5 font-bold text-gray-700">{alert.CurrentStock}</td>
                                                        <td className="px-4 py-5 text-gray-500 font-medium">{alert.ThresholdAtTrigger}</td>
                                                        <td className="px-4 py-5">
                                                            <span className={`
                                                                px-3 py-1 rounded-full text-[10px] font-extrabold uppercase
                                                                ${alert.Status === 'OUT OF STOCK' ? 'bg-red-50 text-red-600 shadow-sm shadow-red-100' :
                                                                    alert.Status === 'CRITICAL' ? 'bg-orange-50 text-orange-600 shadow-sm shadow-orange-100' :
                                                                        'bg-yellow-50 text-yellow-600 shadow-sm shadow-yellow-100'}
                                                            `}>
                                                                {alert.Status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-5">
                                                            {forecast?.estimated_days_left !== undefined ? (
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`text-sm font-extrabold ${forecast.estimated_days_left < 7 ? 'text-red-500' : 'text-gray-700'}`}>
                                                                            {forecast.estimated_days_left} Days
                                                                        </span>
                                                                        {forecast.confidence === 'low' && (
                                                                            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-[9px] font-bold uppercase tracking-tighter" title="High usage volatility - estimate may be unreliable">
                                                                                <TrendingDown className="h-2 w-2" />
                                                                                Low Confidence
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">Avg {forecast.daily_consumption}/day</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-300 text-xs italic">Not enough data</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-5">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg w-fit">
                                                                    +{forecast?.recommended_reorder_qty || 10}
                                                                </span>
                                                                <span className="text-[9px] text-gray-400 font-bold uppercase mt-1">Suggested Reorder</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleAlertAction(alert.AlertID, 'view')}
                                                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                                    title="View Details"
                                                                >
                                                                    <ChevronRight className="h-4 w-4" />
                                                                </button>
                                                                {!alert.IsAcknowledged && (
                                                                    <button
                                                                        onClick={() => handleAlertAction(alert.AlertID, 'acknowledge')}
                                                                        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                                                        title="Acknowledge"
                                                                    >
                                                                        <CheckCircle className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => handleAlertAction(alert.AlertID, 'snooze')}
                                                                    className="p-1 text-gray-400 hover:text-orange-500 transition-colors"
                                                                    title="Snooze for 24h"
                                                                >
                                                                    <Clock className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAlertAction(alert.AlertID, 'resolve')}
                                                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                                    title="Mark Resolved"
                                                                >
                                                                    <CheckCheck className="h-4 w-4" />
                                                                </button>
                                                                <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-8 py-10 text-center text-gray-400 italic font-medium">
                                                    🎉 No active alerts! Everything is looking good.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'rules' && <AlertRulesPanel onUpdate={fetchData} showToast={showToast} />}
            {activeTab === 'settings' && <NotificationSettingsPanel showToast={showToast} />}

            {/* Toast Component */}
            {toast && (
                <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 z-[200] ${toast.type === 'error' ? 'bg-red-600 text-white' :
                    toast.type === 'info' ? 'bg-gray-800 text-white' :
                        'bg-green-600 text-white'
                    }`}>
                    {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> :
                        toast.type === 'error' ? <AlertTriangle className="h-5 w-5" /> :
                            <Info className="h-5 w-5" />}
                    <span className="font-bold text-sm tracking-tight">{toast.message}</span>
                </div>
            )}
        </div>
    )
}

function SummaryCard({ title, value, subtext, color, icon }: any) {
    const gradients: any = {
        yellow: 'from-yellow-500 to-amber-500 bg-yellow-50',
        orange: 'from-orange-500 to-red-500 bg-orange-50',
        red: 'from-red-500 to-rose-500 bg-red-50',
        green: 'from-green-500 to-emerald-500 bg-green-50'
    }

    const hoverColors: any = {
        yellow: 'hover:border-yellow-200 hover:shadow-yellow-100',
        orange: 'hover:border-orange-200 hover:shadow-orange-100',
        red: 'hover:border-red-200 hover:shadow-red-100',
        green: 'hover:border-green-200 hover:shadow-green-100'
    }

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 p-6 flex items-start gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-default ${hoverColors[color]}`}>
            <div className={`p-3 rounded-2xl shadow-inner`}>
                {icon}
            </div>
            <div>
                <h4 className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">{title}</h4>
                <div className="text-3xl font-black text-gray-900 mt-1">{value}</div>
                <p className="text-xs text-gray-500 font-medium mt-1">{subtext}</p>
            </div>
        </div>
    )
}

function AlertRulesPanel({ onUpdate, showToast }: { onUpdate: () => void, showToast: (m: string, t?: any) => void }) {
    const [rules, setRules] = useState<any[]>([])
    const [models, setModels] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const modalRef = useModalDismiss<HTMLDivElement>(() => setShowModal(false), showModal)
    const [editingRule, setEditingRule] = useState<any>(null)
    const [targetType, setTargetType] = useState<'model' | 'category'>('model')
    const [formData, setFormData] = useState({
        modelId: '',
        category: '',
        lowThreshold: 5,
        criticalThreshold: 2,
        forecastWindowDays: 30
    })

    const fetchRules = async () => {
        try {
            const res = await fetch('/api/inventory/alert-rules')
            if (res.ok) setRules(await res.json())

            const mRes = await fetch('/api/assets/models')
            if (mRes.ok) setModels(await mRes.json())
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchRules() }, [])

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this rule?')) return
        const res = await fetch(`/api/inventory/alert-rules?id=${id}`, { method: 'DELETE' })
        if (res.ok) {
            showToast('Rule deleted')
            fetchRules()
            onUpdate()
        }
    }

    const openEdit = (rule: any) => {
        setEditingRule(rule)
        const isCategory = !!rule.Category && !rule.ModelID
        setTargetType(isCategory ? 'category' : 'model')
        setFormData({
            modelId: rule.ModelID || '',
            category: rule.Category || '',
            lowThreshold: rule.LowThreshold,
            criticalThreshold: rule.CriticalThreshold,
            forecastWindowDays: rule.ForecastWindowDays || 30
        })
        setShowModal(true)
    }

    const openCreate = () => {
        setEditingRule(null)
        setTargetType('model')
        setFormData({ modelId: '', category: '', lowThreshold: 5, criticalThreshold: 2, forecastWindowDays: 30 })
        setShowModal(true)
    }

    const handleSave = async (e: any) => {
        e.preventDefault()
        const method = editingRule ? 'PATCH' : 'POST'
        const url = editingRule
            ? `/api/inventory/alert-rules?id=${editingRule.RuleID}`
            : '/api/inventory/alert-rules'
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        if (res.ok) {
            showToast(editingRule ? 'Rule updated successfully' : 'New rule created successfully')
            setShowModal(false)
            setEditingRule(null)
            fetchRules()
            onUpdate()
        } else {
            showToast('Failed to save rule', 'error')
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Alert Rules</h2>
                    <p className="text-gray-500 mt-1 font-medium italic">Override system defaults for specific categories or models.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    New Rule
                </button>
            </div>

            {loading ? (
                <div className="py-10 text-center text-gray-400">Loading rules...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {rules.map(rule => (
                        <RuleCard
                            key={rule.RuleID}
                            category={rule.Category || rule.AssetModel?.Name}
                            low={rule.LowThreshold}
                            critical={rule.CriticalThreshold}
                            window={rule.ForecastWindowDays}
                            onDelete={() => handleDelete(rule.RuleID)}
                            onEdit={() => openEdit(rule)}
                        />
                    ))}
                </div>
            )}

            {/* Simple Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div ref={modalRef} className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">{editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}</h3>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Select Asset Model</label>
                                <select
                                    value={formData.modelId}
                                    onChange={e => setFormData({ ...formData, modelId: e.target.value })}
                                    className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-gray-700"
                                >
                                    <option value="">-- Choose Model --</option>
                                    {models.map(m => <option key={m.ModelID} value={m.ModelID}>{m.Name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Low Threshold</label>
                                    <input
                                        type="number"
                                        value={formData.lowThreshold}
                                        onChange={e => setFormData({ ...formData, lowThreshold: parseInt(e.target.value) })}
                                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-gray-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Critical Threshold</label>
                                    <input
                                        type="number"
                                        value={formData.criticalThreshold}
                                        onChange={e => setFormData({ ...formData, criticalThreshold: parseInt(e.target.value) })}
                                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 font-bold text-gray-700"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                                >Cancel</button>
                                <button
                                    type="submit"
                                    className="flex-2 px-8 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all"
                                >{editingRule ? 'Update Rule' : 'Save Rule'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

function RuleCard({ category, low, critical, window: customWindow, onDelete, onEdit }: any) {
    return (
        <div className="p-6 border border-gray-100 rounded-2xl hover:shadow-lg transition-all group">
            <div className="flex items-center justify-between mb-4">
                <span className="font-black text-xl text-gray-800">{category}</span>
            </div>
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-bold">Low Threshold</span>
                    <span className="text-sm font-black text-gray-900 bg-gray-50 px-3 py-1 rounded-lg">{low} Items</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-bold">Critical Threshold</span>
                    <span className="text-sm font-black text-red-500 bg-red-50 px-3 py-1 rounded-lg">{critical} Items</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-bold">Forecast Window</span>
                    <span className="text-sm font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-lg">{customWindow || 30} Days</span>
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                <button
                    onClick={onDelete}
                    className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
                >Delete</button>
                <button
                    onClick={onEdit}
                    className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all"
                >Edit Rule</button>
            </div>
        </div>
    )
}

function NotificationSettingsPanel({ showToast }: { showToast: (m: string, t?: any) => void }) {
    const [settings, setSettings] = useState<any>({
        emailEnabled: true,
        systemEnabled: true,
        alertFrequency: 'Daily',
        recipients: []
    })
    const [emailInput, setEmailInput] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/inventory/notification-settings')
                if (res.ok) {
                    const data = await res.json()
                    if (data.UserID) {
                        const recs = typeof data.Recipients === 'string'
                            ? data.Recipients.split(',').map((s: string) => s.trim()).filter(Boolean)
                            : (Array.isArray(data.Recipients) ? data.Recipients : [])

                        setSettings({
                            emailEnabled: data.EmailEnabled,
                            systemEnabled: data.SystemEnabled,
                            alertFrequency: data.AlertFrequency,
                            recipients: recs
                        })
                    }
                }
            } catch (err) { console.error(err) }
            finally { setLoading(false) }
        }
        fetchSettings()
    }, [])

    const addEmail = (e?: any) => {
        if (e) e.preventDefault()
        if (emailInput && emailInput.includes('@') && !settings.recipients.includes(emailInput)) {
            setSettings({
                ...settings,
                recipients: [...settings.recipients, emailInput]
            })
            setEmailInput('')
        }
    }

    const removeEmail = (email: string) => {
        setSettings({
            ...settings,
            recipients: settings.recipients.filter((r: string) => r !== email)
        })
    }

    const handleSave = async () => {
        try {
            const res = await fetch('/api/inventory/notification-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...settings,
                    recipients: settings.recipients.join(','), // Save as string
                    userId: 'mahan'
                })
            })
            if (res.ok) showToast('Preferences saved successfully')
            else showToast('Failed to save settings', 'error')
        } catch (err) { console.error(err) }
    }

    if (loading) return <div className="p-8 text-center text-gray-400">Loading settings...</div>

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 animate-in slide-in-from-bottom-4 max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Notification Settings</h2>
            <p className="text-gray-500 font-medium mb-8">Choose how and when you want to be notified about stock levels.</p>

            <div className="space-y-8">
                <div
                    onClick={() => setSettings({ ...settings, systemEnabled: !settings.systemEnabled })}
                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-blue-100 transition-all cursor-pointer group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                            <Bell className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <span className="block font-bold text-gray-800">In-App Notifications</span>
                            <span className="text-xs text-gray-400 font-medium">Show real-time alerts in the dashboard bell.</span>
                        </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-all ${settings.systemEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute shadow-sm transition-all ${settings.systemEnabled ? 'right-1' : 'left-1'}`}></div>
                    </div>
                </div>

                <div
                    onClick={() => setSettings({ ...settings, emailEnabled: !settings.emailEnabled })}
                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-blue-100 transition-all cursor-pointer group"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                            <PlusCircle className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <span className="block font-bold text-gray-800">Email Notifications</span>
                            <span className="text-xs text-gray-400 font-medium">Daily digest and critical threshold alerts.</span>
                        </div>
                    </div>
                    <div className={`w-12 h-6 rounded-full relative flex items-center px-1 shadow-inner transition-all ${settings.emailEnabled ? 'bg-purple-600' : 'bg-gray-200'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full absolute shadow-sm transition-all ${settings.emailEnabled ? 'right-1' : 'left-1'}`}></div>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Email Recipients</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {settings.recipients.map((email: string) => (
                            <div key={email} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold group">
                                {email}
                                <button
                                    onClick={() => removeEmail(email)}
                                    className="hover:text-red-500 transition-colors"
                                >
                                    <Plus className="h-3 w-3 rotate-45" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={addEmail} className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                        <input
                            type="email"
                            value={emailInput}
                            onChange={e => setEmailInput(e.target.value)}
                            onBlur={addEmail}
                            className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-12 font-bold text-gray-700 focus:ring-2 focus:ring-blue-100 transition-all"
                            placeholder="Add email and press Enter..."
                        />
                        <button
                            type="submit"
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                        </button>
                    </form>
                    <p className="text-[10px] text-gray-400 font-medium px-2 italic">Multiple emails supported. Rules will be sent to all listed recipients.</p>
                </div>

                <div className="pt-4 border-t border-gray-50">
                    <button
                        onClick={handleSave}
                        className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-[0.98]"
                    >
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    )
}
