'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, GitCompare, ShieldAlert, CheckCircle2, X, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

// ─── Types ───────────────────────────────────────────────────────────────────
interface ADUser { username: string; displayName: string; dn?: string }
interface GroupEntry { dn: string; cn: string }
interface CompareResult {
    referenceUser: ADUser; targetUser: ADUser
    shared: GroupEntry[]; missingInTarget: GroupEntry[]; extraInTarget: GroupEntry[]
    referenceGroups: string[]; targetGroups: string[]
}
interface SyncDetail {
    executor: string; fromUser: string; toUser: string; timestamp: string
    groupsAdded: string[]; groupsRemoved: string[]; groupsSkipped: string[]; groupsFailed: string[]
}

// ─── Privileged group detection ───────────────────────────────────────────────
// Groups that grant elevated AD privileges — warn loudly before cloning
const PRIVILEGED_PATTERNS = [
    /domain.admin/i, /schema.admin/i, /enterprise.admin/i,
    /group.policy.creator/i, /dns.admin/i, /backup.operator/i,
    /account.operator/i, /server.operator/i, /print.operator/i,
]
function isPrivileged(cn: string) {
    return PRIVILEGED_PATTERNS.some(p => p.test(cn))
}

// ─── Debounce hook ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
    const [d, setD] = useState(value)
    useEffect(() => { const id = setTimeout(() => setD(value), delay); return () => clearTimeout(id) }, [value, delay])
    return d
}

// ─── UserPicker ───────────────────────────────────────────────────────────────
function UserPicker({ label, value, onSelect }: { label: string; value: ADUser | null; onSelect: (u: ADUser | null) => void }) {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [results, setResults] = useState<ADUser[]>([])
    const [loading, setLoading] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const dq = useDebounce(query, 400)

    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
        document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
    }, [])

    useEffect(() => {
        if (!dq.trim() || dq.length < 2) { setResults([]); return }
        setLoading(true)
        fetch(`/api/ad/users/search?q=${encodeURIComponent(dq)}`)
            .then(r => r.json()).then(d => setResults(Array.isArray(d) ? d : []))
            .catch(() => setResults([])).finally(() => setLoading(false))
    }, [dq])

    function select(u: ADUser) { onSelect(u); setQuery(''); setOpen(false); setResults([]) }

    return (
        <div ref={ref} className="flex-1 min-w-52">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</div>
            {value ? (
                <div className="input-field flex items-center gap-2 bg-blue-50 border-blue-300">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">{value.displayName?.[0] || '?'}</div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-blue-800 truncate">{value.displayName}</div>
                        <div className="text-xs text-blue-500">{value.username}</div>
                    </div>
                    <button onClick={() => onSelect(null)} className="text-blue-400 hover:text-blue-700"><X className="w-4 h-4" /></button>
                </div>
            ) : (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input className="input-field pl-9" placeholder="Search AD user..." value={query}
                        onChange={e => { setQuery(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} />
                    {open && query.length >= 2 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                            {loading ? <div className="px-4 py-5 text-center text-sm text-gray-400">Searching AD...</div>
                                : results.length === 0 ? <div className="px-4 py-5 text-center text-sm text-gray-400">No results for "{query}"</div>
                                    : results.map(u => (
                                        <button key={u.username} type="button" onClick={() => select(u)}
                                            className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors">
                                            <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold shrink-0">{u.displayName?.[0] || '?'}</div>
                                            <div>
                                                <div className="text-sm font-semibold text-gray-900">{u.displayName}</div>
                                                <div className="text-xs text-gray-400">{u.username}</div>
                                            </div>
                                        </button>
                                    ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Excel Export ─────────────────────────────────────────────────────────────
function exportToExcel(result: CompareResult, detail: SyncDetail) {
    const wb = XLSX.utils.book_new()
    const now = new Date(detail.timestamp)
    const dateStr = now.toLocaleString('de-CH')

    const parseCN = (dn: string) => { const m = dn.match(/^CN=([^,]+)/i); return m ? m[1] : dn }

    // Sheet 1: Summary
    const summaryData = [
        ['AD Group Sync Report'],
        [],
        ['Date', dateStr],
        ['Executed By', detail.executor],
        ['Reference User (FROM)', detail.fromUser],
        ['Target User (TO)', detail.toUser],
        [],
        ['Summary', 'Count'],
        ['Shared (pre-existing)', result.shared.length],
        ['Groups Added', detail.groupsAdded.length],
        ['Groups Removed', detail.groupsRemoved.length],
        ['Failed', detail.groupsFailed.length],
    ]
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData)
    ws1['!cols'] = [{ wch: 28 }, { wch: 40 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary')

    // Sheet 2: Group Detail
    const rows: any[][] = [['Group Name', 'Full DN', 'Status']]
    result.shared.forEach(g => rows.push([g.cn, g.dn, '✅ Pre-existing (Shared)']))
    detail.groupsAdded.forEach(dn => rows.push([parseCN(dn), dn, '➕ Added']))
    detail.groupsRemoved.forEach(dn => rows.push([parseCN(dn), dn, '➖ Removed']))
    detail.groupsFailed.forEach(dn => {
        const op = dn.startsWith('ADD:') ? 'Add' : 'Remove'
        const cleanDn = dn.replace(/^(ADD|REMOVE):/, '')
        rows.push([parseCN(cleanDn), cleanDn, `❌ Failed (${op})`])
    })
    const ws2 = XLSX.utils.aoa_to_sheet(rows)
    ws2['!cols'] = [{ wch: 30 }, { wch: 60 }, { wch: 24 }]
    XLSX.utils.book_append_sheet(wb, ws2, 'Group Detail')

    // Sheet 3: Audit Trail
    const auditRows = [
        ['Timestamp', 'Executor', 'Action', 'From User', 'To User', 'Group', 'Status'],
        ...detail.groupsAdded.map(dn => [dateStr, detail.executor, 'ADD', detail.fromUser, detail.toUser, parseCN(dn), 'SUCCESS']),
        ...detail.groupsRemoved.map(dn => [dateStr, detail.executor, 'REMOVE', detail.fromUser, detail.toUser, parseCN(dn), 'SUCCESS']),
        ...detail.groupsFailed.map(dn => {
            const op = dn.startsWith('ADD:') ? 'ADD' : 'REMOVE'
            return [dateStr, detail.executor, op, detail.fromUser, detail.toUser, parseCN(dn.replace(/^(ADD|REMOVE):/, '')), 'FAILED']
        }),
    ]
    const ws3 = XLSX.utils.aoa_to_sheet(auditRows)
    ws3['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, ws3, 'Audit Trail')

    const filename = `AD-Sync_${detail.toUser}_${now.toISOString().slice(0, 10)}.xlsx`
    XLSX.writeFile(wb, filename)
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ADGroupComparePage() {
    const [refUser, setRefUser] = useState<ADUser | null>(null)
    const [tgtUser, setTgtUser] = useState<ADUser | null>(null)
    const [comparing, setComparing] = useState(false)
    const [result, setResult] = useState<CompareResult | null>(null)
    const [error, setError] = useState('')

    const [selectedAdd, setSelectedAdd] = useState<Set<string>>(new Set())
    const [selectedRemove, setSelectedRemove] = useState<Set<string>>(new Set())

    const [showModal, setShowModal] = useState(false)
    const [applying, setApplying] = useState(false)
    const [syncDetail, setSyncDetail] = useState<SyncDetail | null>(null)
    const [applyResult, setApplyResult] = useState<{ status: 'success' | 'partial' | 'failed'; added: number; removed: number; failed: string[] } | null>(null)

    const missing = result?.missingInTarget || []
    const extra = result?.extraInTarget || []

    function toggleAdd(dn: string) { setSelectedAdd(prev => { const n = new Set(prev); n.has(dn) ? n.delete(dn) : n.add(dn); return n }) }
    function toggleRemove(dn: string) { setSelectedRemove(prev => { const n = new Set(prev); n.has(dn) ? n.delete(dn) : n.add(dn); return n }) }
    function toggleAllAdd() { setSelectedAdd(selectedAdd.size === missing.length ? new Set() : new Set(missing.map(g => g.dn))) }
    function toggleAllRemove() { setSelectedRemove(selectedRemove.size === extra.length ? new Set() : new Set(extra.map(g => g.dn))) }

    async function handleCompare() {
        if (!refUser || !tgtUser) return
        setComparing(true); setError(''); setResult(null)
        setSelectedAdd(new Set()); setSelectedRemove(new Set())
        setApplyResult(null); setSyncDetail(null)
        try {
            const res = await fetch('/api/ad/compare', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referenceUsername: refUser.username, targetUsername: tgtUser.username }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Compare failed')
            setResult(data)
        } catch (e: any) { setError(e.message) }
        finally { setComparing(false) }
    }

    async function handleApply() {
        if (!result) return
        const addList = Array.from(selectedAdd)
        const removeList = Array.from(selectedRemove)
        if (addList.length + removeList.length === 0) return
        setApplying(true)
        try {
            const res = await fetch('/api/ad/add-member-batch', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetUserDn: result.targetUser.dn || result.targetUser.username,
                    groupsToAdd: addList, groupsToRemove: removeList,
                    fromUsername: result.referenceUser.username, toUsername: result.targetUser.username,
                }),
            })
            const data = await res.json()
            setApplyResult({ status: data.status, added: data.added, removed: data.removed, failed: data.failed || [] })
            if (data.detail) setSyncDetail(data.detail)

            // Point 7: Optimistic UI update — remove applied groups from result
            // so the table reflects the new state without requiring re-Compare
            setResult(prev => {
                if (!prev) return prev
                const addedSet = new Set(addList.map(d => d.toLowerCase()))
                const removedSet = new Set(removeList.map(d => d.toLowerCase()))
                return {
                    ...prev,
                    // Promoted: missing → shared
                    missingInTarget: prev.missingInTarget.filter(g => !addedSet.has(g.dn.toLowerCase())),
                    shared: [
                        ...prev.shared,
                        ...prev.missingInTarget.filter(g => addedSet.has(g.dn.toLowerCase()))
                    ],
                    // Removed: extra → gone
                    extraInTarget: prev.extraInTarget.filter(g => !removedSet.has(g.dn.toLowerCase())),
                    targetGroups: [
                        ...prev.targetGroups.filter(g => !removedSet.has(g.toLowerCase())),
                        ...addList.filter(d => !prev.targetGroups.map(g => g.toLowerCase()).includes(d.toLowerCase()))
                    ]
                }
            })
            setSelectedAdd(new Set())
            setSelectedRemove(new Set())
        } catch (e: any) { setApplyResult({ status: 'failed', added: 0, removed: 0, failed: [e.message] }) }

        finally { setApplying(false); setShowModal(false) }
    }

    const canCompare = !!refUser && !!tgtUser && !comparing
    const totalSelected = selectedAdd.size + selectedRemove.size

    return (
        <div className="container max-w-6xl">
            {/* Header */}
            <div className="header mb-6">
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.8rem' }}>🔄 AD Group Compare & Sync</h1>
                    <p className="text-sm text-gray-500 mt-1">Compare and synchronize AD group membership between two users</p>
                </div>
                <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2.5 py-1 rounded-full border border-orange-200">
                    <ShieldAlert className="w-3 h-3 inline mr-1" />Admin Only · Audit Logged
                </span>
            </div>

            {/* User Pickers */}
            <div className="card mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <UserPicker label="📌 Reference User (copy FROM)" value={refUser} onSelect={u => { setRefUser(u); setResult(null) }} />
                    <div className="hidden md:flex items-end pb-2"><GitCompare className="w-6 h-6 text-gray-300" /></div>
                    <UserPicker label="🎯 Target User (sync TO)" value={tgtUser} onSelect={u => { setTgtUser(u); setResult(null) }} />
                    <button onClick={handleCompare} disabled={!canCompare}
                        className={`btn shrink-0 ${canCompare ? 'btn-primary' : 'btn-outline opacity-40 cursor-not-allowed'}`}>
                        {comparing ? 'Comparing...' : '⚡ Compare'}
                    </button>
                </div>
                {error && <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2">{error}</div>}
            </div>

            {/* Apply Result + Export */}
            {applyResult && (
                <div className={`mb-4 px-4 py-3 rounded-lg border text-sm flex items-center gap-3 flex-wrap
                    ${applyResult.status === 'success' ? 'bg-green-50 border-green-200 text-green-700'
                        : applyResult.status === 'partial' ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {applyResult.status === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    {applyResult.status === 'partial' && <span className="text-lg">⚠️</span>}
                    {applyResult.status === 'failed' && <span className="text-lg">❌</span>}
                    <span>
                        {applyResult.status === 'success' && `✅ ${applyResult.added} added · ${applyResult.removed} removed — complete`}
                        {applyResult.status === 'partial' && `⚠️ PARTIAL SUCCESS: ${applyResult.added} added · ${applyResult.removed} removed · ${applyResult.failed.length} FAILED — review audit log`}
                        {applyResult.status === 'failed' && `❌ FAILED: no groups were changed — check AD connectivity`}
                    </span>
                    {syncDetail && result && (
                        <button onClick={() => exportToExcel(result, syncDetail)}
                            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors">
                            <Download className="w-3.5 h-3.5" />Export Report (.xlsx)
                        </button>
                    )}
                    <button onClick={() => setApplyResult(null)} className="text-gray-400 hover:text-gray-600 ml-1"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Results */}
            {result && (
                <>
                    {/* Summary Bar */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                        {[
                            { label: 'Reference Groups', value: result.referenceGroups.length, color: 'border-blue-500 bg-blue-50 text-blue-700' },
                            { label: 'Target Groups', value: result.targetGroups.length, color: 'border-indigo-500 bg-indigo-50 text-indigo-700' },
                            { label: 'Shared', value: result.shared.length, color: 'border-green-500 bg-green-50 text-green-700' },
                            { label: 'Missing in Target', value: result.missingInTarget.length, color: 'border-orange-500 bg-orange-50 text-orange-700' },
                            { label: 'Extra in Target', value: result.extraInTarget.length, color: 'border-red-400 bg-red-50 text-red-600' },
                        ].map(s => (
                            <div key={s.label} className={`card p-4 border-l-4 ${s.color}`}>
                                <div className="text-2xl font-bold">{s.value}</div>
                                <div className="text-xs font-medium mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Toolbar */}
                    <div className="card p-0 overflow-hidden border border-gray-200">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <input type="checkbox" className="w-4 h-4 rounded"
                                    checked={selectedAdd.size === missing.length && missing.length > 0}
                                    onChange={toggleAllAdd} title="Select all missing" />
                                <span className="text-orange-600 font-medium">Select all missing ({missing.length})</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <input type="checkbox" className="w-4 h-4 rounded"
                                    checked={selectedRemove.size === extra.length && extra.length > 0}
                                    onChange={toggleAllRemove} title="Select all extra" />
                                <span className="text-red-600 font-medium">Select all extra ({extra.length})</span>
                            </div>
                            <div className="flex-1" />
                            <button onClick={() => totalSelected > 0 && setShowModal(true)} disabled={totalSelected === 0}
                                className={`btn text-sm px-4 ${totalSelected > 0 ? 'btn-primary' : 'btn-outline opacity-40 cursor-not-allowed'}`}>
                                Apply Changes ({selectedAdd.size} add · {selectedRemove.size} remove)
                            </button>
                        </div>

                        {/* Column Headers */}
                        <div className="grid grid-cols-3 border-b border-gray-200">
                            <div className="px-4 py-2.5 text-xs font-bold text-orange-700 bg-orange-50 uppercase tracking-wider">
                                ⬜ Missing ({missing.length}) — will ADD
                            </div>
                            <div className="px-4 py-2.5 text-xs font-bold text-green-700 bg-green-50 uppercase tracking-wider border-x border-gray-200">
                                ✅ Shared ({result.shared.length})
                            </div>
                            <div className="px-4 py-2.5 text-xs font-bold text-red-600 bg-red-50 uppercase tracking-wider">
                                ➕ Extra ({extra.length}) — can REMOVE
                            </div>
                        </div>

                        {/* Point 6: Scrollable rows for large group lists (200+ groups) */}
                        <div className="max-h-[600px] overflow-y-auto">
                            {(() => {
                                const maxRows = Math.max(missing.length, result.shared.length, extra.length)
                                if (maxRows === 0) return (
                                    <div className="py-12 text-center text-gray-400 text-sm">Groups are identical — nothing to sync.</div>
                                )
                                return Array.from({ length: maxRows }).map((_, i) => {
                                    const m = missing[i], s = result.shared[i], e = extra[i]
                                    return (
                                        <div key={i} className="grid grid-cols-3 border-b border-gray-100 last:border-0 text-sm">
                                            <div className="px-4 py-2.5 flex items-center gap-2">
                                                {m && (
                                                    <>
                                                        <input type="checkbox" className="w-4 h-4 rounded shrink-0"
                                                            checked={selectedAdd.has(m.dn)} onChange={() => toggleAdd(m.dn)} />
                                                        <span className={`font-medium truncate ${isPrivileged(m.cn) ? 'text-red-700' : 'text-orange-800'}`} title={m.dn}>
                                                            {m.cn}
                                                        </span>
                                                        {isPrivileged(m.cn) && (
                                                            <span title="Privileged group — elevated AD rights" className="shrink-0 text-[10px] font-bold bg-red-100 text-red-700 border border-red-300 px-1.5 py-0.5 rounded-full">
                                                                ⚠️ PRIV
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                            <div className="px-4 py-2.5 flex items-center border-x border-gray-100">
                                                {s && <span className="text-green-800 truncate" title={s.dn}>{s.cn}</span>}
                                            </div>
                                            <div className="px-4 py-2.5 flex items-center gap-2">
                                                {e && <>
                                                    <input type="checkbox" className="w-4 h-4 rounded shrink-0 accent-red-500"
                                                        checked={selectedRemove.has(e.dn)} onChange={() => toggleRemove(e.dn)} />
                                                    <span className="text-red-700 font-medium truncate" title={e.dn}>{e.cn}</span>
                                                </>}
                                            </div>
                                        </div>
                                    )
                                })
                            })()}
                        </div>
                    </div>
                </>
            )}

            {/* Confirm Modal */}
            {showModal && result && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                <ShieldAlert className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Confirm AD Sync</h3>
                                <p className="text-xs text-gray-500">This action is audit-logged and irreversible</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-4">
                            Syncing AD groups for <strong>{result.targetUser.displayName}</strong>{' '}
                            based on <strong>{result.referenceUser.displayName}</strong>:
                        </p>
                        <div className="bg-gray-50 rounded-lg p-3 mb-4 max-h-48 overflow-y-auto space-y-1">
                            {Array.from(selectedAdd).map(dn => {
                                const g = missing.find(m => m.dn === dn)
                                return <div key={dn} className="text-xs text-green-700">➕ Add: {g?.cn || dn}</div>
                            })}
                            {Array.from(selectedRemove).map(dn => {
                                const g = extra.find(e => e.dn === dn)
                                return <div key={dn} className="text-xs text-red-600">➖ Remove: {g?.cn || dn}</div>
                            })}
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                            <button onClick={handleApply} disabled={applying} className="btn btn-primary">
                                {applying ? 'Applying...' : '✓ Confirm & Apply'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
