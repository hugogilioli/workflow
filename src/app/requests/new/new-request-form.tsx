"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { createRequestAction, type CreateRequestResult } from "@/app/requests/actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { RequestMaterialsTable, type RequestMaterialRow } from "@/components/request-materials-table";

const initialState: CreateRequestResult | null = null;

export function NewRequestForm({ materials }: { materials: RequestMaterialRow[] }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createRequestAction, initialState);

  useEffect(() => {
    if (state?.ok) {
      router.push(`/requests/${state.id}`);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Card className="rounded-2xl">
      <CardContent className="p-6 space-y-6">
        <form action={formAction} className="space-y-6">
          {/* Inline error banner */}
          {state && !state.ok ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.message}
            </div>
          ) : null}

          {/* Header fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectSite">Project / Site</Label>
              <Input id="projectSite" name="projectSite" placeholder="e.g. Bronx Fiber Expansion" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamName">Team (optional)</Label>
              <Input id="teamName" name="teamName" placeholder="e.g. Crew A" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestedBy">Requested by</Label>
              <Input id="requestedBy" name="requestedBy" placeholder="e.g. John Smith" />
            </div>
          </div>

          <Separator />

          {/* ✅ Restored: feet inputs + suggested qty + use button */}
          <RequestMaterialsTable materials={materials} />

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create Request"}
            </Button>

            <Button type="button" variant="outline" asChild>
              <Link href="/requests">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
