
'use client'

import { useRouter } from 'next/navigation'

interface LogoutButtonProps {
    customClass?: string
}

export default function LogoutButton({ customClass }: LogoutButtonProps) {
    const router = useRouter()

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' })
        router.push('/login')
        router.refresh()
    }

    return (
        <button
            onClick={handleLogout}
            className={customClass || "text-gray-600 hover:text-red-500 font-medium transition-colors"}
            style={customClass ? {} : { fontSize: '0.95rem' }}
        >
            Log Out
        </button>
    )
}
