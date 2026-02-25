'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ModernDatePicker from '@/components/ModernDatePicker'

export default function NewLicensePage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData)

        try {
            const res = await fetch('/api/licenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to create')
            }
            const license = await res.json()
            router.push(`/licenses/${license.LicenseID}`)
        } catch (err: any) {
            setError(err.message)
            setSaving(false)
        }
    }

    return (
        <div className="container max-w-2xl">
            <div className="header mb-6">
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>📋 New License</h1>
                <Link href="/licenses" className="btn btn-outline">← Back</Link>
            </div>

            <form onSubmit={handleSubmit} className="card">
                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>}

                <div className="form-grid mb-6">
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" htmlFor="ProductName">Product Name *</label>
                        <input id="ProductName" name="ProductName" required className="input-field" placeholder="e.g. Microsoft 365 Business" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="VendorName">Vendor</label>
                        <input id="VendorName" name="VendorName" className="input-field" placeholder="e.g. Microsoft" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="LicenseType">License Type</label>
                        <select id="LicenseType" name="LicenseType" className="select-field">
                            <option value="Per Seat">Per Seat</option>
                            <option value="Site License">Site License</option>
                            <option value="Device">Device</option>
                            <option value="OEM">OEM</option>
                            <option value="Concurrent">Concurrent</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="TotalSeats">Total Seats</label>
                        <input id="TotalSeats" name="TotalSeats" type="number" min="1" className="input-field" placeholder="Leave empty for unlimited" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="CostPerYear">Annual Cost (CHF)</label>
                        <input id="CostPerYear" name="CostPerYear" type="number" step="0.01" min="0" className="input-field" placeholder="0.00" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="PurchaseDate">Purchase Date</label>
                        <ModernDatePicker name="PurchaseDate" defaultValue="" className="w-full" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="ExpiryDate">Expiry Date</label>
                        <ModernDatePicker name="ExpiryDate" defaultValue="" className="w-full" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="Status">Status</label>
                        <select id="Status" name="Status" className="select-field">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Expired">Expired</option>
                        </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" htmlFor="LicenseKey">License Key</label>
                        <input id="LicenseKey" name="LicenseKey" className="input-field font-mono" placeholder="xxxx-xxxx-xxxx-xxxx (optional)" />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" htmlFor="Notes">Notes</label>
                        <textarea id="Notes" name="Notes" rows={3} className="textarea-field" placeholder="Additional notes..." />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        {saving ? 'Saving...' : 'Create License'}
                    </button>
                    <Link href="/licenses" className="btn btn-outline">Cancel</Link>
                </div>
            </form>
        </div>
    )
}
