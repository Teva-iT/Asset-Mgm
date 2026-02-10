
"use server";

import { prisma } from "@/lib/db";

export async function getProcurementRequests() {
    try {
        const requests = await prisma.procurementRequest.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                Vendor: true,
                items: {
                    include: {
                        // Link to Model would be via ModelID manually fetched or if we add relation to ProcurementItem
                        // Schema has ProcurementItem -> ModelID (String). 
                        // We didn't add relation in Schema for ModelID in ProcurementItem, just string?
                        // Wait, Schema:
                        // model ProcurementItem { ... ModelID String ... }
                        // It doesn't have @relation to AssetModel.
                        // We should fix that or just fetch it manually/optimistically.
                        // For now, let's just fetch requests.
                    }
                }
            },
        });
        return requests;
    } catch (error) {
        console.error("Error fetching procurement requests:", error);
        return [];
    }
}

export async function createProcurementRequest(formData: FormData) {

    const vendorId = formData.get("vendorId") as string;
    const note = formData.get("note") as string;
    // Simplified creation for now

    try {
        await prisma.procurementRequest.create({
            data: {
                RequesterUserID: "SYSTEM", // Replace with auth user
                VendorID: vendorId,
                Status: "PENDING",
                Notes: note
            }
        });
        return { success: true };
    } catch (e) {
        return { success: false, error: "Failed" };
    }
}
