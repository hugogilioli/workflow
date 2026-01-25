import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function RequestsPage() {
  const requests = await prisma.materialRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { team: true, items: true },
    take: 50,
  });

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
  <div>
    <h1 className="text-2xl font-semibold">Requests</h1>
    <p className="text-sm text-muted-foreground">
      Material Requests created in WorkFlow.
    </p>
  </div>

  <Button asChild>
    <Link href="/requests/new">New Request</Link>
  </Button>

  
</div>


      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Request ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Project / Site</TableHead>
                <TableHead className="w-[140px]">Team</TableHead>
                <TableHead className="w-[140px]">Items</TableHead>
                <TableHead className="w-[120px] text-right">View</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-sm">{r.requestCode}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(r.date).toLocaleDateString("en-US")}
                  </TableCell>
                  <TableCell className="text-sm">{r.projectSite}</TableCell>
                  <TableCell className="text-sm">{r.team?.name ?? "-"}</TableCell>
                  <TableCell className="text-sm">{r.items.length}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/requests/${r.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {requests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No requests yet. Click <span className="font-medium">New Request</span>.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
