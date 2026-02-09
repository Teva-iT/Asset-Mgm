'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import EmployeeAutocomplete from './EmployeeAutocomplete'
import AssetTypeIcon, { getIconForType } from './AssetTypeIcon'
import AssetTypeSelect from './AssetTypeSelect'

// Define types for better TS support
interface Asset {
    AssetID: string
    AssetType: string
    OwnershipType?: string
    Quantity?: number
    Location?: string
    AssetName: string
    Brand: string
    Model: string
    SerialNumber: string
    DeviceTag: string | null
    Status: string
    Condition?: string | null
    OperationalState?: string | null
    PurchaseDate: string
    Notes: string | null
}

const STATUS_OPTIONS = [
    'Available', 'Assigned', 'Returned', 'Lost', 'Damaged'
]

// ... (imports remain the same)

export default function AssetForm({ asset, currentUser, admins = [] }: { asset?: Asset, currentUser?: { name: string, role: string, id: string }, admins?: { id: string, name: string }[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const defaultSerial = searchParams.get('serial') || ''

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Asset Type State
    const [assetTypes, setAssetTypes] = useState<{ Name: string, OwnershipType: string }[]>([])
    const [selectedType, setSelectedType] = useState(asset?.AssetType || '')
    const [ownershipType, setOwnershipType] = useState<string>(asset?.OwnershipType || 'Individual')

    // Ownership Specific State
    const [quantity, setQuantity] = useState(asset?.Quantity || 1)
    const [location, setLocation] = useState(asset?.Location || '')

    // Assignment State
    const [isAssignmentEnabled, setIsAssignmentEnabled] = useState(!!((asset as any)?.assignments?.length > 0))
    const [assignedEmployee, setAssignedEmployee] = useState<any>(null)
    const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0])
    const [expectedReturnDate, setExpectedReturnDate] = useState('')

    // Admin Override State
    const [assignedBy, setAssignedBy] = useState(currentUser?.id || '')

    // Status State
    // Status State
    const [status, setStatus] = useState(asset?.Status || 'Available')

    // Photos State
    const [photos, setPhotos] = useState<{ PhotoID?: string, URL: string, Category: string }[]>((asset as any)?.Photos || [])
    const [uploading, setUploading] = useState(false)

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files || e.target.files.length === 0) return

        const file = e.target.files[0]
        setUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (!res.ok) throw new Error('Upload failed')

            const data = await res.json()

            // Add to photos state
            setPhotos(prev => [...prev, { URL: data.url, Category: 'General' }])
        } catch (error) {
            console.error('Upload error:', error)
            alert('Failed to upload image')
        } finally {
            setUploading(false)
        }
    }

    // Derived State for Ownership
    const isIndividual = ownershipType === 'Individual'
    const isShared = ownershipType === 'Shared'
    const isStock = ownershipType === 'Stock'

    // Fetch Asset Types
    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const res = await fetch('/api/asset-types')
                if (res.ok) {
                    const data = await res.json()
                    setAssetTypes(data)
                }
            } catch (err) {
                console.error('Failed to fetch asset types', err)
            }
        }
        fetchTypes()
    }, [])

    // Update OwnershipType when AssetType changes (only for new assets or if type changes)
    useEffect(() => {
        if (selectedType) {
            const typeDef = assetTypes.find(t => t.Name === selectedType)
            if (typeDef) {
                setOwnershipType(typeDef.OwnershipType)
            }
        }
    }, [selectedType, assetTypes])

    // Enforce Rules based on Ownership
    useEffect(() => {
        if (isStock || isShared) {
            setIsAssignmentEnabled(false)
        }
        if (isStock) {
            // Maybe set status default for stock?
        }
    }, [isStock, isShared])

    // Initialize assignment state from asset prop
    useEffect(() => {
        if (asset && (asset as any).assignments && (asset as any).assignments.length > 0) {
            const activeAssignment = (asset as any).assignments[0]
            setIsAssignmentEnabled(true)
            setAssignedEmployee(activeAssignment.Employee)
            setAssignedDate(new Date(activeAssignment.AssignedDate).toISOString().split('T')[0])
            if (activeAssignment.ExpectedReturnDate) {
                setExpectedReturnDate(new Date(activeAssignment.ExpectedReturnDate).toISOString().split('T')[0])
            }
            if (activeAssignment.AssignedByUserID) {
                setAssignedBy(activeAssignment.AssignedByUserID)
            }
        }
    }, [asset])

    // Update status logic
    const currentStatusDisplay = isAssignmentEnabled && assignedEmployee ? 'Assigned' :
        (isStock ? (status === 'Available' ? 'In Stock' : status) : status)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const data: any = Object.fromEntries(formData)

        // Inject specific fields
        data.OwnershipType = ownershipType
        data.Quantity = isStock ? quantity : 1
        data.Location = isShared ? location : null

        // Handle Photos
        // For POST: Send full list (api/assets creates them)
        // For PUT: Send 'newPhotos' (api/assets/[id] appends them)
        if (asset) {
            // Edit mode: filter only new ones
            data.newPhotos = photos.filter(p => !p.PhotoID)
        } else {
            // Create mode: send all
            data.photos = photos.map(p => ({ url: p.URL, category: p.Category }))
        }

        // Rule: Status Logic
        if (isAssignmentEnabled && assignedEmployee && isIndividual) {
            data.Status = 'Assigned'
            data.assignment = {
                employeeId: assignedEmployee.EmployeeID,
                assignedDate,
                expectedReturnDate: expectedReturnDate || undefined,
                assignedByUserId: assignedBy
            }
        } else {
            if (data.Status === 'Assigned') {
                data.Status = 'Available'
            }
            delete data.assignment
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
                const errorData = await res.json()
                throw new Error(errorData.error || 'Failed to save asset')
            }

            router.push('/assets')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'An error occurred while saving.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card max-w-4xl mx-auto relative">
            {/* Mode Badge */}
            <div className="absolute top-6 right-6 flex gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                    ${isIndividual ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                    ${isShared ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                    ${isStock ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                 `}>
                    {ownershipType} Asset
                </span>
            </div>

            {/* Section 1: Core Identity */}
            <div className="mb-8 pt-2">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                    <h3 className="text-lg font-semibold">Asset Identity</h3>
                    <Link href="/assets/types" className="btn btn-primary" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                        Manage Types
                        <span style={{ fontSize: '1.1em' }}>↗</span>
                    </Link>
                </div>

                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label" htmlFor="AssetType">Type</label>
                        <AssetTypeSelect
                            value={selectedType}
                            onChange={setSelectedType}
                            options={assetTypes.map(t => t.Name)}
                            placeholder="Select Type"
                        />
                        <input type="hidden" name="AssetType" value={selectedType} />
                    </div>

                    {/* Stock Quantity */}
                    {isStock && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="Quantity">Quantity</label>
                            <input
                                type="number"
                                id="Quantity"
                                name="Quantity"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                                className="input-field"
                            />
                        </div>
                    )}

                    {/* Shared Location */}
                    {isShared && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="Location">Location / Room</label>
                            <input
                                id="Location"
                                name="Location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="input-field"
                                placeholder="e.g. Printer Room 2nd Floor"
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="Condition">Physical Condition</label>
                        <select
                            id="Condition"
                            name="Condition"
                            defaultValue={asset?.Condition || 'New (Unboxed)'}
                            className={`select-field ${isAssignmentEnabled && assignedEmployee && asset ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            disabled={!!(isAssignmentEnabled && assignedEmployee && asset)}
                        >
                            <option value="">Select Condition...</option>
                            <option value="New (Unboxed)">New (Unboxed)</option>
                            <option value="Used (Good)">Used (Good)</option>
                            <option value="Used (Needs Check)">Used (Needs Check)</option>
                            <option value="Damaged">Damaged</option>
                        </select>
                    </div>

                    {!isStock && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="OperationalState">Operational State</label>
                            <select
                                id="OperationalState"
                                name="OperationalState"
                                defaultValue={asset?.OperationalState || 'Not Imaged'}
                                className="select-field"
                            >
                                <option value="">Select State...</option>
                                <option value="Not Imaged">Not Imaged</option>
                                <option value="Imaged (Ready)">Imaged (Ready)</option>
                                <option value="In Preparation">In Preparation</option>
                                <option value="Retired">Retired</option>
                            </select>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="AssetName">Asset Number</label>
                        <input
                            id="AssetName"
                            name="AssetName"
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
                            defaultValue={asset?.Model}
                            className="input-field"
                            placeholder="e.g. Latitude 5440"
                        />
                    </div>

                    {!isStock && (
                        <div className="form-group">
                            <label className="form-label" htmlFor="SerialNumber">Serial Number</label>
                            <input
                                id="SerialNumber"
                                name="SerialNumber"
                                defaultValue={asset?.SerialNumber || defaultSerial}
                                className="input-field"
                                placeholder="Serial Number"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="DeviceTag">Device Tag / Barcode</label>
                        <input
                            id="DeviceTag"
                            name="DeviceTag"
                            defaultValue={asset?.DeviceTag || ''}
                            className="input-field"
                            placeholder={isStock ? "Optional Barcode" : "Internal Tag ID"}
                        />
                    </div>
                </div>
            </div>

            {/* Section 2: Assignment (Only for Individual) */}
            {isIndividual && (
                <div className={`mb-8 p-6 rounded-xl border transition-all ${isAssignmentEnabled ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-4">
                        <input
                            type="checkbox"
                            id="enableAssignment"
                            checked={isAssignmentEnabled}
                            onChange={(e) => setIsAssignmentEnabled(e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="enableAssignment" className="font-semibold text-gray-900 select-none cursor-pointer">
                            Assign this asset now?
                        </label>
                    </div>

                    {isAssignmentEnabled && (
                        <div className="form-grid animate-fade-in">
                            <div className="form-group">
                                <label className="form-label text-blue-900">Assigned By</label>
                                {(currentUser?.role === 'ADMIN' && admins.length > 0) ? (
                                    <select
                                        className="select-field"
                                        style={{ borderColor: '#93c5fd', backgroundColor: 'white' }}
                                        value={assignedBy}
                                        onChange={(e) => setAssignedBy(e.target.value)}
                                    >
                                        {admins.map(admin => (
                                            <option key={admin.id} value={admin.id}>
                                                {admin.name} {currentUser && admin.id === currentUser.id ? '(You)' : '(Admin)'}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="p-3 bg-blue-100/50 rounded border border-blue-200 text-sm text-blue-900 flex items-center gap-2 h-[42px]">
                                        <span>{admins.find(a => a.id === assignedBy)?.name || (currentUser?.id === assignedBy ? currentUser?.name : 'Unknown')}</span>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label text-blue-900">Assign to Employee <span className="text-red-500">*</span></label>
                                <EmployeeAutocomplete
                                    onSelect={setAssignedEmployee}
                                    defaultEmployee={assignedEmployee}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label text-blue-900">Assigned Date</label>
                                <input
                                    type="date"
                                    value={assignedDate}
                                    onChange={(e) => setAssignedDate(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label text-blue-900">Expected Return Date</label>
                                <input
                                    type="date"
                                    value={expectedReturnDate}
                                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Section 3: Meta */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Meta Data</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label" htmlFor="PurchaseDate">Effective Date</label>
                        <input
                            id="PurchaseDate"
                            name="PurchaseDate"
                            type="date"
                            defaultValue={asset?.PurchaseDate ? new Date(asset.PurchaseDate).toISOString().split('T')[0] : ''}
                            className="input-field"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="Status">Status</label>
                        <div className="relative">
                            <select
                                id="Status"
                                name="Status"
                                value={currentStatusDisplay}
                                onChange={(e) => !isAssignmentEnabled && setStatus(e.target.value)}
                                className={`select-field ${isAssignmentEnabled || assignedEmployee ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                                disabled={isAssignmentEnabled || !!assignedEmployee}
                            >
                                <option value="Available">Available</option>
                                {isIndividual && <option value="Assigned">Assigned</option>}
                                <option value="Returned">Returned</option>
                                <option value="Lost">Lost</option>
                                <option value="Damaged">Damaged</option>
                                {isStock && <option value="In Stock">In Stock</option>}
                                {isStock && <option value="Low Stock">Low Stock</option>}
                            </select>
                            {(isAssignmentEnabled || !!assignedEmployee) && <input type="hidden" name="Status" value={currentStatusDisplay} />}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {isAssignmentEnabled ? 'Auto-set to "Assigned".' : 'Current status.'}
                        </p>
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

            {/* Section 4: Photos */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Photos</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {photos.map((photo, index) => (
                        <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                            <img src={photo.URL} alt="Asset" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <span className="text-white text-xs bg-black/50 px-2 py-1 rounded">{photo.Category}</span>
                            </div>
                        </div>
                    ))}

                    <label className="border-2 border-dashed border-gray-300 rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={uploading}
                        />
                        {uploading ? (
                            <span className="text-sm text-gray-500">Uploading...</span>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                <span className="text-sm text-gray-500 font-medium">Add Photo</span>
                            </>
                        )}
                    </label>
                </div>
            </div>

            {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

            <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" disabled={loading || uploading} className="btn btn-primary">
                    {loading ? 'Saving...' : (asset ? 'Update Asset' : (isAssignmentEnabled ? 'Create & Assign' : 'Add to Inventory'))}
                </button>
                <button type="button" onClick={() => router.back()} className="btn btn-outline">
                    Cancel
                </button>
            </div>
        </form>
    )
}
