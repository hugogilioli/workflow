"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type DeleteResult =
  | { ok: true }
  | { ok: false; message: string };

type Props = {
  onDelete: () => Promise<DeleteResult>;
};

export function DeleteMaterialButton({ onDelete }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        const ok = confirm(
          "Permanently delete this material? This cannot be undone."
        );
        if (!ok) return;

        startTransition(async () => {
          const result = await onDelete();

          if (!result.ok) {
            alert(result.message);
            return;
          }

          router.push("/materials");
          router.refresh();
        });
      }}
    >
      {isPending ? "Deleting..." : "Delete Permanently"}
    </Button>
  );
}
