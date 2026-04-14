import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as jose from 'jose'
import dns from 'dns/promises'
import net from 'net'
import { Client } from 'ldapts'
import { getADDiagnosticConfig } from '@/lib/ad'

function parseLdapTarget(rawUrl: string) {
    const normalized = rawUrl.includes('://') ? rawUrl : `ldap://${rawUrl}`
    const parsed = new URL(normalized)
    const defaultPort = parsed.protocol === 'ldaps:' ? 636 : 389

    return {
        url: normalized,
        host: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : defaultPort,
        protocol: parsed.protocol.replace(':', ''),
    }
}

function tcpCheck(host: string, port: number, timeoutMs: number) {
    return new Promise<void>((resolve, reject) => {
        const socket = net.createConnection({ host, port })

        const timeout = setTimeout(() => {
            socket.destroy()
            reject(new Error('TCP connection timeout'))
        }, timeoutMs)

        socket.once('connect', () => {
            clearTimeout(timeout)
            socket.end()
            resolve()
        })

        socket.once('error', (error) => {
            clearTimeout(timeout)
            reject(error)
        })
    })
}

export async function GET(request: Request) {
    try {
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
        if (currentUser.role !== 'ADMIN' && currentUser.role !== 'IT_SUPPORT') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q') || ''
        const { activedirectoryUrl, bindDn, bindPass, searchBase } = getADDiagnosticConfig()

        const steps: Array<Record<string, unknown>> = []

        steps.push({
            step: 'config',
            status: activedirectoryUrl && bindDn && bindPass && searchBase ? 'ok' : 'error',
            detail: {
                adUrl: activedirectoryUrl || null,
                bindUser: bindDn || null,
                bindPassPresent: Boolean(bindPass),
                searchBase: searchBase || null,
            },
        })

        if (!activedirectoryUrl || !bindDn || !bindPass || !searchBase) {
            return NextResponse.json({
                overallStatus: 'error',
                steps,
                message: 'Active Directory configuration is incomplete.',
            }, { status: 200 })
        }

        const target = parseLdapTarget(activedirectoryUrl)

        try {
            const dnsResult = await dns.lookup(target.host)
            steps.push({
                step: 'dns',
                status: 'ok',
                detail: {
                    host: target.host,
                    address: dnsResult.address,
                    family: dnsResult.family,
                },
            })
        } catch (error: any) {
            steps.push({
                step: 'dns',
                status: 'error',
                detail: {
                    host: target.host,
                    code: error?.code || null,
                    message: error?.message || 'DNS lookup failed',
                },
            })

            return NextResponse.json({
                overallStatus: 'error',
                steps,
                message: 'DNS lookup failed.',
            }, { status: 200 })
        }

        try {
            await tcpCheck(target.host, target.port, 8000)
            steps.push({
                step: 'tcp',
                status: 'ok',
                detail: {
                    host: target.host,
                    port: target.port,
                },
            })
        } catch (error: any) {
            steps.push({
                step: 'tcp',
                status: 'error',
                detail: {
                    host: target.host,
                    port: target.port,
                    code: error?.code || null,
                    message: error?.message || 'TCP connection failed',
                },
            })

            return NextResponse.json({
                overallStatus: 'error',
                steps,
                message: 'TCP connection to LDAP failed.',
            }, { status: 200 })
        }

        const client = new Client({
            url: target.url,
            timeout: 8000,
            connectTimeout: 8000,
        })

        try {
            await client.bind(bindDn, bindPass)
            steps.push({
                step: 'ldap-bind',
                status: 'ok',
                detail: {
                    bindUser: bindDn,
                },
            })

            if (query.trim().length >= 2) {
                const safeQuery = query.replace(/[\\*()\0]/g, '\\$&')
                const filter = `(&(objectClass=user)(objectCategory=person)(|(sAMAccountName=*${safeQuery}*)(displayName=*${safeQuery}*)(mail=*${safeQuery}*)))`
                const { searchEntries } = await client.search(searchBase, {
                    filter,
                    scope: 'sub',
                    attributes: ['sAMAccountName', 'displayName', 'mail'],
                    sizeLimit: 5,
                })

                steps.push({
                    step: 'ldap-search',
                    status: 'ok',
                    detail: {
                        query,
                        resultCount: searchEntries.length,
                        results: searchEntries.map((entry: any) => ({
                            username: entry.sAMAccountName?.toString() || '',
                            displayName: entry.displayName?.toString() || '',
                            email: entry.mail?.toString() || '',
                        })),
                    },
                })
            }
        } catch (error: any) {
            steps.push({
                step: 'ldap-bind',
                status: 'error',
                detail: {
                    bindUser: bindDn,
                    code: error?.code || null,
                    message: error?.message || 'LDAP bind failed',
                },
            })

            return NextResponse.json({
                overallStatus: 'error',
                steps,
                message: 'LDAP bind failed.',
            }, { status: 200 })
        } finally {
            try {
                await client.unbind()
            } catch { }
        }

        return NextResponse.json({
            overallStatus: 'ok',
            steps,
            message: 'Active Directory diagnostics completed successfully.',
        }, { status: 200 })
    } catch (error: any) {
        return NextResponse.json({
            overallStatus: 'error',
            message: error?.message || 'Unexpected AD diagnostics error',
            steps: [],
        }, { status: 500 })
    }
}
