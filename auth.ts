import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}

const credentialsSchema = z.object({
  email: z.email().transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1).max(200),
});

const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const limit = await rateLimit(`login:${email}`, { limit: 8, windowSeconds: 600 });
        if (!limit.success) throw new TooManyAttempts();

        const user = await prisma.user.findUnique({ where: { email } });
        // Compare against a dummy hash when the user doesn't exist to keep timing similar.
        const hash = user?.passwordHash ?? "$2b$12$C6UzMDM.H6dfI/f/IKcEeO8Y3QMbIt6a1bH0nJqvXzKpB7nVYc9pW";
        const ok = await bcrypt.compare(password, hash);
        if (!user || !user.active || !user.passwordHash || !ok) return null;

        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
    ...(googleEnabled ? [Google({ allowDangerousEmailAccountLinking: false })] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;
      // Google sign-in only works for staff who were already invited.
      const email = user.email?.toLowerCase();
      if (!email) return false;
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing || !existing.active) return "/admin/login?error=NotInvited";
      await prisma.user.update({ where: { id: existing.id }, data: { lastLoginAt: new Date() } });
      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account?.provider === "google" && user.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
        if (dbUser) {
          token.uid = dbUser.id;
          token.role = dbUser.role;
          token.name = dbUser.name;
        }
        return token;
      }
      return authConfig.callbacks.jwt({ token, user });
    },
  },
});

export { googleEnabled };
