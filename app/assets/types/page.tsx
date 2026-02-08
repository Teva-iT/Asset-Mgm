'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AssetType {
    TypeID: string
    Name: string
}

export default function AssetTypesPage() {
    const [types, setTypes] = useState<AssetType[]>([])
    const [newType, setNewType] = useState('')
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetchTypes()
    }, [])

    async function fetchTypes() {
        try {
            const res = await fetch('/api/asset-types')
            if (res.ok) {
                const data = await res.json()
                setTypes(data)
            }
        } catch (error) {
            console.error('Error fetching types:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!newType.trim()) return

        setAdding(true)
        try {
            const res = await fetch('/api/asset-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newType }),
            })

            if (res.ok) {
                setNewType('')
                fetchTypes() // Refresh list
            } else {
                alert('Failed to add type')
            }
        } catch (error) {
            console.error('Error adding type:', error)
        } finally {
            setAdding(false)
        }
    }

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <div className="header">
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Asset Types</h1>
                <Link href="/assets" className="btn btn-outline" style={{ backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                    Back
                </Link>
            </div>

            <div className="card mb-8">
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Add New Type</h2>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        type="text"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        placeholder="e.g. Projector"
                        className="input-field"
                        style={{ flex: 1 }}
                    />
                    <button type="submit" disabled={adding} className="btn btn-primary">
                        {adding ? 'Adding...' : 'Add Type'}
                    </button>
                </form>
            </div>

            <div className="card">
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Existing Types</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
                        {types.map(type => (
                            <div key={type.TypeID} style={{
                                padding: '1rem',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                textAlign: 'center',
                                fontWeight: 500
                            }}>
                                {type.Name}
                            </div>
                        ))}
                    </div>
                )}
                {types.length === 0 && !loading && <p>No types found.</p>}
            </div>
        </div>
    )
}
