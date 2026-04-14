'use client'

import { useState, useEffect, useRef } from 'react'

interface Employee {
    EmployeeID: string
    FirstName: string
    LastName: string
    Email: string
    Department: string
    Source?: string
}

interface EmployeeAutocompleteProps {
    onSelect: (employee: Employee | null) => void
    defaultEmployee?: Employee
    disabled?: boolean
}

export default function EmployeeAutocomplete({ onSelect, defaultEmployee, disabled = false }: EmployeeAutocompleteProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<Employee[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [selected, setSelected] = useState<Employee | null>(null)
    const [isDirty, setIsDirty] = useState(false)
    const [isProvisioning, setIsProvisioning] = useState(false)
    const [adLookupStatus, setAdLookupStatus] = useState<'idle' | 'ok' | 'config-missing' | 'connection-error'>('idle')
    const [adLookupMessage, setAdLookupMessage] = useState('')
    const wrapperRef = useRef<HTMLDivElement>(null)
    const selectedEmployee = isDirty ? selected : (defaultEmployee || null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        const fetchEmployees = async () => {
            if (query.length < 2) {
                setResults([])
                setAdLookupStatus('idle')
                setAdLookupMessage('')
                return
            }

            try {
                const res = await fetch(`/api/employees?q=${encodeURIComponent(query)}`)
                if (res.ok) {
                    const statusHeader = res.headers.get('x-ad-status')
                    const messageHeader = res.headers.get('x-ad-message')
                    const data = await res.json()
                    setResults(data)
                    setAdLookupStatus(
                        statusHeader === 'config-missing' || statusHeader === 'connection-error' || statusHeader === 'ok'
                            ? statusHeader
                            : 'idle'
                    )
                    setAdLookupMessage(messageHeader ? decodeURIComponent(messageHeader) : '')
                    setIsOpen(true)
                }
            } catch (error) {
                console.error('Failed to search employees', error)
                setAdLookupStatus('connection-error')
                setAdLookupMessage('Employee search failed before Active Directory could respond.')
            }
        }

        const timeoutId = setTimeout(fetchEmployees, 300)
        return () => clearTimeout(timeoutId)
    }, [query])

    const handleSelect = async (employee: Employee) => {
        if (employee.EmployeeID.startsWith('ad:')) {
            setIsProvisioning(true)
            try {
                const res = await fetch('/api/employees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        FirstName: employee.FirstName,
                        LastName: employee.LastName,
                        Email: employee.Email,
                        Department: employee.Department === 'Active Directory' ? 'Unknown' : employee.Department,
                        StartDate: new Date().toISOString(),
                    }),
                })

                if (!res.ok) {
                    throw new Error('Failed to prepare employee record from Active Directory')
                }

                const persistedEmployee = await res.json()
                setIsDirty(true)
                setSelected(persistedEmployee)
                onSelect(persistedEmployee)
            } catch (error) {
                console.error('Failed to provision AD employee', error)
                return
            } finally {
                setIsProvisioning(false)
            }
        } else {
            setIsDirty(true)
            setSelected(employee)
            onSelect(employee)
        }

        setIsOpen(false)
        setQuery('')
    }

    const handleClear = () => {
        setIsDirty(true)
        setSelected(null)
        onSelect(null)
        setQuery('')
        setAdLookupStatus('idle')
        setAdLookupMessage('')
    }

    // If an employee is selected, replace the input with the "Chip" view
    if (selectedEmployee) {
        return (
            <div style={{
                padding: '0.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                backgroundColor: disabled ? '#f3f4f6' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '9999px',
                        backgroundColor: '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#2563eb',
                        fontWeight: 'bold',
                        fontSize: '0.875rem'
                    }}>
                        {selectedEmployee.FirstName[0]}{selectedEmployee.LastName[0]}
                    </div>
                    <div>
                        <div style={{ fontWeight: 500, color: '#111827', lineHeight: 1.25 }}>
                            {selectedEmployee.FirstName} {selectedEmployee.LastName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            {selectedEmployee.Department} • {selectedEmployee.Email}
                        </div>
                    </div>
                </div>
                {!disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        style={{
                            padding: '0.25rem',
                            borderRadius: '9999px',
                            color: '#9ca3af',
                            cursor: 'pointer',
                            border: 'none',
                            background: 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Remove assignment"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                )}
            </div>
        )
    }

    // Search Input View
    return (
        <div style={{ position: 'relative' }} ref={wrapperRef}>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name, email, or department..."
                    className="input-field"
                    style={{ width: '100%', backgroundColor: disabled ? '#f3f4f6' : 'white' }}
                    disabled={disabled || isProvisioning}
                    onFocus={() => !disabled && query.length >= 2 && setIsOpen(true)}
                />
            </div>

            {/* Dropdown Results */}
            {isOpen && results.length > 0 && (
                <div style={{
                    position: 'absolute',
                    zIndex: 50,
                    width: '100%',
                    marginTop: '0.25rem',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    maxHeight: '15rem',
                    overflowY: 'auto',
                    top: '100%',
                    left: 0
                }}>
                    {results.map((employee, index) => (
                        <div
                            key={employee.EmployeeID}
                            onClick={() => void handleSelect(employee)}
                            style={{
                                padding: '0.75rem',
                                cursor: 'pointer',
                                borderBottom: index === results.length - 1 ? 'none' : '1px solid #f3f4f6',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                backgroundColor: 'white'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                            <div style={{ fontWeight: 500, color: '#111827' }}>
                                {employee.FirstName} {employee.LastName}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                {employee.Email} <span style={{ color: '#d1d5db' }}>|</span> {employee.Department}
                            </div>
                            {employee.Source === 'AD' && (
                                <div style={{ fontSize: '0.75rem', color: '#2563eb' }}>
                                    Active Directory result
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* No Results Message */}
            {isOpen && results.length === 0 && query.length >= 2 && (
                <div style={{
                    position: 'absolute',
                    zIndex: 50,
                    width: '100%',
                    marginTop: '0.25rem',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '0.75rem',
                    textAlign: 'center',
                    color: adLookupStatus === 'ok' || adLookupStatus === 'idle' ? '#6b7280' : '#b45309',
                    top: '100%',
                    left: 0
                }}>
                    <div>
                        {adLookupStatus === 'config-missing'
                            ? 'Active Directory is not fully configured'
                            : adLookupStatus === 'connection-error'
                                ? 'Active Directory search failed'
                                : 'No employee found'}
                    </div>
                    {(adLookupStatus === 'config-missing' || adLookupStatus === 'connection-error') && adLookupMessage && (
                        <div style={{ fontSize: '0.75rem', marginTop: '0.35rem', color: '#6b7280' }}>
                            {adLookupMessage}
                        </div>
                    )}
                </div>
            )}
            {isProvisioning && (
                <div style={{
                    marginTop: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#2563eb'
                }}>
                    Preparing employee from Active Directory...
                </div>
            )}
        </div>
    )
}
