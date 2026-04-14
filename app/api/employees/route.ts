import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { searchADUsers } from '@/lib/ad'
import fs from 'fs'
import path from 'path'

function log(message: string) {
    try {
        const logPath = path.join(process.cwd(), 'server_debug.log')
        const timestamp = new Date().toISOString()
        fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`)
    } catch (e) {
        // Ignore logging errors
    }
}

function splitDisplayName(displayName: string) {
    const parts = displayName.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 0) {
        return { firstName: 'Unknown', lastName: 'User' }
    }

    if (parts.length === 1) {
        return { firstName: parts[0], lastName: '' }
    }

    return {
        firstName: parts[0],
        lastName: parts.slice(1).join(' '),
    }
}

async function buildUniqueSlug(firstName: string, lastName: string) {
    let baseSlug = `${firstName}-${lastName || 'user'}`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'employee'

    let slug = baseSlug
    let count = 1

    while (true) {
        const { data: existing } = await supabase.from("Employee").select("EmployeeID").eq("Slug", slug).maybeSingle()
        if (!existing) break
        slug = `${baseSlug}-${count}`
        count++
    }

    return slug
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    try {
        let queryBuilder = supabase
            .from("Employee")
            .select("*, assignments:Assignment(count)")
            .order("LastName", { ascending: true });

        if (q) {
            queryBuilder = queryBuilder.limit(10);
            const terms = q.split(/\s+/).filter(Boolean);
            terms.forEach(term => {
                queryBuilder = queryBuilder.or(`FirstName.ilike.%${term}%,LastName.ilike.%${term}%,Email.ilike.%${term}%,Department.ilike.%${term}%`);
            });
        }

        const { data: employees, error } = await queryBuilder;

        if (error) throw error;

        const dbEmployees = (employees || []).map((emp: any) => ({
            ...emp,
            _count: {
                assignments: emp.assignments?.[0]?.count || 0
            }
        }));

        if (!q || q.length < 2) {
            return NextResponse.json(dbEmployees, {
                headers: {
                    'x-ad-status': 'idle',
                },
            })
        }

        let adStatus = 'ok'
        let adMessage = ''
        let adEmployees: any[] = []
        try {
            const adUsers = await searchADUsers(q)
            const existingByEmail = new Map(
                dbEmployees
                    .filter((employee: any) => employee.Email)
                    .map((employee: any) => [String(employee.Email).toLowerCase(), employee])
            )

            adEmployees = adUsers.map((user) => {
                const emailKey = user.email?.toLowerCase()
                const existingEmployee = emailKey ? existingByEmail.get(emailKey) : null
                if (existingEmployee) return existingEmployee

                const { firstName, lastName } = splitDisplayName(user.displayName || user.username)
                return {
                    EmployeeID: `ad:${user.email || user.username}`,
                    FirstName: firstName,
                    LastName: lastName,
                    Email: user.email || '',
                    Department: 'Active Directory',
                    Source: 'AD',
                    _count: {
                        assignments: 0,
                    },
                }
            })
        } catch (adError: any) {
            log(`AD lookup warning for "${q}": ${adError.message || 'Unknown error'}`)
            if (adError?.code === 'AD_CONFIG_MISSING') {
                adStatus = 'config-missing'
                adMessage = 'Active Directory configuration is incomplete.'
            } else {
                adStatus = 'connection-error'
                adMessage = adError?.message || 'Active Directory lookup failed.'
            }
        }

        const merged = [...dbEmployees]
        const seenIds = new Set(merged.map((employee: any) => employee.EmployeeID))

        for (const employee of adEmployees) {
            if (seenIds.has(employee.EmployeeID)) continue
            seenIds.add(employee.EmployeeID)
            merged.push(employee)
        }

        return NextResponse.json(merged, {
            headers: {
                'x-ad-status': adStatus,
                'x-ad-message': encodeURIComponent(adMessage),
            },
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
    }
}


export async function POST(request: Request) {
    try {
        const body = await request.json()
        log(`Received POST request for employee creation: ${JSON.stringify(body)}`)

        if (body.Email) {
            const { data: existingByEmail } = await supabase
                .from("Employee")
                .select("*")
                .eq("Email", body.Email)
                .maybeSingle()

            if (existingByEmail) {
                return NextResponse.json(existingByEmail, { status: 200 })
            }
        }

        const slug = await buildUniqueSlug(body.FirstName, body.LastName)
        log(`Generated slug: ${slug}`)

        const newEmployeeId = crypto.randomUUID();
        const { error: insertError } = await supabase.from("Employee").insert({
            EmployeeID: newEmployeeId,
            FirstName: body.FirstName,
            LastName: body.LastName,
            Email: body.Email,
            Slug: slug,
            Department: body.Department,
            StartDate: new Date(body.StartDate || new Date().toISOString()).toISOString(),
            Status: 'Active', // Explicitly set default
            updatedAt: new Date().toISOString()
        });

        if (insertError) throw insertError;
        log(`Employee created successfully: ${newEmployeeId}`)

        const { data: employee } = await supabase.from("Employee").select("*").eq("EmployeeID", newEmployeeId).single();

        return NextResponse.json(employee, { status: 201 })
    } catch (error: any) {
        log(`Error creating employee: ${error.message}`)
        console.error('Error creating employee:', error)
        return NextResponse.json({ error: error.message || 'Failed to create employee' }, { status: 500 })
    }
}
