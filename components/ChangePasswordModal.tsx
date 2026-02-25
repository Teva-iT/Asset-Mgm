'use client'

import { useState } from 'react'

export default function ChangePasswordModal({ isOpen, onClose, username }: { isOpen: boolean, onClose: () => void, username: string }) {
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    if (!isOpen) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, oldPassword, newPassword })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to change password')
            }

            setSuccess('Password changed successfully!')
            setTimeout(() => {
                onClose()
                setOldPassword('')
                setNewPassword('')
                setConfirmPassword('')
                setSuccess('')
            }, 1500)

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>

                <h2 className="text-xl font-bold text-gray-900 mb-4">Change Password</h2>

                {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-4">{error}</div>}
                {success && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm mb-4">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Old Password</label>
                        <input
                            type="password"
                            required
                            className="w-full input-field"
                            value={oldPassword}
                            onChange={e => setOldPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                            type="password"
                            required
                            className="w-full input-field"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            required
                            className="w-full input-field"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-outline"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
