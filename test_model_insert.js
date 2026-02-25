import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const { data: manufacturer } = await supabase.from('Manufacturer').select('*').limit(1).single()

    if (!manufacturer) {
        console.log("No manufacturer found.")
        return
    }

    console.log("Found manufacturer:", manufacturer.Name)

    const newId = crypto.randomUUID()
    const { data, error } = await supabase.from('AssetModel').insert({
        ModelID: newId,
        Name: 'Test Server Model',
        ManufacturerID: manufacturer.ManufacturerID,
        Category: 'Server',
        updatedAt: new Date().toISOString()
    }).select()

    if (error) {
        console.error("Insert Error:", error)
    } else {
        console.log("Insert Success:", data)
    }
}

run()
