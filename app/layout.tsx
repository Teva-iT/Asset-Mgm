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
// ...

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // const user = await getCurrentUser() // Removed blocking call

    return (
        <html lang="en" className="h-full">
            <body className="flex flex-col min-h-screen bg-gray-50">
                <nav className="bg-white border-b border-gray-200 px-6 h-16 flex items-center justify-between sticky top-0 z-50 shadow-sm">
                    {/* Left: Logo */}
                    <div className="flex-shrink-0 w-48">
                        <img src="/logo.jpg" alt="Logo" className="h-8 object-contain" />
                    </div>

                    {/* Center: Navigation */}
                    <div className="flex-1 flex justify-center">
                        <NavBar />
                    </div>

                    {/* Right: User Profile */}
                    <div className="flex-shrink-0 w-48 flex justify-end">
                        <Suspense fallback={<div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />}>
                            <UserProfileWrapper />
                        </Suspense>
                    </div>
                </nav>
                <main className="flex-grow">
                    {children}
                </main>
                <Footer />
            </body>
        </html>
    )
}
