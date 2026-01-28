import Link from "next/link";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { logAudit } from "@/lib/audit";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminConfirmDeleteButton } from "@/components/admin-confirm-delete-button";

type ActionResult = { ok: true } | { ok: false; message: string };

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <p className="text-sm">Access denied.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  async function deleteUser(userId: string, adminPassword: string): Promise<ActionResult> {
    "use server";

    const session = await auth();
    if (!session?.user) return { ok: false, message: "Not authenticated." };
    if ((session.user as any).role !== "ADMIN") return { ok: false, message: "Admin only." };

    const adminId = (session.user as any).id as string | undefined;
    if (!adminId) return { ok: false, message: "Session missing user id." };

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { passwordHash: true, role: true, email: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      return { ok: false, message: "Admin session invalid." };
    }

    const ok = await bcrypt.compare(adminPassword, admin.passwordHash);
    if (!ok) return { ok: false, message: "Invalid admin password." };

    if (userId === adminId) {
      return { ok: false, message: "You cannot delete your own account." };
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true },
    });

    if (!target) return { ok: false, message: "User not found." };

    if (target.role === "ADMIN") {
      const admins = await prisma.user.count({ where: { role: "ADMIN" } });
      if (admins <= 1) {
        return { ok: false, message: "You cannot delete the last ADMIN user." };
      }
    }

    await prisma.user.delete({ where: { id: userId } });

    await logAudit({
      action: "DELETE_USER",
      entityType: "USER",
      entityId: userId,
      message: `User deleted: ${target.email ?? userId}`,
      userId: adminId,
      userEmail: admin.email ?? null,
    });

    revalidatePath("/users");
    return { ok: true };
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage accounts. Deletions require ADMIN password.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/">Back</Link>
          </Button>

          <Button asChild>
            <Link href="/users/new">Add User</Link>
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-white">
              <tr>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Email</th>
                <th className="text-left px-3 py-2 w-[140px]">Role</th>
                <th className="text-left px-3 py-2 w-[160px]">Created</th>
                <th className="text-right px-3 py-2 w-[160px]">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">{u.name}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2">
                    {new Date(u.createdAt).toLocaleDateString("en-US")}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <AdminConfirmDeleteButton
                      label="Delete"
                      title="Delete User"
                      description={
                        u.role === "ADMIN"
                          ? `This user is ADMIN. Admins left: ${adminCount}. Enter ADMIN password to confirm.`
                          : "Enter ADMIN password to confirm."
                      }
                      confirmText="Delete User"
                      onConfirm={deleteUser.bind(null, u.id)}
                      redirectTo="/users"
                    />
                  </td>
                </tr>
              ))}

              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-10 text-center text-sm text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
