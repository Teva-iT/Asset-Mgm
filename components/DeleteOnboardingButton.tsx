'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface DeleteOnboardingButtonProps {
    id: string
    employeeName: string
    isIconOnly?: boolean
}

export default function DeleteOnboardingButton({ id, employeeName, isIconOnly = false }: DeleteOnboardingButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to completely delete the onboarding workflow for ${employeeName}? This action cannot be undone and will also delete any related access and hardware requests.`)) {
            return
        }

        setIsDeleting(true)
        try {
            const res = await fetch(`/api/onboarding/${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                router.push('/onboarding')
                router.refresh()
            } else {
                const data = await res.json()
                alert(`Failed to delete onboarding request: ${data.error}`)
            }
        } catch (error) {
            console.error('Failed to delete onboarding', error)
            alert('An error occurred while deleting.')
        } finally {
            setIsDeleting(false)
        }
    }

    if (isIconOnly) {
        return (
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50 disabled:opacity-50"
                title="Delete Onboarding Request"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        )
    }

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg shadow-sm font-medium text-sm hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
        >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete Workflow'}
        </button>
    )
}
