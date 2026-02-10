const fs = require('fs')
const path = require('path')

// Manually load .env
try {
    const envPath = path.join(__dirname, '..', '.env')
    const envFile = fs.readFileSync(envPath, 'utf8')
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/^["']|["']$/g, '')
            process.env[key] = value
        }
    })
} catch (e) {
    console.log('Could not load .env:', e.message)
}

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('--- DIAGNOSTIC START (USER UPDATE) ---')

    try {
        // 1. Get a user
        const user = await prisma.user.findFirst()
        if (!user) {
            console.log('No users found to test update.')
            return
        }
        console.log('Found user:', user.Username, user.UserID)

        // 2. Attempt Update
        console.log('Attempting dummy update...')
        const updated = await prisma.user.update({
            where: { UserID: user.UserID },
            data: { Role: user.Role } // No change, just testing the update capability
        })
        console.log('Update SUCCESS:', updated)

    } catch (e) {
        console.log('Update FAILED:', e.message)
        if (e.code) console.log('Error Code:', e.code)
        if (e.meta) console.log('Meta:', e.meta)
    } // finally log
    finally {
        await prisma.$disconnect()
    }

    console.log('--- DIAGNOSTIC END ---')
}

main().catch(e => console.error(e))
