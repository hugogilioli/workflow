"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { createMaterialAction } from "@/app/materials/actions";
import type { ActionResult } from "@/lib/action-result";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ActionResult | null = null;

export default function NewMaterialPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createMaterialAction, initialState);

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
          <h1 className="text-2xl font-semibold">Add Material</h1>
          <p className="text-sm text-muted-foreground">Create a new item in your catalog.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/materials">Back</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <form action={formAction} className="space-y-5">
            {state && !state.ok ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.message}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="sapPn">SAP PN</Label>
              <Input id="sapPn" name="sapPn" placeholder="e.g. 8473921" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g. Fiber Optic Cable 100ft" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input id="description" name="description" placeholder="e.g. Outdoor rated" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit (optional)</Label>
              <Input id="unit" name="unit" placeholder="e.g. ea, ft, box" />
            </div>

            <div className="pt-2 flex gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/materials">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
