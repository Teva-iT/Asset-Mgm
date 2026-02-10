
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const departments = [
    'Executive Management',
    'Administration',
    'Human Resources',
    'Finance',
    'Accounting',
    'Legal',
    'Compliance',
    'Risk Management',
    'Internal Audit',
    'Corporate Strategy',
    'Investor Relations',
    'Public Relations',
    'Sales',
    'Marketing',
    'Digital Marketing',
    'Business Development',
    'Product Management',
    'Customer Support',
    'Customer Success',
    'Account Management',
    'Brand Management',
    'Information Technology (IT)',
    'IT Support',
    'Software Engineering',
    'Infrastructure & DevOps',
    'Cybersecurity',
    'Data Science & Analytics',
    'Quality Assurance (QA)',
    'Research & Development (R&D)',
    'Product Design (UI/UX)',
    'Network Engineering',
    'Operations',
    'Manufacturing',
    'Production',
    'Quality Control',
    'Supply Chain Management',
    'Logistics',
    'Procurement',
    'Inventory Management',
    'Facilities Management',
    'Health, Safety & Environment (HSE)',
    'Medical Affairs',
    'Clinical Research',
    'Regulatory Affairs',
    'Laboratory Services',
    'Quality Assurance - GxP',
    'Training & Development',
    'Events Management',
    'Creative Services',
    'Editorial & Content'
]

async function main() {
    console.log('Starting Force Restore...')

    let added = 0;
    let skipped = 0;

    for (const name of departments) {
        // Check if exists
        const exists = await prisma.department.findFirst({
            where: { Name: name }
        })

        if (!exists) {
            await prisma.department.create({
                data: { Name: name },
            })
            console.log(`[+] Inserted: ${name}`)
            added++
        } else {
            console.log(`[-] Skipped (Exists): ${name}`)
            skipped++
        }
    }

    const count = await prisma.department.count()
    console.log(`\n---------------------------------`)
    console.log(`Operation Complete.`)
    console.log(`Added: ${added}`)
    console.log(`Skipped: ${skipped}`)
    console.log(`Total Departments in DB: ${count}`)
    console.log(`---------------------------------`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
