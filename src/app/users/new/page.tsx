import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function NewUserPage() {
  const session = await auth();

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <p className="text-sm">Access denied.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function createUser(formData: FormData) {
    "use server";

    const session = await auth();
    if (!session?.user) throw new Error("Not authenticated.");
    if ((session.user as any).role !== "ADMIN") throw new Error("Admin only.");

    const adminId = (session.user as any).id as string | undefined;

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "OPERATOR").toUpperCase();

    if (!name || !email || !password) {
      throw new Error("Name, Email and Password are required.");
    }
    if (!email.includes("@")) throw new Error("Invalid email.");
    if (password.length < 6) throw new Error("Password must be at least 6 characters.");
    if (!["VIEWER", "OPERATOR", "ADMIN"].includes(role)) throw new Error("Invalid role.");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("Email already exists.");

    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = await prisma.user.create({
      data: { name, email, role: role as any, passwordHash },
      select: { id: true },
    });

    await logAudit({
      action: "CREATE_USER",
      entityType: "USER",
      entityId: createdUser.id,
      message: `User created: ${email} (${role})`,
      userId: adminId ?? null,
      userEmail: session.user.email ?? null,
    });

    revalidatePath("/users");
    redirect("/users");
  }

  return (
    <div className="mx-auto max-w-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Add User</h1>
          <p className="text-sm text-muted-foreground">Create a new account (ADMIN only).</p>
        </div>

        <Button variant="outline" asChild>
          <Link href="/users">Back</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <form action={createUser} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g. John Smith" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" placeholder="e.g. john@company.com" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Min 6 characters"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                defaultValue="OPERATOR"
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              >
                <option value="VIEWER">VIEWER</option>
                <option value="OPERATOR">OPERATOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <p className="text-xs text-muted-foreground">
                ADMIN can delete data (requires admin password confirmation).
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit">Create User</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/users">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
