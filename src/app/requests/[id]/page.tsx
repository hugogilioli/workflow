import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteRequestButton } from "@/components/delete-request-button";

type Props = {
  params: Promise<{ id: string }>;
};

type DeleteResult = { ok: true } | { ok: false; message: string };

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

  // =========================
  // Server Action – Delete
  // =========================
  async function deleteRequest(requestId: string): Promise<DeleteResult> {
    "use server";

    try {
      await prisma.materialRequest.delete({
        where: { id: requestId },
      });

      revalidatePath("/requests");
      return { ok: true };
    } catch (err) {
      console.error("Delete request error:", err);
      return { ok: false, message: "Unable to delete this request." };
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {/* ================= HEADER ================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Material Request</h1>
          <p className="text-sm text-muted-foreground">
            {request.requestCode}
          </p>
        </div>

        {/* ===== BUTTONS BLOCK ===== */}
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/requests">Back</Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href={`/requests/${request.id}/export/excel`}>
              Export Excel
            </Link>
          </Button>

          <Button asChild>
            <Link href="/requests/new">New Request</Link>
          </Button>

          <DeleteRequestButton
            onDelete={deleteRequest.bind(null, request.id)}
          />
        </div>
      </div>

      {/* ================= CARD ================= */}
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-4">
          {/* ===== REQUEST INFO ===== */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Request ID</div>
              <div className="font-mono">{request.requestCode}</div>
            </div>

            <div>
              <div className="text-muted-foreground">Date</div>
              <div>
                {new Date(request.date).toLocaleDateString("en-US")}
              </div>
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

          {/* ===== ITEMS TABLE ===== */}
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
                    <td className="px-3 py-2">
                      {it.material.name}
                    </td>
                    <td className="px-3 py-2">{it.quantity}</td>
                    <td className="px-3 py-2">{it.notes ?? "-"}</td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          it.status === "COMPLETE"
                            ? "default"
                            : "secondary"
                        }
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
