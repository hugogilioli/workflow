import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteMaterialButton } from "@/components/delete-material-button";

type Props = {
  params: Promise<{ id: string }>;
};

type DeleteResult =
  | { ok: true }
  | { ok: false; message: string };


/* ---------- Server Actions ---------- */

async function updateMaterial(id: string, formData: FormData) {
  "use server";

  const sapPn = String(formData.get("sapPn") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!sapPn || !name) {
    throw new Error("SAP PN and Name are required.");
  }

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

  redirect("/materials");
}

async function deleteMaterial(id: string): Promise<DeleteResult> {
  "use server";

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

  await prisma.material.delete({
    where: { id },
  });

  revalidatePath("/materials");

  return { ok: true };
}



/* ---------- Page ---------- */

export default async function EditMaterialPage({ params }: Props) {
  const { id } = await params;
  if (!id) return notFound();

  const material = await prisma.material.findUnique({ where: { id } });
  if (!material) return notFound();

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit Material</h1>
          <p className="text-sm text-muted-foreground">
            Update or deactivate this material.
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/materials">Back</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-8">
          {/* ---------- Edit Form ---------- */}
          <form
            action={updateMaterial.bind(null, material.id)}
            className="space-y-5"
          >
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

          {/* ---------- Danger Zone ---------- */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-red-600 mb-2">
              Danger Zone
            </h3>

            <DeleteMaterialButton onDelete={deleteMaterial.bind(null, material.id)} />

            <p className="text-xs text-muted-foreground mt-2">
              This will deactivate the material. Existing requests will not be
              affected.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
