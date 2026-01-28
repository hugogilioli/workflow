import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HomeSearch } from "@/components/home-search";
import { Button } from "@/components/ui/button";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { q } = await searchParams;
  const query = (q ?? "").trim();

  // ✅ Recent Activity (last 10)
  const activity = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // ✅ Most Used Materials (last 30 days)
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const mostUsed = await prisma.materialRequestItem.groupBy({
    by: ["materialId"],
    where: {
      request: { createdAt: { gte: since } },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 10,
  });

  const materialIds = mostUsed.map((x) => x.materialId);
  const materials = await prisma.material.findMany({
    where: { id: { in: materialIds } },
    select: { id: true, sapPn: true, name: true, unit: true },
  });

  const materialMap = new Map(materials.map((m) => [m.id, m]));

  // ✅ Search Everything
  const searchResults =
    query.length > 0
      ? await Promise.all([
          prisma.material.findMany({
            where: {
              OR: [
                { sapPn: { contains: query } },
                { name: { contains: query } },
              ],
            },
            take: 10,
            orderBy: { name: "asc" },
            select: { id: true, sapPn: true, name: true },
          }),
          prisma.materialRequest.findMany({
            where: {
              OR: [
                { requestCode: { contains: query } },
                { projectSite: { contains: query } },
              ],
            },
            take: 10,
            orderBy: { createdAt: "desc" },
            select: { id: true, requestCode: true, projectSite: true },
          }),
        ])
      : [[], []];

  const [foundMaterials, foundRequests] = searchResults as any;

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Recent activity, top materials, and search.
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild>
            <Link href="/requests/new">New Request</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/materials/new">Add Material</Link>
          </Button>
        </div>
      </div>

      {/* Search Everything */}
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Search Everything</div>
            {query ? (
              <Badge variant="secondary">{query}</Badge>
            ) : (
              <Badge variant="secondary">Type to search</Badge>
            )}
          </div>

          <HomeSearch />

          {query ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <div className="text-sm font-medium">Requests</div>
                <div className="border rounded-xl overflow-hidden">
                  {foundRequests.length ? (
                    foundRequests.map((r: any) => (
                      <Link
                        key={r.id}
                        href={`/requests/${r.id}`}
                        className="block px-4 py-2 border-t first:border-t-0 hover:bg-muted"
                      >
                        <div className="font-mono text-sm">{r.requestCode}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.projectSite}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      No requests found.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Materials</div>
                <div className="border rounded-xl overflow-hidden">
                  {foundMaterials.length ? (
                    foundMaterials.map((m: any) => (
                      <Link
                        key={m.id}
                        href={`/materials/${m.id}/edit`}
                        className="block px-4 py-2 border-t first:border-t-0 hover:bg-muted"
                      >
                        <div className="font-mono text-sm">{m.sapPn}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.name}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-muted-foreground">
                      No materials found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Recent Activity + Most Used */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recent Activity */}
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Recent Activity</div>
              <Badge variant="secondary">Last 10</Badge>
            </div>

            <div className="border rounded-xl overflow-hidden">
              {activity.length ? (
                activity.map((a) => (
                  <div
                    key={a.id}
                    className="px-4 py-2 border-t first:border-t-0"
                  >
                    <div className="text-sm">{a.message}</div>
                    <div className="text-xs text-muted-foreground flex gap-2">
                      <span>{new Date(a.createdAt).toLocaleString("en-US")}</span>
                      <span>•</span>
                      <span>{a.action}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  No activity yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Most Used Materials */}
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Most Used Materials</div>
              <Badge variant="secondary">Last 30 days</Badge>
            </div>

            <div className="border rounded-xl overflow-hidden">
              {mostUsed.length ? (
                mostUsed.map((row) => {
                  const m = materialMap.get(row.materialId);
                  const qty = row._sum.quantity ?? 0;
                  return (
                    <div
                      key={row.materialId}
                      className="px-4 py-2 border-t first:border-t-0 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-sm font-medium">
                          {m?.name ?? "Unknown"}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {m?.sapPn ?? row.materialId}
                        </div>
                      </div>
                      <div className="text-sm">
                        {qty} {m?.unit ?? ""}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  No usage data yet.
                </div>
              )}
            </div>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
