
import { prisma } from "@/lib/db";

// Fetch all models
export async function getAssetModels() {
    try {
        const models = await prisma.assetModel.findMany({
            take: 100, // Limit for performance
            orderBy: { Name: "asc" },
            include: {
                Manufacturer: true,
                _count: {
                    select: { assets: true },
                },
            },
        });
        return models;
    } catch (error) {
        console.error("Error fetching models:", error);
        return [];
    }
}

// Duplicate a model
export async function duplicateModel(modelId: string) {
    try {
        const existing = await prisma.assetModel.findUnique({
            where: { ModelID: modelId },
        });

        if (!existing) {
            return { success: false, error: "Model not found" };
        }

        const newModel = await prisma.assetModel.create({
            data: {
                Name: `${existing.Name} (Copy)`,
                ModelNumber: existing.ModelNumber,
                Category: existing.Category,
                ManufacturerID: existing.ManufacturerID,
                Description: existing.Description,
                ImageURL: existing.ImageURL,
                EOLDate: existing.EOLDate,
            },
        });

        return { success: true, newModelId: newModel.ModelID };
    } catch (error) {
        console.error("Error duplicating model:", error);
        return { success: false, error: "Failed to duplicate model" };
    }
}
