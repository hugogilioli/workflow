import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  RequestMaterialsTable,
  type RequestMaterialRow,
} from "@/components/request-materials-table";

async function nextRequestCode() {
  const last = await prisma.materialRequest.findFirst({
    orderBy: { createdAt: "desc" },
    select: { requestCode: true },
  });

  const lastNum = last?.requestCode?.match(/WF-(\d+)/)?.[1];
  const n = lastNum ? parseInt(lastNum, 10) + 1 : 1;
  return `WF-${String(n).padStart(6, "0")}`;
}

async function createRequest(formData: FormData) {
  "use server";

  const projectSite = String(formData.get("projectSite") ?? "").trim();
  const requestedBy = String(formData.get("requestedBy") ?? "").trim();
  const teamName = String(formData.get("teamName") ?? "").trim();

  if (!projectSite || !requestedBy) {
    throw new Error("Project / Site and Requested by are required.");
  }

  // ✅ user context for audit + linking
  const session = await auth();
  const userId = (session?.user as any)?.id ?? null;
  const userEmail = session?.user?.email ?? null;

  const activeMaterials = await prisma.material.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true },
  });

  const selected = activeMaterials
    .filter((m) => formData.get(`m_${m.id}`) === "on")
    .map((m) => {
      const qtyRaw = String(formData.get(`q_${m.id}`) ?? "").trim();
      const notes = String(formData.get(`n_${m.id}`) ?? "").trim();
      const quantity = parseInt(qtyRaw || "0", 10);

      return {
        materialId: m.id,
        quantity: Number.isFinite(quantity) ? quantity : 0,
        notes: notes || null,
      };
    })
    .filter((x) => x.quantity > 0);

  if (selected.length === 0) {
    throw new Error("Select at least one material and set a quantity (> 0).");
  }

  const requestCode = await nextRequestCode();

  let teamId: string | null = null;
  if (teamName) {
    const existing = await prisma.team.findFirst({
      where: { name: teamName },
      select: { id: true },
    });
    if (existing) teamId = existing.id;
    else {
      const created = await prisma.team.create({
        data: { name: teamName },
        select: { id: true },
      });
      teamId = created.id;
    }
  }

  // NOTE: feet/project-site config is step 2 (later). Keep request creation stable now.

  const created = await prisma.materialRequest.create({
    data: {
      requestCode,
      projectSite,
      requestedBy,
      teamId,
      date: new Date(),
      userId, // ✅ link to creator
      items: {
        create: selected.map((it, idx) => ({
          itemNumber: idx + 1,
          quantity: it.quantity,
          notes: it.notes,
          materialId: it.materialId,
        })),
      },
    },
    select: { id: true },
  });

  // ✅ audit
  await logAudit({
    action: "CREATE_REQUEST",
    entityType: "REQUEST",
    entityId: created.id,
    message: `Request ${requestCode} created (${projectSite})`,
    userId,
    userEmail,
    meta: { items: selected.length },
  });

  redirect(`/requests/${created.id}`);
}

export default async function NewRequestPage() {
  const materials = (await prisma.material.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      sapPn: true,
      name: true,
      description: true,
      unit: true,
      calcBasis: true,
      calcFactor: true,
      calcRounding: true,
    },
  })) as RequestMaterialRow[];

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">New Request</h1>
          <p className="text-sm text-muted-foreground">
            Create a material request. Use feet inputs to get suggested quantities.
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/requests">Back</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <form action={createRequest} className="space-y-6">
            {/* Header fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectSite">Project / Site</Label>
                <Input
                  id="projectSite"
                  name="projectSite"
                  placeholder="e.g. Bronx Fiber Expansion"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamName">Team (optional)</Label>
                <Input id="teamName" name="teamName" placeholder="e.g. Crew A" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestedBy">Requested by</Label>
                <Input
                  id="requestedBy"
                  name="requestedBy"
                  placeholder="e.g. John Smith"
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Materials with Suggested Qty */}
            <RequestMaterialsTable materials={materials} />

            <div className="flex gap-3 pt-2">
              <Button type="submit">Create Request</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/requests">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
