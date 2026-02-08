'use client'

import { useState, useRef, useEffect } from 'react'
import LogoutButton from './LogoutButton'

interface UserProfileProps {
    user?: {
        username: string
        role: string
        initials: string
    } | null
}

export default function UserProfile({ user }: UserProfileProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    if (!user) return null

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-100 focus:outline-none"
            >
                <div className="flex flex-col items-end text-right hidden md:block">
                    <span className="text-sm font-semibold text-gray-700 leading-tight">{user.username}</span>
                    <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">{user.role}</span>
                </div>

                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md border-2 border-white ring-2 ring-gray-100">
                    {user.initials}
                </div>

                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 transform origin-top-right transition-all">
                    <div className="px-4 py-3 border-b border-gray-50 md:hidden">
                        <p className="text-sm font-semibold text-gray-800">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                    </div>

                    <div className="py-1">
                        <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                            My Profile
                        </a>
                        <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11.536 9.464l-.995.995a1 1 0 01-1.414 0l-.99.99a1 1 0 000 1.415l1 1a1 1 0 001.415 0l4.242-4.242a6 6 0 018.486 8.486A2 2 0 0113 19.5v.5a2 2 0 01-2 2H9a2 2 0 01-2-2v-3.5a2 2 0 01.37-1.3l.63-.63a2.49 2.49 0 011.08-.66l.006-.002A6.03 6.03 0 0121 9a6 6 0 01-1.99-4.32l.06-.06a2 2 0 012.83 2.83z"></path></svg>
                            Change Password
                        </a>
                        <div className="px-4 py-2">
                            <div className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-1">Current Role</div>
                            <div className="text-xs font-medium text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded border border-blue-100">
                                {user.role}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-1 mt-1">
                        <div className="px-2">
                            <LogoutButton customClass="w-full text-left flex items-center gap-2 px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
