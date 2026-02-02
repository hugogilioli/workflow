import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewMaterialPage() {
  async function createMaterialAction(formData: FormData) {
    "use server";

    const sapPn = String(formData.get("sapPn") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const unit = String(formData.get("unit") ?? "").trim();

    const calcBasisRaw = String(formData.get("calcBasis") ?? "").trim();
    const calcBasis = calcBasisRaw.length > 0 ? calcBasisRaw : null;

    const calcFactorRaw = String(formData.get("calcFactor") ?? "").trim();
    const calcFactor =
      calcFactorRaw.length > 0 && Number.isFinite(parseFloat(calcFactorRaw))
        ? parseFloat(calcFactorRaw)
        : null;

    const calcRounding = String(formData.get("calcRounding") ?? "CEIL").trim() || "CEIL";

    if (!sapPn || !name) throw new Error("SAP PN and Name are required.");

    await prisma.material.create({
      data: {
        sapPn,
        name,
        description: description || null,
        unit: unit || null,
        isActive: true,

        // ✅ suggestion config
        calcBasis: (calcBasis as any) || null,
        calcFactor,
        calcRounding: calcRounding as any,
      },
    });

    redirect("/materials");
  }

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
        <CardContent className="p-6 space-y-6">
          <form action={createMaterialAction} className="space-y-5">
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

            <div className="border-t pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Suggestion rule</h3>
                <p className="text-xs text-muted-foreground">
                  Used for Suggested Qty in New Request (based on Fiber/Strand feet).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="calcBasis">Basis</Label>
                  <select
                    id="calcBasis"
                    name="calcBasis"
                    defaultValue=""
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">(none)</option>
                    <option value="FIBER_FT">FIBER_FT</option>
                    <option value="STRAND_FT">STRAND_FT</option>
                    <option value="TOTAL_FT">TOTAL_FT</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calcFactor">Factor</Label>
                  <Input id="calcFactor" name="calcFactor" placeholder="e.g. 0.02" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calcRounding">Rounding</Label>
                  <select
                    id="calcRounding"
                    name="calcRounding"
                    defaultValue="CEIL"
                    className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="CEIL">CEIL</option>
                    <option value="ROUND">ROUND</option>
                    <option value="FLOOR">FLOOR</option>
                    <option value="NONE">NONE</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
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
