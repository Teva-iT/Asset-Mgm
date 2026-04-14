'use client'

import { useState } from 'react'
import { ShieldAlert, Search, RefreshCw, CheckCircle2, XCircle, ServerCrash } from 'lucide-react'

type DiagnosticStep = {
    step: string
    status: 'ok' | 'error'
    detail: Record<string, unknown>
}

type DiagnosticResponse = {
    overallStatus: 'ok' | 'error'
    message: string
    steps: DiagnosticStep[]
}

function formatStepTitle(step: string) {
    if (step === 'config') return 'Configuration'
    if (step === 'dns') return 'DNS Lookup'
    if (step === 'tcp') return 'TCP Connection'
    if (step === 'ldap-bind') return 'LDAP Bind'
    if (step === 'ldap-search') return 'LDAP Search'
    return step
}

export default function ADDiagnosticsPage() {
    const [query, setQuery] = useState('Ayoub.Bousbaa@mepha.ch')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<DiagnosticResponse | null>(null)
    const [error, setError] = useState('')

    async function runDiagnostics() {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`/api/ad/diagnostics?q=${encodeURIComponent(query)}`)
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.error || data?.message || 'Diagnostics failed')
            }
            setResult(data)
        } catch (err: any) {
            setResult(null)
            setError(err.message || 'Diagnostics failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/60 p-6">
            <div className="mx-auto max-w-5xl space-y-6">
                <div className="rounded-3xl border border-blue-100 bg-white/90 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
                                <ShieldAlert className="h-3.5 w-3.5" />
                                Active Directory Diagnostics
                            </div>
                            <h1 className="mt-4 text-3xl font-bold text-slate-900">Check AD connectivity from the app</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                This page shows exactly where the chain breaks: configuration, DNS, TCP reachability, LDAP bind, and optional LDAP search.
                            </p>
                        </div>

                        <div className="flex w-full flex-col gap-3 lg:w-[420px]">
                            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Search query</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <input
                                        value={query}
                                        onChange={(event) => setQuery(event.target.value)}
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Search AD user..."
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={runDiagnostics}
                                    disabled={loading}
                                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    Run
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {result && (
                    <>
                        <div className={`rounded-2xl border p-4 ${
                            result.overallStatus === 'ok'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-amber-200 bg-amber-50 text-amber-800'
                        }`}>
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                {result.overallStatus === 'ok'
                                    ? <CheckCircle2 className="h-4 w-4" />
                                    : <ServerCrash className="h-4 w-4" />}
                                {result.message}
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {result.steps.map((step) => (
                                <div key={step.step} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-lg font-semibold text-slate-900">{formatStepTitle(step.step)}</h2>
                                            <p className="mt-1 text-sm text-slate-500">Technical output from the app environment.</p>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                                            step.status === 'ok'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : 'bg-red-50 text-red-700'
                                        }`}>
                                            {step.status === 'ok' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                            {step.status.toUpperCase()}
                                        </span>
                                    </div>

                                    <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-100">
                                        {JSON.stringify(step.detail, null, 2)}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
