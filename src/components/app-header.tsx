import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/signout-button";

export async function AppHeader() {
  const session = await auth();
  const user = session?.user as any;

  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/requests" className="font-semibold">
            WorkFlow
          </Link>

          {session ? (
            <nav className="flex items-center gap-3 text-sm text-muted-foreground">
              <Link href="/requests" className="hover:text-foreground">
                Requests
              </Link>
              <Link href="/materials" className="hover:text-foreground">
                Materials
              </Link>
              {user?.role === "ADMIN" ? (
                <Link href="/admin/users" className="hover:text-foreground">
                  Users
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <div className="text-xs text-muted-foreground text-right">
                <div className="font-medium text-foreground">
                  {user?.name ?? "User"}
                </div>
                <div>{user?.role ?? ""}</div>
              </div>
              <SignOutButton />
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
