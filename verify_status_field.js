require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
    console.log("Verifying AssetModel Status column...")

    // Check if column exists
    const { data: cols, error: colError } = await supabase.rpc('exec_raw_sql', {
        query: "SELECT column_name FROM information_schema.columns WHERE table_name = 'AssetModel' AND column_name = 'Status';"
    })

    if (colError) {
        console.error("Error checking column:", colError)
        return
    }

    if (cols && cols.length > 0) {
        console.log("SUCCESS: 'Status' column exists in AssetModel table.")
    } else {
        console.error("FAILURE: 'Status' column NOT found in AssetModel table.")
    }

    // Try a test insert (with a random ID to avoid collisions)
    const testId = crypto.randomUUID()
    console.log(`Testing insert into AssetModel with Status... (ID: ${testId})`)

    // We need a manufacturer ID for the insert
    const { data: mfrs } = await supabase.from('Manufacturer').select('ManufacturerID').limit(1)
    if (!mfrs || mfrs.length === 0) {
        console.error("No manufacturers found to run test insert.")
        return
    }
    const mfrId = mfrs[0].ManufacturerID

    const { error: insertError } = await supabase.from('AssetModel').insert({
        ModelID: testId,
        Name: 'Test Model Status',
        Category: 'Laptop',
        ManufacturerID: mfrId,
        Status: 'New',
        updatedAt: new Date().toISOString()
    })

    if (insertError) {
        console.error("Error during test insert:", insertError)
    } else {
        console.log("SUCCESS: Test insert with Status worked.")

        // Verify the data
        const { data: retrieved, error: fetchError } = await supabase
            .from('AssetModel')
            .select('Status')
            .eq('ModelID', testId)
            .single()

        if (fetchError) {
            console.error("Error fetching test model:", fetchError)
        } else if (retrieved.Status === 'New') {
            console.log("SUCCESS: Retrieved Status matches inserted Status.")
        } else {
            console.error(`FAILURE: Retrieved Status (${retrieved.Status}) does not match inserted Status (New).`)
        }

        // Cleanup
        await supabase.from('AssetModel').delete().eq('ModelID', testId)
        console.log("Cleanup: Test model deleted.")
    }
}

verify()
