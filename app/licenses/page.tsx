'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface License {
    LicenseID: string
    ProductName: string
    VendorName: string | null
    LicenseType: string
    TotalSeats: number | null
    ExpiryDate: string | null
    CostPerYear: number | null
    Status: string
    usedSeats: number
    availableSeats: number | null
    isOverAllocated: boolean
    assignments: any[]
}

function ExpiryBadge({ date }: { date: string | null }) {
    if (!date) return <span className="text-gray-400 text-xs">No expiry</span>
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
    if (days < 0) return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Expired {Math.abs(days)}d ago</span>
    if (days <= 30) return <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">⚠️ {days}d left</span>
    if (days <= 90) return <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">{days}d left</span>
    return <span className="text-xs text-gray-500">{new Date(date).toLocaleDateString('de-CH')}</span>
}

function SeatBar({ used, total, overAllocated }: { used: number, total: number | null, overAllocated: boolean }) {
    if (total == null) return <span className="text-xs text-gray-400">Unlimited</span>
    const pct = Math.min(100, Math.round((used / total) * 100))
    const color = overAllocated ? 'bg-red-500' : pct >= 80 ? 'bg-orange-400' : 'bg-blue-500'
    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className={overAllocated ? 'text-red-600 font-semibold' : 'text-gray-600'}>{used} / {total} used</span>
                <span className="text-gray-400">{total - used} free</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

export default function LicensesPage() {
    const [licenses, setLicenses] = useState<License[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetch('/api/licenses').then(r => r.json()).then(data => {
            setLicenses(Array.isArray(data) ? data : [])
            setLoading(false)
        })
    }, [])

    const filtered = licenses.filter(l =>
        l.ProductName.toLowerCase().includes(search.toLowerCase()) ||
        (l.VendorName || '').toLowerCase().includes(search.toLowerCase())
    )

    const totalCost = licenses.reduce((s, l) => s + (l.CostPerYear || 0), 0)
    const expiringSoon = licenses.filter(l => {
        if (!l.ExpiryDate) return false
        const d = Math.ceil((new Date(l.ExpiryDate).getTime() - Date.now()) / 86400000)
        return d >= 0 && d <= 30
    }).length
    const overAllocated = licenses.filter(l => l.isOverAllocated).length

    return (
        <div className="container">
            <div className="header">
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>📋 License Management</h1>
                    <p className="text-sm text-gray-500 mt-1">{licenses.length} licenses tracked</p>
                </div>
                <Link href="/licenses/new" className="btn btn-primary">+ Add License</Link>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="card p-4 border-l-4 border-blue-500">
                    <div className="text-2xl font-bold text-blue-700">{licenses.length}</div>
                    <div className="text-sm text-gray-500">Total Licenses</div>
                </div>
                <div className="card p-4 border-l-4 border-red-400">
                    <div className="text-2xl font-bold text-red-600">{overAllocated}</div>
                    <div className="text-sm text-gray-500">Over-Allocated</div>
                </div>
                <div className="card p-4 border-l-4 border-orange-400">
                    <div className="text-2xl font-bold text-orange-600">{expiringSoon}</div>
                    <div className="text-sm text-gray-500">Expiring &lt;30d</div>
                </div>
                <div className="card p-4 border-l-4 border-green-500">
                    <div className="text-2xl font-bold text-green-700">
                        CHF {totalCost.toLocaleString('de-CH', { minimumFractionDigits: 0 })}
                    </div>
                    <div className="text-sm text-gray-500">Annual Cost</div>
                </div>
            </div>

            {/* Search */}
            <div className="card mb-4 p-3">
                <input
                    className="input-field"
                    placeholder="Search by product or vendor..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            {/* Table */}
            <div className="card bg-white overflow-hidden p-0 border border-gray-200 rounded-lg">
                {loading ? (
                    <div className="p-12 text-center text-gray-400">Loading...</div>
                ) : (
                    <table className="table min-w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-48">Seat Usage</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost / Year</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(license => (
                                <tr key={license.LicenseID} className={`hover:bg-gray-50 ${license.isOverAllocated ? 'bg-red-50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{license.ProductName}</div>
                                        {license.VendorName && <div className="text-xs text-gray-500">{license.VendorName}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{license.LicenseType}</td>
                                    <td className="px-6 py-4">
                                        <SeatBar used={license.usedSeats} total={license.TotalSeats} overAllocated={license.isOverAllocated} />
                                    </td>
                                    <td className="px-6 py-4"><ExpiryBadge date={license.ExpiryDate} /></td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {license.CostPerYear
                                            ? `CHF ${Number(license.CostPerYear).toLocaleString('de-CH', { minimumFractionDigits: 0 })}`
                                            : '—'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${license.Status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {license.Status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/licenses/${license.LicenseID}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                            Manage →
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                                        No licenses yet. <Link href="/licenses/new" className="text-blue-600 hover:underline">Add your first license →</Link>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
