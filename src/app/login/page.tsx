"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/";


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-md rounded-2xl">
        <CardContent className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">WorkFlow</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to continue.
            </p>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);

              startTransition(async () => {
                const res = await signIn("credentials", {
                  email,
                  password,
                  redirect: false, // ✅ we'll redirect manually (most reliable)
                  callbackUrl,
                });

                // NextAuth returns { ok, error, url }
                if (!res || res.error) {
                  setError("Invalid email or password.");
                  return;
                }

                // ✅ Go to callbackUrl (or /requests)
                router.push(res.url ?? callbackUrl);
                router.refresh();
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : null}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
