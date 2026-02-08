'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import AssetTypeIcon from './AssetTypeIcon'
import AssetTypeSelect from './AssetTypeSelect'

interface Asset {
    AssetID: string
    AssetType: string
    AssetName: string
    Brand: string
    Model: string
    SerialNumber: string
    DeviceTag: string | null
    Status: string
    PurchaseDate: string | Date
    Notes: string | null
}

export default function AssetList({ initialAssets }: { initialAssets: Asset[] }) {
    const router = useRouter()
    const [filterType, setFilterType] = useState('')
    const [filterStatus, setFilterStatus] = useState('')
    const [search, setSearch] = useState('')
    const [assetTypes, setAssetTypes] = useState<string[]>([])

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const res = await fetch('/api/asset-types')
                if (res.ok) {
                    const data = await res.json()
                    setAssetTypes(data.map((t: any) => t.Name))
                }
            } catch (err) {
                console.error('Failed to fetch asset types', err)
            }
        }
        fetchTypes()
    }, [])

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this asset?')) return
        const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' })
        if (res.ok) {
            router.refresh()
        } else {
            alert('Failed to delete asset')
        }
    }

    const filteredAssets = initialAssets.filter(asset => {
        const searchLower = search.toLowerCase()

        const matchesSearch =
            (asset.AssetName && asset.AssetName.toLowerCase().includes(searchLower)) ||
            (asset.SerialNumber && asset.SerialNumber.toLowerCase().includes(searchLower)) ||
            (asset.DeviceTag && asset.DeviceTag.toLowerCase().includes(searchLower)) ||
            (asset.AssetType && asset.AssetType.toLowerCase().includes(searchLower))

        const matchesType = filterType ? asset.AssetType === filterType : true
        const matchesStatus = filterStatus ? asset.Status === filterStatus : true

        return matchesSearch && matchesType && matchesStatus
    })

    const STATUS_OPTIONS = ['Available', 'Assigned', 'Returned', 'Lost', 'Damaged']

    return (
        <div>
            <div
                className="card"
                style={{
                    marginBottom: '1.5rem',
                    padding: '1.5rem',
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap'
                }}
            >
                <div style={{ flex: 2, minWidth: '200px' }}>
                    <input
                        placeholder="Search Name, Serial, Tag, Type..."
                        className="input-field"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ flex: 1, minWidth: '150px' }}>
                    <AssetTypeSelect
                        value={filterType}
                        onChange={setFilterType}
                        options={assetTypes}
                        placeholder="All Types"
                    />
                </div>

                <select
                    className="select-field"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    style={{ flex: 1, minWidth: '150px' }}
                >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Model</th>
                                <th>Serial</th>
                                <th>Tag</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAssets.map(asset => (
                                <tr key={asset.AssetID}>
                                    <td>
                                        <span className={`badge badge-${asset.Status.toLowerCase()}`}>
                                            {asset.Status}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{asset.AssetName}</td>
                                    <td className="flex items-center gap-2">
                                        <AssetTypeIcon type={asset.AssetType} className="w-4 h-4 text-gray-400" />
                                        <span>{asset.AssetType}</span>
                                    </td>
                                    <td>{asset.Brand} {asset.Model}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.9em' }}>
                                        {asset.SerialNumber}
                                    </td>
                                    <td>{asset.DeviceTag || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <Link
                                                href={`/assets/${asset.AssetID}`}
                                                className="btn btn-outline"
                                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                                            >
                                                View/Edit
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(asset.AssetID)}
                                                className="btn btn-outline"
                                                style={{
                                                    padding: '0.25rem 0.6rem',
                                                    fontSize: '0.8rem',
                                                    borderColor: '#fee2e2',
                                                    color: '#b91c1c',
                                                    background: '#fff1f2'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredAssets.length === 0 && (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                                        {initialAssets.length === 0
                                            ? 'No assets found. Click "Add Asset" to create one.'
                                            : 'No assets match your search filters.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
