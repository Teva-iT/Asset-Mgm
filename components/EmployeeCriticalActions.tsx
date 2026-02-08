'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'


export default function EmployeeCriticalActions({ employee }: { employee: any }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteConfirmation, setDeleteConfirmation] = useState('')

    async function handleDelete() {
        setLoading(true)
        try {
            const res = await fetch(`/api/employees/${employee.EmployeeID}`, {
                method: 'DELETE',
            })

            const data = await res.json()

            if (!res.ok) {
                alert(data.error || 'Failed to delete employee')
            } else {
                router.push('/employees')
                router.refresh()
            }
        } catch (err) {
            alert('An error occurred while deleting.')
        } finally {
            setLoading(false)
            setShowDeleteModal(false)
            setDeleteConfirmation('')
        }
    }

    return (
        <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Critical Actions</h3>

            {/* Delete Section - Neutral Style */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex justify-between items-start gap-4">
                <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Delete Employee Record</h4>
                    <p className="text-sm text-gray-500 mb-0 max-w-2xl">
                        Permanently remove this employee record and all associated assignment history.
                        <span className="block mt-1">This action cannot be undone.</span>
                    </p>
                </div>
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="btn px-4 py-2 text-sm font-medium text-red-600 bg-white border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors"
                >
                    Delete Employee
                </button>
            </div>

            {/* Heavy Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-gray-900/75 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-red-100">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <span className="text-red-600">⚠️</span>
                                Delete Employee?
                            </h3>
                            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                                You are about to permanently delete <strong>{employee.FirstName} {employee.LastName}</strong>.
                                <br /><br />
                                All data associated with this employee, including assignment history, will be <strong>permanently erased</strong>.
                            </p>

                            <div className="mb-6">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Type <span className="text-black select-all">DELETE</span> to confirm
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmation}
                                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-mono text-sm"
                                    placeholder="DELETE"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setDeleteConfirmation('')
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteConfirmation !== 'DELETE' || loading}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm min-w-[80px]"
                                >
                                    {loading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
