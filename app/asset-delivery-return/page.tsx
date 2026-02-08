'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AssetSchedulingPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        requestType: 'Asset Return',
        requestedDate: '',
        notes: ''
    })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleTypeSelect = (type: string) => {
        setFormData({ ...formData, requestType: type })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess(false)

        try {
            const res = await fetch('/api/asset-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Something went wrong')
            } else {
                setSuccess(true)
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    requestType: 'Asset Return',
                    requestedDate: '',
                    notes: ''
                })
            }
        } catch (err) {
            setError('Failed to submit request')
        } finally {
            setLoading(false)
        }
    }

    // Get tomorrow's date for min date attribute
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const minDate = tomorrow.toISOString().split('T')[0]

    return (
        <div className="container mx-auto max-w-3xl py-12 px-6">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">Asset Return & Delivery Scheduling</h1>
                <p className="text-gray-500 max-w-lg mx-auto">
                    Use this form to request a delivery or return date for company assets.
                    Requests will be reviewed and coordinated by the IT department.
                </p>
            </div>

            {success ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center animate-fade-in-up shadow-sm">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-green-900 mb-2">Request Received</h3>
                    <p className="text-green-700 mb-8 max-w-md mx-auto">
                        Your request has been received. IT will contact you to confirm the details.
                    </p>
                    <button
                        onClick={() => setSuccess(false)}
                        className="btn btn-outline"
                    >
                        Submit Another Request
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            {error}
                        </div>
                    )}

                    {/* Context Bar */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                        <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p className="text-sm text-blue-800">
                            This request helps IT coordinate asset return or delivery smoothly.
                            Please submit it at least a few days in advance.
                        </p>
                    </div>

                    {/* Section 1: Employee Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="mb-6 border-b border-gray-50 pb-4">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-bold shadow-sm">1</span>
                                Employee Information
                            </h2>
                            <p className="text-sm text-gray-500 ml-11 mt-1">Who is making the request</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="form-group">
                                <label className="form-label" htmlFor="firstName">First Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    required
                                    className="input-field"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="lastName">Last Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    required
                                    className="input-field"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Corporate Email <span className="text-red-500">*</span></label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                placeholder="firstname.lastname@tevapharma.ch"
                                className="input-field"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            <p className="text-xs text-gray-400 mt-1">Must be an @tevapharma.ch address</p>
                        </div>
                    </div>

                    {/* Section 2: Request Details */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="mb-6 border-b border-gray-50 pb-4">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-bold shadow-sm">2</span>
                                Request Details
                            </h2>
                            <p className="text-sm text-gray-500 ml-11 mt-1">Please select the option that best describes your situation.</p>
                        </div>

                        <div className="form-group mb-10">
                            <label className="form-label mb-4 block text-base">Request Type <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Option 1: Return (Amber/Orange - Leaving/Sensitive) */}
                                <div
                                    onClick={() => handleTypeSelect('Asset Return')}
                                    className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all hover:bg-amber-50/50
                                    ${formData.requestType === 'Asset Return'
                                            ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500'
                                            : 'border-gray-100 hover:border-amber-200'}`}
                                >
                                    <div className="flex flex-col items-center text-center gap-3">
                                        <div className={`p-3 rounded-full ${formData.requestType === 'Asset Return' ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-400'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path><polyline points="9 9 20 20 15 20 20 15 20 20 20 15"></polyline></svg>
                                        </div>
                                        <div>
                                            <div className={`font-semibold ${formData.requestType === 'Asset Return' ? 'text-amber-900' : 'text-gray-700'}`}>Asset Return</div>
                                            <div className="text-xs text-gray-500 mt-1">Leaving the company</div>
                                            <div className="text-xs text-amber-600 mt-1 font-medium">We will coordinate the handover with you.</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Option 2: Delivery (Teal/Green - New/Start) */}
                                <div
                                    onClick={() => handleTypeSelect('Asset Delivery')}
                                    className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all hover:bg-teal-50/50 
                                    ${formData.requestType === 'Asset Delivery'
                                            ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                                            : 'border-gray-100 hover:border-teal-200'}`}
                                >
                                    <div className="flex flex-col items-center text-center gap-3">
                                        <div className={`p-3 rounded-full ${formData.requestType === 'Asset Delivery' ? 'bg-teal-100 text-teal-700' : 'bg-gray-50 text-gray-400'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                                        </div>
                                        <div>
                                            <div className={`font-semibold ${formData.requestType === 'Asset Delivery' ? 'text-teal-900' : 'text-gray-700'}`}>Asset Delivery</div>
                                            <div className="text-xs text-gray-500 mt-1">New or replacement asset</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Option 3: Exchange (Slate/Blue - Change) */}
                                <div
                                    onClick={() => handleTypeSelect('Asset Exchange')}
                                    className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50/50 
                                    ${formData.requestType === 'Asset Exchange'
                                            ? 'border-slate-500 bg-slate-50 ring-1 ring-slate-500'
                                            : 'border-gray-100 hover:border-slate-200'}`}
                                >
                                    <div className="flex flex-col items-center text-center gap-3">
                                        <div className={`p-3 rounded-full ${formData.requestType === 'Asset Exchange' ? 'bg-slate-100 text-slate-700' : 'bg-gray-50 text-gray-400'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                                        </div>
                                        <div>
                                            <div className={`font-semibold ${formData.requestType === 'Asset Exchange' ? 'text-slate-900' : 'text-gray-700'}`}>Asset Exchange</div>
                                            <div className="text-xs text-gray-500 mt-1">Replace existing asset</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-group py-2">
                            <label className="form-label mb-3 flex items-center gap-2 text-lg" htmlFor="requestedDate">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-900"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                Requested Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                id="requestedDate"
                                name="requestedDate"
                                required
                                min={minDate}
                                className="input-field h-14 text-lg font-medium px-4 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                value={formData.requestedDate}
                                onChange={handleChange}
                            />
                            <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                <span>Typical requests are scheduled <strong>3–5 business days</strong> in advance.</span>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Additional Information */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="mb-6 border-b border-gray-50 pb-4">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-bold shadow-sm">3</span>
                                Additional Information
                            </h2>
                            <p className="text-sm text-gray-500 ml-11 mt-1">Anything IT should be aware of</p>
                        </div>

                        <div className="form-group mb-8">
                            <label className="form-label" htmlFor="notes">Additional Notes <span className="text-gray-400 font-normal">(Optional)</span></label>
                            <textarea
                                id="notes"
                                name="notes"
                                rows={4}
                                placeholder="E.g., Last working day, preferred time window, office location..."
                                className="input-field resize-none text-base"
                                value={formData.notes}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-4 text-lg font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex justify-center items-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    processing...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                    Send Request to IT
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}
