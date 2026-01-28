import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminConfirmDeleteButton } from "@/components/admin-confirm-delete-button";

type Props = { params: Promise<{ id: string }> };
type ActionResult = { ok: true } | { ok: false; message: string };

function toFloatOrNull(v: FormDataEntryValue | null) {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export default async function EditMaterialPage({ params }: Props) {
  const { id } = await params;
  if (!id) return notFound();

  const material = await prisma.material.findUnique({ where: { id } });
  if (!material) return notFound();

  // -------------------------
  // Server Action: Update
  // -------------------------
  async function updateMaterial(formData: FormData) {
    "use server";

    const sapPn = String(formData.get("sapPn") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const unit = String(formData.get("unit") ?? "").trim();
    const isActive = formData.get("isActive") === "on";

    // calc fields
    const calcEnabled = formData.get("calcEnabled") === "on";
    const calcBasis = String(formData.get("calcBasis") ?? "").trim();
    const calcFactor = toFloatOrNull(formData.get("calcFactor"));
    const calcRounding = String(formData.get("calcRounding") ?? "CEIL").trim();

    if (!sapPn || !name) throw new Error("SAP PN and Name are required.");

    // Validation for calc config
    let calcData:
      | {
          calcBasis: "FIBER_FT" | "STRAND_FT" | "TOTAL_FT" | null;
          calcFactor: number | null;
          calcRounding: "CEIL" | "ROUND" | "FLOOR" | "NONE";
        }
      | undefined;

    if (!calcEnabled) {
      calcData = {
        calcBasis: null,
        calcFactor: null,
        calcRounding: "CEIL",
      };
    } else {
      const basisOk =
        calcBasis === "FIBER_FT" ||
        calcBasis === "STRAND_FT" ||
        calcBasis === "TOTAL_FT";
      if (!basisOk) throw new Error("Invalid calc basis.");

      if (calcFactor === null) {
        throw new Error("Calc factor is required when calc is enabled.");
      }

      const roundingOk =
        calcRounding === "CEIL" ||
        calcRounding === "ROUND" ||
        calcRounding === "FLOOR" ||
        calcRounding === "NONE";
      if (!roundingOk) throw new Error("Invalid rounding option.");

      calcData = {
        calcBasis: calcBasis as any,
        calcFactor,
        calcRounding: calcRounding as any,
      };
    }

    await prisma.material.update({
      where: { id },
      data: {
        sapPn,
        name,
        description: description || null,
        unit: unit || null,
        isActive,
        ...calcData,
      },
    });

    revalidatePath("/materials");
    redirect("/materials");
  }

  // ---------------------------------------------------
  // Server Action: Delete (ADMIN password required)
  // Hard delete ONLY if not used in any request items
  // ---------------------------------------------------
  async function deleteMaterial(adminPassword: string): Promise<ActionResult> {
    "use server";

    const session = await auth();
    if (!session?.user) return { ok: false, message: "Not authenticated." };
    if ((session.user as any).role !== "ADMIN")
      return { ok: false, message: "Admin only." };

    const adminId = (session.user as any).id as string | undefined;
    if (!adminId) return { ok: false, message: "Session missing user id." };

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { passwordHash: true, role: true },
    });

    if (!admin || admin.role !== "ADMIN")
      return { ok: false, message: "Admin session invalid." };

    const ok = await bcrypt.compare(adminPassword, admin.passwordHash);
    if (!ok) return { ok: false, message: "Invalid admin password." };

    const usedCount = await prisma.materialRequestItem.count({
      where: { materialId: id },
    });

    if (usedCount > 0) {
      return {
        ok: false,
        message:
          "This material is used in existing requests and cannot be permanently deleted.",
      };
    }

    await prisma.material.delete({ where: { id } });

    revalidatePath("/materials");
    return { ok: true };
  }

  const calcEnabled = !!material.calcBasis && material.calcFactor !== null;

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit Material</h1>
          <p className="text-sm text-muted-foreground">
            Update catalog item details.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/materials">Back</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-8">
          <form action={updateMaterial} className="space-y-6">
            {/* Basic fields */}
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="sapPn">SAP PN</Label>
                <Input id="sapPn" name="sapPn" defaultValue={material.sapPn} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" defaultValue={material.name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={material.description ?? ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit (optional)</Label>
                <Input id="unit" name="unit" defaultValue={material.unit ?? ""} />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={material.isActive}
                />
                Active
              </label>
            </div>

            {/* Calculation Rule */}
            <div className="border rounded-2xl p-4 space-y-4">
              <div>
                <div className="font-semibold">Calculation Rule (optional)</div>
                <div className="text-xs text-muted-foreground">
                  Used to suggest quantities on New Request based on Fiber/Strand feet.
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="calcEnabled"
                  defaultChecked={calcEnabled}
                />
                Enable suggested quantity for this material
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calcBasis">Basis</Label>
                  <select
                    id="calcBasis"
                    name="calcBasis"
                    defaultValue={material.calcBasis ?? "TOTAL_FT"}
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="TOTAL_FT">TOTAL_FT</option>
                    <option value="FIBER_FT">FIBER_FT</option>
                    <option value="STRAND_FT">STRAND_FT</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calcFactor">Factor</Label>
                  <Input
                    id="calcFactor"
                    name="calcFactor"
                    inputMode="decimal"
                    placeholder="e.g. 0.01 (1 per 100ft)"
                    defaultValue={
                      material.calcFactor !== null && material.calcFactor !== undefined
                        ? String(material.calcFactor)
                        : ""
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calcRounding">Rounding</Label>
                  <select
                    id="calcRounding"
                    name="calcRounding"
                    defaultValue={material.calcRounding ?? "CEIL"}
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="CEIL">CEIL</option>
                    <option value="ROUND">ROUND</option>
                    <option value="FLOOR">FLOOR</option>
                    <option value="NONE">NONE</option>
                  </select>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Suggested Qty = feet × factor. Example: factor 0.01 means 1 item per 100ft.
              </p>
            </div>

            <div className="pt-2 flex gap-3">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/materials">Cancel</Link>
              </Button>
            </div>
          </form>

          {/* Danger Zone */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>

            <AdminConfirmDeleteButton
              label="Delete Material"
              title="Delete Material"
              description="Enter ADMIN password to permanently delete this material."
              confirmText="Delete Material"
              onConfirm={deleteMaterial}
              redirectTo="/materials"
            />

            <p className="text-xs text-muted-foreground mt-2">
              Permanent delete is blocked if the material is used in any request.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
