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

    if (!sapPn || !name) throw new Error("SAP PN and Name are required.");

    await prisma.material.update({
      where: { id }, // ✅ use route id, not closure object
      data: {
        sapPn,
        name,
        description: description || null,
        unit: unit || null,
        isActive,
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
      where: { materialId: id }, // ✅ use route id
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
          <form action={updateMaterial} className="space-y-5">
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

            <div className="pt-2 flex gap-3">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/materials">Cancel</Link>
              </Button>
            </div>
          </form>

          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-red-600 mb-2">
              Danger Zone
            </h3>

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
