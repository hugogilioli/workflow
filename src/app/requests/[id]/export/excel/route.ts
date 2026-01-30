export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";

import fs from "node:fs";
import path from "node:path";

// Palette
const DARK = "FF2A2F36";
const BORDER = "FFD1D5DB";
const LIGHT = "FFF3F4F6";
const WHITE = "FFFFFFFF";
const GOLD_BAR = "FFC9A24D";
const MUTED = "FF6B7280";
const TEXT = "FF111111";

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

function styleValue(cell: ExcelJS.Cell, opts?: { mono?: boolean }) {
  const mono = opts?.mono ?? false;
  cell.font = {
    name: mono ? "Consolas" : "Calibri",
    size: mono ? 14 : 12,
    bold: mono ? true : false,
    color: { argb: TEXT },
  };
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

    await prisma.materialRequestItem.updateMany({
      where: { requestId: request.id },
      data: { status: "COMPLETE" },
    });

    revalidatePath(`/requests/${request.id}`);
    revalidatePath("/requests");

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

    // ✅ ONLY 4 columns A–D
    ws.columns = [
      { width: 12 }, // A
      { width: 22 }, // B
      { width: 56 }, // C
      { width: 14 }, // D
    ];

    ws.getColumn(5).width = 0.1;
ws.getColumn(6).width = 0.1;

for (let col = 5; col <= 16384; col++) {
  ws.getColumn(col).hidden = true;
}

ws.views = [
  {
    state: "frozen",
    xSplit: 4,
    ySplit: 0,
    topLeftCell: "A1",
    activeCell: "A1",
  },
];


    // Row heights
    ws.getRow(1).height = 28;
    ws.getRow(2).height = 8;
    ws.getRow(3).height = 16;
    ws.getRow(4).height = 20;
    ws.getRow(5).height = 20;
    ws.getRow(6).height = 20;
    ws.getRow(7).height = 20;
    ws.getRow(8).height = 20;

    // Row 1: Logo area A1:B1, Request ID in C1/D1
    ws.mergeCells("A1:B1");

    ws.getCell("C1").value = "Request ID";
    styleLabel(ws.getCell("C1"));
    ws.getCell("C1").alignment = { vertical: "middle", horizontal: "right" };

    ws.getCell("D1").value = request.requestCode;
    styleValue(ws.getCell("D1"), { mono: true });
    ws.getCell("D1").alignment = { vertical: "middle", horizontal: "left" };

    for (let c = 1; c <= 4; c++) thinBorder(ws.getRow(1).getCell(c));

    const logoPath = path.join(process.cwd(), "public", "workflow-logo.png");
    if (fs.existsSync(logoPath)) {
      const imageId = wb.addImage({ filename: logoPath, extension: "png" });
      ws.addImage(imageId, {
        tl: { col: 0.10, row: 0.15 },
        ext: { width: 230, height: 42 },
      });
    }

    // Row 2 blank
    for (let c = 1; c <= 4; c++) thinBorder(ws.getRow(2).getCell(c));

    // Row 3 gold bar
    ws.mergeCells("A3:D3");
    ws.getCell("A3").value = "";
    ws.getCell("A3").fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD_BAR } };
    for (let c = 1; c <= 4; c++) thinBorder(ws.getRow(3).getCell(c));

    // Info block rows 4–7
    for (let r = 4; r <= 7; r++) fillRow(ws, r, 1, 4, LIGHT);

    ws.getCell("A4").value = "Date";
    ws.getCell("A5").value = "Project / Site";
    ws.getCell("A6").value = "Team";
    ws.getCell("A7").value = "Requested by";
    styleLabel(ws.getCell("A4"));
    styleLabel(ws.getCell("A5"));
    styleLabel(ws.getCell("A6"));
    styleLabel(ws.getCell("A7"));

    ws.getCell("B4").value = new Date(request.date).toLocaleDateString("en-US");
    ws.getCell("B5").value = request.projectSite;
    ws.getCell("B6").value = request.team?.name ?? "-";
    ws.getCell("B7").value = request.requestedBy;
    styleValue(ws.getCell("B4"));
    styleValue(ws.getCell("B5"));
    styleValue(ws.getCell("B6"));
    styleValue(ws.getCell("B7"));

    for (let r = 4; r <= 7; r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= 4; c++) thinBorder(row.getCell(c));
    }

    // Table header row 8
    const headerRow = ws.getRow(8);
    headerRow.values = ["ITEM #", "SAP PN", "MATERIAL", "QTY"];

    for (let c = 1; c <= 4; c++) {
      const cell = headerRow.getCell(c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
      cell.font = { name: "Calibri", size: 12, bold: true, color: { argb: WHITE } };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      thinBorder(cell);
    }

    // Table rows
    let rowIdx = 9;
    for (const it of request.items) {
      const r = ws.getRow(rowIdx);
      r.height = 20;

      r.getCell(1).value = it.itemNumber;
      r.getCell(2).value = it.material.sapPn;
      r.getCell(3).value = it.material.name;
      r.getCell(4).value = it.quantity;

      for (let c = 1; c <= 4; c++) {
        const cell = r.getCell(c);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
        cell.font = { name: c === 2 ? "Consolas" : "Calibri", size: 12, color: { argb: TEXT } };
        cell.alignment = {
          vertical: "middle",
          horizontal: c === 4 ? "center" : "left",
          wrapText: c === 3,
        };
        thinBorder(cell);
      }

      rowIdx++;
    }

    // Blank area + footer
    const blankRows = 6;
    for (let k = 0; k < blankRows; k++) {
      const rr = ws.getRow(rowIdx + k);
      rr.height = 18;
      for (let c = 1; c <= 4; c++) {
        const cell = rr.getCell(c);
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: WHITE } };
        thinBorder(cell);
      }
    }
    rowIdx += blankRows;

    ws.mergeCells(`A${rowIdx}:D${rowIdx}`);
    ws.getRow(rowIdx).height = 22;

    const footer = ws.getCell(`A${rowIdx}`);
    footer.value = `Generated by WorkFlow • ${new Date().toLocaleString("en-US")}`;
    footer.font = { name: "Calibri", size: 11, color: { argb: MUTED } };
    footer.alignment = { vertical: "middle", horizontal: "left" };
    thinBorder(footer);

    // ✅ Print area only A–D (no column E)
    ws.pageSetup.printArea = `A1:D${rowIdx}`;

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
