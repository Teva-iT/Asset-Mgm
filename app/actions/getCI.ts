
import { prisma } from "@/lib/db";

export async function getCIById(id: string) {
    try {
        const ci = await prisma.asset.findUnique({
            where: { AssetID: id },
            include: {
                AssetModel: {
                    include: {
                        Manufacturer: true,
                    },
                },
                assignments: {
                    include: { Employee: true }
                },
                ScanHistory: {
                    orderBy: { ScannedAt: 'desc' },
                    take: 5
                }
            },
        });
        return ci;
    } catch (error) {
        console.error("Error fetching CI:", error);
        return null;
    }
}
