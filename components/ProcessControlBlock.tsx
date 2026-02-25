import { useState } from 'react'

export interface ProcessControlState {
    sectionDueDate: string
    forwardingDeadline: string
    executionConfirmationDate: string
    deactivationDate: string
}

import ModernDatePicker from './ModernDatePicker'

interface Props {
    state: ProcessControlState
    onChange: (state: ProcessControlState) => void
}

export default function ProcessControlBlock({ state, onChange }: Props) {

    const handleChange = (field: keyof ProcessControlState, value: string) => {
        onChange({ ...state, [field]: value })
    }

    return (
        <div className="card shadow-sm border border-gray-200 mt-6 bg-gray-50/50">
            <h2 className="text-xl font-bold bg-slate-100 -mx-6 -mt-6 p-4 border-b border-slate-200 rounded-t-xl text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                6. Process Control / Dates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Section due date</label>
                    <ModernDatePicker
                        value={state.sectionDueDate}
                        onChange={(e: any) => handleChange('sectionDueDate', e.target.value)}
                        className="w-full text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Forwarding deadline</label>
                    <ModernDatePicker
                        value={state.forwardingDeadline}
                        onChange={(e: any) => handleChange('forwardingDeadline', e.target.value)}
                        className="w-full text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Execution confirm date</label>
                    <ModernDatePicker
                        value={state.executionConfirmationDate}
                        onChange={(e: any) => handleChange('executionConfirmationDate', e.target.value)}
                        className="w-full text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Deactivation Date</label>
                    <ModernDatePicker
                        value={state.deactivationDate}
                        onChange={(e: any) => handleChange('deactivationDate', e.target.value)}
                        className="w-full text-sm"
                    />
                </div>

            </div>
        </div>
    )
}
