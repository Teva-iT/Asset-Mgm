'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AssignmentForm({ asset, employees }: { asset: any, employees: any[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const data = {
            AssetID: asset.AssetID,
            EmployeeID: formData.get('EmployeeID'),
            ExpectedReturnDate: formData.get('ExpectedReturnDate'),
            Notes: formData.get('Notes')
        }

        try {
            const res = await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const json = await res.json()
                throw new Error(json.error || 'Failed to assign asset')
            }

            router.push(`/assets/${asset.AssetID}`)
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card">
            <div className="form-group">
                <label className="form-label">Select Employee</label>
                <select name="EmployeeID" required className="select-field">
                    <option value="">-- Choose Employee --</option>
                    {employees.map(emp => (
                        <option key={emp.EmployeeID} value={emp.EmployeeID}>
                            {emp.LastName}, {emp.FirstName} ({emp.Department})
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label className="form-label">Expected Return Date</label>
                <input name="ExpectedReturnDate" type="date" className="input-field" />
                <small style={{ color: '#888' }}>Optional</small>
            </div>

            <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea name="Notes" rows={3} className="textarea-field" placeholder="Condition notes, accessories, etc." />
            </div>

            {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                {loading ? 'Assigning...' : 'Confirm Assignment'}
            </button>
        </form>
    )
}
