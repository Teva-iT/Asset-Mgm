import { Client } from 'ldapts'
import fs from 'fs'
import path from 'path'

// --- Mock Data Fallback for Development ---
const MOCK_USERS = [
    { sAMAccountName: 'jdoe', displayName: 'John Doe', mail: 'jdoe@example.com', memberOf: ['CN=All-Employees,OU=Groups,DC=example,DC=com', 'CN=VPN-Users,OU=Groups,DC=example,DC=com', 'CN=IT-Support,OU=Groups,DC=example,DC=com'] },
    { sAMAccountName: 'asmith', displayName: 'Alice Smith', mail: 'asmith@example.com', memberOf: ['CN=All-Employees,OU=Groups,DC=example,DC=com', 'CN=HR-Managers,OU=Groups,DC=example,DC=com'] },
    { sAMAccountName: 'bjones', displayName: 'Bob Jones', mail: 'bjones@example.com', memberOf: ['CN=All-Employees,OU=Groups,DC=example,DC=com', 'CN=Sales-Team,OU=Groups,DC=example,DC=com'] },
]

export interface ADUser {
    username: string
    displayName: string
    email: string
    groups: string[]
}

const adEnvCache = new Map<string, string>()

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

function getAdEnvValue(key: string): string | undefined {
    const directValue = process.env[key]?.trim()
    if (directValue) return directValue

    if (adEnvCache.has(key)) {
        return adEnvCache.get(key)
    }

    const fallbackFiles = [
        path.join(process.cwd(), '.env.local'),
        path.join(process.cwd(), 'types/.env.local'),
    ]

    for (const filePath of fallbackFiles) {
        const fileValue = readEnvFileValue(filePath, key)
        if (fileValue) {
            adEnvCache.set(key, fileValue)
            return fileValue
        }
    }

    return undefined
}

function getReadOnlyAdConfig() {
    const activedirectoryUrl = getAdEnvValue('AD_URL')
    const readUser = getAdEnvValue('AD_READ_USER')
    const writeUser = getAdEnvValue('AD_WRITE_USER')
    const readPass = getAdEnvValue('AD_READ_PASS')
    const writePass = getAdEnvValue('AD_WRITE_PASS')
    const searchBase = getAdEnvValue('AD_BASE_DN') || 'DC=domain,DC=local'
    const bridgeUrl = getAdEnvValue('AD_BRIDGE_URL')
    const bridgeToken = getAdEnvValue('AD_BRIDGE_TOKEN')

    const bindDn = readUser || writeUser
    const bindPass = readPass || (bindDn && writeUser && bindDn === writeUser ? writePass : undefined)

    return {
        activedirectoryUrl,
        bindDn,
        bindPass,
        searchBase,
        bridgeUrl,
        bridgeToken,
    }
}

async function searchADUsersViaBridge(query: string, bridgeUrl: string, bridgeToken?: string): Promise<ADUser[]> {
    const endpoint = new URL('/search', bridgeUrl)
    endpoint.searchParams.set('q', query)

    const response = await fetch(endpoint.toString(), {
        headers: bridgeToken ? { 'x-ad-bridge-token': bridgeToken } : {},
        cache: 'no-store',
    })

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
        const bridgeError: any = new Error(payload?.error || payload?.message || 'AD bridge request failed')
        bridgeError.code = payload?.code || `BRIDGE_${response.status}`
        throw bridgeError
    }

    return Array.isArray(payload?.users) ? payload.users : []
}

/**
 * Searches Active Directory for users matching the query (checks name, username, or email).
 * Returns strictly read-only data including the user's current groups (memberOf).
 */
export async function searchADUsers(query: string): Promise<ADUser[]> {
    const { activedirectoryUrl, bindDn, bindPass, searchBase, bridgeUrl, bridgeToken } = getReadOnlyAdConfig()

    if (bridgeUrl) {
        return searchADUsersViaBridge(query, bridgeUrl, bridgeToken)
    }

    if (!activedirectoryUrl || !bindDn || !bindPass) {
        const configError: any = new Error('Active Directory is not fully configured.')
        configError.code = 'AD_CONFIG_MISSING'
        throw configError
    }

    // 2. Connect to real Active Directory
    const client = new Client({
        url: activedirectoryUrl,
        timeout: 5000,
        connectTimeout: 5000,
    })

    try {
        await client.bind(bindDn, bindPass)

        // Prevent LDAP injection by escaping the query
        const safeQuery = query.replace(/[\\*()\0]/g, '\\$&')

        // Search filter matching name, username, or email
        const filter = `(&(objectClass=user)(objectCategory=person)(|(sAMAccountName=*${safeQuery}*)(displayName=*${safeQuery}*)(mail=*${safeQuery}*)))`

        const { searchEntries } = await client.search(searchBase, {
            filter,
            scope: 'sub',
            attributes: ['sAMAccountName', 'displayName', 'mail', 'memberOf'],
            sizeLimit: 20 // Don't overwhelm the UI
        })

        const results: ADUser[] = searchEntries.map((entry: any) => {
            // memberOf can be a string (if 1 group) or array of strings. Standardize to array.
            let groups: string[] = []
            if (entry.memberOf) {
                groups = Array.isArray(entry.memberOf) ? entry.memberOf : [entry.memberOf]
            }

            return {
                username: entry.sAMAccountName?.toString() || '',
                displayName: entry.displayName?.toString() || '',
                email: entry.mail?.toString() || '',
                groups: groups.map(g => g.toString())
            }
        })

        return results

    } catch (error: any) {
        console.error('AD Search Error:', error)
        const wrappedError: any = new Error(`Failed to query Active Directory: ${error?.message || 'Unknown error'}`)
        wrappedError.code = error?.code || 'AD_QUERY_FAILED'
        throw wrappedError
    } finally {
        try {
            await client.unbind()
        } catch (e) { }
    }
}

/**
 * Adds a user to an Active Directory group.
 * Uses the dedicated AD_WRITE_USER service account.
 * 
 * @param userDn The distinguishedName of the user (e.g., CN=John Doe,OU=Users,DC=corp)
 * @param groupDn The distinguishedName of the group (e.g., CN=IT-Admins,OU=Groups,DC=corp)
 */
export async function addADUserToGroup(userDn: string, groupDn: string): Promise<boolean> {
    const activedirectoryUrl = getAdEnvValue('AD_URL')
    const bindDn = getAdEnvValue('AD_WRITE_USER') // Highly restricted write account
    const bindPass = getAdEnvValue('AD_WRITE_PASS')

    if (!activedirectoryUrl || !bindDn || !bindPass) {
        console.warn('⚠️ AD_WRITE_USER credentials not set. Simulating AD Group Add in Mock Mode.')
        console.log(`[MOCK AD WRITE] Added ${userDn} to ${groupDn}`)
        return true
    }

    const { Change, Client, Attribute } = await import('ldapts')
    const client = new Client({
        url: activedirectoryUrl,
        timeout: 5000,
        connectTimeout: 5000,
    })

    try {
        await client.bind(bindDn, bindPass)
        const change = new Change({
            operation: 'add',
            modification: new Attribute({
                type: 'member',
                values: [userDn]
            })
        })
        await client.modify(groupDn, [change])
        return true
    } catch (error: any) {
        console.error('AD Write Error (addADUserToGroup):', error)
        throw new Error(`Failed to add user to AD group: ${error.message || 'Unknown error'}`)
    } finally {
        try { await client.unbind() } catch (e) { }
    }
}

export function getADDiagnosticConfig() {
    return getReadOnlyAdConfig()
}

/**
 * Removes a user from an Active Directory group.
 * Uses the dedicated AD_WRITE_USER service account.
 */
export async function removeADUserFromGroup(userDn: string, groupDn: string): Promise<boolean> {
    const activedirectoryUrl = getAdEnvValue('AD_URL')
    const bindDn = getAdEnvValue('AD_WRITE_USER')
    const bindPass = getAdEnvValue('AD_WRITE_PASS')

    if (!activedirectoryUrl || !bindDn || !bindPass) {
        console.warn('⚠️ AD_WRITE_USER credentials not set. Simulating AD Group Remove in Mock Mode.')
        console.log(`[MOCK AD WRITE] Removed ${userDn} from ${groupDn}`)
        return true
    }

    const { Change, Client, Attribute } = await import('ldapts')
    const client = new Client({
        url: activedirectoryUrl,
        timeout: 5000,
        connectTimeout: 5000,
    })

    try {
        await client.bind(bindDn, bindPass)
        const change = new Change({
            operation: 'delete',
            modification: new Attribute({
                type: 'member',
                values: [userDn]
            })
        })
        await client.modify(groupDn, [change])
        return true
    } catch (error: any) {
        console.error('AD Write Error (removeADUserFromGroup):', error)
        throw new Error(`Failed to remove user from AD group: ${error.message || 'Unknown error'}`)
    } finally {
        try { await client.unbind() } catch (e) { }
    }
}
