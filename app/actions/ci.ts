
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Fetch CIs with Model details
export async function getConfigurationItems() {
    try {
        const cis = await prisma.asset.findMany({
            take: 100, // Limit to 100 latest items for performance
            orderBy: { createdAt: "desc" },
            include: {
                AssetModel: {
                    include: {
                        Manufacturer: true,
                    },
                },
            },
        });
        return cis;
    } catch (error) {
        console.error("Error fetching CIs:", error);
        return [];
    }
}

// Create a new CI
export async function createConfigurationItem(formData: FormData) {

    const modelId = formData.get("modelId") as string;
    const serialNumber = formData.get("serialNumber") as string;
    const assetTag = formData.get("assetTag") as string;
    const status = formData.get("status") as string;
    const condition = formData.get("condition") as string;
    const location = formData.get("location") as string;

    if (!modelId || !serialNumber) {
        throw new Error("Model and Serial Number are required");
    }

    try {
        // Fetch model to get deprecated fields if needed, or just let them be null/legacy
        // We should strictly use ModelID now.

        // Check if Serial already exists
        const existing = await prisma.asset.findUnique({ where: { SerialNumber: serialNumber } });
        if (existing) {
            return { success: false, error: "Serial Number already exists" };
        }

        await prisma.asset.create({
            data: {
                ModelID: modelId,
                SerialNumber: serialNumber,
                AssetTag: assetTag || serialNumber, // Default to serial if no tag
                DeviceTag: assetTag || serialNumber, // Legacy field sync
                Status: status || "Available",
                Condition: condition || "New",
                Location: location,
                // Legacy fields - optional: we could populate them for backward compat if purely reading legacy code
                // But the goal is to stop using them.
            },
        });
        return { success: true };
    } catch (error) {
        console.error("Error creating CI:", error);
        return { success: false, error: "Failed to create CI" };
    }
}
