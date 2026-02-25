'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'

type WarrantyStatus = 'expired' | 'critical' | 'warning' | 'good' | 'none'

function getWarrantyStatus(date: string | null): WarrantyStatus {
    if (!date) return 'none'
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
    if (days < 0) return 'expired'
    if (days <= 30) return 'critical'
    if (days <= 90) return 'warning'
    return 'good'
}

function daysUntil(date: string | null): number | null {
    if (!date) return null
    return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
}

const STATUS_CFG = {
    expired: { row: 'bg-red-50 hover:bg-red-100', badge: 'bg-red-100 text-red-700 border border-red-200', label: '⛔ Expired' },
    critical: { row: 'bg-orange-50 hover:bg-orange-100', badge: 'bg-orange-100 text-orange-700 border border-orange-200', label: '⚠️ < 30 days' },
    warning: { row: 'bg-yellow-50 hover:bg-yellow-100', badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200', label: '🔔 < 90 days' },
    good: { row: 'bg-white hover:bg-green-50', badge: 'bg-green-100 text-green-700 border border-green-200', label: '✅ Valid' },
    none: { row: 'bg-white hover:bg-gray-50', badge: 'bg-gray-100 text-gray-500 border border-gray-200', label: 'No data' },
}

const FILTER_OPTIONS = [
    { key: 'all', label: 'All' },
    { key: 'expired', label: '⛔ Expired' },
    { key: 'critical', label: '⚠️ < 30d' },
    { key: 'warning', label: '🔔 < 90d' },
    { key: 'good', label: '✅ Valid' },
    { key: 'none', label: 'No data' },
]

export default function WarrantyTable({ assets }: { assets: any[] }) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim()
        return assets.filter(asset => {
            const ws = getWarrantyStatus(asset.WarrantyExpiryDate)
            if (statusFilter !== 'all' && ws !== statusFilter) return false
            if (!q) return true
            const name = asset.AssetName || asset.SerialNumber || asset.DeviceTag || ''
            const vendor = asset.VendorName || ''
            const model = asset.AssetModel?.Name || asset.Model || ''
            const mfr = asset.AssetModel?.Manufacturer?.Name || asset.Brand || ''
            const serial = asset.SerialNumber || ''
            return (
                name.toLowerCase().includes(q) ||
                vendor.toLowerCase().includes(q) ||
                model.toLowerCase().includes(q) ||
                mfr.toLowerCase().includes(q) ||
                serial.toLowerCase().includes(q)
            )
        })
    }, [assets, search, statusFilter])

    return (
        <>
            {/* Search + Filter Bar */}
            <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by asset, serial, vendor, model..."
                        className="input-field pl-9 pr-9"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {FILTER_OPTIONS.map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setStatusFilter(opt.key)}
                            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${statusFilter === opt.key ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-xs text-gray-500 mb-2 px-1">
                {filtered.length === assets.length ? `${assets.length} assets` : `${filtered.length} of ${assets.length} assets`}
                {search && <span className="ml-1 text-blue-600">· matching "{search}"</span>}
            </div>

            <div className="card bg-white overflow-hidden p-0 border border-gray-200 rounded-lg">
                <table className="table min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Asset</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Purchase Price</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Warranty Expiry</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Support Contract</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.map((asset: any) => {
                            const ws = getWarrantyStatus(asset.WarrantyExpiryDate)
                            const cfg = STATUS_CFG[ws]
                            const days = daysUntil(asset.WarrantyExpiryDate)
                            const mfr = asset.AssetModel?.Manufacturer?.Name || asset.Brand || ''
                            const model = asset.AssetModel?.Name || asset.Model || ''
                            return (
                                <tr key={asset.AssetID} className={`transition-colors ${cfg.row}`}>
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{asset.AssetName || asset.SerialNumber || asset.DeviceTag || '—'}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{[mfr, model, asset.AssetType].filter(Boolean).join(' · ')}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-800 font-medium">{asset.VendorName || '—'}</div>
                                        {asset.VendorContact && <div className="text-xs text-blue-600 mt-0.5">{asset.VendorContact}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                        {asset.PurchasePrice ? `CHF ${Number(asset.PurchasePrice).toLocaleString('de-CH', { minimumFractionDigits: 2 })}` : '—'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {asset.WarrantyExpiryDate ? (
                                            <>
                                                <div className="text-sm font-semibold text-gray-800">{new Date(asset.WarrantyExpiryDate).toLocaleDateString('de-CH')}</div>
                                                <div className={`text-xs mt-0.5 font-medium ${days !== null && days < 0 ? 'text-red-600' : days !== null && days <= 30 ? 'text-orange-600' : 'text-gray-500'}`}>
                                                    {days !== null && days < 0 ? `Expired ${Math.abs(days)}d ago` : days !== null ? `in ${days} days` : ''}
                                                </div>
                                            </>
                                        ) : <span className="text-gray-400 text-sm">—</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {asset.SupportContractEnd ? new Date(asset.SupportContractEnd).toLocaleDateString('de-CH') : '—'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.badge}`}>{cfg.label}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link href={`/assets/${asset.AssetID}`} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">Edit →</Link>
                                    </td>
                                </tr>
                            )
                        })}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-16 text-center">
                                    <div className="text-gray-400 text-sm">
                                        {search ? (<>No results for "<strong>{search}</strong>" — <button onClick={() => setSearch('')} className="text-blue-600 hover:underline">clear search</button></>) : 'No assets match the selected filter.'}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    )
}
