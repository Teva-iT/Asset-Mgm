'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function NavBar({ user }: { user?: any }) {
    const pathname = usePathname()

    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const links = [
        { name: 'Home', href: '/' },
        { name: 'Asset Management', href: '/assets' },
        { name: 'IT Inventory', href: '/inventory' },
        { name: 'Employees', href: '/employees' },
        { name: 'Admin Users', href: '/admin/users' },
        { name: 'Reports', href: '/reports' },
    ]

    if (pathname === '/login' || !user) return null

    return (
        <>
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
                {links.map(link => {
                    const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`
                            text-sm font-semibold transition-colors duration-100 px-3 py-2 rounded-md
                            ${isActive
                                    ? 'text-blue-600 bg-blue-50'
                                    : 'text-gray-600 hover:text-black hover:bg-gray-100'}
                        `}
                        >
                            {link.name}
                        </Link>
                    )
                })}
            </div>

            {/* Mobile Hamburger Button */}
            <button
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-lg py-4 px-6 flex flex-col gap-2 md:hidden z-50 animate-in fade-in slide-in-from-top-4">
                    {links.map(link => {
                        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className={`
                                    text-base font-semibold transition-colors duration-100 px-4 py-3 rounded-md block
                                    ${isActive
                                        ? 'text-blue-600 bg-blue-50'
                                        : 'text-gray-600 hover:text-black hover:bg-gray-100'}
                                `}
                            >
                                {link.name}
                            </Link>
                        )
                    })}
                </div>
            )}
        </>
    )
}
