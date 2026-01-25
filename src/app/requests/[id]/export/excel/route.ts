export const runtime = "nodejs";
export const dynamic = "force-dynamic";



import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import fs from "node:fs";
import path from "node:path";
import { Buffer } from "node:buffer";

function argb(hex: string) {
  const clean = hex.replace("#", "");
  return `FF${clean.toUpperCase()}`;
}

const COLORS = {
  dark: "#1F2933",     // charcoal (quase preto elegante)
  light: "#F4F6F8",    // off-white premium
  accent: "#2FBF71",   // green sofisticado (não neon)
  accentSoft: "#E6F4EC", // green muito suave
  white: "#FFFFFF",
  grayText: "#6B7280",
};


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

    if (!request) {
      return new NextResponse("Request not found", { status: 404 });
    }

    // ✅ Update all items to COMPLETE when exporting
    await prisma.materialRequestItem.updateMany({
      where: { requestId: request.id },
      data: { status: "COMPLETE" },
    });

    revalidatePath(`/requests/${request.id}`);
    revalidatePath("/requests");

    // =========================
    // Build Premium Excel
    // =========================
    const wb = new ExcelJS.Workbook();
    wb.creator = "WorkFlow";
    wb.created = new Date();

    const ws = wb.addWorksheet("Request", {
      views: [{ state: "frozen", ySplit: 11 }], // freeze header area
      pageSetup: {
        paperSize: 9, // A4
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.3,
          right: 0.3,
          top: 0.4,
          bottom: 0.4,
          header: 0.2,
          footer: 0.2,
        },
      },
    });

    ws.columns = [
      { key: "item", width: 8 },
      { key: "sap", width: 18 },
      { key: "mat", width: 52 },
      { key: "qty", width: 8 },
      { key: "notes", width: 32 },
      { key: "status", width: 12 },
    ];

    // ✅ Correct ExcelJS border shape (use the object shape directly)
    const thinBorder = {
      top: { style: "thin", color: { argb: argb("#D0D5DD") } },
      left: { style: "thin", color: { argb: argb("#D0D5DD") } },
      bottom: { style: "thin", color: { argb: argb("#D0D5DD") } },
      right: { style: "thin", color: { argb: argb("#D0D5DD") } },
    } as ExcelJS.Borders;

    // =========================
    // Header Bar (Row 1)
    // =========================
    ws.mergeCells("A1:F1");
    ws.getRow(1).height = 18;
    ws.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: argb(COLORS.dark) },
    };

    ws.mergeCells("A2:D4");

    // Make the logo area background match the logo background (workaround)
for (let row = 2; row <= 4; row++) {
  for (const col of ["A", "B", "C", "D"]) {
    ws.getCell(`${col}${row}`).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: argb("#FFFFFF") }, // change if your logo bg is not pure white
    };
  }
}


    // Right info box
    ws.mergeCells("E2:F2");
    ws.mergeCells("E3:F3");
    ws.mergeCells("E4:F4");

    const infoStyle = (addr: string, label: string, value: string) => {
      const c = ws.getCell(addr);
      c.value = `${label}: ${value}`;
      c.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: argb(COLORS.dark) },
      };
      c.alignment = { vertical: "middle", horizontal: "right" };
    };

    infoStyle("E2", "Request ID", request.requestCode);
    infoStyle("E3", "Date", new Date(request.date).toLocaleDateString("en-US"));
    infoStyle("E4", "Status", "COMPLETE");

  ws.getRow(2).height = 30;
ws.getRow(3).height = 30;
ws.getRow(4).height = 30;


    // Neon underline (Row 5)
    ws.mergeCells("A5:F5");
ws.getRow(5).height = 2;
ws.getCell("A5").fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: argb(COLORS.accent) },
};


    // Meta block (Rows 6-8)
    ws.mergeCells("A6:B6");
    ws.mergeCells("C6:F6");
    ws.mergeCells("A7:B7");
    ws.mergeCells("C7:F7");
    ws.mergeCells("A8:B8");
    ws.mergeCells("C8:F8");

    const metaLabel = (addr: string, text: string) => {
      const c = ws.getCell(addr);
      c.value = text;
      c.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: argb(COLORS.dark) },
      };
      c.alignment = { vertical: "middle", horizontal: "left" };
    };

    const metaValue = (addr: string, text: string) => {
      const c = ws.getCell(addr);
      c.value = text;
      c.font = { name: "Calibri", size: 11, color: { argb: argb(COLORS.dark) } };
      c.alignment = { vertical: "middle", horizontal: "left" };
    };

    metaLabel("A6", "Project / Site");
    metaValue("C6", request.projectSite);

    metaLabel("A7", "Team");
    metaValue("C7", request.team?.name ?? "");

    metaLabel("A8", "Requested by");
    metaValue("C8", request.requestedBy);

    ws.getRow(6).height = 18;
    ws.getRow(7).height = 18;
    ws.getRow(8).height = 18;

    // subtle background for meta area
    for (let row = 6; row <= 8; row++) {
      for (const col of ["A", "B", "C", "D", "E", "F"]) {
        ws.getCell(`${col}${row}`).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: argb("#F6F7F9") },
        };
      }
    }

    // =========================
    // Insert Logo
    // =========================
    const logoPath = path.join(process.cwd(), "public", "workflow-logo.png");

if (fs.existsSync(logoPath)) {
  const imageId = wb.addImage({
    filename: logoPath,
    extension: "png",
  });

  ws.addImage(imageId, {
  tl: { col: 0, row: 1.15 },       // aligns nicely inside A2:D4
  ext: { width: 400, height: 112 }, // big and readable like your screenshot
});

} else {
  console.warn("workflow-logo.png not found at:", logoPath);
}


    // =========================
    // Table Header (Row 10)
    // =========================
    const headerRowIndex = 10;
    const header = ws.getRow(headerRowIndex);
    header.values = ["ITEM #", "SAP PN", "MATERIAL", "QTY", "NOTES", "STATUS"];
    header.height = 20;

    header.eachCell((cell) => {
      cell.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: argb(COLORS.white) },
      };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: argb(COLORS.dark) },
      };
      cell.border = thinBorder;
    });

    // Neon line under header (Row 11)
    ws.mergeCells("A11:F11");
    ws.getRow(11).height = 2;
    ws.getCell("A11").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: argb(COLORS.accent) },

    };

    // =========================
    // Table Body (Row 12+)
    // =========================
    let rowIndex = 12;

    request.items.forEach((it, idx) => {
      const row = ws.getRow(rowIndex);
      row.values = [
        it.itemNumber,
        it.material.sapPn,
        it.material.name,
        it.quantity,
        it.notes ?? "",
        "COMPLETE",
      ];
      row.height = 18;

      const zebra = idx % 2 === 0 ? COLORS.white : COLORS.light;


      row.eachCell((cell, colNumber) => {
        cell.font = { name: "Calibri", size: 11, color: { argb: argb(COLORS.dark) } };
        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber === 4 ? "center" : "left",
          wrapText: true,
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: argb(zebra) },
        };
        cell.border = thinBorder;
      });

      // Status cell styling (premium green)
      const statusCell = ws.getCell(`F${rowIndex}`);
      statusCell.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: argb("#FFFFFF") },
      };
      statusCell.alignment = { vertical: "middle", horizontal: "center" };
      statusCell.fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: argb(COLORS.accent) },
};


      rowIndex++;
    });

    // =========================
    // Footer
    // =========================
    const footerRow = rowIndex + 2;
    ws.mergeCells(`A${footerRow}:F${footerRow}`);
    const footerCell = ws.getCell(`A${footerRow}`);
    footerCell.value = `Generated by WorkFlow • ${new Date().toLocaleString("en-US")}`;
    footerCell.font = {
  name: "Calibri",
  size: 9,
  color: { argb: argb(COLORS.grayText) },
};

    footerCell.alignment = { vertical: "middle", horizontal: "left" };

    ws.headerFooter.oddFooter = "&LGenerated by WorkFlow&R&P / &N";

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${request.requestCode}_Material_Request.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("Excel export error:", err);
    return new NextResponse("Excel export failed (see server logs).", {
      status: 500,
    });
  }
}
