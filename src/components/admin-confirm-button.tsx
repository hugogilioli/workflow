"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export type AdminActionResult = { ok: true } | { ok: false; message: string };

export function AdminConfirmButton({
  label,
  confirmTitle,
  confirmText,
  action,
  successRedirectTo, // ✅ optional
}: {
  label: string;
  confirmTitle: string;
  confirmText: string;
  action: (adminPassword: string) => Promise<AdminActionResult>;
  successRedirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button
        variant="destructive"
        type="button"
        onClick={() => {
          setPw("");
          setOpen(true);
        }}
      >
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{confirmTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{confirmText}</p>

            <div className="space-y-2">
              <div className="text-sm font-medium">Admin password</div>
              <Input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Enter admin password"
                autoComplete="current-password"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>

            <Button
              variant="destructive"
              type="button"
              disabled={pending || pw.length === 0}
              onClick={() => {
                startTransition(async () => {
                  const res = await action(pw);
                  if (!res.ok) {
                    alert(res.message);
                    return;
                  }
                  setOpen(false);

                  if (successRedirectTo) {
                    router.push(successRedirectTo);
                  }
                  router.refresh();
                });
              }}
            >
              {pending ? "Confirming..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
