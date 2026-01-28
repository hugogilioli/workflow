import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Menu</h1>
        <p className="text-sm text-muted-foreground">
          Choose where you want to go.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-3">
            <div className="font-semibold">Materials</div>
            <div className="text-sm text-muted-foreground">
              Manage your catalog (SAP PN, name, unit).
            </div>
            <Button asChild>
              <Link href="/materials">Open</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-3">
            <div className="font-semibold">Requests</div>
            <div className="text-sm text-muted-foreground">
              Create and export material requests.
            </div>
            <Button asChild>
              <Link href="/requests">Open</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-3">
            <div className="font-semibold">Users</div>
            <div className="text-sm text-muted-foreground">
              Manage accounts (admin actions require admin password).
            </div>
            <Button asChild>
              <Link href="/users">Open</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
