"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      type="button"
      onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
    >
      Sign out
    </Button>
  );
}
