import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import EditMaterialForm from "./edit-material-form";

type Props = { params: Promise<{ id: string }> };

type DeleteResult = { ok: true } | { ok: false; message: string };

export default async function EditMaterialPage({ params }: Props) {
  const { id } = await params;

  
  const material = await prisma.material.findUnique({
    where: { id },
  });


  if (!material) return notFound();

  async function deleteMaterialAction(materialId: string): Promise<DeleteResult> {
    "use server";


    const usedCount = await prisma.materialRequestItem.count({
      where: { materialId },
    });

    if (usedCount > 0) {
      return {
        ok: false,
        message:
          "This material is used in existing requests and cannot be permanently deleted.",
      };
    }

    await prisma.material.delete({ where: { id: materialId } });
    return { ok: true };
  }

  return (
    <EditMaterialForm
      material={material}
      onDelete={deleteMaterialAction.bind(null, material.id)}
    />
  );
}
