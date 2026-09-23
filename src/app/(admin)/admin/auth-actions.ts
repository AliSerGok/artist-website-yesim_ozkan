"use server";

import { redirect } from "next/navigation";

import {
  changeEmail,
  changePassword,
  closeAllSessions,
  requireAdmin,
  signIn,
  signOut,
} from "@/lib/auth";
import { finish } from "@/lib/flash";

const field = (form: FormData, key: string) => String(form.get(key) ?? "");

/**
 * The login form's own action. It answers with a line to print under the
 * fields rather than redirecting, so a mistyped password keeps the page —
 * and the address already typed — where it was.
 */
export async function signInAction(
  _state: { error: string },
  form: FormData,
): Promise<{ error: string }> {
  const email = field(form, "email").trim();
  const password = field(form, "password");

  if (!email || !password) {
    return { error: "E-posta ve şifre gerekli." };
  }

  let refusal: string | null;
  try {
    refusal = await signIn(email, password);
  } catch (cause) {
    console.error(cause);
    const reason = cause instanceof Error ? cause.message : "bilinmeyen hata";
    return { error: `Olmadı — ${reason}.` };
  }

  if (refusal) return { error: refusal };

  // redirect() throws to unwind, so it stays out of the try above.
  redirect("/admin");
}

export async function signOutAction(): Promise<never> {
  await signOut();
  redirect("/admin/login");
}

export async function changePasswordAction(form: FormData): Promise<never> {
  return finish("/admin/account", "Şifre değiştirildi.", async () => {
    const admin = await requireAdmin();
    await changePassword(
      admin,
      field(form, "current"),
      field(form, "next"),
      field(form, "repeat"),
    );
  });
}

export async function changeEmailAction(form: FormData): Promise<never> {
  // Lower case here too, so the note says the address that was actually saved.
  const email = field(form, "email").trim().toLowerCase();

  return finish("/admin/account", `Giriş adresi ${email} oldu.`, async () => {
    const admin = await requireAdmin();
    await changeEmail(admin, email, field(form, "password"));
  });
}

/** Signs out every browser, this one included. */
export async function closeSessionsAction(): Promise<never> {
  return finish(
    "/admin/login",
    "Bütün oturumlar kapatıldı.",
    async () => {
      const admin = await requireAdmin();
      await closeAllSessions(admin);
      await signOut();
    },
    "/admin/account",
  );
}
