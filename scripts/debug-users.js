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
    console.log('--- DIAGNOSTIC START (USERS) ---')

    try {
        // Test 1: List all tables looking for 'user'
        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
        const userTables = tables.filter(t => t.table_name.toLowerCase().includes('user'))
        console.log('1. User-like tables:', userTables.map(t => t.table_name))

        // Test 2: Try select from 'user' (lowercase, singular)
        try {
            const rows = await prisma.$queryRaw`SELECT * FROM "user" LIMIT 1`
            console.log(`2. SELECT FROM "user": Success! Found ${rows.length} rows.`)
            if (rows.length > 0) console.log('   Keys:', Object.keys(rows[0]))
        } catch (e) {
            console.log('2. SELECT FROM "user" failed:', e.message.split('\n')[0])
        }

        // Test 3: Try select from 'User' (Titlecase)
        try {
            const rows = await prisma.$queryRaw`SELECT * FROM "User" LIMIT 1`
            console.log(`3. SELECT FROM "User": Success! Found ${rows.length} rows.`)
        } catch (e) {
            console.log('3. SELECT FROM "User" failed:', e.message.split('\n')[0])
        }

        // Test 4: Try select from 'users' (lowercase, plural)
        try {
            const rows = await prisma.$queryRaw`SELECT * FROM "users" LIMIT 1`
            console.log(`4. SELECT FROM "users": Success! Found ${rows.length} rows.`)
        } catch (e) {
            console.log('4. SELECT FROM "users" failed:', e.message.split('\n')[0])
        }

    } catch (e) {
        console.log('   FATAL:', e.message)
    }

    console.log('--- DIAGNOSTIC END ---')
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
