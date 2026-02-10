
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { utils, write } from "xlsx";

export async function GET() {
    try {
        const assets = await prisma.asset.findMany({
            include: {
                AssetModel: {
                    include: { Manufacturer: true }
                },
                assignments: {
                    where: { Status: "Active" },
                    include: { Employee: true },
                    take: 1
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const data = assets.map(a => ({
            "Asset Tag": a.AssetTag,
            "Serial Number": a.SerialNumber,
            "Manufacturer": a.AssetModel?.Manufacturer?.Name || "",
            "Model": a.AssetModel?.Name || "",
            "Status": a.Status,
            "Condition": a.Condition,
            "Location": a.Location,
            "Assigned To": a.assignments[0]?.Employee ? `${a.assignments[0].Employee.FirstName} ${a.assignments[0].Employee.LastName}` : "",
            "Notes": a.Notes
        }));

        const wb = utils.book_new();
        const ws = utils.json_to_sheet(data);
        utils.book_append_sheet(wb, ws, "Assets");

        const buf = write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buf, {
            headers: {
                "Content-Disposition": 'attachment; filename="assets_export.xlsx"',
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
        });

    } catch (e) {
        console.error("Export failed:", e);
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
    }
}
