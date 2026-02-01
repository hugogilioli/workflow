"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Result } from "@/lib/action-result";
import { createUserAction } from "./actions";

const initialState: Result | null = null;

export function NewUserForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createUserAction, initialState);

  useEffect(() => {
    if (!state) return;

    if (!state.ok) {
      toast.error(state.message);
      return;
    }

    toast.success("User created.");
    router.push("/users");
    router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border bg-white p-6">
      <div className="space-y-1">
        <label className="text-sm font-medium">Name</label>
        <input
          name="name"
          className="w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="e.g. Saulo"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          className="w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="e.g. saulo@company.com"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Role</label>
        {/* Valores precisam bater com o enum do Prisma */}
        <select
          name="role"
          className="w-full rounded-xl border px-3 py-2 text-sm"
          defaultValue="USER"
          required
        >
          <option value="ADMIN">ADMIN</option>
          <option value="USER">USER</option>
          {/* Se seu enum tiver OPERATOR, habilite: */}
          {/* <option value="OPERATOR">OPERATOR</option> */}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Password</label>
        <input
          name="password"
          type="password"
          className="w-full rounded-xl border px-3 py-2 text-sm"
          placeholder="••••••••"
          required
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
