import fs from 'fs'
import http from 'http'
import path from 'path'
import { Client } from 'ldapts'

type ADUser = {
    username: string
    displayName: string
    email: string
    groups: string[]
}

function readEnvFileValue(filePath: string, key: string): string | undefined {
    if (!fs.existsSync(filePath)) return undefined

    const fileContent = fs.readFileSync(filePath, 'utf8')
    let matchedValue: string | undefined

    for (const rawLine of fileContent.split(/\r?\n/)) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#')) continue

        const separatorIndex = line.indexOf('=')
        if (separatorIndex === -1) continue

        const envKey = line.slice(0, separatorIndex).trim()
        if (envKey !== key) continue

        matchedValue = line.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '')
    }

    return matchedValue
}

function getEnvValue(key: string): string | undefined {
    const directValue = process.env[key]?.trim()
    if (directValue) return directValue

    const candidateFiles = [
        path.join(process.cwd(), '.env.local'),
        path.join(process.cwd(), 'types/.env.local'),
    ]

    for (const filePath of candidateFiles) {
        const fileValue = readEnvFileValue(filePath, key)
        if (fileValue) return fileValue
    }

    return undefined
}

function escapeLdapQuery(value: string) {
    return value.replace(/[\\*()\0]/g, '\\$&')
}

function json(res: http.ServerResponse, statusCode: number, payload: unknown) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-ad-bridge-token',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
    })
    res.end(JSON.stringify(payload))
}

async function searchUsers(query: string): Promise<ADUser[]> {
    const adUrl = getEnvValue('AD_URL')
    const readUser = getEnvValue('AD_READ_USER') || getEnvValue('AD_WRITE_USER')
    const readPass = getEnvValue('AD_READ_PASS') || getEnvValue('AD_WRITE_PASS')
    const baseDn = getEnvValue('AD_BASE_DN') || 'DC=domain,DC=local'

    if (!adUrl || !readUser || !readPass) {
        const error: any = new Error('Bridge AD configuration is incomplete.')
        error.code = 'AD_BRIDGE_CONFIG_MISSING'
        throw error
    }

    const client = new Client({
        url: adUrl,
        timeout: 8000,
        connectTimeout: 8000,
    })

    try {
        await client.bind(readUser, readPass)
        const safeQuery = escapeLdapQuery(query)
        const filter = `(&(objectClass=user)(objectCategory=person)(|(sAMAccountName=*${safeQuery}*)(displayName=*${safeQuery}*)(mail=*${safeQuery}*)))`
        const { searchEntries } = await client.search(baseDn, {
            filter,
            scope: 'sub',
            attributes: ['sAMAccountName', 'displayName', 'mail', 'memberOf'],
            sizeLimit: 20,
        })

        return searchEntries.map((entry: any) => {
            const groups = entry.memberOf
                ? (Array.isArray(entry.memberOf) ? entry.memberOf : [entry.memberOf]).map((group: any) => String(group))
                : []

            return {
                username: entry.sAMAccountName?.toString() || '',
                displayName: entry.displayName?.toString() || '',
                email: entry.mail?.toString() || '',
                groups,
            }
        })
    } finally {
        try {
            await client.unbind()
        } catch {
            // Ignore bridge cleanup errors.
        }
    }
}

const bridgePort = Number(getEnvValue('AD_BRIDGE_PORT') || 4100)
const bridgeToken = getEnvValue('AD_BRIDGE_TOKEN')

const server = http.createServer(async (req, res) => {
    if (!req.url || !req.method) {
        json(res, 400, { error: 'Invalid request' })
        return
    }

    if (req.method === 'OPTIONS') {
        json(res, 204, {})
        return
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

    if (bridgeToken && req.headers['x-ad-bridge-token'] !== bridgeToken) {
        json(res, 401, { error: 'Invalid bridge token', code: 'AD_BRIDGE_UNAUTHORIZED' })
        return
    }

    if (req.method === 'GET' && requestUrl.pathname === '/health') {
        json(res, 200, {
            ok: true,
            bridgePort,
            adUrl: getEnvValue('AD_URL') || null,
            baseDn: getEnvValue('AD_BASE_DN') || null,
        })
        return
    }

    if (req.method === 'GET' && requestUrl.pathname === '/search') {
        const query = requestUrl.searchParams.get('q') || ''
        if (query.trim().length < 2) {
            json(res, 200, { users: [] })
            return
        }

        try {
            const users = await searchUsers(query)
            json(res, 200, { users })
        } catch (error: any) {
            json(res, 500, {
                error: error?.message || 'Bridge AD search failed',
                code: error?.code || 'AD_BRIDGE_SEARCH_FAILED',
            })
        }
        return
    }

    json(res, 404, { error: 'Not found' })
})

server.listen(bridgePort, '0.0.0.0', () => {
    console.log(`[AD Bridge] listening on http://0.0.0.0:${bridgePort}`)
    console.log(`[AD Bridge] health: http://127.0.0.1:${bridgePort}/health`)
    console.log('[AD Bridge] ready for /search?q=<query>')
})
