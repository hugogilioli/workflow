"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";

type Result = { ok: true } | { ok: false; message: string };

export function DeleteRequestButton({
  onDelete,
}: {
  onDelete: () => Promise<Result>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="destructive"
      disabled={pending}
      type="button"
      onClick={() => {
        const ok = confirm(
          "Permanently delete this request? This cannot be undone."
        );
        if (!ok) return;

        startTransition(async () => {
          const res = await onDelete();

          if (!res.ok) {
            alert(res.message);
            return;
          }

          router.push("/requests");
          router.refresh();
        });
      }}
    >
      {pending ? "Deleting..." : "Delete Request"}
    </Button>
  );
}
