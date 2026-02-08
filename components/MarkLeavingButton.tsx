'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MarkLeavingButtonProps {
    employeeId: string
    employeeName: string
    currentStatus: string
}

export default function MarkLeavingButton({ employeeId, employeeName, currentStatus }: MarkLeavingButtonProps) {
    const [showModal, setShowModal] = useState(false)
    const [endDate, setEndDate] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleMarkLeaving = async () => {
        if (!endDate) {
            alert('Please select an end date')
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`/api/employees/${employeeId}/mark-leaving`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endDate })
            })

            const data = await response.json()

            if (response.ok) {
                alert(data.message)
                setShowModal(false)
                router.refresh()
            } else {
                alert(data.error || 'Failed to mark employee as leaving')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('An error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (currentStatus !== 'Active') {
        return null
    }

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="btn btn-outline"
                style={{ background: '#f97316', color: 'white', borderColor: '#f97316' }}
            >
                Mark as Leaving
            </button>

            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '12px',
                        maxWidth: '500px',
                        width: '90%'
                    }}>
                        <h2 style={{ marginBottom: '1rem' }}>Mark {employeeName} as Leaving</h2>
                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                            All assigned assets must be returned by this date.
                        </p>

                        <div className="form-group">
                            <label className="form-label">End Date</label>
                            <input
                                type="date"
                                className="input-field"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button
                                onClick={handleMarkLeaving}
                                disabled={loading}
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                            >
                                {loading ? 'Processing...' : 'Confirm'}
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={loading}
                                className="btn btn-outline"
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
