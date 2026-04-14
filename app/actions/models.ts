"use server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { revalidatePath } from "next/cache";

type ModelPhotoInput = {
    url?: string;
    URL?: string;
    category?: string;
    Category?: string;
};

function normalizeModelPhotoPayload(rawValue: FormDataEntryValue | null) {
    if (!rawValue) return [];

    try {
        const parsed = JSON.parse(rawValue.toString());
        if (!Array.isArray(parsed)) return [];

        return parsed
            .map((photo: ModelPhotoInput, index: number) => ({
                URL: photo.URL || photo.url || "",
                Category: photo.Category || photo.category || "Reference",
                SortOrder: index,
            }))
            .filter((photo) => Boolean(photo.URL));
    } catch (error) {
        console.error("Failed to parse model photo payload:", error);
        return [];
    }
}

function mergeLegacyImageWithPhotos(model: any, photos: any[]) {
    const normalizedPhotos = Array.isArray(photos) ? [...photos] : [];
    const hasPrimaryPhoto = normalizedPhotos.some((photo) => photo.URL === model.ImageURL);

    if (model.ImageURL && !hasPrimaryPhoto) {
        normalizedPhotos.unshift({
            PhotoID: `legacy-${model.ModelID}`,
            ModelID: model.ModelID,
            URL: model.ImageURL,
            Category: "Reference",
            SortOrder: -1,
        });
    }

    return normalizedPhotos.sort((left, right) => {
        const leftOrder = typeof left.SortOrder === "number" ? left.SortOrder : 9999;
        const rightOrder = typeof right.SortOrder === "number" ? right.SortOrder : 9999;
        return leftOrder - rightOrder;
    });
}

async function fetchModelPhotos(modelIds: string[]) {
    const validIds = modelIds.filter(Boolean);
    if (validIds.length === 0) return new Map<string, any[]>();

    const { data, error } = await supabaseAdmin
        .from("ModelPhoto")
        .select("*")
        .in("ModelID", validIds)
        .order("SortOrder", { ascending: true })
        .order("createdAt", { ascending: true });

    if (error) {
        console.warn("ModelPhoto lookup unavailable, falling back to ImageURL only:", error.message);
        return new Map<string, any[]>();
    }

    return (data || []).reduce((map, photo: any) => {
        const current = map.get(photo.ModelID) || [];
        current.push(photo);
        map.set(photo.ModelID, current);
        return map;
    }, new Map<string, any[]>());
}

async function syncModelPhotos(modelId: string, rawValue: FormDataEntryValue | null, fallbackPrimaryUrl: string | null) {
    const normalizedPhotos = normalizeModelPhotoPayload(rawValue);
    const photosToPersist = normalizedPhotos.length > 0
        ? normalizedPhotos
        : (fallbackPrimaryUrl ? [{ URL: fallbackPrimaryUrl, Category: "Reference", SortOrder: 0 }] : []);

    const deleteResult = await supabaseAdmin.from("ModelPhoto").delete().eq("ModelID", modelId);
    if (deleteResult.error) {
        console.warn("ModelPhoto delete skipped:", deleteResult.error.message);
        return;
    }

    if (photosToPersist.length === 0) return;

    const insertResult = await supabaseAdmin.from("ModelPhoto").insert(
        photosToPersist.map((photo) => ({
            PhotoID: crypto.randomUUID(),
            ModelID: modelId,
            URL: photo.URL,
            Category: photo.Category || "Reference",
            SortOrder: photo.SortOrder ?? 0,
            UploadedBy: null,
        }))
    );

    if (insertResult.error) {
        console.warn("ModelPhoto insert skipped:", insertResult.error.message);
    }
}

// Fetch all models
export async function getAssetModels() {
    try {
        console.log("FETCHING MODELS...");
        const modelsRes = await supabaseAdmin.from("AssetModel").select("*").order("Name", { ascending: true }).limit(100);
        console.log("MODELS RES:", modelsRes.error, modelsRes.data?.length);

        const mfrsRes = await supabaseAdmin.from("Manufacturer").select("ManufacturerID, Name");
        const modelIds = (modelsRes.data || []).map((m: any) => m.ModelID);
        const assetsRes = modelIds.length > 0
            ? await supabaseAdmin.from("Asset").select("ModelID, StorageLocationID").in("ModelID", modelIds)
            : { data: [], error: null };
        const invRes = modelIds.length > 0
            ? await supabaseAdmin.from("InventoryRecord").select("ModelID, StorageLocationID, ActionType, CreatedAt").in("ModelID", modelIds)
            : { data: [], error: null };
        const locsRes = await supabaseAdmin.from("StorageLocation").select("LocationID, Name");

        if (modelsRes.error) {
            console.error("Models Error", modelsRes.error);
            throw modelsRes.error;
        }

        const models = modelsRes.data || [];
        const mfrs = mfrsRes.data || [];
        const assets = assetsRes.data || [];
        const inventory = invRes.data || [];
        const locations = locsRes.data || [];
        const photoMap = await fetchModelPhotos(models.map((model: any) => model.ModelID));

        // Map location IDs to names
        const locMap: Record<string, string> = {};
        for (const loc of locations) {
            locMap[loc.LocationID] = loc.Name;
        }

        return models.map((m: any) => {
            const manufacturer = mfrs.find((mfr: any) => mfr.ManufacturerID === m.ManufacturerID) || { Name: 'Unknown' };
            const assetList = assets.filter((a: any) => a.ModelID === m.ModelID);
            const assetCount = assetList.length;

            // Use DefaultLocationID if set, otherwise fallback to finding any associated location
            const defaultLocName = m.DefaultLocationID ? locMap[m.DefaultLocationID] : null;

            // Gather all distinct location IDs from both assets and inventory records for this model
            const modelLocIds = new Set<string>();

            if (m.DefaultLocationID) modelLocIds.add(m.DefaultLocationID);

            assetList.forEach((a: any) => {
                if (a.StorageLocationID) modelLocIds.add(a.StorageLocationID);
            });

            inventory.filter((inv: any) => inv.ModelID === m.ModelID).forEach((inv: any) => {
                if (inv.StorageLocationID) modelLocIds.add(inv.StorageLocationID);
            });

            const modelLocationNames = Array.from(modelLocIds)
                .map(id => locMap[id])
                .filter(Boolean);
            const modelPhotos = mergeLegacyImageWithPhotos(m, photoMap.get(m.ModelID) || []);
            const incomingRecords = inventory
                .filter((inv: any) => inv.ModelID === m.ModelID && ["ADD", "OPENING_STOCK", "ADJUST_OPENING_STOCK", "ADJUST_PURCHASE"].includes(inv.ActionType));

            const latestIncomingRecord = incomingRecords
                .filter((inv: any) => ["ADD", "OPENING_STOCK"].includes(inv.ActionType))
                .sort((left: any, right: any) => new Date(right.CreatedAt).getTime() - new Date(left.CreatedAt).getTime())[0] || null;

            const intakeDates = Array.from(new Set(incomingRecords.map((inv: any) => {
                const baseDate = inv.PurchaseDate ? new Date(inv.PurchaseDate) : new Date(inv.CreatedAt);
                return baseDate.toISOString().split('T')[0];
            })));

            return {
                ...m,
                Manufacturer: manufacturer,
                ModelPhotos: modelPhotos,
                LastIncomingActionType: latestIncomingRecord?.ActionType || null,
                IntakeDates: intakeDates,
                DefaultLocationName: defaultLocName,
                locations: modelLocationNames,
                _count: {
                    assets: assetCount
                }
            };
        });
    } catch (error) {
        console.error("Error fetching models:", error);
        return [];
    }
}

// Duplicate a model
export async function duplicateModel(modelId: string) {
    try {
        const { data: existing, error: fetchError } = await supabaseAdmin
            .from("AssetModel")
            .select("*")
            .eq("ModelID", modelId)
            .single();
        const { data: existingPhotos } = await supabaseAdmin
            .from("ModelPhoto")
            .select("*")
            .eq("ModelID", modelId)
            .order("SortOrder", { ascending: true })
            .order("createdAt", { ascending: true });

        if (fetchError || !existing) {
            return { success: false, error: "Model not found" };
        }

        const newId = crypto.randomUUID();
        const { error: insertError } = await supabaseAdmin.from("AssetModel").insert({
            ModelID: newId,
            Name: `${existing.Name} (Copy)`,
            ModelNumber: existing.ModelNumber,
            Category: existing.Category,
            ManufacturerID: existing.ManufacturerID,
            Description: existing.Description,
            ImageURL: existing.ImageURL,
            PurchaseDate: existing.PurchaseDate,
            EOLDate: existing.EOLDate,
            updatedAt: new Date().toISOString()
        });

        if (insertError) throw insertError;

        await syncModelPhotos(newId, JSON.stringify(existingPhotos || []), existing.ImageURL || null);

        return { success: true, newModelId: newId };
    } catch (error) {
        console.error("Error duplicating model:", error);
        return { success: false, error: "Failed to duplicate model" };
    }
}

// Create a new model
export async function createModelAction(formData: FormData) {
    const name = formData.get("name")?.toString();
    const manufacturerId = formData.get("manufacturerId")?.toString();
    const category = formData.get("category")?.toString();
    const series = formData.get("series")?.toString() || null;

    if (!name || !manufacturerId || !category) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        const newId = crypto.randomUUID();
        const primaryImageUrl = formData.get("imageUrl")?.toString() || null;
        const purchaseDate = formData.get("purchaseDate")?.toString() || null;
        const initialExistingStockStr = formData.get("initialExistingStock")?.toString() || "0";
        const initialExistingStock = Math.max(0, parseInt(initialExistingStockStr, 10) || 0);
        const initialExistingStockDate = formData.get("initialExistingStockDate")?.toString() || null;
        const initialExistingStockNotes = formData.get("initialExistingStockNotes")?.toString() || null;
        const { error } = await supabaseAdmin.from("AssetModel").insert({
            ModelID: newId,
            Name: name,
            Series: series,
            ManufacturerID: manufacturerId,
            Category: category,
            Color: formData.get("color")?.toString() || null,
            ImageURL: primaryImageUrl,
            PurchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : null,
            TotalStock: initialExistingStock,
            AvailableStock: initialExistingStock,
            AssignedStock: 0,
            Status: formData.get("status")?.toString() || null,
            DefaultLocationID: formData.get("defaultLocationId")?.toString() || null,
            updatedAt: new Date().toISOString()
        });

        if (error) {
            console.error("Supabase insert error:", error);
            return { success: false, error: error.message };
        }

        await syncModelPhotos(newId, formData.get("photos"), primaryImageUrl);

        if (initialExistingStock > 0) {
            const { error: openingStockError } = await supabaseAdmin
                .from("InventoryRecord")
                .insert({
                    RecordID: crypto.randomUUID(),
                    ModelID: newId,
                    Quantity: initialExistingStock,
                    ActionType: "OPENING_STOCK",
                    PurchaseDate: initialExistingStockDate ? new Date(initialExistingStockDate).toISOString() : null,
                    StorageLocationID: formData.get("defaultLocationId")?.toString() || null,
                    Notes: initialExistingStockNotes || "Initial existing stock captured during model creation",
                    CreatedAt: new Date().toISOString()
                });

            if (openingStockError) {
                console.error("Model created but opening stock history failed:", openingStockError);
            }
        }

        revalidatePath("/inventory/cmdb/models");
        revalidatePath(`/inventory/cmdb/models/${newId}`);
        return { success: true, newModelId: newId };
    } catch (error: any) {
        console.error("Error creating model:", error);
        return { success: false, error: error.message || "Failed to create model" };
    }
}

// Update an existing model
export async function updateModelAction(modelId: string, formData: FormData) {
    const name = formData.get("name")?.toString();
    const manufacturerId = formData.get("manufacturerId")?.toString();
    const category = formData.get("category")?.toString();
    const series = formData.get("series")?.toString() || null;
    const reorderLevelStr = formData.get("reorderLevel")?.toString();
    const reorderLevel = reorderLevelStr ? Math.max(0, parseInt(reorderLevelStr, 10)) : 0;

    if (!name || !manufacturerId || !category) {
        return { success: false, error: "Missing required fields" };
    }

    try {
        const primaryImageUrl = formData.get("imageUrl")?.toString() || null;
        const purchaseDate = formData.get("purchaseDate")?.toString() || null;
        const initialExistingStockStr = formData.get("initialExistingStock")?.toString() || "0";
        const initialExistingStock = Math.max(0, parseInt(initialExistingStockStr, 10) || 0);
        const initialExistingStockDate = formData.get("initialExistingStockDate")?.toString() || null;
        const initialExistingStockNotes = formData.get("initialExistingStockNotes")?.toString() || null;
        const { data: existingModel, error: existingModelError } = await supabaseAdmin
            .from("AssetModel")
            .select("TotalStock, AvailableStock, AssignedStock")
            .eq("ModelID", modelId)
            .single();

        if (existingModelError || !existingModel) {
            return { success: false, error: "Model not found" };
        }

        const { error } = await supabaseAdmin.from("AssetModel").update({
            Name: name,
            Series: series,
            ManufacturerID: manufacturerId,
            Category: category,
            Color: formData.get("color")?.toString() || null,
            ImageURL: primaryImageUrl,
            PurchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : null,
            TotalStock: existingModel.TotalStock === 0 && initialExistingStock > 0 ? initialExistingStock : existingModel.TotalStock,
            AvailableStock: existingModel.TotalStock === 0 && initialExistingStock > 0 ? initialExistingStock : existingModel.AvailableStock,
            Status: formData.get("status")?.toString() || null,
            ReorderLevel: reorderLevel,
            DefaultLocationID: formData.get("defaultLocationId")?.toString() || null,
            updatedAt: new Date().toISOString()
        }).eq('ModelID', modelId);

        if (error) {
            console.error("Supabase update error:", error);
            return { success: false, error: error.message };
        }

        await syncModelPhotos(modelId, formData.get("photos"), primaryImageUrl);

        if (existingModel.TotalStock === 0 && initialExistingStock > 0) {
            const { error: openingStockError } = await supabaseAdmin
                .from("InventoryRecord")
                .insert({
                    RecordID: crypto.randomUUID(),
                    ModelID: modelId,
                    Quantity: initialExistingStock,
                    ActionType: "OPENING_STOCK",
                    PurchaseDate: initialExistingStockDate ? new Date(initialExistingStockDate).toISOString() : null,
                    StorageLocationID: formData.get("defaultLocationId")?.toString() || null,
                    Notes: initialExistingStockNotes || "Initial existing stock captured during model edit",
                    CreatedAt: new Date().toISOString()
                });

            if (openingStockError) {
                console.error("Model updated but opening stock history failed:", openingStockError);
            }
        }

        revalidatePath("/inventory/cmdb/models");
        revalidatePath(`/inventory/cmdb/models/${modelId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error updating model:", error);
        return { success: false, error: error.message || "Failed to update model" };
    }
}

// Check dependencies before deleting a model
export async function checkModelDependencies(modelId: string) {
    try {
        const { count, error } = await supabaseAdmin
            .from("Asset")
            .select("*", { count: "exact", head: true })
            .eq("ModelID", modelId);

        if (error) throw error;

        return { success: true, count: count || 0 };
    } catch (error: any) {
        console.error("Error checking model dependencies:", error);
        return { success: false, error: "Failed to check dependencies" };
    }
}

// Delete a model
export async function deleteModel(modelId: string, force: boolean = false) {
    try {
        if (force) {
            // First delete associated assets (InventoryRecords should cascade via DB schema, but we can explicitly delete Assets to be safe as that might be what's blocking)
            const { error: assetError } = await supabaseAdmin
                .from("Asset")
                .delete()
                .eq("ModelID", modelId);

            if (assetError) {
                console.error("Failed to force delete associated assets:", assetError);
                return { success: false, error: "Failed to delete associated assets during force delete." };
            }
        }

        const { error } = await supabaseAdmin
            .from("AssetModel")
            .delete()
            .eq("ModelID", modelId);

        if (error) {
            console.error("Supabase delete error:", error);
            // Handling foreign key constraint gracefully
            if (error.code === '23503') {
                return { success: false, error: "Cannot delete model because it is associated with existing assets." };
            }
            return { success: false, error: error.message };
        }

        revalidatePath("/inventory/cmdb/models");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting model:", error);
        return { success: false, error: "Failed to delete model" };
    }
}

export async function addStockAction(formData: FormData) {
    const modelId = formData.get("modelId")?.toString();
    const quantityStr = formData.get("quantity")?.toString();
    const purchaseDate = formData.get("purchaseDate")?.toString() || null;
    const storageLocationId = formData.get("storageLocationId")?.toString() || null;
    const notes = formData.get("notes")?.toString() || null;
    const entryType = formData.get("entryType")?.toString() || "purchase";

    if (!modelId || !quantityStr) {
        return { success: false, error: "Missing required fields" };
    }

    const quantity = parseInt(quantityStr, 10);
    if (isNaN(quantity) || quantity <= 0) {
        return { success: false, error: "Quantity must be a positive integer" };
    }

    try {
        const { data: model, error: fetchError } = await supabaseAdmin
            .from("AssetModel")
            .select("TotalStock, AvailableStock, DefaultLocationID")
            .eq("ModelID", modelId)
            .single();

        if (fetchError || !model) throw new Error("Model not found");

        const newTotalStock = (model.TotalStock || 0) + quantity;
        const newAvailableStock = (model.AvailableStock || 0) + quantity;

        // Use provided location or fall back to model's default
        const effectiveLocationId = storageLocationId || model.DefaultLocationID;

        const { error: updateError } = await supabaseAdmin
            .from("AssetModel")
            .update({
                TotalStock: newTotalStock,
                AvailableStock: newAvailableStock,
                DefaultLocationID: effectiveLocationId,
                updatedAt: new Date().toISOString()
            })
            .eq("ModelID", modelId);

        if (updateError) throw updateError;

        const { error: recordError } = await supabaseAdmin
            .from("InventoryRecord")
            .insert({
                RecordID: crypto.randomUUID(),
                ModelID: modelId,
                Quantity: quantity,
                ActionType: entryType === "opening_stock" ? "OPENING_STOCK" : "ADD",
                PurchaseDate: purchaseDate,
                StorageLocationID: effectiveLocationId,
                Notes: notes,
                CreatedAt: new Date().toISOString()
            });

        if (recordError) {
            console.error("Created stock but failed to log record:", recordError);
        }

        revalidatePath("/inventory/cmdb/models");
        return { success: true };
    } catch (error: any) {
        console.error("Error adding stock:", error);
        return { success: false, error: error.message || "Failed to add stock" };
    }
}

export async function adjustStockAction(formData: FormData) {
    const modelId = formData.get("modelId")?.toString();
    const currentStockStr = formData.get("currentStock")?.toString();
    const newStockStr = formData.get("newStock")?.toString();
    const differenceStr = formData.get("difference")?.toString();
    const storageLocationId = formData.get("storageLocationId")?.toString();
    const reason = formData.get("reason")?.toString() || "adjustment";
    const notes = formData.get("notes")?.toString() || null;
    const adjustmentScope = formData.get("adjustmentScope")?.toString() || "opening_stock";

    if (!modelId || newStockStr === undefined || differenceStr === undefined) {
        return { success: false, error: "Missing required fields" };
    }

    const newStock = parseInt(newStockStr, 10);
    const difference = parseInt(differenceStr, 10);

    if (isNaN(newStock) || newStock < 0) {
        return { success: false, error: "Invalid stock value" };
    }

    try {
        const { data: model, error: fetchError } = await supabaseAdmin
            .from("AssetModel")
            .select("TotalStock, AvailableStock, AssignedStock, DefaultLocationID")
            .eq("ModelID", modelId)
            .single();

        if (fetchError || !model) throw new Error("Model not found");

        if (difference !== 0) {
            // Only update stock counts when there is an actual change
            const assignedStock = model.AssignedStock || 0;
            const newAvailable = Math.max(0, newStock - assignedStock);

            // Use provided location or fall back to model's default
            const effectiveLocationId = storageLocationId || model.DefaultLocationID;

            const { error: updateError } = await supabaseAdmin
                .from("AssetModel")
                .update({
                    TotalStock: newStock,
                    AvailableStock: newAvailable,
                    DefaultLocationID: effectiveLocationId,
                    updatedAt: new Date().toISOString()
                })
                .eq("ModelID", modelId);

            if (updateError) throw updateError;
        }

        // Log the adjustment (includes location-only changes)
        const actionType = difference === 0
            ? "LOCATION_CHANGE"
            : (adjustmentScope === "purchase" ? "ADJUST_PURCHASE" : "ADJUST_OPENING_STOCK");
        const effectiveLocationId = storageLocationId || model.DefaultLocationID;

        await supabaseAdmin.from("InventoryRecord").insert({
            RecordID: crypto.randomUUID(),
            ModelID: modelId,
            Quantity: difference,
            ActionType: actionType,
            StorageLocationID: effectiveLocationId,
            Notes: `Scope: ${adjustmentScope === "purchase" ? "Purchase Stock" : "Opening Stock"} | Reason: ${reason}${notes ? ` — ${notes}` : ""}`,
            CreatedAt: new Date().toISOString()
        });

        revalidatePath("/inventory/cmdb/models");
        return { success: true };
    } catch (error: any) {
        console.error("Error adjusting stock:", error);
        return { success: false, error: error.message || "Failed to adjust stock" };
    }
}
