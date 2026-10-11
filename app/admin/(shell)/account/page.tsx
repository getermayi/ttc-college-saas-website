import { requireUser } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/constants";
import { AdminPageHeader } from "@/components/admin/page-header";
import { AccountForm } from "@/components/admin/account-form";

export const instant = false;
export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <AdminPageHeader
        title="Your account"
        description={`${user.name} · ${user.email} · ${ROLE_LABELS[user.role]}`}
      />
      <AccountForm />
    </>
  );
}
