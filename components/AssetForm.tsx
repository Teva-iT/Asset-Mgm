'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EmployeeAutocomplete from './EmployeeAutocomplete'

// Define types for better TS support
interface Asset {
    AssetID: string
    AssetType: string
    AssetName: string
    Brand: string
    Model: string
    SerialNumber: string
    DeviceTag: string | null
    Status: string
    PurchaseDate: string
    Notes: string | null
}

const STATUS_OPTIONS = [
    'Available', 'Assigned', 'Returned', 'Lost', 'Damaged'
]

export default function AssetForm({ asset }: { asset?: Asset }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [assetTypes, setAssetTypes] = useState<string[]>([])

    // Assignment State
    const [assignedEmployee, setAssignedEmployee] = useState<any>(null)
    const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0])
    const [expectedReturnDate, setExpectedReturnDate] = useState('')

    // Status State (to allow auto-update)
    const [status, setStatus] = useState(asset?.Status || 'Available')

    // Fetch Asset Types
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

    // Update status when assignment changes
    useEffect(() => {
        if (assignedEmployee) {
            setStatus('Assigned')
        } else if (!asset && status === 'Assigned') {
            // Only revert to Available if it was auto-set to Assigned and we are in Create mode
            setStatus('Available')
        }
    }, [assignedEmployee])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const data: any = Object.fromEntries(formData)

        // Manual status override if assigned
        if (assignedEmployee) {
            data.Status = 'Assigned'
            data.assignment = {
                employeeId: assignedEmployee.EmployeeID,
                assignedDate,
                expectedReturnDate: expectedReturnDate || undefined
            }
        }

        const url = asset ? `/api/assets/${asset.AssetID}` : '/api/assets'
        const method = asset ? 'PUT' : 'POST'

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                throw new Error('Failed to save asset')
            }

            router.push('/assets')
            router.refresh()
        } catch (err) {
            setError('An error occurred while saving.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card max-w-4xl mx-auto">
            {/* Section 1: Asset Info */}
            <div className="mb-8">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                    <h3 className="text-lg font-semibold">Asset Information</h3>
                    <Link href="/assets/types" className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        Manage Types
                        <span style={{ fontSize: '1.1em' }}>↗</span>
                    </Link>
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label" htmlFor="AssetType">Type</label>
                        <select
                            id="AssetType"
                            name="AssetType"
                            required
                            value={asset?.AssetType} // Use controlled if possible, but for form params defaultValue is easier. 
                            // Actually, standard select works best with key prop to force re-render if options change
                            key={assetTypes.length}
                            defaultValue={asset?.AssetType || ""}
                            className="select-field"
                        >
                            <option value="">Select Type</option>
                            {assetTypes.length > 0 ? (
                                assetTypes.map(t => <option key={t} value={t}>{t}</option>)
                            ) : (
                                <option disabled>Loading types...</option>
                            )}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="AssetName">Asset Number</label>
                        <input
                            id="AssetName"
                            name="AssetName"
                            required
                            defaultValue={asset?.AssetName}
                            className="input-field"
                            placeholder="e.g. AST-001"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="Brand">Brand</label>
                        <input
                            id="Brand"
                            name="Brand"
                            required
                            defaultValue={asset?.Brand}
                            className="input-field"
                            placeholder="e.g. Dell"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="Model">Model</label>
                        <input
                            id="Model"
                            name="Model"
                            required
                            defaultValue={asset?.Model}
                            className="input-field"
                            placeholder="e.g. Latitude 5440"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="SerialNumber">Serial Number</label>
                        <input
                            id="SerialNumber"
                            name="SerialNumber"
                            required
                            defaultValue={asset?.SerialNumber}
                            className="input-field"
                            placeholder="Serial Number"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="DeviceTag">Device Tag</label>
                        <input
                            id="DeviceTag"
                            name="DeviceTag"
                            defaultValue={asset?.DeviceTag || ''}
                            className="input-field"
                            placeholder="Internal Tag ID"
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Assignment (Only for Create Mode) */}
            {!asset && (
                <div className="mb-8 bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 border-b border-blue-200 pb-2 text-blue-800">
                        Immediate Assignment (Optional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group md:col-span-2">
                            <label className="form-label">Assign to Employee</label>
                            <EmployeeAutocomplete onSelect={setAssignedEmployee} />
                        </div>

                        {assignedEmployee && (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Assigned Date</label>
                                    <input
                                        type="date"
                                        value={assignedDate}
                                        onChange={(e) => setAssignedDate(e.target.value)}
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Expected Return Date</label>
                                    <input
                                        type="date"
                                        value={expectedReturnDate}
                                        onChange={(e) => setExpectedReturnDate(e.target.value)}
                                        className="input-field"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Section 3: Meta */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Meta Data</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label" htmlFor="PurchaseDate">Purchase Date</label>
                        <input
                            id="PurchaseDate"
                            name="PurchaseDate"
                            type="date"
                            required
                            defaultValue={asset?.PurchaseDate ? new Date(asset.PurchaseDate).toISOString().split('T')[0] : ''}
                            className="input-field"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="Status">Status</label>
                        <select
                            id="Status"
                            name="Status"
                            required
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="select-field"
                            disabled={!!assignedEmployee} // Disable manual status change if assigned
                        >
                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {assignedEmployee && <input type="hidden" name="Status" value="Assigned" />}
                    </div>
                </div>

                <div className="form-group mt-4">
                    <label className="form-label" htmlFor="Notes">Notes</label>
                    <textarea
                        id="Notes"
                        name="Notes"
                        rows={3}
                        defaultValue={asset?.Notes || ''}
                        className="textarea-field"
                        placeholder="Additional notes..."
                    />
                </div>
            </div>

            {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" disabled={loading} className="btn btn-primary">
                    {loading ? 'Saving...' : (asset ? 'Update Asset' : 'Add Asset')}
                </button>
                <button type="button" onClick={() => router.back()} className="btn btn-outline">
                    Cancel
                </button>
            </div>
        </form>
    )
}
