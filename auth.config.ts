import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration (no database access).
 * Used by proxy.ts for a fast, optimistic session check. Real authorisation
 * happens in lib/auth/session.ts on every admin page and server action.
 */
export const authConfig = {
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isPublicAdmin =
        pathname.startsWith("/admin/login") || pathname.startsWith("/admin/accept-invite");
      if (pathname.startsWith("/admin") && !isPublicAdmin) return !!auth?.user;
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.uid = (user as { id?: string }).id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? "";
        session.user.role = (token.role as string) ?? "";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
