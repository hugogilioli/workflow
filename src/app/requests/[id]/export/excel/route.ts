export const runtime = "nodejs"; // ✅ IMPORTANT: Prisma + better-sqlite3 + ExcelJS need Node runtime
export const dynamic = "force-dynamic"; // ✅ avoid caching issues

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";

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

    // ✅ Build Excel
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Request");

    ws.addRow(["MATERIAL REQUEST"]);
    ws.addRow(["Request ID", request.requestCode]);
    ws.addRow(["Date", new Date(request.date).toLocaleDateString("en-US")]);
    ws.addRow(["Project / Site", request.projectSite]);
    ws.addRow(["Team", request.team?.name ?? ""]);
    ws.addRow(["Requested by", request.requestedBy]);
    ws.addRow([]);

    const headerRow = ws.addRow([
      "ITEM #",
      "SAP PN",
      "MATERIAL",
      "QTY",
      "NOTES",
      "STATUS",
    ]);
    headerRow.font = { bold: true };

    request.items.forEach((it) => {
      ws.addRow([
        it.itemNumber,
        it.material.sapPn,
        it.material.name,
        it.quantity,
        it.notes ?? "",
        "COMPLETE",
      ]);
    });

    ws.columns = [
      { width: 8 },
      { width: 18 },
      { width: 50 },
      { width: 8 },
      { width: 30 },
      { width: 12 },
    ];

    const buffer = await wb.xlsx.writeBuffer(); // ArrayBuffer

    return new NextResponse(buffer as any, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${request.requestCode}_Material_Request.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    // ✅ Helps you see the real reason in terminal
    console.error("Excel export error:", err);
    return new NextResponse("Excel export failed (see server logs).", {
      status: 500,
    });
  }
}
