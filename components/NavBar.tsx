'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavBar() {
    const pathname = usePathname()

    const links = [
        { name: 'Home', href: '/' },
        { name: 'Asset Management', href: '/assets' },
        { name: 'Asset Types', href: '/assets/types' },
        { name: 'Employees', href: '/employees' },
        { name: 'Admin Users', href: '/admin/users' },
        { name: 'Asset Scheduling', href: '/asset-delivery-return' },
        { name: 'IT Inventory', href: '/inventory' },
        { name: 'Reports', href: '/reports' },
    ]

    return (
        <div className="flex items-center gap-6">
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
    )
}
