"use server";

import { prisma } from "@/lib/db";

export type CreateRequestResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

async function nextRequestCode() {
  const last = await prisma.materialRequest.findFirst({
    orderBy: { createdAt: "desc" },
    select: { requestCode: true },
  });

  const lastNum = last?.requestCode?.match(/WF-(\d+)/)?.[1];
  const n = lastNum ? parseInt(lastNum, 10) + 1 : 1;
  return `WF-${String(n).padStart(6, "0")}`;
}

export async function createRequestAction(
  _prev: CreateRequestResult | null,
  formData: FormData
): Promise<CreateRequestResult> {
  const projectSite = String(formData.get("projectSite") ?? "").trim();
  const requestedBy = String(formData.get("requestedBy") ?? "").trim();
  const teamName = String(formData.get("teamName") ?? "").trim();

  if (!projectSite || !requestedBy) {
    return { ok: false, message: "Project / Site and Requested by are required." };
  }

  const activeMaterials = await prisma.material.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true },
  });

  const selected = activeMaterials
    .filter((m) => formData.get(`m_${m.id}`) === "on")
    .map((m) => {
      const qtyRaw = String(formData.get(`q_${m.id}`) ?? "").trim();
      const notes = String(formData.get(`n_${m.id}`) ?? "").trim();
      const quantity = parseInt(qtyRaw || "0", 10);
      return {
        materialId: m.id,
        quantity: Number.isFinite(quantity) ? quantity : 0,
        notes: notes || null,
      };
    })
    .filter((x) => x.quantity > 0);

  if (selected.length === 0) {
    return { ok: false, message: "Select at least one material and set a quantity (> 0)." };
  }

  let teamId: string | null = null;
  if (teamName) {
    const existingTeam = await prisma.team.findFirst({
      where: { name: teamName },
      select: { id: true },
    });
    if (existingTeam) teamId = existingTeam.id;
    else {
      const createdTeam = await prisma.team.create({
        data: { name: teamName },
        select: { id: true },
      });
      teamId = createdTeam.id;
    }
  }

  try {
    const requestCode = await nextRequestCode();
    const created = await prisma.materialRequest.create({
      data: {
        requestCode,
        projectSite,
        requestedBy,
        teamId,
        date: new Date(),
        items: {
          create: selected.map((it, idx) => ({
            itemNumber: idx + 1,
            quantity: it.quantity,
            notes: it.notes,
            materialId: it.materialId,
          })),
        },
      },
      select: { id: true },
    });

    return { ok: true, id: created.id };
  } catch (e) {
    console.error("createRequestAction error:", e);
    return { ok: false, message: "Unable to create request." };
  }
}
