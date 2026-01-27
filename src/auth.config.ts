import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

function getBaseUrl() {
  // ✅ obrigatório em dev/prod para authorize() usar URL absoluta
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const authConfig: NextAuthConfig = {
    secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },

  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;

        const res = await fetch(`${getBaseUrl()}/api/internal/verify-credentials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // ✅ Edge-safe: só faz fetch
          body: JSON.stringify({ email, password }),
          cache: "no-store",
        });

        if (!res.ok) return null;

        const data = (await res.json()) as any;
        if (!data?.ok) return null;

        return data.user as any;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        (token as any).userId = (user as any).id;
        (token as any).role = (user as any).role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).userId;
        (session.user as any).role = (token as any).role;
      }
      return session;
    },
  },
};
