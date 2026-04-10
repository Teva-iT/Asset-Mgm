import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const modelId = params.id

    const [{ data: model }, { data: history }] = await Promise.all([
        supabase
            .from('AssetModel')
            .select('*, Manufacturer:ManufacturerID(Name)')
            .eq('ModelID', modelId)
            .single(),
        supabase
            .from('InventoryRecord')
            .select('*, StorageLocation:StorageLocationID(Name)')
            .eq('ModelID', modelId)
            .order('CreatedAt', { ascending: true })
    ])

    if (!model) return NextResponse.json({ error: 'Model not found' }, { status: 404 })

    const { data: photos, error: photosError } = await supabase
        .from("ModelPhoto")
        .select("*")
        .eq("ModelID", modelId)
        .order("SortOrder", { ascending: true })
        .order("createdAt", { ascending: true });

    const mergedPhotos = [...(photos || [])];
    if (model.ImageURL && !mergedPhotos.some((photo) => photo.URL === model.ImageURL)) {
        mergedPhotos.unshift({
            PhotoID: `legacy-${model.ModelID}`,
            ModelID: model.ModelID,
            URL: model.ImageURL,
            Category: "Reference",
            SortOrder: -1,
        });
    }

    if (photosError) {
        console.warn("ModelPhoto lookup unavailable in /api/models/[id]:", photosError.message);
    }

    return NextResponse.json({
        model: {
            ...model,
            ModelPhotos: mergedPhotos,
        },
        history: history || [],
    })
}
