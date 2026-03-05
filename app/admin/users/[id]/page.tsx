'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)
    const [error, setError] = useState('')

    // Form State
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('USER')
    const [isSupportContact, setIsSupportContact] = useState(false)
    const [supportRole, setSupportRole] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        // Fetch user details on mount
        const fetchUser = async () => {
            try {
                const res = await fetch(`/api/users/${id}`)
                if (res.ok) {
                    const data = await res.json()
                    setUsername(data.Username)
                    setEmail(data.Email || '')
                    setRole(data.Role)
                    setIsSupportContact(data.IsSupportContact || false)
                    setSupportRole(data.SupportRole || '')
                    setAvatarUrl(data.AvatarUrl || '')
                } else {
                    setError('Failed to load user')
                }
            } catch (err) {
                setError('An error occurred loading user')
            } finally {
                setFetching(false)
            }
        }
        fetchUser()
    }, [id])

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData)

        // Add manual state fields
        const payload = {
            ...data,
            isSupportContact,
            supportRole,
            avatarUrl
        }

        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to update user')
            }

            router.push('/admin/users')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'An error occurred.')
        } finally {
            setLoading(false)
        }
    }

    if (fetching) return <div className="container">Loading...</div>

    return (
        <div className="container">
            <div className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ margin: 0 }}>Edit User</h1>
                </div>
                <Link href="/admin/users" className="btn btn-outline" style={{ backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                    Back
                </Link>
            </div>

            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <form onSubmit={handleSubmit} className="card">
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label" htmlFor="username">Username</label>
                            <input
                                id="username"
                                name="username"
                                required
                                className="input-field"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="user@example.com"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">New Password (Optional)</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                className="input-field"
                                placeholder="Leave blank to keep current"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="role">Role</label>
                            <select
                                id="role"
                                name="role"
                                required
                                className="select-field"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="USER">Viewer (User)</option>
                                <option value="ADMIN">Admin (Full Access)</option>
                            </select>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8 mt-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Support Profile</h3>
                        <div className="form-grid">
                            <div className="form-group flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isSupportContact"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={isSupportContact}
                                    onChange={(e) => setIsSupportContact(e.target.checked)}
                                />
                                <label className="form-label mb-0" htmlFor="isSupportContact">Show on Support Page</label>
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="supportRole">Support Role Name</label>
                                <input
                                    id="supportRole"
                                    className="input-field"
                                    value={supportRole}
                                    onChange={(e) => setSupportRole(e.target.value)}
                                    placeholder="e.g. IT Site Lead"
                                />
                            </div>

                            <div className="form-group sm:col-span-2">
                                <label className="form-label">Profile Image</label>
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 overflow-hidden shrink-0">
                                        {avatarUrl ? (
                                            <img src={avatarUrl} alt="Preview" className="h-full w-full object-cover" />
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                <circle cx="12" cy="7" r="4"></circle>
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            id="avatar-upload"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0]
                                                if (!file) return

                                                setUploading(true)
                                                const formData = new FormData()
                                                formData.append('file', file)

                                                try {
                                                    const res = await fetch('/api/upload', {
                                                        method: 'POST',
                                                        body: formData
                                                    })
                                                    if (res.ok) {
                                                        const { url } = await res.json()
                                                        setAvatarUrl(url)
                                                    }
                                                } catch (err) {
                                                    console.error('Upload failed', err)
                                                } finally {
                                                    setUploading(false)
                                                }
                                            }}
                                        />
                                        <label htmlFor="avatar-upload" className={`btn btn-outline text-sm py-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            {uploading ? 'Uploading...' : 'Choose New Photo'}
                                        </label>
                                        <p className="text-xs text-gray-500 mt-1">Recommended: Square image, max 2MB</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && <p style={{ color: 'red', marginBottom: '1rem', marginTop: '1rem' }}>{error}</p>}

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
