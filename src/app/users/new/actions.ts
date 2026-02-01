"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Result } from "@/lib/action-result";
import { UserRole } from "@/generated/prisma/client";

function s(v: unknown) {
  return String(v ?? "").trim();
}

export async function createUserAction(
  _prev: Result | null,
  formData: FormData
): Promise<Result> {
  const name = s(formData.get("name"));
  const email = s(formData.get("email")).toLowerCase();
  const roleRaw = s(formData.get("role"));
  const password = s(formData.get("password"));

  if (!name || !email || !roleRaw || !password) {
    return { ok: false, message: "All fields are required." };
  }

  const validRoles = Object.values(UserRole);
  if (!validRoles.includes(roleRaw as UserRole)) {
    return {
      ok: false,
      message: `Invalid role "${roleRaw}". Allowed: ${validRoles.join(", ")}`,
    };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, message: "Email already exists." };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { name, email, role: roleRaw as UserRole, passwordHash },
      select: { id: true },
    });

    return { ok: true };
  } catch (e) {
    console.error("createUserAction error:", e);
    return { ok: false, message: "Unable to create user." };
  }
}
