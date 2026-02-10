'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AssetTypeIcon from '@/components/AssetTypeIcon'

interface AssetType {
    TypeID: string
    Name: string
    OwnershipType?: string
}

export default function AssetTypesPage() {
    const [types, setTypes] = useState<AssetType[]>([])
    const [newType, setNewType] = useState('')
    const [newOwnershipType, setNewOwnershipType] = useState('Individual')
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)

    // Edit State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')

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
                body: JSON.stringify({ name: newType, ownershipType: newOwnershipType }),
            })

            if (res.ok) {
                setNewType('')
                setNewOwnershipType('Individual')
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

    async function handleDelete(type: AssetType) {
        if (!confirm(`Are you sure you want to delete "${type.Name}"?`)) return;

        try {
            const res = await fetch(`/api/asset-types/${type.TypeID}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                setTypes(types.filter(t => t.TypeID !== type.TypeID))
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to delete type. It might be in use.')
            }
        } catch (error) {
            console.error('Error deleting type:', error)
            alert('An error occurred while deleting.')
        }
    }

    function startEdit(type: AssetType) {
        setEditingId(type.TypeID)
        setEditName(type.Name)
    }

    async function handleUpdate() {
        if (!editName.trim()) return
        if (!editingId) return

        try {
            const res = await fetch(`/api/asset-types/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName })
            })

            if (res.ok) {
                setTypes(types.map(t => t.TypeID === editingId ? { ...t, Name: editName } : t))
                setEditingId(null)
                setEditName('')
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to update type')
            }
        } catch (error) {
            console.error('Error updating type:', error)
            alert('Failed to update type')
        }
    }

    return (
        <div className="container" style={{ maxWidth: '900px' }}>
            <div className="header">
                <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Asset Types</h1>
                <Link href="/assets" className="btn btn-outline" style={{ backgroundColor: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                    Back
                </Link>
            </div>

            <div className="card mb-8">
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Add New Type</h2>
                <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                    <div className="flex-grow">
                        <input
                            type="text"
                            value={newType}
                            onChange={(e) => setNewType(e.target.value)}
                            placeholder="Type Name (e.g. Projector)"
                            className="input-field w-full h-11"
                        />
                    </div>
                    <div className="md:w-64 flex-shrink-0">
                        <select
                            value={newOwnershipType}
                            onChange={(e) => setNewOwnershipType(e.target.value)}
                            className="select-field w-full h-11"
                        >
                            <option value="Individual">Individual (Assign to Person)</option>
                            <option value="Shared">Shared (Location Based)</option>
                            <option value="Stock">Stock (Quantity Based)</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={adding}
                        className="btn btn-primary h-11 px-8 whitespace-nowrap flex items-center justify-center"
                    >
                        {adding ? 'Adding...' : 'Add Type'}
                    </button>
                </form>
            </div>

            <div className="card">
                <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Existing Types</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {types.map(type => (
                            <div key={type.TypeID} className="relative p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col items-center justify-between group hover:border-blue-300 transition-colors">
                                {/* Ownership Badge */}
                                <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full border
                                    ${type.OwnershipType === 'Individual' || !type.OwnershipType ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}
                                    ${type.OwnershipType === 'Shared' ? 'bg-orange-100 text-orange-700 border-orange-200' : ''}
                                    ${type.OwnershipType === 'Stock' ? 'bg-purple-100 text-purple-700 border-purple-200' : ''}
                                `}>
                                    {type.OwnershipType || 'Individual'}
                                </span>

                                {editingId === type.TypeID ? (
                                    <div className="w-full flex flex-col gap-2 mt-6">
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="input-field text-sm p-1"
                                            autoFocus
                                        />
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={handleUpdate} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200">Save</button>
                                            <button onClick={() => setEditingId(null)} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mt-4 mb-3 text-blue-500 bg-blue-50 p-3 rounded-full">
                                            <AssetTypeIcon type={type.Name} className="w-8 h-8" />
                                        </div>
                                        <span className="font-medium text-gray-800 mb-2 text-center">{type.Name}</span>
                                        <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEdit(type)}
                                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                Edit
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                onClick={() => handleDelete(type)}
                                                className="text-xs text-red-600 hover:text-red-800 hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {types.length === 0 && !loading && <p>No types found.</p>}
            </div>
        </div>
    )
}
