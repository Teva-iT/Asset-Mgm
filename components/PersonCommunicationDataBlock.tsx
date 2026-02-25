export interface SharedMailbox {
    address: string
    accessType: 'Full' | 'SendAs' | 'ReadOnly' | ''
    justification: string
}

export interface PersonCommunicationState {
    sharedMailboxes: SharedMailbox[]
}

interface Props {
    state: PersonCommunicationState
    onChange: (state: PersonCommunicationState) => void
}

export default function PersonCommunicationDataBlock({ state, onChange }: Props) {

    const addMailbox = () => {
        onChange({
            ...state,
            sharedMailboxes: [...state.sharedMailboxes, { address: '', accessType: '', justification: '' }]
        })
    }

    const updateMailbox = (index: number, field: keyof SharedMailbox, value: string) => {
        const newMailboxes = [...state.sharedMailboxes]
        newMailboxes[index] = { ...newMailboxes[index], [field]: value }
        onChange({ ...state, sharedMailboxes: newMailboxes })
    }

    const removeMailbox = (index: number) => {
        const newMailboxes = [...state.sharedMailboxes]
        newMailboxes.splice(index, 1)
        onChange({ ...state, sharedMailboxes: newMailboxes })
    }

    return (
        <div className="card shadow-sm border border-gray-200 mt-6">
            <div className="flex justify-between items-center bg-green-50 -mx-6 -mt-6 p-4 border-b border-green-100 rounded-t-xl mb-6">
                <h2 className="text-xl font-bold text-green-900 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    1C. Shared Mailbox Access
                </h2>
                <button
                    type="button"
                    onClick={addMailbox}
                    className="text-sm bg-white border border-green-300 text-green-700 hover:bg-green-50 px-3 py-1.5 rounded shadow-sm transition-colors flex items-center gap-1"
                >
                    <span className="text-lg leading-none">+</span> Add Mailbox
                </button>
            </div>

            <p className="text-sm text-gray-500 mb-6">
                Add required shared mailboxes below. (Note: Personal emails and formats are managed directly via Employee Master Data).
            </p>

            <div className="space-y-4">
                {state.sharedMailboxes.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                        No shared mailboxes requested. Click "Add Mailbox" to add one.
                    </div>
                ) : (
                    state.sharedMailboxes.map((mailbox, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-100 relative group">
                            <div className="flex-1 w-full relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Mailbox Address <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={mailbox.address}
                                    onChange={e => updateMailbox(index, 'address', e.target.value)}
                                    placeholder="e.g. info@company.com"
                                    className="form-input w-full text-sm"
                                    required
                                />
                            </div>

                            <div className="w-full md:w-48 shrink-0">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Access Type <span className="text-red-500">*</span></label>
                                <select
                                    value={mailbox.accessType}
                                    onChange={e => updateMailbox(index, 'accessType', e.target.value)}
                                    className="form-input w-full text-sm"
                                    required
                                >
                                    <option value="">Select Type...</option>
                                    <option value="Full">Full Access</option>
                                    <option value="SendAs">Send As</option>
                                    <option value="SendOnBehalf">Send on Behalf</option>
                                    <option value="ReadOnly">Read Only</option>
                                </select>
                            </div>

                            <div className="flex-1 w-full">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Justification (Optional)</label>
                                <input
                                    type="text"
                                    value={mailbox.justification}
                                    onChange={e => updateMailbox(index, 'justification', e.target.value)}
                                    placeholder="Why is it needed?"
                                    className="form-input w-full text-sm"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => removeMailbox(index)}
                                className="absolute top-2 right-2 md:static md:mt-6 text-gray-400 hover:text-red-600 transition-colors bg-white md:bg-transparent rounded-full p-1"
                                title="Remove Mailbox"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
