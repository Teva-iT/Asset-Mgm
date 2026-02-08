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
    const [assetTypes, setAssetTypes] = useState<string[]>([])
    const [selectedType, setSelectedType] = useState(asset?.AssetType || '')

    // Assignment State
    const [isAssignmentEnabled, setIsAssignmentEnabled] = useState(!!((asset as any)?.assignments?.length > 0))
    const [assignedEmployee, setAssignedEmployee] = useState<any>(null)
    const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0])
    const [expectedReturnDate, setExpectedReturnDate] = useState('')

    // Admin Override State
    const [assignedBy, setAssignedBy] = useState(currentUser?.id || '')

    // Status State (Derived mostly, but keep state for potential manual overrides if needed, though User wants auto)
    // We will derive 'Status' for the payload, but might show it as read-only or disabled.
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

    // Update status logic: Verified Rule 2
    // If Assigning -> Status = Assigned
    // If Not Assigning -> Status = Available (or whatever it was if editing, usually Available/In Stock)
    // We'll calculate this at submission time to be safe, but can update UI feedback here.
    const currentStatusDisplay = isAssignmentEnabled && assignedEmployee ? 'Assigned' : (status === 'Assigned' ? 'Available' : status)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const data: any = Object.fromEntries(formData)

        // Rule 2 & 4: Status Logic
        if (isAssignmentEnabled && assignedEmployee) {
            data.Status = 'Assigned'
            data.assignment = {
                employeeId: assignedEmployee.EmployeeID,
                assignedDate,
                expectedReturnDate: expectedReturnDate || undefined,
                assignedByUserId: assignedBy // Send selected admin ID
            }
        } else {
            // Rule 4: If not assigning, ensure status reflects that.
            // If we are editing and unchecking assignment, we should probably set it to Available
            if (data.Status === 'Assigned') {
                data.Status = 'Available'
            }
            // Ensure no assignment data is sent if disabled
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
            {/* Mode Badge - Top Right or Top Left */}
            <div className="absolute top-6 right-6">
                {isAssignmentEnabled ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        🔵 Assignment Mode
                    </span>
                ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        🟢 Inventory Mode
                    </span>
                )}
            </div>

            {/* Section 1: Core Identity (Asset Info) */}
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
                            options={assetTypes}
                            placeholder="Select Type"
                        />
                        <input type="hidden" name="AssetType" value={selectedType} />
                    </div>

                    {/* Rule 1: Physical Condition & Operational State immediately after Type */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="Condition">Physical Condition</label>
                        <select
                            id="Condition"
                            name="Condition"
                            defaultValue={asset?.Condition || 'New (Unboxed)'} // Smart Default for new assets
                            className={`select-field ${isAssignmentEnabled && assignedEmployee && asset ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            disabled={!!(isAssignmentEnabled && assignedEmployee && asset)}
                        >
                            <option value="">Select Condition...</option>
                            <option value="New (Unboxed)">New (Unboxed)</option>
                            <option value="Used (Good)">Used (Good)</option>
                            <option value="Used (Needs Check)">Used (Needs Check)</option>
                            <option value="Damaged">Damaged</option>
                        </select>
                        {isAssignmentEnabled && assignedEmployee && asset && <input type="hidden" name="Condition" value={asset?.Condition || ''} />}
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="OperationalState">Operational State</label>
                        <select
                            id="OperationalState"
                            name="OperationalState"
                            defaultValue={asset?.OperationalState || 'Not Imaged'} // Smart Default for new assets
                            className="select-field"
                        >
                            <option value="">Select State...</option>
                            <option value="Not Imaged">Not Imaged</option>
                            <option value="Imaged (Ready)">Imaged (Ready)</option>
                            <option value="In Preparation">In Preparation</option>
                            <option value="Retired">Retired</option>
                        </select>
                    </div>

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

                    {/* ... Other details ... */}
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

            {/* Section 2: Assignment (Optional) */}
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

                {/* Rule 3 & 5: Show/Hide Logic */}
                {isAssignmentEnabled && (
                    <div className="form-grid animate-fade-in">
                        {/* Assigned By */}
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

                        {/* Assign to Employee */}
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

                    {/* Rule 2: Status is auto-set or smart */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="Status">Status</label>
                        <div className="relative">
                            <select
                                id="Status"
                                name="Status"
                                value={currentStatusDisplay}
                                // If not assigning, user *can* select status (e.g. Broken, Lost), but if Assigning, it's locked.
                                onChange={(e) => !isAssignmentEnabled && setStatus(e.target.value)}
                                className={`select-field ${isAssignmentEnabled || assignedEmployee ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                                disabled={isAssignmentEnabled || !!assignedEmployee}
                            >
                                {/* Only show relevant options based on context? Or all? */}
                                <option value="Available">Available</option>
                                <option value="Assigned">Assigned</option>
                                <option value="Returned">Returned</option>
                                <option value="Lost">Lost</option>
                                <option value="Damaged">Damaged</option>
                            </select>
                            {/* Valid Hidden Field for submission if disabled */}
                            {(isAssignmentEnabled || !!assignedEmployee) && <input type="hidden" name="Status" value={currentStatusDisplay} />}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {isAssignmentEnabled ? 'Auto-set to "Assigned" because assignment is enabled.' : 'Current status of the asset.'}
                        </p>
                    </div>


                    {/* Condition and OperationalState moved up */}
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
                    {loading ? 'Saving...' : (asset ? 'Update Asset' : (isAssignmentEnabled ? 'Create & Assign Asset' : 'Add to Inventory'))}
                </button>
                <button type="button" onClick={() => router.back()} className="btn btn-outline">
                    Cancel
                </button>
            </div>
        </form>
    )
}
