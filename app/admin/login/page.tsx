import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { googleEnabled } from "@/auth";
import { LoginForm } from "@/components/admin/login-form";
import { Emblem } from "@/components/site/logo";
import { MotifBand } from "@/components/site/motif";

export const instant = false;

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/admin";
  if (user) redirect(callbackUrl.startsWith("/admin") ? callbackUrl : "/admin");
  const error = typeof sp.error === "string" ? sp.error : null;
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#173b2c] p-12 text-[#fbf7f0] lg:flex lg:flex-col lg:justify-between">
        <div className="motif-texture-light absolute inset-0" aria-hidden />
        <div className="relative flex items-center gap-3">
          <Emblem className="size-12" />
          <span className="font-display text-2xl font-semibold">TTC Aalo</span>
        </div>
        <div className="relative">
          <p className="font-display text-5xl leading-tight font-semibold">
            Every change here reaches a future teacher.
          </p>
          <p className="mt-4 max-w-md text-[#c9d6cd]">
            Update notices, answer enquiries and keep the website accurate — changes go live instantly.
          </p>
        </div>
        <MotifBand tone="accent" className="relative opacity-70" />
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 lg:hidden">
            <Emblem className="size-10" />
            <span className="font-display text-xl font-semibold">TTC Aalo</span>
          </div>
          <h1 className="font-display mt-8 text-3xl font-semibold lg:mt-0">Staff sign in</h1>
          <p className="text-muted-foreground mt-2">Use the email your administrator invited.</p>
          <LoginForm
            callbackUrl={callbackUrl}
            googleEnabled={googleEnabled}
            initialError={
              error === "NotInvited"
                ? "That Google account hasn't been invited. Ask an admin to invite you."
                : error
                  ? "Sign-in failed. Please try again."
                  : null
            }
          />
        </div>
      </div>
    </main>
  );
}
