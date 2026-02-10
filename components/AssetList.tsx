'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import AssetTypeIcon from './AssetTypeIcon'
import { Filter, X, Search } from 'lucide-react'

interface Asset {
    AssetID: string
    AssetType: string | null
    AssetName: string | null
    Brand: string | null
    Model: string | null
    SerialNumber: string | null
    DeviceTag: string | null
    Status: string | null
    Location: string | null
    updatedAt: string | Date
    AssetModel?: {
        Name: string
        Manufacturer: {
            Name: string
        }
    } | null
}

export default function AssetList({ initialAssets }: { initialAssets: Asset[] }) {
    const router = useRouter()

    // Filter States
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [manufacturerFilter, setManufacturerFilter] = useState('')
    const [locationFilter, setLocationFilter] = useState('')

    const STATUS_OPTIONS = ['Available', 'Assigned', 'Returned', 'Lost', 'Damaged', 'In Stock', 'Low Stock', 'Retired']

    // Unique Values for Dropdowns
    const uniqueTypes = useMemo(() => Array.from(new Set(initialAssets.map(a => a.AssetType).filter(Boolean))), [initialAssets])
    const uniqueManufacturers = useMemo(() => Array.from(new Set(initialAssets.map(a => a.AssetModel?.Manufacturer.Name || a.Brand).filter(Boolean))), [initialAssets])
    const uniqueLocations = useMemo(() => Array.from(new Set(initialAssets.map(a => a.Location).filter(Boolean))), [initialAssets])

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this asset?')) return
        const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' })
        if (res.ok) {
            router.refresh()
        } else {
            alert('Failed to delete asset')
        }
    }

    const filteredAssets = useMemo(() => {
        return initialAssets.filter(asset => {
            const searchLower = search.toLowerCase()
            const modelName = asset.AssetModel?.Name || asset.Model || ''
            const mfrName = asset.AssetModel?.Manufacturer.Name || asset.Brand || ''

            // Search
            const matchesSearch = !search ||
                (asset.AssetName && asset.AssetName.toLowerCase().includes(searchLower)) ||
                (asset.SerialNumber && asset.SerialNumber.toLowerCase().includes(searchLower)) ||
                (asset.DeviceTag && asset.DeviceTag.toLowerCase().includes(searchLower)) ||
                (modelName.toLowerCase().includes(searchLower)) ||
                (mfrName.toLowerCase().includes(searchLower))

            // Filters
            const matchesStatus = !statusFilter || asset.Status === statusFilter
            const matchesType = !typeFilter || asset.AssetType === typeFilter
            const matchesMfr = !manufacturerFilter || mfrName === manufacturerFilter
            const matchesLocation = !locationFilter || asset.Location === locationFilter

            return matchesSearch && matchesStatus && matchesType && matchesMfr && matchesLocation
        })
    }, [initialAssets, search, statusFilter, typeFilter, manufacturerFilter, locationFilter])

    const clearFilters = () => {
        setSearch('')
        setStatusFilter('')
        setTypeFilter('')
        setManufacturerFilter('')
        setLocationFilter('')
    }

    const hasFilters = search || statusFilter || typeFilter || manufacturerFilter || locationFilter

    return (
        <div>
            {/* Advanced Filter Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 space-y-4">
                <div className="flex gap-2 relative items-center">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        placeholder="Search Assets (Name, Serial, Tag, Model...)"
                        className="!pl-12 input-field w-full h-10"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-3">
                    <select className="select-field w-auto min-w-[140px]" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">Status: All</option>
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select className="select-field w-auto min-w-[140px]" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                        <option value="">Type: All</option>
                        {uniqueTypes.map(t => <option key={t} value={t as string}>{t}</option>)}
                    </select>

                    <select className="select-field w-auto min-w-[140px]" value={manufacturerFilter} onChange={e => setManufacturerFilter(e.target.value)}>
                        <option value="">Manufacturer: All</option>
                        {uniqueManufacturers.map(m => <option key={m} value={m as string}>{m}</option>)}
                    </select>

                    {uniqueLocations.length > 0 && (
                        <select className="select-field w-auto min-w-[140px]" value={locationFilter} onChange={e => setLocationFilter(e.target.value)}>
                            <option value="">Location: All</option>
                            {uniqueLocations.map(l => <option key={l} value={l as string}>{l}</option>)}
                        </select>
                    )}

                    {hasFilters && (
                        <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1 px-2">
                            <X className="h-4 w-4" /> Clear
                        </button>
                    )}
                </div>

                <div className="text-xs text-gray-500 font-medium">
                    Showing {filteredAssets.length} of {initialAssets.length} assets
                </div>
            </div>

            {/* Mobile: Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredAssets.map(asset => (
                    <div key={asset.AssetID} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <AssetTypeIcon type={asset.AssetType || 'General'} className="w-6 h-6 text-gray-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 leading-tight">{asset.AssetName || 'Unnamed Asset'}</h3>
                                    <p className="text-sm text-gray-500">
                                        {asset.AssetModel?.Manufacturer.Name || asset.Brand} {asset.AssetModel?.Name || asset.Model}
                                    </p>
                                </div>
                            </div>
                            <span className={`badge badge-${(asset.Status || 'Available').toLowerCase().replace(' ', '-')} text-xs px-2 py-1`}>
                                {asset.Status || 'Unknown'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 border-t border-gray-50 pt-3 mt-1">
                            <div>
                                <span className="block text-xs text-gray-400 uppercase tracking-wide">Serial</span>
                                <span className="font-mono">{asset.SerialNumber || '-'}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-gray-400 uppercase tracking-wide">Tag</span>
                                <span>{asset.DeviceTag || '-'}</span>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-2 pt-2">
                            <Link
                                href={`/assets/${asset.AssetID}`}
                                className="flex-1 btn btn-outline text-center py-2 text-sm"
                            >
                                View / Edit
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop: Table View */}
            <div className="hidden md:block card bg-white overflow-hidden p-0 border border-gray-200 rounded-lg">
                <table className="table min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Asset</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Manufacturer & Model</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Serial / Tag</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAssets.map(asset => (
                            <tr key={asset.AssetID} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`badge badge-${(asset.Status || 'Available').toLowerCase().replace(' ', '-')}`}>
                                        {asset.Status || 'Unknown'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">{asset.AssetName || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <AssetTypeIcon type={asset.AssetType || 'General'} className="w-4 h-4 text-gray-400" />
                                        <span>{asset.AssetType || '-'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                    {asset.AssetModel?.Manufacturer.Name || asset.Brand} {asset.AssetModel?.Name || asset.Model}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-mono text-gray-600">{asset.SerialNumber}</span>
                                        {asset.DeviceTag && <span className="text-xs text-gray-400">{asset.DeviceTag}</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                                    {asset.Location || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={`/assets/${asset.AssetID}`}
                                            className="text-blue-600 hover:text-blue-900 hover:underline px-2 py-1 rounded"
                                        >
                                            View
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(asset.AssetID)}
                                            className="text-red-600 hover:text-red-900 hover:underline px-2 py-1 rounded"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredAssets.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-gray-500">
                                    No assets match your search filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
