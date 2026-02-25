'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
    const router = useRouter()

    // Steps: 0 = Request Code, 1 = Verify Code & Reset
    const [step, setStep] = useState(0)

    const [identifier, setIdentifier] = useState('')
    const [code, setCode] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    async function handleRequestCode(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to send code')

            setSuccess('Reset code sent! Check the server console (simulation).')
            setStep(1)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleResetPassword(e: React.FormEvent) {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, code, newPassword })
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to reset password')

            setSuccess('Password reset successful! Redirecting to login...')
            setTimeout(() => {
                router.push('/login')
            }, 2000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {step === 0 ? 'Forgot Password?' : 'Reset Password'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-2">
                        {step === 0
                            ? 'Enter your username or email to receive a reset code.'
                            : 'Enter the 6-digit code and your new password.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                        {success}
                    </div>
                )}

                {step === 0 ? (
                    <form onSubmit={handleRequestCode} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username or Email</label>
                            <input
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="Enter username or email"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors
                                ${loading ? 'opacity-70 cursor-not-allowed' : ''}
                            `}
                        >
                            {loading ? 'Sending...' : 'Send Reset Code'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reset Code (6 Digits)</label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-mono tracking-widest text-center text-lg"
                                placeholder="000000"
                                maxLength={6}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors
                                ${loading ? 'opacity-70 cursor-not-allowed' : ''}
                            `}
                        >
                            {loading ? 'Resetting...' : 'Set New Password'}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <Link href="/login" className="text-sm text-blue-600 hover:underline">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}
