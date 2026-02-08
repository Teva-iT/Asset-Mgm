
'use client'

import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useRouter } from 'next/navigation'

interface EmployeeData {
    FirstName: string
    LastName: string
    Email: string
    Department: string
    StartDate: string
    // internal use
    Status?: string
    isValid?: boolean
    errors?: string[]
}

export default function EmployeeImportModal({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [step, setStep] = useState<'upload' | 'preview'>('upload')
    const [employees, setEmployees] = useState<EmployeeData[]>([])
    const [dragActive, setDragActive] = useState(false)
    const [loading, setLoading] = useState(false)
    const [summary, setSummary] = useState({ valid: 0, invalid: 0 })

    if (!isOpen) return null

    const handleFile = async (file: File) => {
        setLoading(true)
        const reader = new FileReader()

        reader.onload = (e) => {
            const data = e.target?.result
            if (data) {
                const workbook = XLSX.read(data, { type: 'binary' })
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[]

                const parsedData: EmployeeData[] = jsonData.map((row: any) => {
                    const errors: string[] = []

                    // Basic Validation
                    if (!row.FirstName) errors.push('First Name missing')
                    if (!row.LastName) errors.push('Last Name missing')
                    if (!row.Email || !row.Email.includes('@')) errors.push('Invalid Email')
                    if (!row.Department) errors.push('Department missing')

                    // Date parsing (Excel dates are sometimes numbers)
                    let startDate = row.StartDate
                    if (typeof startDate === 'number') {
                        // Excel date serial number to JS Date
                        const date = new Date((startDate - (25567 + 2)) * 86400 * 1000)
                        startDate = date.toISOString().split('T')[0]
                    } else if (startDate instanceof Date) {
                        startDate = startDate.toISOString().split('T')[0]
                    } else if (!startDate) {
                        // Default to today if missing? Or error? Let's error.
                        errors.push('Start Date missing')
                    }

                    return {
                        FirstName: row.FirstName || '',
                        LastName: row.LastName || '',
                        Email: row.Email || '',
                        Department: row.Department || '',
                        StartDate: startDate || '',
                        Status: 'Active',
                        isValid: errors.length === 0,
                        errors
                    }
                })

                setEmployees(parsedData)
                setSummary({
                    valid: parsedData.filter(e => e.isValid).length,
                    invalid: parsedData.filter(e => !e.isValid).length
                })
                setStep('preview')
                setLoading(false)
            }
        }
        reader.readAsBinaryString(file)
    }

    const handleImport = async () => {
        setLoading(true)
        const validEmployees = employees.filter(e => e.isValid)

        try {
            const res = await fetch('/api/employees/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employees: validEmployees })
            })

            if (res.ok) {
                const result = await res.json()
                alert(`Successfully imported ${result.count} employees.`)
                onSuccess()
                onClose()
            } else {
                alert('Failed to import employees. Please try again.')
            }
        } catch (error) {
            console.error('Import failed', error)
            alert('An error occurred during import.')
        } finally {
            setLoading(false)
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '600px', maxWidth: '90%',
                maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Import Employees</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280' }}>&times;</button>
                </div>

                {step === 'upload' ? (
                    <div
                        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                        style={{
                            border: `2px dashed ${dragActive ? '#2563eb' : '#e5e7eb'}`,
                            borderRadius: '0.75rem', padding: '3rem', textAlign: 'center',
                            backgroundColor: dragActive ? '#eff6ff' : '#f9fafb',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{ marginBottom: '1rem', color: '#9CA3AF' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        </div>
                        <p style={{ fontWeight: 500, color: '#374151', marginBottom: '0.5rem' }}>Drag & Drop your Excel file here</p>
                        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>or</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx, .xls"
                            style={{ display: 'none' }}
                            onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                        />
                        <button onClick={() => fileInputRef.current?.click()} className="btn btn-outline">
                            Select File
                        </button>
                        <div style={{ marginTop: '2rem', textAlign: 'left', fontSize: '0.85rem', color: '#6B7280', backgroundColor: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                            <strong>Supported Columns:</strong> FirstName, LastName, Email, Department, StartDate
                        </div>
                    </div>
                ) : (
                    <div>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ flex: 1, padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '0.5rem', border: '1px solid #d1fae5', color: '#065f46' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summary.valid}</div>
                                <div style={{ fontSize: '0.875rem' }}>Valid Employees</div>
                            </div>
                            <div style={{ flex: 1, padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fee2e2', color: '#991b1b' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{summary.invalid}</div>
                                <div style={{ fontSize: '0.875rem' }}>Issues Found</div>
                            </div>
                        </div>

                        {summary.invalid > 0 && (
                            <div style={{ marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                                <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f9fafb' }}>
                                        <tr>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Row</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Name</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Issues</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {employees.map((emp, idx) => !emp.isValid && (
                                            <tr key={idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                                                <td style={{ padding: '0.5rem' }}>{idx + 2}</td> {/* +2 for header row and 1-based index */}
                                                <td style={{ padding: '0.5rem' }}>{emp.FirstName} {emp.LastName}</td>
                                                <td style={{ padding: '0.5rem', color: '#ef4444' }}>{emp.errors?.join(', ')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => { setStep('upload'); setEmployees([]) }} className="btn btn-outline">
                                Back to Upload
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={summary.valid === 0 || loading}
                                className="btn btn-primary"
                                style={{ opacity: (summary.valid === 0 || loading) ? 0.5 : 1 }}
                            >
                                {loading ? 'Importing...' : `Import ${summary.valid} Employees`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
