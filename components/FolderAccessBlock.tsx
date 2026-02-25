import { useState } from 'react'

export interface FolderRow {
    id: string
    fNumber: string
    fName: string
    accessType: 'Read' | 'Write'
    refPerson: string
}

export interface FolderAccessState {
    folders: FolderRow[]
}

interface Props {
    state: FolderAccessState
    onChange: (state: FolderAccessState) => void
}

export default function FolderAccessBlock({ state, onChange }: Props) {

    const addFolder = () => {
        onChange({
            ...state,
            folders: [
                ...(state.folders || []),
                {
                    id: Math.random().toString(36).substr(2, 9),
                    fNumber: '',
                    fName: '',
                    accessType: 'Read',
                    refPerson: ''
                }
            ]
        })
    }

    const removeFolder = (id: string) => {
        onChange({
            ...state,
            folders: (state.folders || []).filter(f => f.id !== id)
        })
    }

    const handleChange = (id: string, field: keyof FolderRow, value: string) => {
        onChange({
            ...state,
            folders: (state.folders || []).map(f => f.id === id ? { ...f, [field]: value } : f)
        })
    }

    return (
        <div className="card shadow-sm border border-gray-200 mt-6">
            <h2 className="text-xl font-bold bg-indigo-50 -mx-6 -mt-6 p-4 border-b border-indigo-100 rounded-t-xl text-indigo-900 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                    3. Folder Access (Detailed)
                </div>
                <button
                    onClick={addFolder}
                    className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    Add Folder
                </button>
            </h2>

            <div className="space-y-4">
                {(!state.folders || state.folders.length === 0) ? (
                    <div className="text-sm text-gray-500 italic p-4 text-center border-2 border-dashed border-gray-200 rounded">
                        No specific folder access requested. Click "Add Folder" to request access.
                    </div>
                ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700">
                                <tr>
                                    <th className="p-3 font-semibold">Folder Number</th>
                                    <th className="p-3 font-semibold">Folder Name / Path</th>
                                    <th className="p-3 font-semibold">Function Specific Access <span className="text-red-500">*</span></th>
                                    <th className="p-3 font-semibold">Reference Person</th>
                                    <th className="p-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {state.folders.map(folder => (
                                    <tr key={folder.id} className="bg-white hover:bg-indigo-50/30 transition-colors">
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                placeholder="e.g. F-1234"
                                                value={folder.fNumber}
                                                onChange={e => handleChange(folder.id, 'fNumber', e.target.value)}
                                                className="w-full text-sm p-1.5 border border-gray-300 rounded focus:border-indigo-500 outline-none"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                placeholder="e.g. \\server\department\..."
                                                value={folder.fName}
                                                onChange={e => handleChange(folder.id, 'fName', e.target.value)}
                                                className="w-full text-sm p-1.5 border border-gray-300 rounded focus:border-indigo-500 outline-none"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <select
                                                value={folder.accessType}
                                                onChange={e => handleChange(folder.id, 'accessType', e.target.value as any)}
                                                className="w-full text-sm p-1.5 border border-gray-300 rounded focus:border-indigo-500 outline-none bg-white"
                                            >
                                                <option value="Read">R (Read)</option>
                                                <option value="Write">W (Write)</option>
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="text"
                                                placeholder="Name"
                                                value={folder.refPerson}
                                                onChange={e => handleChange(folder.id, 'refPerson', e.target.value)}
                                                className="w-full text-sm p-1.5 border border-gray-300 rounded focus:border-indigo-500 outline-none"
                                            />
                                        </td>
                                        <td className="p-2 text-center">
                                            <button
                                                onClick={() => removeFolder(folder.id)}
                                                className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                                title="Remove"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
