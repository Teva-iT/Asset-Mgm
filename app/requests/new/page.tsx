'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ModernDatePicker from '@/components/ModernDatePicker'
import EmployeeSearchSelect from '@/components/EmployeeSearchSelect'

export default function NewRequestPage() {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [employees, setEmployees] = useState<any[]>([])
    const [assetTypes, setAssetTypes] = useState<any[]>([])
    const [selectedEmployeeID, setSelectedEmployeeID] = useState('')

    useEffect(() => {
        fetch('/api/employees').then(r => r.json()).then(d => setEmployees(Array.isArray(d) ? d : []))
        fetch('/api/asset-types').then(r => r.json()).then(d => setAssetTypes(Array.isArray(d) ? d : []))
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setSaving(true)
        setError('')
        const formData = new FormData(e.currentTarget)
        const data: any = Object.fromEntries(formData)
        // Override with controlled state value (combobox uses hidden input)
        data.EmployeeID = selectedEmployeeID
        if (!data.EmployeeID) {
            setError('Please select an employee.')
            setSaving(false)
            return
        }
        try {
            const res = await fetch('/api/requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to submit')
            }
            router.push('/admin/requests')
        } catch (err: any) {
            setError(err.message)
            setSaving(false)
        }
    }

    return (
        <div className="container max-w-2xl">
            <div className="header mb-6">
                <h1 style={{ margin: 0, fontSize: '1.8rem' }}>📥 New Asset Request</h1>
                <Link href="/admin/requests" className="btn btn-outline">← Back</Link>
            </div>

            <form onSubmit={handleSubmit} className="card">
                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">{error}</div>}

                <div className="form-grid mb-6">
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Requesting Employee *</label>
                        <EmployeeSearchSelect
                            employees={employees.filter(e => e.Status === 'Active')}
                            value={selectedEmployeeID}
                            onChange={(id) => setSelectedEmployeeID(id)}
                            placeholder="Search by name, department or email..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="AssetType">Asset Type Needed *</label>
                        <select id="AssetType" name="AssetType" required className="select-field">
                            <option value="">Select type...</option>
                            {assetTypes.map((t: any) => (
                                <option key={t.AssetTypeID || t.Name} value={t.Name}>{t.Name}</option>
                            ))}
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="Urgency">Urgency</label>
                        <select id="Urgency" name="Urgency" className="select-field">
                            <option value="Low">Low — No rush</option>
                            <option value="Normal" selected>Normal — Within a week</option>
                            <option value="High">High — Within 2 days</option>
                            <option value="Critical">🔴 Critical — Today</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="NeededByDate">Needed By Date</label>
                        <ModernDatePicker name="NeededByDate" defaultValue="" className="w-full" />
                    </div>

                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label" htmlFor="Reason">Reason / Business Justification *</label>
                        <textarea
                            id="Reason"
                            name="Reason"
                            required
                            rows={4}
                            className="textarea-field"
                            placeholder="Explain why this asset is needed, what it will be used for, and any specific requirements..."
                        />
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-blue-700">
                    💡 After submission, IT Admin will review and approve or reject this request. You will be notified of the decision.
                </div>

                <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="btn btn-primary">
                        {saving ? 'Submitting...' : 'Submit Request'}
                    </button>
                    <Link href="/admin/requests" className="btn btn-outline">Cancel</Link>
                </div>
            </form>
        </div>
    )
}
