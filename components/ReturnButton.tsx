'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ReturnButton({ assignmentId, assetId }: { assignmentId: string, assetId: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleReturn() {
        if (!confirm('Confirm return of this asset?')) return

        setLoading(true)
        try {
            const res = await fetch(`/api/assignments/${assignmentId}/return`, {
                method: 'PUT'
            })
            if (res.ok) {
                router.refresh()
            } else {
                alert('Failed to return asset')
            }
        } catch (e) {
            alert('Error processing return')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleReturn}
            disabled={loading}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
        >
            {loading ? 'Processing...' : 'Return Asset'}
        </button>
    )
}
