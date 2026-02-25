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

        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
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
