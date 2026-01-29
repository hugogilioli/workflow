"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useTransition } from "react";

import type { Material } from "@/generated/prisma";
import type { ActionResult } from "@/lib/action-result";
import { updateMaterialAction } from "@/app/materials/actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DeleteResult = { ok: true } | { ok: false; message: string };

type Props = {
  material: Material;
  onDelete: () => Promise<DeleteResult>;
};

const initialState: ActionResult | null = null;

export default function EditMaterialForm({ material, onDelete }: Props) {
  const router = useRouter();

  // bind id into the server action signature: (prev, formData) => Promise<ActionResult>
  const boundUpdate = updateMaterialAction.bind(null, material.id);

  const [state, formAction, pending] = useActionState(boundUpdate, initialState);

  const [isDeleting, startDelete] = useTransition();

  useEffect(() => {
    if (state?.ok) {
      router.push("/materials");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit Material</h1>
          <p className="text-sm text-muted-foreground">
            Update or permanently delete this material.
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/materials">Back</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-8">
          {/* ===== Inline error banner (no red error page) ===== */}
          {state && !state.ok ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.message}
            </div>
          ) : null}

          {/* ===== Edit form ===== */}
          <form action={formAction} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sapPn">SAP PN</Label>
              <Input
                id="sapPn"
                name="sapPn"
                defaultValue={material.sapPn}
                placeholder="e.g. 8473921"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={material.name}
                placeholder="e.g. Fiber Optic Cable 100ft"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                name="description"
                defaultValue={material.description ?? ""}
                placeholder="e.g. Outdoor rated"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit (optional)</Label>
              <Input
                id="unit"
                name="unit"
                defaultValue={material.unit ?? ""}
                placeholder="e.g. ea, ft, box"
              />
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
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save Changes"}
              </Button>

              <Button type="button" variant="outline" asChild>
                <Link href="/materials">Cancel</Link>
              </Button>
            </div>
          </form>

          {/* ===== Danger Zone ===== */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-red-600 mb-2">Danger Zone</h3>

            <Button
              variant="destructive"
              type="button"
              disabled={isDeleting}
              onClick={() => {
                const ok = confirm(
                  "Permanently delete this material? This cannot be undone."
                );
                if (!ok) return;

                startDelete(async () => {
                  const res = await onDelete();
                  if (!res.ok) {
                    alert(res.message);
                    return;
                  }
                  router.push("/materials");
                  router.refresh();
                });
              }}
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </Button>

            <p className="text-xs text-muted-foreground mt-2">
              If this material is used in existing requests, deletion will be blocked.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
