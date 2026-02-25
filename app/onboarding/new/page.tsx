'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import EmployeeAutocomplete from '@/components/EmployeeAutocomplete'
import ModernDatePicker from '@/components/ModernDatePicker'

export default function NewOnboardingPage() {
    const router = useRouter()

    const [employeeId, setEmployeeId] = useState<string>('')
    const [employeeName, setEmployeeName] = useState<string>('')
    const [minStartDate, setMinStartDate] = useState<string>('')
    const [startDate, setStartDate] = useState<string>('')
    const [includeAccess, setIncludeAccess] = useState(true)
    const [includeHardware, setIncludeHardware] = useState(true)
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!employeeId || !startDate) return alert('Please select an employee and start date.')

        setLoading(true)
        try {
            const res = await fetch('/api/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employee_id: employeeId,
                    start_date: startDate,
                    include_access: includeAccess,
                    include_hardware: includeHardware,
                    notes
                })
            })
            if (!res.ok) throw new Error('Failed to create onboarding request')

            const data = await res.json()
            router.push(`/onboarding/${data.onboardingId}`)
        } catch (error) {
            console.error(error)
            alert('Failed to submit onboarding request.')
        } finally {
            setLoading(false)
        }
    }

    // We can reuse ReferenceUserAutocomplete temporarily or build an EmployeeAutocomplete
    // For now, let's assume we have a simple way to pick employees or we'll build One
    // Wait, we DO have Employee selection for Assets! We can build a dedicated Employee lookup or reuse
    return (
        <div className="container mx-auto p-6 max-w-3xl">
            <div className="mb-8">
                <Link href="/onboarding" className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
                    <span>&larr;</span> Back to Onboarding List
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Initiate Onboarding</h1>
                <p className="text-gray-500 mt-1">Start a new workflow to provision access and hardware.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">

                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Target Employee <span className="text-red-500">*</span></label>
                    <p className="text-xs text-gray-500 mb-2">Select the employee who is joining or transitioning.</p>
                    <EmployeeAutocomplete
                        onSelect={(emp: any) => {
                            setEmployeeId(emp ? emp.EmployeeID : '')
                            setEmployeeName(emp ? `${emp.FirstName} ${emp.LastName}` : '')
                            if (emp && emp.StartDate) {
                                setMinStartDate(emp.StartDate.split('T')[0])
                                // Also auto-select it if possible, or reset it if it's invalid
                                setStartDate(prev => {
                                    if (prev && prev < emp.StartDate.split('T')[0]) return emp.StartDate.split('T')[0]
                                    return prev
                                })
                            } else {
                                setMinStartDate('')
                            }
                        }}
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">Process Start Date <span className="text-red-500">*</span></label>
                    <ModernDatePicker
                        className="w-full"
                        value={startDate}
                        onChange={(e: any) => setStartDate(e.target.value)}
                        min={minStartDate}
                        required
                    />
                    {minStartDate && (
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Employee started on: {new Date(minStartDate).toLocaleDateString()}
                        </p>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Orchestration Scope</h3>
                    <div className="space-y-3">
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                checked={includeAccess}
                                onChange={e => setIncludeAccess(e.target.checked)}
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-800">Generate Access Request</span>
                                <span className="text-xs text-gray-500">Auto-creates a draft IT Access Request (Logical Access)</span>
                            </div>
                        </label>
                        <label className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                checked={includeHardware}
                                onChange={e => setIncludeHardware(e.target.checked)}
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-800">Generate Hardware Request</span>
                                <span className="text-xs text-gray-500">Auto-creates a draft Hardware Provisioning Request (Physical Assets)</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">General Notes</label>
                    <textarea
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                        rows={3}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Optional instructions for the orchestration team..."
                    />
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-sm transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {loading ? 'Initiating...' : 'Start Onboarding Workflow'}
                    </button>
                </div>

            </form>
        </div>
    )
}
