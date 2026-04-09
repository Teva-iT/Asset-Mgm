'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useMemo, useEffect, useRef } from 'react'
import AssetTypeIcon from './AssetTypeIcon'
import { AlertTriangle, ChevronDown, ShieldAlert, ShieldCheck, Search, X } from 'lucide-react'

interface Asset {
    AssetID: string
    AssetType: string | null
    AssetName: string | null
    Brand: string | null
    Model: string | null
    SerialNumber: string | null
    DeviceTag: string | null
    Status: string | null
    Condition?: string | null
    Location: string | null
    StorageLocationID: string | null
    WarrantyExpiryDate?: string | null
    StorageLocation?: {
        Name: string
        ParentLocation?: { Name: string } | null
    } | null
    updatedAt: string | Date
    AssetModel?: {
        Name: string
        Manufacturer: {
            Name: string
        }
    } | null
    assignments?: {
        Status: string
        Employee?: {
            FirstName: string
            LastName: string
        } | null
    }[]
}

function normalizeText(value: unknown) {
    return String(value || '').trim().toLowerCase()
}

function getAssetRisk(status: string | null, condition: string | null) {
    const normalizedStatus = normalizeText(status)
    const normalizedCondition = normalizeText(condition)

    if (
        ['lost', 'stolen', 'missing'].includes(normalizedStatus) ||
        /(broken|damaged|faulty|defect|repair required)/i.test(normalizedCondition)
    ) {
        return {
            level: 'Critical',
            label: 'Critical',
            note: 'Immediate attention required',
            badgeClass: 'bg-red-100 text-red-700 border-red-200',
            icon: AlertTriangle,
        }
    }

    if (
        ['in repair', 'repair', 'reserved', 'quarantine', 'retired', 'disposed'].includes(normalizedStatus) ||
        /(used|fair|worn|old)/i.test(normalizedCondition)
    ) {
        return {
            level: 'Warning',
            label: 'Warning',
            note: 'Operational follow-up needed',
            badgeClass: 'bg-orange-100 text-orange-700 border-orange-200',
            icon: ShieldAlert,
        }
    }

    if (['assigned'].includes(normalizedStatus)) {
        return {
            level: 'Healthy',
            label: 'Healthy',
            note: 'In normal operation',
            badgeClass: 'bg-green-100 text-green-700 border-green-200',
            icon: ShieldCheck,
        }
    }

    return {
        level: 'Caution',
        label: 'Caution',
        note: 'Needs verification',
        badgeClass: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        icon: ShieldAlert,
    }
}

function summarizeSelections(selectedValues: string[], allLabel: string) {
    if (selectedValues.length === 0) return allLabel
    if (selectedValues.length <= 2) return selectedValues.join(', ')
    return `${selectedValues[0]} +${selectedValues.length - 1}`
}

function MultiSelectFilter({
    label,
    selectedValues,
    options,
    onChange,
    allLabel,
    className = '',
    renderOption,
}: {
    label: string
    selectedValues: string[]
    options: string[]
    onChange: (values: string[]) => void
    allLabel: string
    className?: string
    renderOption?: (option: string) => React.ReactNode
}) {
    const [isOpen, setIsOpen] = useState(false)
    const wrapperRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    function toggleOption(option: string) {
        if (selectedValues.includes(option)) {
            onChange(selectedValues.filter((value) => value !== option))
            return
        }

        onChange([...selectedValues, option])
    }

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="filter-control cursor-pointer justify-between w-full"
            >
                <span className={`truncate text-sm ${selectedValues.length > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                    {label}: {summarizeSelections(selectedValues, allLabel)}
                </span>
                <div className="ml-auto flex items-center gap-2">
                    {selectedValues.length > 0 && (
                        <span className="inline-flex min-w-5 justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {selectedValues.length}
                        </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                        <button type="button" onClick={() => onChange(options)} className="text-xs font-medium text-blue-600 hover:text-blue-800">
                            Select all
                        </button>
                        <button type="button" onClick={() => onChange([])} className="text-xs font-medium text-gray-500 hover:text-gray-800">
                            Clear
                        </button>
                    </div>
                    {options.map((option) => (
                        <label
                            key={option}
                            className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50 text-gray-700"
                        >
                            <input
                                type="checkbox"
                                checked={selectedValues.includes(option)}
                                onChange={() => toggleOption(option)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="min-w-0 flex-1 truncate text-sm">
                                {renderOption ? renderOption(option) : option}
                            </span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function AssetList({ initialAssets }: { initialAssets: Asset[] }) {
    const router = useRouter()

    // Filter States
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string[]>([])
    const [riskFilter, setRiskFilter] = useState<string[]>([])
    const [typeFilter, setTypeFilter] = useState<string[]>([])
    const [manufacturerFilter, setManufacturerFilter] = useState<string[]>([])
    const [locationFilter, setLocationFilter] = useState<string[]>([])

    // Fetch Statuses
    const [statuses, setStatuses] = useState<{ Name: string; Color: string; Description: string }[]>([])
    useEffect(() => {
        fetch('/api/statuses')
            .then(r => r.json())
            .then(data => setStatuses(Array.isArray(data) ? data : []))
            .catch(err => console.error('Failed to fetch statuses', err))
    }, [])

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
            const assetRisk = getAssetRisk(asset.Status, asset.Condition || null)
            const matchesStatus = statusFilter.length === 0 || statusFilter.includes(asset.Status || '')
            const matchesRisk = riskFilter.length === 0 || riskFilter.includes(assetRisk.level)
            const matchesType = typeFilter.length === 0 || typeFilter.includes(asset.AssetType || '')
            const matchesMfr = manufacturerFilter.length === 0 || manufacturerFilter.includes(mfrName)
            const matchesLocation = locationFilter.length === 0 || locationFilter.includes(asset.Location || '')

            return matchesSearch && matchesStatus && matchesRisk && matchesType && matchesMfr && matchesLocation
        })
    }, [initialAssets, search, statusFilter, riskFilter, typeFilter, manufacturerFilter, locationFilter])

    const clearFilters = () => {
        setSearch('')
        setStatusFilter([])
        setRiskFilter([])
        setTypeFilter([])
        setManufacturerFilter([])
        setLocationFilter([])
    }

    const hasFilters = search || statusFilter || riskFilter || typeFilter || manufacturerFilter || locationFilter
    const riskSummary = useMemo(() => {
        return filteredAssets.reduce((summary, asset) => {
            const risk = getAssetRisk(asset.Status, asset.Condition || null)
            summary[risk.level as keyof typeof summary] += 1
            return summary
        }, { Critical: 0, Warning: 0, Caution: 0, Healthy: 0 })
    }, [filteredAssets])

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
                    <MultiSelectFilter
                        label="Status"
                        selectedValues={statusFilter}
                        options={statuses.map(status => status.Name)}
                        onChange={setStatusFilter}
                        allLabel="All"
                        className="w-[220px]"
                        renderOption={(option) => {
                            const status = statuses.find((item) => item.Name === option)
                            return (
                                <span className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: status?.Color || '#6b7280' }} />
                                    <span>{option}</span>
                                </span>
                            )
                        }}
                    />

                    <MultiSelectFilter
                        label="Risk"
                        selectedValues={riskFilter}
                        options={['Critical', 'Warning', 'Caution', 'Healthy']}
                        onChange={setRiskFilter}
                        allLabel="All"
                        className="w-[180px]"
                    />

                    <MultiSelectFilter
                        label="Type"
                        selectedValues={typeFilter}
                        options={uniqueTypes.map((type) => type as string)}
                        onChange={setTypeFilter}
                        allLabel="All"
                        className="w-[180px]"
                    />

                    <MultiSelectFilter
                        label="Manufacturer"
                        selectedValues={manufacturerFilter}
                        options={uniqueManufacturers.map((manufacturer) => manufacturer as string)}
                        onChange={setManufacturerFilter}
                        allLabel="All"
                        className="w-[220px]"
                    />

                    {uniqueLocations.length > 0 && (
                        <MultiSelectFilter
                            label="Location"
                            selectedValues={locationFilter}
                            options={uniqueLocations.map((location) => location as string)}
                            onChange={setLocationFilter}
                            allLabel="All"
                            className="w-[220px]"
                        />
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-red-600">Critical</div>
                        <div className="text-xl font-bold text-red-700">{riskSummary.Critical}</div>
                    </div>
                    <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-orange-600">Warning</div>
                        <div className="text-xl font-bold text-orange-700">{riskSummary.Warning}</div>
                    </div>
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-yellow-700">Caution</div>
                        <div className="text-xl font-bold text-yellow-700">{riskSummary.Caution}</div>
                    </div>
                    <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-green-600">Healthy</div>
                        <div className="text-xl font-bold text-green-700">{riskSummary.Healthy}</div>
                    </div>
                </div>
            </div>

            {/* Mobile: Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredAssets.map(asset => (
                    <div key={asset.AssetID} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
                        {(() => {
                            const risk = getAssetRisk(asset.Status, asset.Condition || null)
                            const RiskIcon = risk.icon
                            return (
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${risk.badgeClass}`}>
                                        <RiskIcon className="h-3.5 w-3.5" />
                                        {risk.label}
                                    </span>
                                    <span className="text-[11px] text-gray-500">{risk.note}</span>
                                </div>
                            )
                        })()}
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
                            {asset.Status === 'Available' && (
                                <Link
                                    href={`/assets/${asset.AssetID}/assign`}
                                    className="flex-1 btn btn-primary text-center py-2 text-sm"
                                >
                                    Assign
                                </Link>
                            )}
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
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned To</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Manufacturer &amp; Model</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Asset S/N</th>
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
                                    {asset.WarrantyExpiryDate && (() => {
                                        const days = Math.ceil((new Date(asset.WarrantyExpiryDate!).getTime() - Date.now()) / 86400000)
                                        if (days < 0) return <div className="text-xs text-red-600 mt-1" title="Warranty expired">⚠️ Warranty expired</div>
                                        if (days <= 30) return <div className="text-xs text-orange-600 mt-1" title={`Warranty expires in ${days}d`}>⚠️ {days}d left</div>
                                        return null
                                    })()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {(() => {
                                        const risk = getAssetRisk(asset.Status, asset.Condition || null)
                                        const RiskIcon = risk.icon
                                        return (
                                            <div className="flex flex-col gap-1">
                                                <span className={`inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${risk.badgeClass}`}>
                                                    <RiskIcon className="h-3.5 w-3.5" />
                                                    {risk.label}
                                                </span>
                                                <span className="text-[11px] text-gray-500">{risk.note}</span>
                                            </div>
                                        )
                                    })()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {(() => {
                                        const activeAssignment = asset.assignments?.find(a => a.Status === 'Active')
                                        const employeeName = activeAssignment?.Employee
                                            ? `${activeAssignment.Employee.FirstName} ${activeAssignment.Employee.LastName}`
                                            : null
                                        return employeeName
                                            ? <span className="text-sm font-medium text-gray-900">👤 {employeeName}</span>
                                            : <span className="text-sm text-gray-400">—</span>
                                    })()}
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
                                    <span className="text-xs font-mono text-gray-600">{asset.SerialNumber || '—'}</span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                                    {asset.StorageLocation
                                        ? (asset.StorageLocation.ParentLocation
                                            ? `${asset.StorageLocation.ParentLocation.Name} › ${asset.StorageLocation.Name}`
                                            : asset.StorageLocation.Name)
                                        : (asset.Location || '-')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={`/assets/${asset.AssetID}`}
                                            className="text-blue-600 hover:text-blue-900 hover:underline px-2 py-1 rounded"
                                        >
                                            View
                                        </Link>
                                        {asset.Status === 'Available' && (
                                            <Link
                                                href={`/assets/${asset.AssetID}/assign`}
                                                className="text-green-600 hover:text-green-900 hover:underline px-2 py-1 rounded font-medium"
                                            >
                                                Assign
                                            </Link>
                                        )}
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
                                <td colSpan={8} className="text-center py-12 text-gray-500">
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
