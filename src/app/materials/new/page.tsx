import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function createMaterial(formData: FormData) {
  "use server";

  const sapPn = String(formData.get("sapPn") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();

  if (!sapPn || !name) {
    throw new Error("SAP PN and Name are required.");
  }

  await prisma.material.create({
    data: {
      sapPn,
      name,
      description: description || null,
      unit: unit || null,
      isActive: true,
    },
  });

  redirect("/materials");
}

export default function NewMaterialPage() {
  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Add Material</h1>
          <p className="text-sm text-muted-foreground">
            Create a new item in your catalog.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/materials">Back</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <form action={createMaterial} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sapPn">SAP PN</Label>
              <Input id="sapPn" name="sapPn" placeholder="e.g. 8473921" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g. Fiber Optic Cable 100ft" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input id="description" name="description" placeholder="e.g. Outdoor rated" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit (optional)</Label>
              <Input id="unit" name="unit" placeholder="e.g. ea, ft, box" />
            </div>

            <div className="pt-2 flex gap-3">
              <Button type="submit">Save</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/materials">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
