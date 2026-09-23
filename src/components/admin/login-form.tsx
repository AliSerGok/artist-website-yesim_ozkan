"use client";

import { useActionState } from "react";

import { signInAction } from "@/app/(admin)/admin/auth-actions";

import { SubmitButton } from "./submit-button";

/**
 * The only door into the panel. A refusal comes back as text under the
 * fields — the address stays typed, and nothing about which half was wrong
 * is given away.
 */
export function LoginForm() {
  const [state, action] = useActionState(signInAction, { error: "" });

  return (
    <form action={action} className="mt-7 flex flex-col gap-4">
      <div>
        <label className="adm-label" htmlFor="email">
          E-posta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="adm-input"
          autoComplete="username"
          autoFocus
          required
        />
      </div>

      <div>
        <label className="adm-label" htmlFor="password">
          Şifre
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

      {state.error ? (
        <p className="adm-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <SubmitButton
        className="adm-btn adm-btn-primary mt-1 justify-center"
        busyLabel="Giriliyor…"
      >
        Gir
      </SubmitButton>
    </form>
  );
}
