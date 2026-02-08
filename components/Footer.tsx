export default function Footer() {
    return (
        <footer style={{
            marginTop: 'auto',
            padding: '2rem',
            borderTop: '1px solid #eaeaea',
            backgroundColor: '#f9fafb',
            color: '#6b7280',
            textAlign: 'center',
            fontSize: '0.875rem'
        }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <p>&copy; {new Date().getFullYear()} Asset Manager. All rights reserved.</p>

                <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                    Developed by Mahan Zadeghi for Teva-Mepha · February 2026
                </p>

                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <a href="/support" className="hover:text-gray-900">Support</a>
                </div>
            </div>
        </footer>
    )
}
