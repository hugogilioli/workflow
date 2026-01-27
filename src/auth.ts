// src/auth.ts
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * ⚠️ IMPORTANTE
 * - Este arquivo NÃO pode importar Prisma, db ou bcrypt
 * - Ele é usado pelo middleware (Edge Runtime)
 * - Toda lógica pesada fica fora (ex: API Node)
 */

export const {
  handlers, // /api/auth/[...nextauth]
  auth,     // usado no middleware e server components
  signIn,
  signOut,
} = NextAuth(authConfig);
