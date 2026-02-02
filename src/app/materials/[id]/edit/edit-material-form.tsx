"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { Material } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminConfirmButton, type AdminActionResult } from "@/components/admin-confirm-button";

type Props = {
  material: Material;
  onUpdate: (formData: FormData) => Promise<AdminActionResult>;
  onDelete: (adminPassword: string) => Promise<AdminActionResult>;
};

export default function EditMaterialForm({ material, onUpdate, onDelete }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>("");

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit Material</h1>
          <p className="text-sm text-muted-foreground">
            Update catalog item details and suggestion rules (admin protected).
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/materials">Back</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-8">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <form
            action={(formData) => {
              startTransition(async () => {
                setError("");
                const res = await onUpdate(formData);
                if (!res.ok) {
                  setError(res.message);
                  return;
                }
                router.push("/materials");
                router.refresh();
              });
            }}
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
              <Input id="description" name="description" defaultValue={material.description ?? ""} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit (optional)</Label>
              <Input id="unit" name="unit" defaultValue={material.unit ?? ""} />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked={material.isActive} /> Active
            </label>

            {/* Suggestion config */}
            <div className="border-t pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Suggestion rule</h3>
                <p className="text-xs text-muted-foreground">
                  Used for Suggested Qty in New Request (based on Fiber/Strand feet).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calcBasis">Basis</Label>
                  <select
                    id="calcBasis"
                    name="calcBasis"
                    defaultValue={material.calcBasis ?? ""}
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">(none)</option>
                    <option value="FIBER_FT">FIBER_FT</option>
                    <option value="STRAND_FT">STRAND_FT</option>
                    <option value="TOTAL_FT">TOTAL_FT</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calcFactor">Factor</Label>
                  <Input
                    id="calcFactor"
                    name="calcFactor"
                    defaultValue={material.calcFactor ?? ""}
                    placeholder="e.g. 0.02"
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
            </div>

            {/* Admin password */}
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Admin password</Label>
              <Input id="adminPassword" name="adminPassword" type="password" />
            </div>

            <div className="pt-2 flex gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save Changes"}
              </Button>

              <Button type="button" variant="outline" asChild>
                <Link href="/materials">Cancel</Link>
              </Button>
            </div>
          </form>

          {/* Delete */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>

            <AdminConfirmButton
              label="Delete"
              confirmTitle="Delete material"
              confirmText="Permanently delete this material (only if it was never used in a request)."
              action={onDelete}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
