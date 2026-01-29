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

type MaterialRow = {
  id: string;
  sapPn: string;
  name: string;
  description: string | null;
};

const initialState: CreateRequestResult | null = null;

export function NewRequestForm({ materials }: { materials: MaterialRow[] }) {
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
              <Input
                id="projectSite"
                name="projectSite"
                placeholder="e.g. Bronx Fiber Expansion"
              />
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

          {/* Materials table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Materials</h2>
              <p className="text-xs text-muted-foreground">
                Check items, then set Qty (Qty must be &gt; 0).
              </p>
            </div>

            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900 text-white">
                  <tr>
                    <th className="text-left px-3 py-2 w-[70px]">Pick</th>
                    <th className="text-left px-3 py-2 w-[140px]">SAP PN</th>
                    <th className="text-left px-3 py-2">Material</th>
                    <th className="text-left px-3 py-2 w-[110px]">Qty</th>
                    <th className="text-left px-3 py-2 w-[280px]">Notes</th>
                  </tr>
                </thead>

                <tbody>
                  {materials.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-3 py-2">
                        <input type="checkbox" name={`m_${m.id}`} />
                      </td>

                      <td className="px-3 py-2 font-mono text-xs">{m.sapPn}</td>

                      <td className="px-3 py-2">
                        <div className="font-medium">{m.name}</div>
                        {m.description ? (
                          <div className="text-xs text-muted-foreground">{m.description}</div>
                        ) : null}
                      </td>

                      <td className="px-3 py-2">
                        <Input name={`q_${m.id}`} type="number" min={0} placeholder="0" />
                      </td>

                      <td className="px-3 py-2">
                        <Input name={`n_${m.id}`} placeholder="Optional notes" />
                      </td>
                    </tr>
                  ))}

                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted-foreground">
                        No active materials found. Add materials first.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

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
