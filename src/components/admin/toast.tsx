"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type ToastTone = "ok" | "err";

interface Toast {
  id: number;
  tone: ToastTone;
  text: string;
}

/** How long a note stays up. A problem waits longer than a success. */
const LIFETIME: Record<ToastTone, number> = { ok: 4200, err: 7500 };

/** At most this many at once; older ones step aside. */
const MAX_SHOWN = 3;

const PushContext = createContext<(text: string, tone?: ToastTone) => void>(
  () => {},
);

/** Call this from any client component inside the admin panel. */
export function useToast() {
  return useContext(PushContext);
}

/**
 * The panel's one voice. Every save, move and failure says so here, so the
 * admin never has to guess whether a click landed.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (text: string, tone: ToastTone = "ok") => {
      if (!text) return;
      nextId.current += 1;
      const id = nextId.current;

      setToasts((list) => [...list, { id, tone, text }].slice(-MAX_SHOWN));
      timers.current.push(
        window.setTimeout(() => dismiss(id), LIFETIME[tone]),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(window.clearTimeout);
  }, []);

  return (
    <PushContext.Provider value={push}>
      {/* Server actions hand their note over in the address bar. */}
      <Suspense fallback={null}>
        <Flash />
      </Suspense>

      {children}

      <div className="adm-toasts" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            type="button"
            className="adm-toast"
            data-tone={toast.tone}
            onClick={() => dismiss(toast.id)}
            title="Kapat"
          >
            <span className="adm-toast-mark" aria-hidden>
              {toast.tone === "err" ? "!" : "✓"}
            </span>
            <span className="adm-toast-text">{toast.text}</span>
          </button>
        ))}
      </div>
    </PushContext.Provider>
  );
}

/**
 * A server action cannot talk to the browser directly, so it redirects with
 * its note attached. We read it, say it out loud, then wipe it from the URL
 * with a plain history write — no second trip to the server.
 */
function Flash() {
  const push = useToast();
  const params = useSearchParams();
  const pathname = usePathname();

  const text = params.get("toast");
  const tone: ToastTone = params.get("tone") === "err" ? "err" : "ok";
  // Two identical saves in a row still differ here, so the second one is
  // not mistaken for the first and swallowed.
  const nonce = params.get("n");

  useEffect(() => {
    if (!text) return;
    push(text, tone);

    const rest = new URLSearchParams(window.location.search);
    ["toast", "tone", "n"].forEach((key) => rest.delete(key));
    const query = rest.toString();
    window.history.replaceState(
      null,
      "",
      query ? `${pathname}?${query}` : pathname,
    );
  }, [text, tone, nonce, pathname, push]);

  return null;
}
