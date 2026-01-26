import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

async function createUser(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "USER") as "ADMIN" | "USER";

  // Extra safety (server-side)
  const session = await auth();
  const currentRole = (session?.user as any)?.role;
  if (currentRole !== "ADMIN") {
    throw new Error("Not allowed.");
  }

  if (!name || !email || !password) {
    throw new Error("Name, Email and Password are required.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
    },
  });

  revalidatePath("/admin/users");
}

export default async function AdminUsersPage() {
  const session = await auth();
  const currentRole = (session?.user as any)?.role;

  if (currentRole !== "ADMIN") {
    // middleware should prevent this, but just in case
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-sm text-muted-foreground">Not authorized.</p>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">
          Create and manage WorkFlow users (admin-only).
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <h2 className="text-base font-semibold">Create User</h2>

          <form action={createUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="e.g. John Smith" />
            </div>

            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" placeholder="e.g. john@company.com" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" placeholder="Set a password" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                defaultValue="USER"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>

            <div className="md:col-span-4">
              <Button type="submit">Create User</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-base font-semibold">Existing Users</h2>

          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-white">
                <tr>
                  <th className="text-left px-3 py-2">Name</th>
                  <th className="text-left px-3 py-2">Email</th>
                  <th className="text-left px-3 py-2 w-[120px]">Role</th>
                  <th className="text-left px-3 py-2 w-[160px]">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2 font-mono text-xs">{u.role}</td>
                    <td className="px-3 py-2">
                      {new Date(u.createdAt).toLocaleDateString("en-US")}
                    </td>
                  </tr>
                ))}

                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center text-sm text-muted-foreground">
                      No users yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
