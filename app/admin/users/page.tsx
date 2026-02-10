'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface User {
    UserID: string
    Username: string
    Role: string
    Email: string | null
    Status: string
    CreatedAt: string
    UpdatedAt: string
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const router = useRouter()

    useEffect(() => {
        fetch('/api/users')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setUsers(data)
                } else {
                    console.error('API returned non-array:', data)
                    setUsers([])
                }
            })
            .catch(err => console.error(err))
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return

        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setUsers(users.filter(u => u.UserID !== id))
                router.refresh()
            } else {
                alert('Failed to delete user')
            }
        } catch (error) {
            console.error('Error deleting user:', error)
            alert('An error occurred')
        }
    }

    return (
        <div className="container">
            <div className="header">
                <h1>Admin Users</h1>
                <Link href="/admin/users/new" className="btn btn-primary">+ Add User</Link>
            </div>

            <div className="card" style={{ padding: 0 }}>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Created At</th>
                            <th>Updated At</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.UserID}>
                                <td style={{ fontWeight: 500 }}>{user.Username}</td>
                                <td>{user.Email || '-'}</td>
                                <td>
                                    <span className={`badge ${user.Role === 'ADMIN' ? 'badge-assigned' : 'badge-returned'}`}>
                                        {user.Role}
                                    </span>
                                </td>
                                <td>
                                    <span className={`badge ${user.Status === 'Active' ? 'badge-available' : 'badge-maintenance'}`}>
                                        {user.Status}
                                    </span>
                                </td>
                                <td>{new Date(user.CreatedAt).toLocaleDateString()}</td>
                                <td>{new Date(user.UpdatedAt).toLocaleDateString()}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <Link href={`/admin/users/${user.UserID}`} className="btn btn-primary">
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(user.UserID)}
                                            className="btn btn-danger"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No users found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
