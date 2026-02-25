'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function SeatBar({ used, total, overAllocated }: { used: number, total: number | null, overAllocated: boolean }) {
    if (total == null) return <span className="text-sm text-gray-400">Unlimited seats</span>
    const pct = Math.min(100, Math.round((used / total) * 100))
    const color = overAllocated ? 'bg-red-500' : pct >= 80 ? 'bg-orange-400' : 'bg-blue-500'
    return (
        <div className="w-full">
            <div className="flex justify-between text-sm mb-2">
                <span className={overAllocated ? 'text-red-600 font-bold' : 'text-gray-700'}>{used} used of {total} seats</span>
                <span className={overAllocated ? 'text-red-500 font-semibold' : 'text-gray-500'}>
                    {overAllocated ? `⚠️ ${used - total} over limit` : `${total - used} available`}
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
                <div className={`${color} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

export default function LicenseDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [license, setLicense] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [employees, setEmployees] = useState<any[]>([])
    const [showAssign, setShowAssign] = useState(false)
    const [selectedEmployee, setSelectedEmployee] = useState('')
    const [assignNote, setAssignNote] = useState('')
    const [assigning, setAssigning] = useState(false)
    const [error, setError] = useState('')

    const load = () => {
        fetch(`/api/licenses/${params.id}`).then(r => r.json()).then(data => {
            setLicense(data)
            setLoading(false)
        })
    }

    useEffect(() => {
        load()
        fetch('/api/employees').then(r => r.json()).then(data => setEmployees(Array.isArray(data) ? data : []))
    }, [])

    async function handleAssign() {
        if (!selectedEmployee) return
        setAssigning(true)
        setError('')
        try {
            const res = await fetch(`/api/licenses/${params.id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ EmployeeID: selectedEmployee, Notes: assignNote }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setShowAssign(false)
            setSelectedEmployee('')
            setAssignNote('')
            load()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setAssigning(false)
        }
    }

    async function handleUnassign(assignmentId: string) {
        if (!confirm('Remove this assignment?')) return
        await fetch(`/api/licenses/${params.id}/assign`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ AssignmentID: assignmentId }),
        })
        load()
    }

    async function handleDelete() {
        if (!confirm(`Delete license "${license?.ProductName}"? This will remove all assignments.`)) return
        await fetch(`/api/licenses/${params.id}`, { method: 'DELETE' })
        router.push('/licenses')
    }

    if (loading) return <div className="container p-12 text-center text-gray-400">Loading...</div>
    if (!license) return <div className="container p-12 text-center text-red-500">License not found</div>

    const usedSeats = license.assignments?.length || 0
    const isOverAllocated = license.TotalSeats != null && usedSeats > license.TotalSeats

    const assignedEmployeeIds = new Set(license.assignments?.map((a: any) => a.EmployeeID))
    const availableEmployees = employees.filter(e => !assignedEmployeeIds.has(e.EmployeeID) && e.Status === 'Active')

    const expiryDays = license.ExpiryDate
        ? Math.ceil((new Date(license.ExpiryDate).getTime() - Date.now()) / 86400000)
        : null

    return (
        <div className="container">
            <div className="header mb-6">
                <div>
                    <Link href="/licenses" className="text-sm text-gray-500 hover:text-gray-700">← All Licenses</Link>
                    <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.8rem' }}>📋 {license.ProductName}</h1>
                    <div className="text-sm text-gray-500 mt-1">
                        {license.VendorName} · {license.LicenseType}
                        <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${license.Status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {license.Status}
                        </span>
                    </div>
                </div>
                <button onClick={handleDelete} className="btn btn-danger text-sm">Delete</button>
            </div>

            {/* Info + Seat Bar */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="card md:col-span-2 p-5">
                    <SeatBar used={usedSeats} total={license.TotalSeats} overAllocated={isOverAllocated} />

                    <div className="grid grid-cols-2 gap-4 mt-5 text-sm">
                        <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Expiry</div>
                            <div className={expiryDays !== null && expiryDays < 0 ? 'text-red-600 font-semibold' : expiryDays !== null && expiryDays <= 30 ? 'text-orange-600 font-semibold' : 'text-gray-800'}>
                                {license.ExpiryDate
                                    ? `${new Date(license.ExpiryDate).toLocaleDateString('de-CH')} ${expiryDays !== null ? `(${expiryDays < 0 ? `expired ${Math.abs(expiryDays)}d ago` : `${expiryDays}d left`})` : ''}`
                                    : '—'}
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Annual Cost</div>
                            <div className="text-gray-800 font-medium">
                                {license.CostPerYear ? `CHF ${Number(license.CostPerYear).toLocaleString('de-CH', { minimumFractionDigits: 2 })}` : '—'}
                            </div>
                        </div>
                        {license.LicenseKey && (
                            <div className="col-span-2">
                                <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">License Key</div>
                                <div className="font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 select-all">{license.LicenseKey}</div>
                            </div>
                        )}
                        {license.Notes && (
                            <div className="col-span-2">
                                <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Notes</div>
                                <div className="text-gray-700">{license.Notes}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="flex flex-col gap-3">
                    <div className="card p-4 text-center border-l-4 border-blue-400">
                        <div className="text-3xl font-bold text-blue-600">{usedSeats}</div>
                        <div className="text-sm text-gray-500">Assigned</div>
                    </div>
                    <div className={`card p-4 text-center border-l-4 ${isOverAllocated ? 'border-red-400' : 'border-green-400'}`}>
                        <div className={`text-3xl font-bold ${isOverAllocated ? 'text-red-600' : 'text-green-600'}`}>
                            {license.TotalSeats != null ? Math.max(0, license.TotalSeats - usedSeats) : '∞'}
                        </div>
                        <div className="text-sm text-gray-500">Available</div>
                    </div>
                </div>
            </div>

            {/* Assignments */}
            <div className="card">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Assigned Users</h3>
                    <button
                        onClick={() => setShowAssign(!showAssign)}
                        className="btn btn-primary text-sm"
                        disabled={license.TotalSeats != null && usedSeats >= license.TotalSeats}
                    >
                        + Assign Employee
                    </button>
                </div>

                {/* Assign Panel */}
                {showAssign && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
                        <div className="grid grid-cols-2 gap-3">
                            <select className="select-field" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
                                <option value="">Select Employee...</option>
                                {availableEmployees.map(e => (
                                    <option key={e.EmployeeID} value={e.EmployeeID}>{e.FirstName} {e.LastName} ({e.Department})</option>
                                ))}
                            </select>
                            <input className="input-field" placeholder="Note (optional)" value={assignNote} onChange={e => setAssignNote(e.target.value)} />
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button onClick={handleAssign} disabled={!selectedEmployee || assigning} className="btn btn-primary text-sm">
                                {assigning ? 'Assigning...' : 'Assign'}
                            </button>
                            <button onClick={() => setShowAssign(false)} className="btn btn-outline text-sm">Cancel</button>
                        </div>
                    </div>
                )}

                {/* Assignment Table */}
                {(license.assignments || []).length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No assignments yet.</div>
                ) : (
                    <table className="table min-w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Employee</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Assigned</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {(license.assignments || []).map((a: any) => (
                                <tr key={a.AssignmentID} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">
                                        {a.Employee ? `${a.Employee.FirstName} ${a.Employee.LastName}` : a.Asset ? `Asset: ${a.Asset.SerialNumber}` : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{a.Employee?.Department || '—'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(a.AssignedDate).toLocaleDateString('de-CH')}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleUnassign(a.AssignmentID)} className="text-red-500 hover:text-red-700 text-sm">
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
