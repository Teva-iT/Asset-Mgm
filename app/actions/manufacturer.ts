
"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Fetch all manufacturers
export async function getManufacturers() {
    try {
        const manufacturers = await prisma.manufacturer.findMany({
            take: 100, // Limit for performance
            orderBy: { Name: "asc" },
            include: {
                _count: {
                    select: { models: true },
                },
            },
        });
        return manufacturers;
    } catch (error) {
        console.error("Error fetching manufacturers:", error);
        return [];
    }
}

// Create a new manufacturer
export async function createManufacturer(formData: FormData) {

    const name = formData.get("name") as string;
    const website = formData.get("website") as string;
    const supportEmail = formData.get("supportEmail") as string;
    const supportPhone = formData.get("supportPhone") as string;

    if (!name) {
        throw new Error("Name is required");
    }

    try {
        await prisma.manufacturer.create({
            data: {
                Name: name,
                Website: website || null,
                SupportEmail: supportEmail || null,
                SupportPhone: supportPhone || null,
            },
        });
        return { success: true };
    } catch (error) {
        console.error("Error creating manufacturer:", error);
        return { success: false, error: "Failed to create manufacturer" };
    }
}
