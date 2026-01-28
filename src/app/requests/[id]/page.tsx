import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminConfirmDeleteButton } from "@/components/admin-confirm-delete-button";

type Props = { params: Promise<{ id: string }> };
type ActionResult = { ok: true } | { ok: false; message: string };

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;

  const request = await prisma.materialRequest.findUnique({
    where: { id },
    include: {
      team: true,
      items: { include: { material: true }, orderBy: { itemNumber: "asc" } },
    },
  });

  if (!request) return notFound();

  // ✅ capture safe primitive for UI only (TS-friendly)
  const requestCode = request.requestCode;

  async function deleteRequest(adminPassword: string): Promise<ActionResult> {
    "use server";

    const session = await auth();
    if (!session?.user) return { ok: false, message: "Not authenticated." };
    if ((session.user as any).role !== "ADMIN")
      return { ok: false, message: "Admin only." };

    const adminId = (session.user as any).id as string | undefined;
    if (!adminId) return { ok: false, message: "Session missing user id." };

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { passwordHash: true, role: true, email: true },
    });

    if (!admin || admin.role !== "ADMIN")
      return { ok: false, message: "Admin session invalid." };

    const ok = await bcrypt.compare(adminPassword, admin.passwordHash);
    if (!ok) return { ok: false, message: "Invalid admin password." };

    // ✅ read requestCode again inside action (no closure)
    const found = await prisma.materialRequest.findUnique({
      where: { id },
      select: { requestCode: true },
    });

    await prisma.materialRequest.delete({ where: { id } });

    await logAudit({
      action: "DELETE_REQUEST",
      entityType: "REQUEST",
      entityId: id,
      message: `Request ${found?.requestCode ?? id} deleted`,
      userId: adminId,
      userEmail: admin.email ?? null,
    });

    revalidatePath("/requests");
    return { ok: true };
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Material Request</h1>

          <div className="relative inline-block mt-1">
            <p className="font-mono text-sm text-muted-foreground">{requestCode}</p>
            <span
              aria-hidden
              className="absolute left-0 -bottom-1 h-[2px] w-full rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(57,255,20,0.35)]"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/requests">Back</Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href={`/requests/${request.id}/export/excel`}>Export Excel</Link>
          </Button>

          <Button asChild>
            <Link href="/requests/new">New Request</Link>
          </Button>

          <AdminConfirmDeleteButton
            label="Delete Request"
            title="Delete Request"
            description="Enter ADMIN password to permanently delete this request."
            confirmText="Delete Request"
            onConfirm={deleteRequest}
            redirectTo="/requests"
          />
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Request ID</div>
              <div className="font-mono">{request.requestCode}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Date</div>
              <div>{new Date(request.date).toLocaleDateString("en-US")}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-muted-foreground">Project / Site</div>
              <div>{request.projectSite}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Team</div>
              <div>{request.team?.name ?? "-"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Requested by</div>
              <div>{request.requestedBy}</div>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-xl mt-4">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-white">
                <tr>
                  <th className="px-3 py-2 w-[60px] text-left">#</th>
                  <th className="px-3 py-2 w-[140px] text-left">SAP PN</th>
                  <th className="px-3 py-2 text-left">Material</th>
                  <th className="px-3 py-2 w-[90px] text-left">Qty</th>
                  <th className="px-3 py-2 w-[220px] text-left">Notes</th>
                  <th className="px-3 py-2 w-[120px] text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {request.items.map((it) => (
                  <tr key={it.id} className="border-t">
                    <td className="px-3 py-2">{it.itemNumber}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {it.material.sapPn}
                    </td>
                    <td className="px-3 py-2">{it.material.name}</td>
                    <td className="px-3 py-2">{it.quantity}</td>
                    <td className="px-3 py-2">{it.notes ?? "-"}</td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={it.status === "COMPLETE" ? "success" : "secondary"}
                      >
                        {it.status}
                      </Badge>
                    </td>
                  </tr>
                ))}

                {request.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-10 text-center text-sm text-muted-foreground"
                    >
                      No items found for this request.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
