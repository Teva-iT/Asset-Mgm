'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import ModernDatePicker from './ModernDatePicker'

interface DepartureActionProps {
    employeeId: string
    employeeName: string
    currentStatus: string
    currentEndDate?: Date | string | null
}

export default function DepartureAction({ employeeId, employeeName, currentStatus, currentEndDate }: DepartureActionProps) {
    const [showModal, setShowModal] = useState(false)
    // Initialize with existing dat if available, or today's date if not
    const [endDate, setEndDate] = useState(
        currentEndDate
            ? new Date(currentEndDate).toISOString().split('T')[0]
            : ''
    )
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const isEditing = currentStatus === 'Leaving' || currentStatus === 'Left'
    const buttonText = isEditing ? 'Edit Date' : 'Mark as Leaving'
    const modalTitle = isEditing ? `Update Departure for ${employeeName}` : `Mark ${employeeName} as Leaving`

    // Trigger Button
    // If Active -> Orange Button "Mark as Leaving"
    // If Leaving -> Outline Orange Button "Manage Departure"
    const TriggerButton = () => {
        return (
            <button
                onClick={() => setShowModal(true)}
                className="btn"
                style={{
                    background: isEditing ? 'white' : '#f97316',
                    color: isEditing ? '#ea580c' : 'white',
                    border: isEditing ? '1px solid #fed7aa' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: 500,
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    boxShadow: isEditing ? 'none' : '0 1px 2px rgba(0,0,0,0.1)'
                }}
            >
                {isEditing ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                )}
                {isEditing ? 'Manage Departure' : 'Mark as Leaving'}
            </button>
        )
    }

    const handleConfirm = async () => {
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
                setShowModal(false)
                router.refresh()
            } else {
                alert(data.error || 'Failed to update departure information')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleRevert = async () => {
        if (!confirm('Are you sure you want to revert this employee to Active status? This will clear the departure date and asset return deadlines.')) {
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`/api/employees/${employeeId}/mark-leaving`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ revert: true })
            })

            const data = await response.json()

            if (response.ok) {
                setShowModal(false)
                router.refresh()
            } else {
                alert(data.error || 'Failed to revert status')
            }
        } catch (error) {
            console.error('Error:', error)
            alert('An error occurred')
        } finally {
            setLoading(false)
        }
    }


    // Use Portal to escape parent transforms
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    return (
        <>
            <TriggerButton />

            {showModal && mounted && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(4px)',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <style jsx global>{`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes slideUp {
                            from { transform: translateY(20px); opacity: 0; }
                            to { transform: translateY(0); opacity: 1; }
                        }
                    `}</style>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        maxWidth: '450px',
                        width: '90%',
                        overflow: 'hidden',
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid #f3f4f6',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: '#ffffff'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#111827' }}>
                                {isEditing ? 'Update Departure' : 'Confirm Departure'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#9ca3af',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '1.5rem' }}>
                            <p style={{ fontSize: '0.95rem', color: '#4b5563', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                                Please select the final working day for <strong style={{ color: '#111827' }}>{employeeName}</strong>.
                                <br /><br />
                                <span style={{
                                    color: '#c2410c',
                                    backgroundColor: '#fff7ed',
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid #ffedd5',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <span>⚠️</span> All assigned assets must be returned before the departure date.
                                </span>
                            </p>

                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                                    Last Working Day
                                </label>
                                <ModernDatePicker
                                    className="w-full"
                                    value={endDate}
                                    onChange={(e: any) => setEndDate(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {isEditing && (
                                    <button
                                        onClick={handleRevert}
                                        disabled={loading}
                                        style={{
                                            padding: '0.75rem',
                                            border: '1px solid #fac8c8',
                                            backgroundColor: '#fef2f2',
                                            color: '#b91c1c',
                                            fontWeight: 600,
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s'
                                        }}
                                        title="Revert status to Active"
                                    >
                                        Revert to Active
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowModal(false)}
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        border: '1px solid #d1d5db',
                                        backgroundColor: 'white',
                                        color: '#374151',
                                        fontWeight: 600,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        padding: '0.75rem',
                                        border: 'none',
                                        backgroundColor: '#2563eb',
                                        color: 'white',
                                        fontWeight: 600,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                                        transition: 'background-color 0.2s, transform 0.1s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    {loading ? 'Processing...' : (isEditing ? 'Update Date' : 'Confirm Departure')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
