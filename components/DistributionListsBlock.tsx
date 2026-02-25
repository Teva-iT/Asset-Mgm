import { useEffect, useState } from 'react'

export interface DistributionList {
    id: string
    name: string
    description?: string
}

export interface DistributionListsState {
    selectedLists: { [id: string]: boolean }
    specificPersonalLists: string // Free text for specific personal distribution lists
}

interface Props {
    state: DistributionListsState
    onChange: (state: DistributionListsState) => void
}

export default function DistributionListsBlock({ state, onChange }: Props) {
    const [lists, setLists] = useState<DistributionList[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchLists = async () => {
            try {
                const res = await fetch('/api/distribution-lists')
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Failed to fetch distribution lists')
                setLists(data.distribution_lists || [])
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchLists()
    }, [])

    const handleCheckboxChange = (id: string, checked: boolean) => {
        onChange({
            ...state,
            selectedLists: {
                ...state.selectedLists,
                [id]: checked
            }
        })
    }

    const handleFreeTextChange = (text: string) => {
        onChange({
            ...state,
            specificPersonalLists: text
        })
    }

    return (
        <div className="card shadow-sm border border-gray-200 mt-6">
            <h2 className="text-xl font-bold bg-teal-50 -mx-6 -mt-6 p-4 border-b border-teal-100 rounded-t-xl text-teal-900 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                4. Public / Personal Distribution Lists
            </h2>

            {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

            <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">Select the standard distribution lists to grant access to:</p>
                {loading ? (
                    <div className="text-sm text-gray-400 animate-pulse">Loading dynamic distribution lists from database...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {lists.map(list => (
                            <label key={list.id} className={`flex items-start gap-3 p-3 rounded border hover:border-teal-300 transition-colors cursor-pointer ${state.selectedLists[list.id] ? 'bg-teal-50 border-teal-200' : 'bg-white border-gray-200'}`}>
                                <input
                                    type="checkbox"
                                    checked={!!state.selectedLists[list.id]}
                                    onChange={(e) => handleCheckboxChange(list.id, e.target.checked)}
                                    className="mt-1 w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                                />
                                <div>
                                    <div className="text-sm font-medium text-gray-800">{list.name}</div>
                                    {list.description && <div className="text-xs text-gray-500 mt-0.5">{list.description}</div>}
                                </div>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            <div className="border-t border-gray-100 pt-6">
                <label className="form-label text-gray-700">Specific Personal Distribution Lists <span className="text-gray-400 font-normal text-xs ml-1">(Free Text)</span></label>
                <textarea
                    value={state.specificPersonalLists}
                    onChange={e => handleFreeTextChange(e.target.value)}
                    className="form-input w-full resize-none"
                    rows={3}
                    placeholder="Enter any other specific distribution lists here..."
                />
            </div>
        </div>
    )
}
