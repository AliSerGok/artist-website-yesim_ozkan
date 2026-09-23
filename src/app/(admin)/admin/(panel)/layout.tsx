import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction } from "@/app/(admin)/admin/auth-actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { getAdminIdentity } from "@/lib/auth";

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nothing inside this group renders without a session. Every action that
  // writes asks again on its own, so a stale form cannot save either.
  const identity = await getAdminIdentity();
  if (!identity) redirect("/admin/login");

  return (
    <>
      <div className="adm-bar">
        <Link href="/admin" className="font-serif text-[20px] leading-none">
          Yönetim
        </Link>
        <AdminNav />
        <div className="flex items-baseline gap-4">
          <span className="label">{identity.email}</span>
          <form action={signOutAction}>
            <button type="submit" className="nav-link">
              Çıkış
            </button>
          </form>
        </div>
      </div>
      <main className="adm-shell pt-[clamp(26px,4vw,44px)]">{children}</main>
    </>
  );
}
