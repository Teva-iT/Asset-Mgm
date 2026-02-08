import Link from 'next/link'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import ReturnButton from '@/components/ReturnButton'

export const dynamic = 'force-dynamic'

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
    let employee = await prisma.employee.findUnique({
        where: { EmployeeID: params.id },
        include: {
            assignments: {
                include: { Asset: true },
                orderBy: { AssignedDate: 'desc' }
            }
        }
    }).catch(() => null) // Catch invalid UUID error

    if (!employee) {
        employee = await prisma.employee.findUnique({
            where: { Slug: params.id },
            include: {
                assignments: {
                    include: { Asset: true },
                    orderBy: { AssignedDate: 'desc' }
                }
            }
        })
    }

    if (!employee) notFound()

    const activeAssignments = employee.assignments.filter(a => a.Status === 'Active')
    const allAssignments = employee.assignments

    // Generate Initials
    const initials = `${employee.FirstName[0]}${employee.LastName[0]}`.toUpperCase()

    // Status badge styling
    const getStatusBadge = (status: string) => {
        const styles = {
            Active: { bg: '#ecfdf5', color: '#047857' },
            Leaving: { bg: '#fff7ed', color: '#c2410c' },
            Left: { bg: '#f3f4f6', color: '#374151' }
        }
        const style = styles[status as keyof typeof styles] || styles.Active

        return (
            <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: style.bg,
                color: style.color,
                border: '1px solid rgba(0,0,0,0.05)'
            }}>
                {status}
            </span>
        )
    }

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            {/* 1. Header & Actions */}
            {/* 1. Navigation & Header */}
            <div style={{ marginBottom: '1rem' }}>
                <Link
                    href="/employees"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#6b7280',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        textDecoration: 'none',
                        marginBottom: '0.5rem'
                    }}
                    className="hover:text-gray-900"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"></path><path d="M12 19l-7-7 7-7"></path></svg>
                    Back to Employees
                </Link>
            </div>

            <div style={{
                marginBottom: '1.5rem',
                backgroundColor: 'white',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                {/* Subtle Header Strip */}
                <div style={{
                    height: '8px',
                    background: 'linear-gradient(to right, #3b82f6, #8b5cf6)'
                }}></div>

                <div style={{ padding: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
                    {/* Profile Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: '#f3f4f6',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            border: '1px solid #e5e7eb'
                        }}>
                            {initials}
                        </div>
                        <div>
                            {getStatusBadge(employee.Status)}
                        </div>
                        <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontWeight: 500 }}>{employee.Department}</span>
                            <span style={{ color: '#d1d5db' }}>•</span>
                            <span>{employee.Email}</span>
                            <span style={{ color: '#d1d5db' }}>•</span>
                            <Link href={`/employees/${employee.EmployeeID}/edit`} style={{ fontSize: '0.9rem', color: '#2563eb', textDecoration: 'none', fontWeight: 500 }} className="hover:underline">
                                Edit Employee
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Main Grid Layout - Increased Density */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Left Column: Details & Dates */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Employment Dates Card - Integrated Status */}
                    <div className="card" style={{ padding: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6b7280' }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                Timeline & Status
                            </h2>
                            {/* Status Badge with Tooltip */}
                            <div title={employee.Status === 'Active' ? "Employee is currently active and can receive assets." : "Employee is leaving or has left."}>
                                {getStatusBadge(employee.Status)}
                            </div>
                        </div>

                        <div style={{ borderLeft: '2px solid #e5e7eb', paddingLeft: '1.25rem', marginLeft: '0.4rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Start Date - Neutral */}
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', left: '-27px', top: '4px', width: '12px', height: '12px',
                                    borderRadius: '50%', backgroundColor: '#9ca3af', border: '2px solid white', boxShadow: '0 0 0 1px #e5e7eb'
                                }}></div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.1rem', fontWeight: 500 }}>Joined Team</div>
                                <div style={{ color: '#374151', fontWeight: 600, fontSize: '0.95rem' }}>
                                    {new Date(employee.StartDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>

                            {/* End Date - Emphasized if set */}
                            <div style={{ position: 'relative' }}>
                                <div style={{
                                    position: 'absolute', left: '-27px', top: '4px', width: '12px', height: '12px',
                                    borderRadius: '50%',
                                    backgroundColor: employee.EndDate ? '#ef4444' : '#d1d5db',
                                    border: '2px solid white',
                                    boxShadow: '0 0 0 1px #e5e7eb'
                                }}></div>

                                {employee.EndDate ? (
                                    <>
                                        <div style={{ fontSize: '0.8rem', color: '#dc2626', marginBottom: '0.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            Departure Scheduled
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: '#b91c1c' }}>
                                            {new Date(employee.EndDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', backgroundColor: '#fef2f2', color: '#b91c1c', padding: '0.5rem', borderRadius: '6px', border: '1px solid #fecaca' }}>
                                            Assets must be returned by this date.
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.1rem', fontWeight: 500 }}>Future Departure</div>
                                        <div style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>Currently Active</div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Assets */}
                <div style={{ minWidth: '0' }}> {/* minWidth 0 prevents table overflow in grid */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '20px', height: '20px', color: '#6366f1' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Asset Inventory
                            </h2>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#f3f4f6', color: '#4b5563', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                                {activeAssignments.length} Active
                            </span>
                        </div>

                        <div>
                            {allAssignments.length === 0 ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '48px', height: '48px', marginBottom: '1rem', opacity: 0.2 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                    <p style={{ fontSize: '0.95rem', fontWeight: 500, marginBottom: '1.5rem' }}>This employee currently has no assigned assets.</p>
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <span style={{ fontSize: '0.85rem' }}>To assign assets, go to </span>
                                        <Link href="/assets" style={{ fontSize: '0.85rem', color: '#6366f1', textDecoration: 'underline' }}>Assets</Link>
                                        <span style={{ fontSize: '0.85rem' }}> and select an available item.</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th style={{ paddingLeft: '1.5rem' }}>Asset Detail</th>
                                                <th>Serial</th>
                                                <th>Timeline</th>
                                                <th style={{ paddingRight: '1.5rem' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allAssignments.map(assignment => {
                                                const isOverdue = assignment.ExpectedReturnDate &&
                                                    new Date(assignment.ExpectedReturnDate) < new Date() &&
                                                    !assignment.ActualReturnDate

                                                return (
                                                    <tr key={assignment.AssignmentID}>
                                                        <td style={{ paddingLeft: '1.5rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                <div style={{
                                                                    width: '32px', height: '32px', borderRadius: '8px',
                                                                    backgroundColor: assignment.Status === 'Active' ? '#e0e7ff' : '#f3f4f6',
                                                                    color: assignment.Status === 'Active' ? '#4338ca' : '#6b7280',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: '0.75rem', fontWeight: 700
                                                                }}>
                                                                    {assignment.Asset.AssetName.substring(0, 2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: 600, color: '#111827' }}>{assignment.Asset.AssetName}</div>
                                                                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{assignment.Asset.AssetType}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <code style={{ fontSize: '0.8rem', fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '0.2rem 0.4rem', borderRadius: '4px', color: '#4b5563' }}>
                                                                {assignment.Asset.SerialNumber}
                                                            </code>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.9rem' }}>
                                                                <span style={{ color: '#111827', fontWeight: 500 }}>
                                                                    {new Date(assignment.AssignedDate).toLocaleDateString()}
                                                                </span>
                                                                {assignment.ExpectedReturnDate ? (
                                                                    <span style={{ fontSize: '0.8rem', marginTop: '0.1rem', color: isOverdue ? '#dc2626' : '#9ca3af', fontWeight: isOverdue ? 700 : 400 }}>
                                                                        Due: {new Date(assignment.ExpectedReturnDate).toLocaleDateString()}
                                                                        {isOverdue && ' warning'}
                                                                    </span>
                                                                ) : (
                                                                    <span style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.1rem' }}>No return date</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td style={{ paddingRight: '1.5rem' }}>
                                                            {assignment.Status === 'Active' ? (
                                                                isOverdue ? (
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                        <span className="badge badge-lost">Overdue</span>
                                                                        <ReturnButton
                                                                            assignmentId={assignment.AssignmentID}
                                                                            assetId={assignment.AssetID}
                                                                        />
                                                                    </div>
                                                                ) : (
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                                                        <span className="badge badge-available">Active</span>
                                                                        <ReturnButton
                                                                            assignmentId={assignment.AssignmentID}
                                                                            assetId={assignment.AssetID}
                                                                        />
                                                                    </div>
                                                                )
                                                            ) : (
                                                                <span className="badge badge-returned">Returned</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}

