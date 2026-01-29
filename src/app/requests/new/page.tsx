import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { NewRequestForm } from "./new-request-form";

export default async function NewRequestPage() {
  const materials = await prisma.material.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      sapPn: true,
      name: true,
      description: true,
    },
  });

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">New Request</h1>
          <p className="text-sm text-muted-foreground">
            Select materials and set quantities to build a Material Request.
          </p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/requests">Back</Link>
        </Button>
      </div>

      <NewRequestForm materials={materials} />
    </div>
  );
}
