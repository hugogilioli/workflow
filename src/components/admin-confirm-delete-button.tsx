"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Result = { ok: true } | { ok: false; message: string };

type Props = {
  label?: string;                 // button label
  title?: string;                 // dialog title
  description?: string;           // optional text
  confirmText?: string;           // confirm button text
  onConfirm: (adminPassword: string) => Promise<Result>;
  redirectTo?: string;            // where to go after success
};

export function AdminConfirmDeleteButton({
  label = "Delete",
  title = "Admin Confirmation",
  description = "Enter ADMIN password to confirm this action.",
  confirmText = "Confirm Delete",
  onConfirm,
  redirectTo,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button
        variant="destructive"
        type="button"
        onClick={() => {
          setPassword("");
          setOpen(true);
        }}
      >
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{description}</p>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">Admin Password</Label>
              <Input
                id="adminPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>

              <Button
                type="button"
                variant="destructive"
                disabled={pending || password.length === 0}
                onClick={() => {
                  startTransition(async () => {
                    const res = await onConfirm(password);
                    if (!res.ok) {
                      alert(res.message);
                      return;
                    }
                    setOpen(false);
                    if (redirectTo) router.push(redirectTo);
                    router.refresh();
                  });
                }}
              >
                {pending ? "Checking..." : confirmText}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
