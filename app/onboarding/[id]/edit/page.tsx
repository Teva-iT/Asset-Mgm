'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ModernDatePicker from '@/components/ModernDatePicker'
import { supabase } from '@/lib/supabase'

export default function EditOnboardingPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const [id, setId] = useState<string | null>(null)

    const [employeeName, setEmployeeName] = useState<string>('')
    const [minStartDate, setMinStartDate] = useState<string>('')
    const [startDate, setStartDate] = useState<string>('')
    const [status, setStatus] = useState<string>('Draft')
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        params.then(p => {
            setId(p.id)
            fetchData(p.id)
        })
    }, [params])

    const fetchData = async (onboardingId: string) => {
        try {
            const { data, error } = await supabase
                .from('onboarding_requests')
                .select('*')
                .eq('id', onboardingId)
                .single()

            if (error || !data) throw new Error('Could not fetch onboarding data')

            setStartDate(data.start_date.split('T')[0])
            setStatus(data.status)
            setNotes(data.notes || '')

            if (data.employee_id) {
                const { data: emp } = await supabase.from('Employee').select('FirstName, LastName, StartDate').eq('EmployeeID', data.employee_id).single()
                if (emp) {
                    setEmployeeName(`${emp.FirstName} ${emp.LastName}`)
                    if (emp.StartDate) {
                        setMinStartDate(emp.StartDate.split('T')[0])
                    }
                }
            }

        } catch (err) {
            console.error(err)
            alert('Failed to load onboarding request.')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!id) return

        setSaving(true)
        try {
            const res = await fetch(`/api/onboarding/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    start_date: startDate,
                    status,
                    notes
                })
            })
            if (!res.ok) throw new Error('Failed to update onboarding request')

            router.push(`/onboarding/${id}`)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Failed to update onboarding request.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-10 text-center text-gray-500">Loading editor...</div>

    return (
        <div className="container mx-auto p-6 max-w-2xl space-y-6">
            <Link href={`/onboarding/${id}`} className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 mb-4">
                <span>&larr;</span> Back to Dashboard
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Onboarding Workflow</h1>

                <form onSubmit={handleSubmit} className="space-y-5">

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Employee</label>
                        <input
                            type="text"
                            value={employeeName}
                            disabled
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">The employee cannot be changed for an existing workflow.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Process Start Date *</label>
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Workflow Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="Draft">Draft</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">General Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional instructions or updates..."
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                        <Link
                            href={`/onboarding/${id}`}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
