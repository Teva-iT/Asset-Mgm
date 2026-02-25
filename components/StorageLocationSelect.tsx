'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Check } from 'lucide-react'

interface StorageLocation {
    LocationID: string
    Name: string
    ParentLocationID: string | null
    ParentLocation?: { Name: string }
    SubLocations?: StorageLocation[]
}

interface StorageLocationSelectProps {
    value?: string
    onChange: (value: string) => void
    error?: string
}

export default function StorageLocationSelect({ value, onChange, error }: StorageLocationSelectProps) {
    const [locations, setLocations] = useState<StorageLocation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await fetch('/api/storage-locations')
                if (res.ok) {
                    const data = await res.json()
                    setLocations(data)
                }
            } catch (err) {
                console.error('Failed to fetch locations', err)
            } finally {
                setLoading(false)
            }
        }
        fetchLocations()
    }, [])

    // Organize into hierarchy (simple 2-level for now, or flat list with paths)
    // For dropdown, a flat list with full path is often easiest for users: "IT Room > Cupboard"

    const getFullPath = (loc: StorageLocation): string => {
        if (loc.ParentLocation) {
            return `${loc.ParentLocation.Name} > ${loc.Name}`
        }
        return loc.Name
    }

    const sortedLocations = locations
        .map(l => ({ ...l, fullPath: getFullPath(l) }))
        .sort((a, b) => a.fullPath.localeCompare(b.fullPath))

    return (
        <div className="relative">
            <select
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full p-2 border rounded-md appearance-none bg-white ${error ? 'border-red-500' : 'border-gray-300'}`}
                disabled={loading}
            >
                <option value="">Select Storage Location...</option>
                {sortedLocations.map(loc => (
                    <option key={loc.LocationID} value={loc.LocationID}>
                        {loc.fullPath}
                    </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
            {loading && <div className="absolute right-8 top-3 text-xs text-gray-400">Loading...</div>}
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    )
}
