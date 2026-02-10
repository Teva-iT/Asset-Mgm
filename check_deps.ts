import { prisma } from './lib/db'

async function check() {
    const count = await prisma.department.count()
    console.log('Department Count:', count)
    if (count > 0) {
        const depts = await prisma.department.findMany({ take: 5 })
        console.log('Sample:', depts)
    }
}

check()
