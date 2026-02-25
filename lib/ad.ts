import { Client } from 'ldapts'

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

/**
 * Searches Active Directory for users matching the query (checks name, username, or email).
 * Returns strictly read-only data including the user's current groups (memberOf).
 */
export async function searchADUsers(query: string): Promise<ADUser[]> {
    const activedirectoryUrl = process.env.AD_URL
    const bindDn = process.env.AD_READ_USER // e.g., 'CN=ReadOnlyService,OU=ServiceAccounts,DC=domain,DC=local'
    const bindPass = process.env.AD_READ_PASS
    const searchBase = process.env.AD_BASE_DN || 'DC=domain,DC=local'

    // 1. Fallback to Mock Data if AD is not configured
    if (!activedirectoryUrl || !bindDn || !bindPass) {
        console.warn('⚠️ AD_URL or credentials not set. Falling back to Mock AD Data.')
        const q = query.toLowerCase()
        const matched = MOCK_USERS.filter(u =>
            u.displayName.toLowerCase().includes(q) ||
            u.sAMAccountName.toLowerCase().includes(q) ||
            u.mail.toLowerCase().includes(q)
        )
        return matched.map(u => ({
            username: u.sAMAccountName,
            displayName: u.displayName,
            email: u.mail,
            groups: u.memberOf
        }))
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

    } catch (error) {
        console.error('AD Search Error:', error)
        throw new Error('Failed to query Active Directory.')
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
    const activedirectoryUrl = process.env.AD_URL
    const bindDn = process.env.AD_WRITE_USER // Highly restricted write account
    const bindPass = process.env.AD_WRITE_PASS

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

/**
 * Removes a user from an Active Directory group.
 * Uses the dedicated AD_WRITE_USER service account.
 */
export async function removeADUserFromGroup(userDn: string, groupDn: string): Promise<boolean> {
    const activedirectoryUrl = process.env.AD_URL
    const bindDn = process.env.AD_WRITE_USER
    const bindPass = process.env.AD_WRITE_PASS

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
