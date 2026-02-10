import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- DIAGNOSTIC START ---')

    // Test 1: Standard Prisma Model Query
    try {
        console.log('\n1. Testing prisma.department.findMany():')
        const deps = await prisma.department.findMany()
        console.log(`   Success! Found ${deps.length} departments.`)
        if (deps.length > 0) console.log('   Sample:', JSON.stringify(deps[0]))
    } catch (e: any) {
        console.log('   FAILED:', e.message.split('\n')[0])
    }

    // Test 2: Raw SQL - Lowercase 'department'
    try {
        console.log('\n2. Testing Raw SQL: SELECT * FROM department')
        const rawDeps: any = await prisma.$queryRaw`SELECT * FROM department LIMIT 1`
        console.log(`   Success! Found ${rawDeps.length} rows.`)
        if (rawDeps.length > 0) console.log('   Sample:', JSON.stringify(rawDeps[0]))
    } catch (e: any) {
        console.log('   FAILED:', e.message.split('\n')[0])
    }

    // Test 3: Raw SQL - Title Case "Department"
    try {
        console.log('\n3. Testing Raw SQL: SELECT * FROM "Department"')
        const rawDepsQuote: any = await prisma.$queryRaw`SELECT * FROM "Department" LIMIT 1`
        console.log(`   Success! Found ${rawDepsQuote.length} rows.`)
    } catch (e: any) {
        console.log('   FAILED:', e.message.split('\n')[0])
    }

    // Test 4: Raw SQL - All Tables
    try {
        console.log('\n4. Listing all tables in public schema:')
        const tables: any = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
        console.log('   Tables:', tables.map((t: any) => t.table_name).join(', '))
    } catch (e: any) {
        console.log('   FAILED:', e.message.split('\n')[0])
    }

    console.log('\n--- DIAGNOSTIC END ---')
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
