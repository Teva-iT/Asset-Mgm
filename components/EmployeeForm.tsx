'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DepartmentSelect from './DepartmentSelect'

export default function EmployeeForm({ employee }: { employee?: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [status, setStatus] = useState(employee?.Status || 'Active')
    const [endDate, setEndDate] = useState(employee?.EndDate ? new Date(employee.EndDate).toISOString().split('T')[0] : '')

    // Status Options
    const STATUS_OPTIONS = ['Active', 'Leaving', 'Left']

    // Department Fetching
    const [departments, setDepartments] = useState<{ DepartmentID: string, Name: string }[]>([])
    const [loadingDepartments, setLoadingDepartments] = useState(true)
    const [selectedDepartment, setSelectedDepartment] = useState(employee?.Department || '')

    useEffect(() => {
        async function fetchDepartments() {
            setLoadingDepartments(true)
            try {
                const res = await fetch('/api/departments')
                if (res.ok) {
                    const data = await res.json()
                    setDepartments(data)
                }
            } catch (err) {
                console.error('Failed to fetch departments', err)
            } finally {
                setLoadingDepartments(false)
            }
        }
        fetchDepartments()
    }, [])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const data: any = Object.fromEntries(formData)

        // Add controlled state to data
        data.Status = employee ? status : 'Active'
        data.EndDate = employee ? (endDate || null) : null
        data.Department = selectedDepartment

        try {
            const url = employee ? `/api/employees/${employee.EmployeeID}` : '/api/employees'
            const method = employee ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.error || errorData.message || 'Failed to save employee')
            }

            if (employee) {
                router.push(`/employees/${employee.EmployeeID}`)
            } else {
                router.push('/employees')
            }
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'An error occurred.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
                {employee ? 'Edit Profile' : 'New Employee'}
            </h2>

            {/* Section A: Basic Info */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-700">Basic Information</h3>
                <div className="form-grid">
                    <div className="form-group">
                        <label className="form-label">First Name</label>
                        <input name="FirstName" required className="input-field" placeholder="John" defaultValue={employee?.FirstName} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input name="LastName" required className="input-field" placeholder="Doe" defaultValue={employee?.LastName} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input name="Email" type="email" required className="input-field" placeholder="john.doe@company.com" defaultValue={employee?.Email} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Department</label>
                        {/* Replaced native select with Rich DepartmentSelect */}
                        <DepartmentSelect
                            value={selectedDepartment}
                            onChange={setSelectedDepartment}
                            departments={departments}
                            loading={loadingDepartments}
                            placeholder="Select Department"
                            className="w-full"
                        />
                        {/* Hidden input to ensure required validation if needed, though handle submit checks state */}
                        <input
                            name="DepartmentHidden"
                            value={selectedDepartment}
                            onChange={() => { }}
                            required
                            style={{ opacity: 0, height: 0, position: 'absolute' }}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Start Date</label>
                        <input name="StartDate" type="date" required className="input-field" defaultValue={employee?.StartDate ? new Date(employee.StartDate).toISOString().split('T')[0] : ''} />
                    </div>
                </div>
            </div>

            {/* Section B: Employment Status (Model A: Status-Driven) */}
            {employee && (
                <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-2 text-gray-800">Employment Status</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Changing status to <strong>Leaving</strong> or <strong>Left</strong> will require an End Date and effectively mark the employee for departure or archival.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select
                                value={status}
                                onChange={(e) => {
                                    const newStatus = e.target.value
                                    setStatus(newStatus)
                                    // Auto-clear end date if setting to Active
                                    if (newStatus === 'Active') setEndDate('')
                                }}
                                className="select-field"
                                style={{ fontWeight: 500 }}
                            >
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input-field"
                                disabled={status === 'Active' || status === 'Left'}
                                required={status === 'Leaving'}
                                style={{
                                    backgroundColor: (status === 'Active' || status === 'Left') ? '#f3f4f6' : 'white',
                                    cursor: (status === 'Active' || status === 'Left') ? 'not-allowed' : 'text',
                                    borderColor: (status === 'Leaving' && !endDate) ? '#ef4444' : '#d1d5db'
                                }}
                            />
                            {status === 'Active' && <span className="text-xs text-gray-400 mt-1">Applicable only for Leaving/Left status</span>}
                            {status === 'Leaving' && <span className="text-xs text-orange-600 mt-1 font-medium">Required for departure</span>}
                            {status === 'Left' && <span className="text-xs text-gray-500 mt-1 flex items-center gap-1">🔒 Date locked. Switch to "Leaving" to edit.</span>}
                        </div>
                    </div>
                </div>
            )}

            {error && <p style={{ color: 'red', marginBottom: '1rem', marginTop: '1rem' }}>{error}</p>}

            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button type="submit" disabled={loading} className="btn btn-primary">
                    {loading ? 'Saving...' : (employee ? 'Update Profile' : 'Save Employee')}
                </button>
                <button type="button" onClick={() => router.back()} className="btn btn-outline">
                    Cancel
                </button>
            </div>
        </form>
    )
}
