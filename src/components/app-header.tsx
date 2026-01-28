// src/components/app-header.tsx
import Link from "next/link";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AppHeader() {
  const session = await auth();

  // Não renderiza header se não estiver logado
  if (!session?.user) return null;

  return (
    <header className="border-b">
      <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold">
            WorkFlow
          </Link>

          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/materials" className="hover:text-foreground">
              Materials
            </Link>
            <Link href="/requests" className="hover:text-foreground">
              Requests
            </Link>
            <Link href="/users" className="hover:text-foreground">
              Users
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground">
            Signed in as{" "}
            <span className="text-foreground font-medium">
              {session.user.email ?? session.user.name ?? "User"}
            </span>
          </div>

          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
