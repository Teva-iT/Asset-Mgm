'use client'

import { useState, useEffect } from 'react'
import { Pencil, Trash2, Plus, X, Save } from 'lucide-react'

interface StorageLocation {
    LocationID: string
    Name: string
    Description: string | null
    ParentLocationID: string | null
    ParentLocation?: { Name: string }
    _count?: { Assets: number, SubLocations?: number }
}

export default function StorageLocationsPage() {
    const [locations, setLocations] = useState<StorageLocation[]>([])
    const [loading, setLoading] = useState(true)

    // Create State
    const [newName, setNewName] = useState('')
    const [newParent, setNewParent] = useState('')
    const [newDescription, setNewDescription] = useState('')

    // Edit State
    const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null)
    const [editName, setEditName] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [editParent, setEditParent] = useState('')

    const fetchLocations = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/storage-locations')
            if (res.ok) {
                const data = await res.json()
                console.log('Frontend Storage Page: Fetched locations:', data)
                setLocations(data)
            } else {
                console.error('Frontend Storage Page: Fetch failed', res.status)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLocations()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newName) return

        try {
            const res = await fetch('/api/storage-locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    Name: newName,
                    Description: newDescription,
                    ParentLocationID: newParent || null
                })
            })

            if (res.ok) {
                setNewName('')
                setNewDescription('')
                setNewParent('')
                fetchLocations()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const startEdit = (loc: StorageLocation) => {
        setEditingLocation(loc)
        setEditName(loc.Name)
        setEditDescription(loc.Description || '')
        setEditParent(loc.ParentLocationID || '')
    }

    const cancelEdit = () => {
        setEditingLocation(null)
        setEditName('')
        setEditDescription('')
        setEditParent('')
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingLocation || !editName) return

        try {
            const res = await fetch('/api/storage-locations', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    LocationID: editingLocation.LocationID,
                    Name: editName,
                    Description: editDescription,
                    ParentLocationID: editParent || null
                })
            })

            if (res.ok) {
                cancelEdit()
                fetchLocations()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return

        try {
            const res = await fetch(`/api/storage-locations?id=${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                fetchLocations()
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to delete')
            }
        } catch (error) {
            console.error(error)
            alert('Failed to delete')
        }
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Storage Locations</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="card h-fit">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-600" />
                        Add New Location
                    </h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                                className="input-field"
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                placeholder="e.g. Server Room"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Parent Location</label>
                            <select
                                className="select-field"
                                value={newParent}
                                onChange={e => setNewParent(e.target.value)}
                            >
                                <option value="">None (Top Level)</option>
                                {locations.map(l => (
                                    <option key={l.LocationID} value={l.LocationID}>{l.Name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Description</label>
                            <textarea
                                className="textarea-field"
                                value={newDescription}
                                onChange={e => setNewDescription(e.target.value)}
                                placeholder="Optional details..."
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-full">Create Location</button>
                    </form>
                </div>

                {/* List */}
                <div className="md:col-span-2">
                    <div className="card">
                        <h2 className="text-lg font-semibold mb-4">Existing Locations</h2>
                        {loading ? (
                            <p>Loading...</p>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b text-sm text-gray-500">
                                        <th className="py-2">Name</th>
                                        <th className="py-2">Parent</th>
                                        <th className="py-2">Description</th>
                                        <th className="py-2 text-center">Assets / Subs</th>
                                        <th className="py-2 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {locations.map(loc => (
                                        <tr key={loc.LocationID} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="py-3 font-medium">{loc.Name}</td>
                                            <td className="py-3 text-gray-600">{loc.ParentLocation?.Name || '-'}</td>
                                            <td className="py-3 text-gray-500 text-sm">{loc.Description || '-'}</td>
                                            <td className="py-3 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full" title="Assets">
                                                        {loc._count?.Assets || 0}
                                                    </span>
                                                    {/* If we had sublocation count, display here too */}
                                                </div>
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => startEdit(loc)}
                                                        className="text-gray-500 hover:text-blue-600 transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(loc.LocationID, loc.Name)}
                                                        className="text-gray-500 hover:text-red-600 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {locations.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-4 text-center text-gray-500">No locations found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingLocation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Edit Location</h3>
                            <button onClick={cancelEdit} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    className="input-field"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Parent Location</label>
                                <select
                                    className="select-field"
                                    value={editParent}
                                    onChange={e => setEditParent(e.target.value)}
                                >
                                    <option value="">None (Top Level)</option>
                                    {locations
                                        .filter(l => l.LocationID !== editingLocation.LocationID) // Prevent self-parenting
                                        .map(l => (
                                            <option key={l.LocationID} value={l.LocationID}>{l.Name}</option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    className="textarea-field"
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={cancelEdit} className="btn btn-secondary">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
