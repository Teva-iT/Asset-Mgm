'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const URGENCY_CONFIG: Record<string, { color: string, label: string }> = {
    Low: { color: 'bg-gray-100 text-gray-600', label: 'Low' },
    Normal: { color: 'bg-blue-100 text-blue-700', label: 'Normal' },
    High: { color: 'bg-orange-100 text-orange-700', label: 'High' },
    Critical: { color: 'bg-red-100 text-red-700', label: '🔴 Critical' },
}

const STATUS_CONFIG: Record<string, { color: string }> = {
    Pending: { color: 'bg-yellow-100 text-yellow-800' },
    Approved: { color: 'bg-green-100 text-green-800' },
    Rejected: { color: 'bg-red-100 text-red-700' },
    Fulfilled: { color: 'bg-blue-100 text-blue-700' },
}

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('Pending')
    const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})

    const load = () => {
        const url = filter ? `/api/requests?status=${filter}` : '/api/requests'
        fetch(url).then(r => r.json()).then(data => {
            setRequests(Array.isArray(data) ? data : [])
            setLoading(false)
        })
    }

    useEffect(() => { load() }, [filter])

    async function handleAction(requestId: string, status: 'Approved' | 'Rejected') {
        await fetch(`/api/requests/${requestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Status: status, ReviewNotes: reviewNotes[requestId] || '' }),
        })
        load()
    }

    const pending = requests.filter(r => r.Status === 'Pending').length

    return (
        <div className="container">
            <div className="header mb-6">
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>📥 Asset Requests</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {pending > 0 && <span className="text-orange-600 font-semibold">{pending} pending review · </span>}
                        Admin approval dashboard
                    </p>
                </div>
                <Link href="/requests/new" className="btn btn-primary">+ New Request</Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {['Pending', 'Approved', 'Rejected', 'Fulfilled', ''].map(s => (
                    <button
                        key={s || 'all'}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="card p-12 text-center text-gray-400">Loading...</div>
            ) : requests.length === 0 ? (
                <div className="card p-12 text-center text-gray-400">No requests found.</div>
            ) : (
                <div className="flex flex-col gap-4">
                    {requests.map(req => {
                        const urgencyCfg = URGENCY_CONFIG[req.Urgency] || URGENCY_CONFIG.Normal
                        const statusCfg = STATUS_CONFIG[req.Status] || { color: 'bg-gray-100 text-gray-600' }
                        const daysLeft = req.NeededByDate
                            ? Math.ceil((new Date(req.NeededByDate).getTime() - Date.now()) / 86400000)
                            : null
                        return (
                            <div key={req.RequestID} className="card border border-gray-200">
                                <div className="flex items-start justify-between gap-4 mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-gray-900">{req.AssetType}</span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${urgencyCfg.color}`}>{urgencyCfg.label}</span>
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.color}`}>{req.Status}</span>
                                        </div>
                                        <div className="text-sm text-gray-700 mt-1">{req.Reason}</div>
                                    </div>
                                    <div className="text-right text-sm text-gray-500 shrink-0">
                                        <div className="font-medium">{req.Employee?.FirstName} {req.Employee?.LastName}</div>
                                        <div className="text-xs">{req.Employee?.Department}</div>
                                    </div>
                                </div>

                                <div className="flex gap-4 text-xs text-gray-500 mb-3">
                                    <span>Submitted: {new Date(req.createdAt).toLocaleDateString('de-CH')}</span>
                                    {daysLeft !== null && (
                                        <span className={daysLeft < 0 ? 'text-red-500 font-semibold' : daysLeft <= 3 ? 'text-orange-500 font-semibold' : ''}>
                                            Needed by: {new Date(req.NeededByDate).toLocaleDateString('de-CH')}
                                            {daysLeft < 0 ? ` (${Math.abs(daysLeft)}d overdue)` : ` (in ${daysLeft}d)`}
                                        </span>
                                    )}
                                </div>

                                {req.Status === 'Pending' && (
                                    <div className="border-t border-gray-100 pt-3 flex gap-2 items-center flex-wrap">
                                        <input
                                            className="input-field flex-1 min-w-48 text-sm"
                                            placeholder="Review notes (optional)..."
                                            value={reviewNotes[req.RequestID] || ''}
                                            onChange={e => setReviewNotes(prev => ({ ...prev, [req.RequestID]: e.target.value }))}
                                        />
                                        <button
                                            onClick={() => handleAction(req.RequestID, 'Approved')}
                                            className="btn btn-primary text-sm px-4"
                                        >
                                            ✓ Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.RequestID, 'Rejected')}
                                            className="btn btn-danger text-sm px-4"
                                        >
                                            ✗ Reject
                                        </button>
                                    </div>
                                )}

                                {req.Status !== 'Pending' && req.ReviewNotes && (
                                    <div className="border-t border-gray-100 pt-3 text-sm text-gray-600">
                                        <span className="font-medium">Review note:</span> {req.ReviewNotes}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
