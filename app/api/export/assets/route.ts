import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function normalizeText(value: unknown) {
    return String(value || "").trim().toLowerCase();
}

function getAssetRisk(status: string | null, condition: string | null) {
    const normalizedStatus = normalizeText(status);
    const normalizedCondition = normalizeText(condition);

    if (
        ["lost", "stolen", "missing"].includes(normalizedStatus) ||
        /(broken|damaged|faulty|defect|repair required)/i.test(normalizedCondition)
    ) {
        return {
            riskLevel: "Critical",
            alert: "Immediate attention required",
            indicator: "🔴 CRITICAL",
            action: "Investigate and resolve immediately",
            rank: 1,
        };
    }

    if (
        ["in repair", "repair", "reserved", "quarantine", "retired", "disposed"].includes(normalizedStatus) ||
        /(used|fair|worn|old)/i.test(normalizedCondition)
    ) {
        return {
            riskLevel: "Warning",
            alert: "Operational follow-up needed",
            indicator: "🟠 WARNING",
            action: "Review status and plan next step",
            rank: 2,
        };
    }

    if (
        ["assigned"].includes(normalizedStatus) ||
        /(good|opened|boxed)/i.test(normalizedCondition)
    ) {
        return {
            riskLevel: "Healthy",
            alert: "Asset is in normal operation",
            indicator: "🟢 OK",
            action: "No action needed",
            rank: 4,
        };
    }

    return {
        riskLevel: "Caution",
        alert: "Check asset details",
        indicator: "🟡 CAUTION",
        action: "Verify status or condition",
        rank: 3,
    };
}

function getRiskColors(riskLevel: string) {
    if (riskLevel === "Critical") return { fill: "FEE2E2", font: "991B1B" };
    if (riskLevel === "Warning") return { fill: "FFEDD5", font: "9A3412" };
    if (riskLevel === "Caution") return { fill: "FEF3C7", font: "92400E" };
    return { fill: "DCFCE7", font: "166534" };
}

function buildMiniBar(count: number, max: number) {
    if (max <= 0 || count <= 0) return "";
    const blocks = Math.max(1, Math.round((count / max) * 10));
    return "█".repeat(blocks);
}

function styleHeaderRow(row: ExcelJS.Row) {
    row.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1D4ED8" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
            top: { style: "thin", color: { argb: "BFDBFE" } },
            left: { style: "thin", color: { argb: "BFDBFE" } },
            bottom: { style: "thin", color: { argb: "BFDBFE" } },
            right: { style: "thin", color: { argb: "BFDBFE" } },
        };
    });
}

function styleRiskRow(row: ExcelJS.Row, riskLevel: string, riskColumnLetters: string[]) {
    const colors = getRiskColors(riskLevel);
    row.eachCell((cell) => {
        cell.border = {
            bottom: { style: "thin", color: { argb: "E5E7EB" } },
        };
    });

    riskColumnLetters.forEach((letter) => {
        const cell = row.getCell(letter);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.fill } };
        cell.font = { color: { argb: colors.font }, bold: true };
    });
}

function getColumnWidth(rows: Record<string, unknown>[], header: string) {
    const longestValue = Math.max(
        header.length,
        ...rows.map((row) => String(row[header] ?? "").length)
    );

    return Math.min(Math.max(longestValue + 2, 12), 36);
}

export async function GET() {
    try {
        const { data: assetsRaw, error } = await supabase
            .from("Asset")
            .select("*, AssetModel(*, Manufacturer(*)), assignments:Assignment(*, Employee(*))")
            .order("createdAt", { ascending: false });

        if (error) throw error;

        const assets = (assetsRaw || []).map((asset) => ({
            ...asset,
            assignments: (asset.assignments || []).filter((assignment: any) => assignment.Status === "Active").slice(0, 1),
        }));

        const exportRows = assets.map((asset) => {
            const risk = getAssetRisk(asset.Status, asset.Condition);

            return {
                "Asset Tag": asset.AssetTag || "",
                "Serial Number": asset.SerialNumber || "",
                "Manufacturer": asset.AssetModel?.Manufacturer?.Name || "",
                "Model": asset.AssetModel?.Name || "",
                "Risk Indicator": risk.indicator,
                "Risk Level": risk.riskLevel,
                "Priority Rank": risk.rank,
                "Alert Details": risk.alert,
                "Recommended Action": risk.action,
                "Status": asset.Status || "",
                "Condition": asset.Condition || "",
                "Location": asset.Location || "",
                "Assigned To": asset.assignments[0]?.Employee
                    ? `${asset.assignments[0].Employee.FirstName} ${asset.assignments[0].Employee.LastName}`
                    : "",
                "Notes": asset.Notes || "",
            };
        }).sort((left, right) => {
            if (left["Priority Rank"] !== right["Priority Rank"]) {
                return Number(left["Priority Rank"]) - Number(right["Priority Rank"]);
            }

            return String(left["Model"]).localeCompare(String(right["Model"]));
        });

        const alertRows = exportRows.filter((row) => row["Risk Level"] !== "Healthy");
        const maxAlertCount = Math.max(
            exportRows.filter((row) => row["Risk Level"] === "Critical").length,
            exportRows.filter((row) => row["Risk Level"] === "Warning").length,
            exportRows.filter((row) => row["Risk Level"] === "Caution").length,
            exportRows.filter((row) => row["Risk Level"] === "Healthy").length,
            1
        );

        const summaryRows = [
            {
                Metric: "Critical assets",
                Count: exportRows.filter((row) => row["Risk Level"] === "Critical").length,
                Visual: buildMiniBar(exportRows.filter((row) => row["Risk Level"] === "Critical").length, maxAlertCount),
                Risk: "Critical",
                Notes: "Lost, stolen, missing, or physically damaged assets",
            },
            {
                Metric: "Warning assets",
                Count: exportRows.filter((row) => row["Risk Level"] === "Warning").length,
                Visual: buildMiniBar(exportRows.filter((row) => row["Risk Level"] === "Warning").length, maxAlertCount),
                Risk: "Warning",
                Notes: "Repair, retired, reserved, or worn-condition assets",
            },
            {
                Metric: "Caution assets",
                Count: exportRows.filter((row) => row["Risk Level"] === "Caution").length,
                Visual: buildMiniBar(exportRows.filter((row) => row["Risk Level"] === "Caution").length, maxAlertCount),
                Risk: "Caution",
                Notes: "Assets that need review because details are unclear",
            },
            {
                Metric: "Healthy assets",
                Count: exportRows.filter((row) => row["Risk Level"] === "Healthy").length,
                Visual: buildMiniBar(exportRows.filter((row) => row["Risk Level"] === "Healthy").length, maxAlertCount),
                Risk: "Healthy",
                Notes: "Assets in normal operational state",
            },
        ];

        const workbook = new ExcelJS.Workbook();
        workbook.creator = "Asset Manager";
        workbook.created = new Date();

        const summarySheet = workbook.addWorksheet("Summary");
        const alertsSheet = workbook.addWorksheet("Alerts");
        const assetsSheet = workbook.addWorksheet("Assets");

        summarySheet.columns = [
            { header: "Metric", key: "Metric", width: 24 },
            { header: "Count", key: "Count", width: 14 },
            { header: "Visual", key: "Visual", width: 18 },
            { header: "Risk", key: "Risk", width: 14 },
            { header: "Notes", key: "Notes", width: 44 },
        ];

        const effectiveAlertRows = alertRows.length > 0 ? alertRows : [{
            "Asset Tag": "",
            "Serial Number": "",
            "Manufacturer": "",
            "Model": "",
            "Risk Indicator": "🟢 OK",
            "Risk Level": "Healthy",
            "Priority Rank": 4,
            "Alert Details": "No asset alerts found in this export",
            "Recommended Action": "No action needed",
            "Status": "",
            "Condition": "",
            "Location": "",
            "Assigned To": "",
            "Notes": "",
        }];

        alertsSheet.columns = Object.keys(effectiveAlertRows[0]).map((header) => ({
            header,
            key: header,
            width: getColumnWidth(effectiveAlertRows, header),
        }));

        assetsSheet.columns = Object.keys(exportRows[0] || {
            "Asset Tag": "",
            "Serial Number": "",
            "Manufacturer": "",
            "Model": "",
            "Risk Indicator": "",
            "Risk Level": "",
            "Priority Rank": "",
            "Alert Details": "",
            "Recommended Action": "",
            "Status": "",
            "Condition": "",
            "Location": "",
            "Assigned To": "",
            "Notes": "",
        }).map((header) => ({
            header,
            key: header,
            width: getColumnWidth(exportRows.length > 0 ? exportRows : effectiveAlertRows, header),
        }));

        summarySheet.insertRows(1, [
            ["Asset Export Dashboard"],
            [`Generated: ${new Date().toLocaleString()}`],
            [],
        ]);
        summarySheet.mergeCells("A1:E1");
        summarySheet.mergeCells("A2:E2");
        summarySheet.getCell("A1").font = { bold: true, size: 18, color: { argb: "0F172A" } };
        summarySheet.getCell("A2").font = { italic: true, color: { argb: "475569" } };

        summarySheet.getRow(4).values = ["Metric", "Count", "Visual", "Risk", "Notes"];
        styleHeaderRow(summarySheet.getRow(4));
        summaryRows.forEach((row) => {
            const addedRow = summarySheet.addRow(row);
            const colors = getRiskColors(row.Risk);
            addedRow.getCell("B").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.fill } };
            addedRow.getCell("B").font = { bold: true, color: { argb: colors.font }, size: 16 };
            addedRow.getCell("C").font = { bold: true, color: { argb: colors.font } };
            addedRow.getCell("D").fill = { type: "pattern", pattern: "solid", fgColor: { argb: colors.fill } };
            addedRow.getCell("D").font = { bold: true, color: { argb: colors.font } };
        });
        summarySheet.addRow([]);
        const kpiRow = summarySheet.addRow({
            Metric: "Total assets",
            Count: exportRows.length,
            Visual: buildMiniBar(exportRows.length, exportRows.length || 1),
            Risk: "Healthy",
            Notes: "Total assets included in this export",
        });
        kpiRow.getCell("B").font = { bold: true, size: 16, color: { argb: "1D4ED8" } };
        kpiRow.getCell("C").font = { bold: true, color: { argb: "1D4ED8" } };
        summarySheet.views = [{ state: "frozen", ySplit: 4 }];
        summarySheet.autoFilter = "A4:E4";

        alertsSheet.addRow(alertsSheet.columns.map((column) => column.header));
        assetsSheet.addRow(assetsSheet.columns.map((column) => column.header));
        styleHeaderRow(alertsSheet.getRow(1));
        styleHeaderRow(assetsSheet.getRow(1));

        effectiveAlertRows.forEach((row) => {
            const addedRow = alertsSheet.addRow(row);
            styleRiskRow(addedRow, String(row["Risk Level"] || "Healthy"), ["E", "F", "G", "H", "I"]);
        });

        exportRows.forEach((row) => {
            const addedRow = assetsSheet.addRow(row);
            styleRiskRow(addedRow, String(row["Risk Level"] || "Healthy"), ["E", "F", "G", "H", "I"]);
        });

        alertsSheet.views = [{ state: "frozen", ySplit: 1 }];
        assetsSheet.views = [{ state: "frozen", ySplit: 1 }];
        alertsSheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: alertsSheet.columnCount },
        };
        assetsSheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: assetsSheet.columnCount },
        };

        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            headers: {
                "Content-Disposition": 'attachment; filename="assets_export.xlsx"',
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        });
    } catch (e) {
        console.error("Export failed:", e);
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
    }
}
