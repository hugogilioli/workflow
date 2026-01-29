"use server";

import { prisma } from "@/lib/db";
import type { ActionResult } from "@/lib/action-result";

function isUniqueConstraintError(e: unknown) {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as any).code === "P2002"
  );
}

export async function createMaterialAction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const sapPn = String(formData.get("sapPn") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();

  if (!sapPn || !name) {
    return { ok: false, message: "SAP PN and Name are required." };
  }

  try {
    await prisma.material.create({
      data: {
        sapPn,
        name,
        description: description || null,
        unit: unit || null,
        isActive: true,
      },
    });
    return { ok: true };
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return { ok: false, message: "SAP PN already exists." };
    }
    console.error("createMaterialAction error:", e);
    return { ok: false, message: "Unable to create material." };
  }
}

export async function updateMaterialAction(
  id: string,
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const sapPn = String(formData.get("sapPn") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!sapPn || !name) {
    return { ok: false, message: "SAP PN and Name are required." };
  }

  try {
    await prisma.material.update({
      where: { id },
      data: {
        sapPn,
        name,
        description: description || null,
        unit: unit || null,
        isActive,
      },
    });
    return { ok: true };
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      return { ok: false, message: "SAP PN already exists." };
    }
    console.error("updateMaterialAction error:", e);
    return { ok: false, message: "Unable to update material." };
  }
}
