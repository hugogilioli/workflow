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

export default async function MaterialsPage() {
  const materials = await prisma.material.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Materials</h1>
          <p className="text-sm text-muted-foreground">
            Manage your material catalog (SAP PN, names, units).
          </p>
        </div>

        <Button asChild>
          <Link href="/materials/new">Add Material</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">SAP PN</TableHead>
                <TableHead>Material</TableHead>
                <TableHead className="w-[90px]">Unit</TableHead>
                <TableHead className="w-[110px]">Active</TableHead>
                <TableHead className="w-[120px] text-right">Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((m) => (
                <TableRow key={m.id} className={!m.isActive ? "opacity-60" : ""}>
                  <TableCell className="font-mono text-sm">{m.sapPn}</TableCell>
                  <TableCell>
                    <div className="font-medium">{m.name}</div>
                    {m.description ? (
                      <div className="text-xs text-muted-foreground">
                        {m.description}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm">{m.unit ?? "-"}</TableCell>
                  <TableCell className="text-sm">
                    {m.isActive ? "YES" : "NO"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/materials/${m.id}/edit`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {materials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No materials yet. Click <span className="font-medium">Add Material</span>.
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
