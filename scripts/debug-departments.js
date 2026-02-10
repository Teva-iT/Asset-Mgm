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
            const value = match[2].trim().replace(/^["']|["']$/g, '') // remove quotes
            process.env[key] = value
        }
    })
    console.log('Loaded .env file. DATABASE_URL length:', process.env.DATABASE_URL?.length)
} catch (e) {
    console.log('Could not load .env:', e.message)
}

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    console.log('--- DIAGNOSTIC START (JS) ---')

    try {
        // Test 1: List all tables
        console.log('\n1. Tables in public schema:')
        const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `
        console.log('   Tables:', tables.map(t => t.table_name).join(', '))

        // Check specifically for department variations
        const deptTables = tables.filter(t => t.table_name.toLowerCase().includes('department'))
        console.log('   Department-like tables:', deptTables.map(t => t.table_name))

    } catch (e) {
        console.log('   FAILED checking tables:', e.message.split('\n')[0])
    }

    try {
        // Test 2: Select from 'department'
        console.log('\n2. SELECT * FROM department')
        const rows = await prisma.$queryRaw`SELECT * FROM department`
        console.log(`   Success! Found ${rows.length} rows.`)
        if (rows.length > 0) console.log('   Sample:', rows[0])
    } catch (e) {
        console.log('   FAILED SELECT FROM department:', e.message.split('\n')[0])
    }

    try {
        // Test 3: Select from "Department"
        console.log('\n3. SELECT * FROM "Department"')
        const rows = await prisma.$queryRaw`SELECT * FROM "Department"`
        console.log(`   Success! Found ${rows.length} rows.`)
    } catch (e) {
        console.log('   FAILED SELECT FROM "Department":', e.message.split('\n')[0])
    }

    console.log('\n--- DIAGNOSTIC END ---')
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
