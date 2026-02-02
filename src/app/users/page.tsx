import Link from "next/link";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminConfirmButton, type AdminActionResult } from "@/components/admin-confirm-button";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  // ✅ Server Action factory (bind userId later)
  async function deleteUser(userId: string, adminPassword: string): Promise<AdminActionResult> {
    "use server";

    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return { ok: false, message: "Invalid admin password." };
    }

    try {
      await prisma.user.delete({ where: { id: userId } });
      revalidatePath("/users");
      return { ok: true };
    } catch (e) {
      console.error("delete user error:", e);
      return { ok: false, message: "Unable to delete user." };
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage accounts (admin protected actions).</p>
        </div>

        <Button asChild>
          <Link href="/users/new">Add User</Link>
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left w-[120px]">Role</th>
                  <th className="px-3 py-2 text-right w-[220px]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{u.name}</td>
                    <td className="px-3 py-2">{u.email}</td>
                    <td className="px-3 py-2">{u.role}</td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        {/* ✅ bind on server side, pass bound action directly */}
                        <AdminConfirmButton
                          label="Delete"
                          confirmTitle="Delete user"
                          confirmText="This will permanently delete the user. This cannot be undone."
                          action={deleteUser.bind(null, u.id)}
                        />
                      </div>
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
