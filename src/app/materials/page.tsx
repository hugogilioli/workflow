import Link from "next/link";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminConfirmButton, type AdminActionResult } from "@/components/admin-confirm-button";

export default async function MaterialsPage() {
  const materials = await prisma.material.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  async function deleteMaterial(materialId: string, adminPassword: string): Promise<AdminActionResult> {
    "use server";

    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return { ok: false, message: "Invalid admin password." };
    }

    const usedCount = await prisma.materialRequestItem.count({ where: { materialId } });
    if (usedCount > 0) {
      return {
        ok: false,
        message: "This material is used in existing requests and cannot be permanently deleted.",
      };
    }

    await prisma.material.delete({ where: { id: materialId } });
    revalidatePath("/materials");
    return { ok: true };
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Materials</h1>
          <p className="text-sm text-muted-foreground">Manage your material catalog.</p>
        </div>

        <Button asChild>
          <Link href="/materials/new">Add Material</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-white">
                <tr>
                  <th className="px-3 py-2 text-left w-[140px]">SAP PN</th>
                  <th className="px-3 py-2 text-left">Material</th>
                  <th className="px-3 py-2 text-left w-[90px]">Unit</th>
                  <th className="px-3 py-2 text-left w-[90px]">Active</th>
                  <th className="px-3 py-2 text-right w-[260px]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {materials.map((m) => (
                  <tr key={m.id} className={`border-t ${!m.isActive ? "opacity-60" : ""}`}>
                    <td className="px-3 py-2 font-mono text-xs">{m.sapPn}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{m.name}</div>
                      {m.description ? (
                        <div className="text-xs text-muted-foreground">{m.description}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">{m.unit ?? "-"}</td>
                    <td className="px-3 py-2">{m.isActive ? "YES" : "NO"}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/materials/${m.id}/edit`}>Edit</Link>
                        </Button>

                        <AdminConfirmButton
                          label="Delete"
                          confirmTitle="Delete material"
                          confirmText="Permanently delete this material (only if it was never used in a request)."
                          action={deleteMaterial.bind(null, m.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}

                {materials.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted-foreground">
                      No materials yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
