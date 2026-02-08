'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import EmployeeAutocomplete from '@/components/EmployeeAutocomplete'
import AssetAutocomplete from '@/components/AssetAutocomplete'

export default function AssignAssetWizardPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // Form State
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
    const [selectedAsset, setSelectedAsset] = useState<any>(null)
    const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0])
    const [expectedReturnDate, setExpectedReturnDate] = useState('')
    const [notes, setNotes] = useState('')

    // Check for pre-selected employee
    useEffect(() => {
        const employeeId = searchParams.get('employeeId')
        if (employeeId && !selectedEmployee) {
            fetch(`/api/employees/${employeeId}`)
                .then(res => res.json())
                .then(data => {
                    if (data && !data.error) {
                        setSelectedEmployee(data)
                    }
                })
                .catch(err => console.error('Failed to pre-select employee', err))
        }
    }, [searchParams, selectedEmployee])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedEmployee || !selectedAsset) {
            setError('Please select both an employee and an asset.')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    AssetID: selectedAsset.AssetID,
                    EmployeeID: selectedEmployee.EmployeeID,
                    ExpectedReturnDate: expectedReturnDate || undefined,
                    Notes: notes
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to create assignment')
            }

            setSuccess(true)
            // Optional: Reset form or redirect
            setTimeout(() => {
                router.push('/assets')
                router.refresh()
            }, 1500)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="container max-w-2xl mx-auto py-12 text-center">
                <div className="card bg-green-50 border-green-200">
                    <h2 className="text-2xl font-bold text-green-700 mb-2">Assignment Successful!</h2>
                    <p className="text-gray-600">
                        Asset <strong>{selectedAsset?.AssetName}</strong> has been assigned to <strong>{selectedEmployee?.FirstName} {selectedEmployee?.LastName}</strong>.
                    </p>
                    <div className="mt-6">
                        <Link href="/" className="btn btn-primary">Return to Dashboard</Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container max-w-3xl mx-auto py-8">
            <h1 className="text-2xl font-bold mb-6">Assign Asset to Employee</h1>

            <form onSubmit={handleSubmit} className="card">
                <div className="grid gap-6">
                    {/* Step 1: Select Employee */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">1. Select Employee</label>
                        <EmployeeAutocomplete onSelect={setSelectedEmployee} />
                        {selectedEmployee && (
                            <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                                Selected: {selectedEmployee.FirstName} {selectedEmployee.LastName} ({selectedEmployee.Department})
                            </div>
                        )}
                    </div>

                    <div className="border-t my-2"></div>

                    {/* Step 2: Select Asset */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">2. Select Available Asset</label>
                        <AssetAutocomplete onSelect={setSelectedAsset} />
                        {selectedAsset && (
                            <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                                Selected: {selectedAsset.AssetName} (SN: {selectedAsset.SerialNumber})
                            </div>
                        )}
                    </div>

                    <div className="border-t my-2"></div>

                    {/* Step 3: Assignment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">Assigned Date</label>
                            <input
                                type="date"
                                value={assignedDate}
                                onChange={(e) => setAssignedDate(e.target.value)}
                                className="input-field"
                                required
                            />
                        </div>
                        <div>
                            <label className="form-label">Expected Return Date</label>
                            <input
                                type="date"
                                value={expectedReturnDate}
                                onChange={(e) => setExpectedReturnDate(e.target.value)}
                                className="input-field"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="form-label">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="textarea-field"
                            placeholder="Optional notes about this assignment..."
                            rows={2}
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-4">
                        <Link href="/" className="btn btn-outline">Cancel</Link>
                        <button
                            type="submit"
                            disabled={loading || !selectedEmployee || !selectedAsset}
                            className="btn btn-primary"
                        >
                            {loading ? 'Assigning...' : 'Confirm Assignment'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
