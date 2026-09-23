import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { adminCount, getAdminIdentity } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * The one address under /admin that lets a stranger in far enough to knock.
 * Before any account exists there is nothing to knock with, so it says how to
 * make one instead of showing a form that could never open.
 */
export default async function Login() {
  if (await getAdminIdentity()) redirect("/admin");

  const accounts = await adminCount();

  return (
    <main className="adm-gate">
      <div className="adm-gate-card">
        <h1 className="adm-h1">Yönetim</h1>

        {accounts === null ? (
          <p className="adm-note mt-3">
            Veritabanına ulaşılamıyor. Yerelde çalışıyorsan önce{" "}
            <code>npm run db:migrate:local</code>.
          </p>
        ) : accounts === 0 ? (
          <>
            <p className="adm-note mt-3">
              Henüz hesap yok. Terminalden bir tane aç, sonra buradan gir:
            </p>
            <pre className="adm-pre mt-3">
              npm run admin:set -- --email adres@site.com --password …
            </pre>
            <p className="adm-note mt-3">
              Yayındaki siteye açmak için komutun sonuna{" "}
              <code>--remote</code> ekle.
            </p>
          </>
        ) : (
          <LoginForm />
        )}
      </div>
    </main>
  );
}
