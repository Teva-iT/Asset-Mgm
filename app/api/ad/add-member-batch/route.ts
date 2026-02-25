import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import * as jose from 'jose'
import { addADUserToGroup, removeADUserFromGroup } from '@/lib/ad'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        // Auth — ADMIN only
        const cookieStore = await cookies()
        const token = cookieStore.get('auth_token')?.value
        let currentUser: any = null
        if (token) {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret')
            try {
                const { payload } = await jose.jwtVerify(token, secret)
                currentUser = payload
            } catch { }
        }
        if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (currentUser.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden: Only ADMIN can batch-sync AD groups' }, { status: 403 })
        }

        const {
            targetUserDn,
            groupsToAdd = [],
            groupsToRemove = [],
            fromUsername,
            toUsername,
        } = await request.json()

        if (!targetUserDn) {
            return NextResponse.json({ error: 'targetUserDn is required' }, { status: 400 })
        }

        const added: string[] = []
        const removed: string[] = []
        const skipped: string[] = []  // already member / already not member
        const failed: string[] = []
        const perGroup: Record<string, string> = {}

        // Helper: detect "already member" class of AD errors (graceful idempotency)
        function isAlreadyMemberError(msg: string) {
            const lower = msg.toLowerCase()
            return lower.includes('already') || lower.includes('constraint') || lower.includes('entry already exists')
        }
        function isNotMemberError(msg: string) {
            const lower = msg.toLowerCase()
            return lower.includes('no such attribute') || lower.includes('not a member')
        }

        // Process additions
        for (const groupDn of groupsToAdd) {
            try {
                await addADUserToGroup(targetUserDn, groupDn)
                added.push(groupDn)
                perGroup[groupDn] = 'ADDED'
            } catch (err: any) {
                if (isAlreadyMemberError(err.message)) {
                    // Idempotent — not a real failure
                    skipped.push(groupDn)
                    perGroup[groupDn] = 'SKIPPED_ALREADY_MEMBER'
                } else {
                    console.error(`[ADD] Failed ${groupDn}:`, err.message)
                    failed.push(`ADD:${groupDn}`)
                    perGroup[groupDn] = `FAILED: ${err.message}`
                }
            }
        }

        // Process removals
        for (const groupDn of groupsToRemove) {
            try {
                await removeADUserFromGroup(targetUserDn, groupDn)
                removed.push(groupDn)
                perGroup[groupDn] = 'REMOVED'
            } catch (err: any) {
                if (isNotMemberError(err.message)) {
                    skipped.push(groupDn)
                    perGroup[groupDn] = 'SKIPPED_NOT_MEMBER'
                } else {
                    console.error(`[REMOVE] Failed ${groupDn}:`, err.message)
                    failed.push(`REMOVE:${groupDn}`)
                    perGroup[groupDn] = `FAILED: ${err.message}`
                }
            }
        }

        // Write audit log with JSONB result for full per-group traceability
        if (added.length > 0 || removed.length > 0 || skipped.length > 0) {
            await supabase.from('ad_sync_logs').insert({
                executed_by: currentUser.id || null,
                executor_name: currentUser.name || currentUser.username || null,
                from_user: fromUsername || '?',
                to_user: toUsername || '?',
                to_user_dn: targetUserDn,
                groups_added: added,
                groups_removed: removed,
                groups_failed: failed,
                result: {
                    perGroup,
                    summary: { added: added.length, removed: removed.length, skipped: skipped.length, failed: failed.length }
                },
            })
        }

        // Explicit status: no ambiguity allowed in an access-control system
        const totalRequested = groupsToAdd.length + groupsToRemove.length
        const realFailed = failed.length  // skipped is NOT a failure
        let operationStatus: 'success' | 'partial' | 'failed'
        if (realFailed === 0) {
            operationStatus = 'success'
        } else if (realFailed < totalRequested) {
            operationStatus = 'partial'  // some succeeded, some truly failed — warn loudly
        } else {
            operationStatus = 'failed'   // nothing worked
        }

        return NextResponse.json({
            status: operationStatus,
            added: added.length,
            removed: removed.length,
            skipped: skipped.length,
            failed,
            detail: {
                executor: currentUser.name || currentUser.username || 'Admin',
                fromUser: fromUsername,
                toUser: toUsername,
                timestamp: new Date().toISOString(),
                groupsAdded: added,
                groupsRemoved: removed,
                groupsSkipped: skipped,
                groupsFailed: failed,
            }
        })
    } catch (error: any) {
        console.error('/api/ad/add-member-batch error:', error)
        return NextResponse.json({ error: error.message || 'Batch sync failed' }, { status: 500 })
    }
}
