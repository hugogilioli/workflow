import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { AdminConfirmButton, type AdminActionResult } from "@/components/admin-confirm-button";

type Props = { params: Promise<{ id: string }> };


export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params;

  const request = await prisma.materialRequest.findUnique({
    where: { id },
    include: {
      team: true,
      items: {
        include: { material: true },
        orderBy: { itemNumber: "asc" },
      },
    },
  });

  if (!request) return notFound();

  async function deleteRequestAction(requestId: string, adminPassword: string): Promise<AdminActionResult> {
    "use server";

    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return { ok: false, message: "Invalid admin password." };
    }

    try {
      await prisma.materialRequest.delete({ where: { id: requestId } });
      revalidatePath("/requests");
      return { ok: true };
    } catch (e) {
      console.error("delete request error:", e);
      return { ok: false, message: "Unable to delete this request." };
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Material Request</h1>

          {/* requestCode + underline (kept simple) */}
          <div className="relative inline-block mt-1">
            <p className="font-mono text-sm text-muted-foreground">{request.requestCode}</p>
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

          <AdminConfirmButton
  label="Delete"
  confirmTitle="Delete request"
  confirmText="This will permanently delete the request and all its items. This cannot be undone."
  action={deleteRequestAction.bind(null, request.id)}
  successRedirectTo="/requests"
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
                    <td className="px-3 py-2 font-mono text-xs">{it.material.sapPn}</td>
                    <td className="px-3 py-2">{it.material.name}</td>
                    <td className="px-3 py-2">{it.quantity}</td>
                    <td className="px-3 py-2">{it.notes ?? "-"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={it.status === "COMPLETE" ? "success" : "secondary"}>
                        {it.status}
                      </Badge>
                    </td>
                  </tr>
                ))}

                {request.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-foreground">
                      No items found.
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
