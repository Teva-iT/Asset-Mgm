import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Asset Manager',
    description: 'Company Asset Management System',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <nav style={{
                    background: 'white',
                    borderBottom: '1px solid #eaeaea',
                    padding: '1rem 2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2rem'
                }}>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>Asset Manager</span>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <a href="/" style={{ textDecoration: 'none', color: '#666' }}>Home</a>
                        <a href="/assets" style={{ textDecoration: 'none', color: '#666' }}>Assets</a>
                        <a href="/assets/types" style={{ textDecoration: 'none', color: '#666' }}>Asset Types</a>
                        <a href="/employees" style={{ textDecoration: 'none', color: '#666' }}>Employees</a>
                        <a href="/reports" style={{ textDecoration: 'none', color: '#666' }}>Reports</a>
                    </div>
                </nav>
                {children}
            </body>
        </html>
    )
}
