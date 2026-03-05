'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function NavBar({ user }: { user?: any }) {
    const pathname = usePathname()

    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const links = [
        { name: 'Home', href: '/' },
        { name: 'Asset Management', href: '/assets' },
        { name: 'Warranties', href: '/warranties' },
        { name: 'Licenses', href: '/licenses' },
        {
            name: 'Service Requests', href: '#', subItems: [
                { name: 'Hardware Requests', href: '/admin/requests' },
                { name: 'Access Requests', href: '/access-requests' }
            ]
        },
        { name: 'IT Inventory', href: '/inventory' },
        { name: 'Employees', href: '/employees' },
        {
            name: 'Employee Lifecycle', href: '#', subItems: [
                { name: 'Onboarding', href: '/onboarding' },
                { name: 'Offboarding', href: '/offboarding/checklists' }
            ]
        },
        { name: 'Admin Users', href: '/admin/users' },
        { name: 'AD Compare', href: '/admin/ad-group-compare' },
        { name: 'Reports', href: '/reports' },
    ]

    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const navRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (navRef.current && !navRef.current.contains(event.target as Node)) {
                setOpenDropdown(null)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    if (pathname === '/login' || !user) return null

    return (
        <>
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-6" ref={navRef}>
                {links.map(link => {
                    const hasSubItems = link.subItems && link.subItems.length > 0;
                    const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href)) || (hasSubItems && link.subItems!.some(sub => pathname.startsWith(sub.href)))

                    if (hasSubItems) {
                        return (
                            <div key={link.name} className="relative group">
                                <button
                                    onClick={() => setOpenDropdown(openDropdown === link.name ? null : link.name)}
                                    className={`
                                        flex items-center gap-1 text-sm font-semibold transition-colors duration-100 px-3 py-2 rounded-md
                                        ${isActive || openDropdown === link.name
                                            ? 'text-blue-600 bg-blue-50'
                                            : 'text-gray-600 hover:text-black hover:bg-gray-100'}
                                    `}
                                >
                                    {link.name}
                                    <ChevronDown className={`h-4 w-4 transition-transform ${openDropdown === link.name ? 'rotate-180' : ''}`} />
                                </button>

                                {openDropdown === link.name && (
                                    <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-in fade-in zoom-in-95">
                                        <div className="py-1">
                                            {link.subItems!.map(sub => {
                                                const isSubActive = pathname.startsWith(sub.href)
                                                return (
                                                    <Link
                                                        key={sub.name}
                                                        href={sub.href}
                                                        onClick={() => setOpenDropdown(null)}
                                                        className={`block px-4 py-2 text-sm ${isSubActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}`}
                                                    >
                                                        {sub.name}
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    }

                    return (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={`
                            text-sm font-semibold transition-colors duration-100 px-3 py-2 rounded-md whitespace-nowrap
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
                        const hasSubItems = link.subItems && link.subItems.length > 0;
                        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href)) || (hasSubItems && link.subItems!.some(sub => pathname.startsWith(sub.href)))

                        if (hasSubItems) {
                            return (
                                <div key={link.name} className="flex flex-col gap-1">
                                    <div className="text-sm font-bold text-gray-400 uppercase tracking-wider px-4 pt-4 pb-1">
                                        {link.name}
                                    </div>
                                    {link.subItems!.map(sub => {
                                        const isSubActive = pathname.startsWith(sub.href)
                                        return (
                                            <Link
                                                key={sub.name}
                                                href={sub.href}
                                                onClick={() => setIsMenuOpen(false)}
                                                className={`
                                                    text-base font-medium transition-colors duration-100 px-6 py-2 rounded-md block
                                                    ${isSubActive
                                                        ? 'text-blue-600 bg-blue-50'
                                                        : 'text-gray-600 hover:text-black hover:bg-gray-50'}
                                                `}
                                            >
                                                {sub.name}
                                            </Link>
                                        )
                                    })}
                                </div>
                            )
                        }

                        return (
                            <Link
                                key={link.name}
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
