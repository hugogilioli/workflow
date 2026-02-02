import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import EditMaterialForm from "./edit-material-form";
import type { AdminActionResult } from "@/components/admin-confirm-button";

type Props = { params: Promise<{ id: string }> };

export default async function EditMaterialPage({ params }: Props) {
  const { id } = await params;

  const material = await prisma.material.findUnique({ where: { id } });
  if (!material) return notFound();

  async function updateAction(formData: FormData): Promise<AdminActionResult> {
    "use server";

    const adminPw = String(formData.get("adminPassword") ?? "");
    if (!adminPw || adminPw !== process.env.ADMIN_PASSWORD) {
      return { ok: false, message: "Invalid admin password." };
    }

    const sapPn = String(formData.get("sapPn") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const unit = String(formData.get("unit") ?? "").trim();
    const isActive = formData.get("isActive") === "on";

    const calcBasisRaw = String(formData.get("calcBasis") ?? "").trim();
    const calcBasis = calcBasisRaw.length > 0 ? calcBasisRaw : null;

    const calcFactorRaw = String(formData.get("calcFactor") ?? "").trim();
    const calcFactor =
      calcFactorRaw.length > 0 && Number.isFinite(parseFloat(calcFactorRaw))
        ? parseFloat(calcFactorRaw)
        : null;

    const calcRounding = String(formData.get("calcRounding") ?? "CEIL").trim() || "CEIL";

    if (!sapPn || !name) return { ok: false, message: "SAP PN and Name are required." };

    try {
      await prisma.material.update({
        where: { id },
        data: {
          sapPn,
          name,
          description: description || null,
          unit: unit || null,
          isActive,
          calcBasis: (calcBasis as any) || null,
          calcFactor,
          calcRounding: calcRounding as any,
        },
      });

      revalidatePath("/materials");
      return { ok: true };
    } catch (e) {
      console.error("update material error:", e);
      return { ok: false, message: "Unable to update material." };
    }
  }

  async function deleteAction(adminPassword: string): Promise<AdminActionResult> {
    "use server";

    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return { ok: false, message: "Invalid admin password." };
    }

    const usedCount = await prisma.materialRequestItem.count({ where: { materialId: id } });
    if (usedCount > 0) {
      return {
        ok: false,
        message: "This material is used in existing requests and cannot be permanently deleted.",
      };
    }

    await prisma.material.delete({ where: { id } });
    revalidatePath("/materials");
    return { ok: true };
  }

  return <EditMaterialForm material={material} onUpdate={updateAction} onDelete={deleteAction} />;
}
