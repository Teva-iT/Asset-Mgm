
"use server";

import { prisma } from "@/lib/db";
import { read, utils } from "xlsx";
import { revalidatePath } from "next/cache";

interface ImportResult {
    success: boolean;
    count?: number;
    errors?: string[];
}

export async function importAssets(formData: FormData): Promise<ImportResult> {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, errors: ["No file uploaded"] };
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const wb = read(buffer, { type: "buffer" });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const data: any[] = utils.sheet_to_json(ws);

        if (data.length === 0) {
            return { success: false, errors: ["Excel file is empty"] };
        }

        const errors: string[] = [];
        let successCount = 0;

        // Process each row
        for (const [index, row] of data.entries()) {
            const rowNum = index + 2; // Header is row 1
            const assetTag = row["Asset Tag"];
            const serialNumber = row["Serial Number"];
            const modelName = row["Model"];
            const status = row["Status"] || "Available";

            if (!modelName || !serialNumber) {
                errors.push(`Row ${rowNum}: Missing Model or Serial Number`);
                continue;
            }

            // Find valid Model
            const model = await prisma.assetModel.findFirst({
                where: { Name: modelName }
            });

            if (!model) {
                errors.push(`Row ${rowNum}: Model '${modelName}' not found. Please create it first.`);
                continue;
            }

            // Check Duplicate Serial
            const existing = await prisma.asset.findUnique({
                where: { SerialNumber: serialNumber }
            });

            if (existing) {
                errors.push(`Row ${rowNum}: Serial Number '${serialNumber}' already exists.`);
                continue;
            }

            try {
                await prisma.asset.create({
                    data: {
                        AssetTag: assetTag ? String(assetTag) : undefined,
                        SerialNumber: String(serialNumber),
                        ModelID: model.ModelID,
                        Status: status,
                        Condition: row["Condition"] || "Used",
                        Location: row["Location"] || null,
                        Notes: row["Notes"] || null,
                    }
                });
                successCount++;
            } catch (dbError) {
                console.error(`Row ${rowNum} DB Error:`, dbError);
                errors.push(`Row ${rowNum}: Database error saving asset.`);
            }
        }

        revalidatePath("/inventory");
        return {
            success: true,
            count: successCount,
            errors: errors.length > 0 ? errors : undefined
        };

    } catch (e) {
        console.error("Import failed:", e);
        return { success: false, errors: ["Failed to process Excel file"] };
    }
}
