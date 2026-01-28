export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await auth();
  const userId = (session?.user as any)?.id ?? null;
  const userEmail = session?.user?.email ?? null;

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

  // ✅ mark COMPLETE on export (your existing behavior)
  await prisma.materialRequestItem.updateMany({
    where: { requestId: request.id },
    data: { status: "COMPLETE" },
  });

  revalidatePath(`/requests/${request.id}`);
  revalidatePath("/requests");

  // ✅ build excel
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Request");

  ws.addRow(["MATERIAL REQUEST"]);
  ws.addRow(["Request ID", request.requestCode]);
  ws.addRow(["Date", new Date(request.date).toLocaleDateString("en-US")]);
  ws.addRow(["Project / Site", request.projectSite]);
  ws.addRow(["Team", request.team?.name ?? "-"]);
  ws.addRow(["Requested by", request.requestedBy]);
  ws.addRow([]);

  ws.addRow(["#", "SAP PN", "MATERIAL", "QTY", "NOTES", "STATUS"]);

  for (const it of request.items) {
    ws.addRow([
      it.itemNumber,
      it.material.sapPn,
      it.material.name,
      it.quantity,
      it.notes ?? "",
      "COMPLETE",
    ]);
  }

  const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;

  // ✅ audit
  await logAudit({
    action: "EXPORT_EXCEL",
    entityType: "REQUEST",
    entityId: request.id,
    message: `Request ${request.requestCode} exported to Excel`,
    userId,
    userEmail,
  });

  return new NextResponse(Buffer.from(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${request.requestCode}.xlsx"`,
    },
  });
}
