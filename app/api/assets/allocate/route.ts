import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: Request) {
    const startedAt = Date.now()
    try {
        const body = await request.json()
        const modelId = body?.modelId as string | undefined
        const locationId = body?.locationId as string | undefined
        const reuseExisting = Boolean(body?.reuseExisting)

        if (!modelId) {
            const response = NextResponse.json({ error: 'modelId is required' }, { status: 400 })
            response.headers.set('x-api-duration-ms', String(Date.now() - startedAt))
            response.headers.set('x-api-route', '/api/assets/allocate')
            return response
        }

        // If requested, try to reuse an existing available asset first.
        if (reuseExisting) {
            let existingQuery = supabaseAdmin
                .from('Asset')
                .select('*')
                .eq('ModelID', modelId)
                .in('Status', ['Available', 'In Stock', 'Stock', 'In-Stock'])
                .order('createdAt', { ascending: false })
                .limit(1)

            if (locationId) {
                existingQuery = existingQuery.eq('StorageLocationID', locationId)
            }

            const { data: existingAssets } = await existingQuery
            if (existingAssets && existingAssets.length > 0) {
                const response = NextResponse.json(existingAssets[0], { status: 200 })
                response.headers.set('x-api-duration-ms', String(Date.now() - startedAt))
                response.headers.set('x-api-route', '/api/assets/allocate')
                return response
            }
        }

        // Try atomic function next (transactional create + decrement)
        const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('allocate_asset_atomic', {
            p_model_id: modelId,
            p_location_id: locationId || null
        })

        if (!rpcError && rpcResult?.success === true && rpcResult.assetId) {
            const { data: asset } = await supabaseAdmin
                .from('Asset')
                .select('*')
                .eq('AssetID', rpcResult.assetId)
                .single()

            const response = NextResponse.json(asset, { status: 201 })
            response.headers.set('x-api-duration-ms', String(Date.now() - startedAt))
            response.headers.set('x-api-route', '/api/assets/allocate')
            return response
        }

        if (rpcResult?.success === false) {
            const response = NextResponse.json({ error: rpcResult.error }, { status: 409 })
            response.headers.set('x-api-duration-ms', String(Date.now() - startedAt))
            response.headers.set('x-api-route', '/api/assets/allocate')
            return response
        }

        // Fallback: legacy non-atomic path
        const { data: model, error: modelError } = await supabaseAdmin
            .from('AssetModel')
            .select('ModelID, Name, Category, AvailableStock, DefaultLocationID, Manufacturer:ManufacturerID(Name)')
            .eq('ModelID', modelId)
            .single()

        if (modelError || !model) {
            const response = NextResponse.json({ error: 'Model not found' }, { status: 404 })
            response.headers.set('x-api-duration-ms', String(Date.now() - startedAt))
            response.headers.set('x-api-route', '/api/assets/allocate')
            return response
        }

        if ((model.AvailableStock || 0) <= 0) {
            const response = NextResponse.json({ error: 'No available stock remaining for this model' }, { status: 409 })
            response.headers.set('x-api-duration-ms', String(Date.now() - startedAt))
            response.headers.set('x-api-route', '/api/assets/allocate')
            return response
        }

        const storageLocationId = locationId || model.DefaultLocationID || null

        const { data: statusRows, error: statusError } = await supabaseAdmin
            .from('AssetStatus')
            .select('Name')

        if (statusError) {
            const response = NextResponse.json({ error: statusError.message || 'Failed to read AssetStatus' }, { status: 500 })
            response.headers.set('x-api-duration-ms', String(Date.now() - startedAt))
            response.headers.set('x-api-route', '/api/assets/allocate')
            return response
        }

        const statusNames = new Set((statusRows || []).map((row: any) => row.Name))
        const preferredStatus = ['Available', 'In Stock', 'Stock', 'In-Stock']
        const availableStatus = preferredStatus.find((name) => statusNames.has(name))

        if (!availableStatus) {
            const response = NextResponse.json(
                { error: 'AssetStatus is missing an available status (e.g. "Available" or "In Stock"). Please seed AssetStatus first.' },
                { status: 409 }
            )
            response.headers.set('x-api-duration-ms', String(Date.now() - startedAt))
            response.headers.set('x-api-route', '/api/assets/allocate')
            return response
        }

        const assetName = `${model.Manufacturer?.Name || ''} ${model.Name || ''}`.trim() || model.Name || 'Asset'
        const newAssetId = crypto.randomUUID()

        const { data: inserted, error: insertError } = await supabaseAdmin
            .from('Asset')
            .insert({
                AssetID: newAssetId,
                ModelID: model.ModelID,
                AssetName: assetName,
                AssetType: model.Category || null,
                OwnershipType: 'Individual',
                Status: availableStatus,
                StorageLocationID: storageLocationId,
                updatedAt: new Date().toISOString(),
            })
            .select('*')
            .single()

        if (insertError || !inserted) {
            const response = NextResponse.json({ error: insertError?.message || 'Failed to create asset' }, { status: 500 })
            response.headers.set('x-api-duration-ms', String(Date.now() - startedAt))
            response.headers.set('x-api-route', '/api/assets/allocate')
            return response
        }

        const response = NextResponse.json(inserted, { status: 201 })
        response.headers.set('x-api-duration-ms', String(Date.now() - startedAt))
        response.headers.set('x-api-route', '/api/assets/allocate')
        return response
    } catch (error: any) {
        console.error('Failed to allocate asset:', error)
        const response = NextResponse.json({ error: error.message || 'Failed to allocate asset' }, { status: 500 })
        response.headers.set('x-api-duration-ms', String(Date.now() - startedAt))
        response.headers.set('x-api-route', '/api/assets/allocate')
        return response
    }
}
