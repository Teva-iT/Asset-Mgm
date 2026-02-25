import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
    title: 'Asset Manager',
    description: 'Company Asset Management System',
}

import { Suspense } from 'react'
import UserProfileWrapper from '@/components/UserProfileWrapper'
import { getCurrentUser } from '@/lib/auth'

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()

    return (
        <html lang="en" className="h-full">
            <body className="flex flex-col min-h-screen bg-gray-50">
                <nav className="bg-white border-b border-gray-200 px-4 md:px-6 h-16 flex items-center justify-between sticky top-0 z-50 shadow-sm relative">
                    {/* Left: Logo */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                        <img src="/logo.jpg" alt="Logo" className="h-8 w-auto object-contain" />
                        <span className="font-bold text-gray-800 md:hidden lg:block hidden">AssetMgr</span>
                    </div>

                    {/* Center: Navigation */}
                    <div className="flex-1 flex justify-end md:justify-center">
                        <NavBar user={user} />
                    </div>

                    {/* Right: User Profile */}
                    <div className="flex-shrink-0 md:w-48 ml-4 flex justify-end">
                        <Suspense fallback={<div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />}>
                            <UserProfileWrapper />
                        </Suspense>
                    </div>
                </nav>
                <main className="flex-grow pt-4 pb-8 px-4 md:px-0">
                    {children}
                </main>
                <Footer />
            </body>
        </html>
    )
}
