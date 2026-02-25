
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewUserPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData)

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.error || 'Failed to create user')
            }

            router.push('/admin/users')
            router.refresh()
        } catch (err: any) {
            setError(err.message || 'An error occurred.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container">
            <div className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h1 style={{ margin: 0 }}>New User</h1>
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
                                placeholder="jdoe"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="input-field"
                                placeholder="user@example.com"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="input-field"
                                placeholder="StrongPassword123"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="role">Role</label>
                            <select
                                id="role"
                                name="role"
                                required
                                className="select-field"
                                defaultValue="USER"
                            >
                                <option value="USER">Viewer (User)</option>
                                <option value="ADMIN">Admin (Full Access)</option>
                            </select>
                        </div>
                    </div>

                    {error && <p style={{ color: 'red', marginBottom: '1rem', marginTop: '1rem' }}>{error}</p>}

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button type="submit" disabled={loading} className="btn btn-primary">
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
