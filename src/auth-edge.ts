import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { auth } = NextAuth({
  // ✅ Edge-safe: nada de Prisma aqui
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // ✅ MVP EDGE-SAFE: validação hardcoded (só pra destravar middleware)
        // Depois a gente troca por Prisma no auth normal (Node).
        if (
          credentials?.username === "admin" &&
          credentials?.password === "admin"
        ) {
          return { id: "admin", name: "Admin", role: "ADMIN" } as any;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role;
      return token;
    },
    async session({ session, token }) {
      (session.user as any).role = token.role;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
