import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const modelId = params.id

    const [{ data: model }, { data: history }, { data: locations }] = await Promise.all([
        supabase
            .from('AssetModel')
            .select('*, Manufacturer:ManufacturerID(Name)')
            .eq('ModelID', modelId)
            .single(),
        supabase
            .from('InventoryRecord')
            .select('*, StorageLocation:StorageLocationID(Name)')
            .eq('ModelID', modelId)
            .order('CreatedAt', { ascending: true }),
        supabase
            .from('StorageLocation')
            .select('LocationID, Name')
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

    const locationMap = (locations || []).reduce((map: Record<string, string>, location: any) => {
        map[location.LocationID] = location.Name;
        return map;
    }, {});

    const { data: familyModels, error: familyModelsError } = await supabase
        .from("AssetModel")
        .select("ModelID, Name, Category, Color, ManufacturerID, Series, DefaultLocationID, AvailableStock, AssignedStock, TotalStock")
        .eq("Name", model.Name)
        .eq("ManufacturerID", model.ManufacturerID)
        .eq("Category", model.Category)
        .order("Color", { ascending: true });

    if (familyModelsError) {
        console.warn("Family model lookup unavailable in /api/models/[id]:", familyModelsError.message);
    }

    const colorSummaries = (familyModels || [model]).reduce((summaries: any[], familyModel: any) => {
        const colorKey = familyModel.Color || "Unspecified";
        const stockLocation = familyModel.DefaultLocationID
            ? (locationMap[familyModel.DefaultLocationID] || "Unassigned")
            : "Unassigned";
        const existing = summaries.find((summary) => summary.color === colorKey);

        if (existing) {
            existing.availableStock += familyModel.AvailableStock || 0;
            existing.assignedStock += familyModel.AssignedStock || 0;
            existing.totalStock += familyModel.TotalStock || 0;
            existing.modelIds.push(familyModel.ModelID);
            existing.locationStocks[stockLocation] = (existing.locationStocks[stockLocation] || 0) + (familyModel.AvailableStock || 0);
            if (familyModel.Series && !existing.series.includes(familyModel.Series)) {
                existing.series.push(familyModel.Series);
            }
            return summaries;
        }

        summaries.push({
            color: colorKey,
            availableStock: familyModel.AvailableStock || 0,
            assignedStock: familyModel.AssignedStock || 0,
            totalStock: familyModel.TotalStock || 0,
            modelIds: [familyModel.ModelID],
            series: familyModel.Series ? [familyModel.Series] : [],
            locationStocks: {
                [stockLocation]: familyModel.AvailableStock || 0,
            },
        });
        return summaries;
    }, [] as any[]);

    return NextResponse.json({
        model: {
            ...model,
            ModelPhotos: mergedPhotos,
            ColorSummaries: colorSummaries,
        },
        history: history || [],
    })
}
