import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// Optimistic check only: redirects signed-out visitors away from /admin.
// Every admin page and server action re-verifies the user against the database.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/admin/:path*"],
};
