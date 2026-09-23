import {
  changeEmailAction,
  changePasswordAction,
  closeSessionsAction,
} from "@/app/(admin)/admin/auth-actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { PASSWORD_MIN, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Account() {
  const admin = await requireAdmin();

  return (
    <>
      <h1 className="adm-h1">Hesap</h1>
      <p className="adm-note mt-3 max-w-[60ch]">
        Panele bu adres ve şifreyle giriliyor. İkisini de buradan
        değiştirebilirsin; her ikisi için de mevcut şifreni yazman gerekiyor.
        Şifre değişince başka tarayıcılarda açık kalan oturumlar kapanır.
      </p>

      <div className="mt-9 grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
        <form
          action={changePasswordAction}
          className="adm-card flex flex-col gap-4"
        >
          <h2 className="font-serif text-[21px] leading-tight">Şifre</h2>

          <div>
            <label className="adm-label" htmlFor="current">
              Mevcut şifre
            </label>
            <input
              id="current"
              name="current"
              type="password"
              className="adm-input"
              autoComplete="current-password"
              required
            />
          </div>

          <div>
            <label className="adm-label" htmlFor="next">
              Yeni şifre — en az {PASSWORD_MIN} karakter
            </label>
            <input
              id="next"
              name="next"
              type="password"
              className="adm-input"
              autoComplete="new-password"
              minLength={PASSWORD_MIN}
              required
            />
          </div>

          <div>
            <label className="adm-label" htmlFor="repeat">
              Yeni şifre, bir daha
            </label>
            <input
              id="repeat"
              name="repeat"
              type="password"
              className="adm-input"
              autoComplete="new-password"
              minLength={PASSWORD_MIN}
              required
            />
          </div>

          <SubmitButton
            className="adm-btn adm-btn-primary self-start"
            busyLabel="Değişiyor…"
          >
            Şifreyi değiştir
          </SubmitButton>
        </form>

        <form
          action={changeEmailAction}
          className="adm-card flex flex-col gap-4"
        >
          <h2 className="font-serif text-[21px] leading-tight">E-posta</h2>

          <div>
            <label className="adm-label" htmlFor="email">
              Giriş adresi
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="adm-input"
              defaultValue={admin.email}
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="adm-label" htmlFor="password">
              Mevcut şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="adm-input"
              autoComplete="current-password"
              required
            />
          </div>

          <SubmitButton
            className="adm-btn adm-btn-primary self-start"
            busyLabel="Değişiyor…"
          >
            Adresi değiştir
          </SubmitButton>
        </form>
      </div>

      <form action={closeSessionsAction} className="mt-9">
        <SubmitButton
          className="adm-btn adm-btn-danger"
          busyLabel="Kapatılıyor…"
          confirm="Bütün oturumlar kapanacak, bu tarayıcı dâhil. Devam?"
        >
          Bütün oturumları kapat
        </SubmitButton>
        <p className="adm-note mt-2 max-w-[60ch]">
          Başka bir bilgisayarda açık unuttuğunu düşünüyorsan. Buradan da
          çıkmış olursun, şifreni yeniden girersin.
        </p>
      </form>
    </>
  );
}
