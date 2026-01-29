export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";

import fs from "node:fs";
import path from "node:path";

const DARK = "FF1F2937";          // table header (grafite)
const BORDER = "FFD1D5DB";        // soft gray borders
const LIGHT = "FFF9FAFB";         // info block background
const WHITE = "FFFFFFFF";
const NEON = "B08D57";         // neon bar
const STATUS_GREEN = "FF059669";  // emerald green (COMPLETE)
const MUTED = "FF6B7280";         // secondary text
const TEXT = "FF111827";          // primary text

function thinBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: "thin", color: { argb: BORDER } },
    left: { style: "thin", color: { argb: BORDER } },
    bottom: { style: "thin", color: { argb: BORDER } },
    right: { style: "thin", color: { argb: BORDER } },
  };
}

function fillRow(ws: ExcelJS.Worksheet, r: number, fromCol: number, toCol: number, argb: string) {
  const row = ws.getRow(r);
  for (let c = fromCol; c <= toCol; c++) {
    const cell = row.getCell(c);
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
    thinBorder(cell);
  }
}

function styleLabel(cell: ExcelJS.Cell) {
  cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: MUTED } };
  cell.alignment = { vertical: "middle", horizontal: "left" };
}

function styleValue(cell: ExcelJS.Cell, mono = false) {
  cell.font = { name: mono ? "Consolas" : "Calibri", size: 12, bold: mono, color: { argb: TEXT } };
  cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const request = await prisma.materialRequest.findUnique({
      where: { id },
      include: {
        team: true,
        items: {
          include: { material: true },
          orderBy: { itemNumber: "asc" },
        },
      },
    });

    if (!request) return new NextResponse("Request not found", { status: 404 });

    // ✅ Mark COMPLETE on export
    await prisma.materialRequestItem.updateMany({
      where: { requestId: request.id },
      data: { status: "COMPLETE" },
    });

    revalidatePath(`/requests/${request.id}`);
    revalidatePath("/requests");

    // =========================
    // Workbook
    // =========================
    const wb = new ExcelJS.Workbook();
    wb.creator = "WorkFlow";
    wb.created = new Date();

    const ws = wb.addWorksheet("Request", {
      views: [{ showGridLines: false }],
      pageSetup: {
        paperSize: 9,
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.4, right: 0.4, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
      },
    });

    // Columns A-F (match screenshot proportions)
    ws.columns = [
      { width: 12 }, // A ITEM #
      { width: 22 }, // B SAP PN
      { width: 56 }, // C MATERIAL
      { width: 12 }, // D QTY
      { width: 42 }, // E NOTES
      { width: 16 }, // F STATUS
    ];

    // Row heights
    ws.getRow(1).height = 28; // header row (logo + request id)
    ws.getRow(2).height = 8;  // small spacing
    ws.getRow(3).height = 16; // neon bar
    ws.getRow(4).height = 20; // info row 1
    ws.getRow(5).height = 20; // info row 2
    ws.getRow(6).height = 20; // info row 3
    ws.getRow(7).height = 10; // spacer
    ws.getRow(8).height = 20; // table header

    // =========================
    // HEADER: Logo left + Request ID right
    // =========================
    // Make a big left zone for logo: A1:D1
    ws.mergeCells("A1:D1");
    // Right zone for label/value: E1:F1 (but we'll split inside)
    ws.getCell("E1").value = "Request ID";
    styleLabel(ws.getCell("E1"));
    ws.getCell("E1").alignment = { vertical: "middle", horizontal: "right" };

    ws.getCell("F1").value = request.requestCode;
    ws.getCell("F1").font = { name: "Consolas", size: 14, bold: true, color: { argb: TEXT } };
    ws.getCell("F1").alignment = { vertical: "middle", horizontal: "left" };

    // Borders for row 1
    for (let c = 1; c <= 6; c++) thinBorder(ws.getRow(1).getCell(c));

    // Insert LOGO (exactly like screenshot) using filename (no Buffer typing issues)
    const logoPath = path.join(process.cwd(), "public", "workflow-logo.png");
    if (fs.existsSync(logoPath)) {
      const imageId = wb.addImage({ filename: logoPath, extension: "png" });

      // Fit nicely inside A1:D1
      ws.addImage(imageId, {
        tl: { col: 0.15, row: 0.15 },
        ext: { width: 220, height: 42 },
      });
    }

    // Row 2: blank, but keep borders so the outer frame stays continuous
    for (let c = 1; c <= 6; c++) thinBorder(ws.getRow(2).getCell(c));

    // =========================
    // NEON BAR (row 3)
    // =========================
    ws.mergeCells("A3:F3");
    ws.getCell("A3").value = "";
    ws.getCell("A3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: NEON } };
    for (let c = 1; c <= 6; c++) thinBorder(ws.getRow(3).getCell(c));

    // =========================
    // INFO BLOCK (rows 4-6) light gray
    // Layout like screenshot:
    // A label | B..D value | E label | F value
    // =========================
    // Fill background
    fillRow(ws, 4, 1, 6, LIGHT);
    fillRow(ws, 5, 1, 6, LIGHT);
    fillRow(ws, 6, 1, 6, LIGHT);

    // Merge value blocks: B-D for left values
    ws.mergeCells("B4:D4");
    ws.mergeCells("B5:D5");
    ws.mergeCells("B6:D6");

    // Left labels
    ws.getCell("A4").value = "Project / Site";
    ws.getCell("A5").value = "Team";
    ws.getCell("A6").value = "Requested by";
    styleLabel(ws.getCell("A4"));
    styleLabel(ws.getCell("A5"));
    styleLabel(ws.getCell("A6"));

    // Left values
    ws.getCell("B4").value = request.projectSite;
    ws.getCell("B5").value = request.team?.name ?? "-";
    ws.getCell("B6").value = request.requestedBy;
    styleValue(ws.getCell("B4"));
    styleValue(ws.getCell("B5"));
    styleValue(ws.getCell("B6"));

    // Right label/value for Date (only on row 4 like screenshot)
    ws.getCell("E4").value = "Date";
    styleLabel(ws.getCell("E4"));
    ws.getCell("E4").alignment = { vertical: "middle", horizontal: "left" };

    ws.getCell("F4").value = new Date(request.date).toLocaleDateString("en-US");
    styleValue(ws.getCell("F4"));

    // Keep E5/F5 E6/F6 empty but bordered/filled (already via fillRow)

    // =========================
    // Spacer row 7 (blank)
    // =========================
    for (let c = 1; c <= 6; c++) thinBorder(ws.getRow(7).getCell(c));

    // =========================
    // TABLE HEADER (row 8)
    // =========================
    const headerRow = ws.getRow(8);
    headerRow.values = ["ITEM #", "SAP PN", "MATERIAL", "QTY", "NOTES", "STATUS"];

    for (let c = 1; c <= 6; c++) {
      const cell = headerRow.getCell(c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
      cell.font = { name: "Calibri", size: 12, bold: true, color: { argb: WHITE } };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      thinBorder(cell);
    }

    // =========================
    // TABLE ROWS
    // =========================
    let rowIdx = 9;

    for (let i = 0; i < request.items.length; i++) {
      const it = request.items[i];
      const r = ws.getRow(rowIdx);
      r.height = 20;

      r.getCell(1).value = it.itemNumber;
      r.getCell(2).value = it.material.sapPn;
      r.getCell(3).value = it.material.name;
      r.getCell(4).value = it.quantity;
      r.getCell(5).value = it.notes ?? "";
      r.getCell(6).value = "COMPLETE";

      // Zebra not used in screenshot for table row (it's plain white)
      for (let c = 1; c <= 6; c++) {
        const cell = r.getCell(c);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
        cell.font = { name: c === 2 ? "Consolas" : "Calibri", size: 12, color: { argb: TEXT } };
        cell.alignment = {
          vertical: "middle",
          horizontal: c === 4 ? "center" : "left",
          wrapText: c === 3 || c === 5,
        };
        thinBorder(cell);
      }

      // Status cell green like screenshot
      const statusCell = r.getCell(6);
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: STATUS_GREEN } };
      statusCell.font = { name: "Calibri", size: 12, bold: true, color: { argb: WHITE } };
      statusCell.alignment = { vertical: "middle", horizontal: "center" };

      rowIdx++;
    }

    // =========================
    // FOOTER (like screenshot) + big blank area
    // =========================
    // Create some blank space before footer (screenshot has big empty area)
    const blankRows = 6;
    for (let k = 0; k < blankRows; k++) {
      const rr = ws.getRow(rowIdx + k);
      rr.height = 18;
      for (let c = 1; c <= 6; c++) {
        const cell = rr.getCell(c);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
        thinBorder(cell);
      }
    }
    rowIdx += blankRows;

    // Footer row
    ws.mergeCells(`A${rowIdx}:F${rowIdx}`);
    ws.getRow(rowIdx).height = 22;
    const footer = ws.getCell(`A${rowIdx}`);
    footer.value = `Generated by WorkFlow • ${new Date().toLocaleString("en-US")}`;
    footer.font = { name: "Calibri", size: 11, color: { argb: MUTED } };
    footer.alignment = { vertical: "middle", horizontal: "left" };
    thinBorder(footer);

    // Outer frame: ensure ALL cells in print area have borders
    const lastRow = rowIdx;
    for (let r = 1; r <= lastRow; r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= 6; c++) thinBorder(row.getCell(c));
    }

    ws.pageSetup.printArea = `A1:F${lastRow}`;

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${request.requestCode}_Material_Request.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Excel export error:", err);
    return new NextResponse("Excel export failed (see server logs).", { status: 500 });
  }
}
