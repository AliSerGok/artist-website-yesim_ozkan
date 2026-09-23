"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useFormStatus } from "react-dom";

import { useToast } from "@/components/admin/toast";
import type { Note } from "@/lib/flash";

/**
 * A list the admin reorders by dragging, rather than walking a row up one
 * press at a time. Thirty works used to mean thirty clicks; now it is one
 * drag, and the whole order goes to the server on release.
 *
 * While the drag runs nothing reflows: the rows keep their places and only
 * their transforms move, so the page under the pointer stays still. The
 * screen is committed first and the server catches up — if it refuses, the
 * old order comes straight back with the reason.
 *
 * The page keeps its own markup. It hands the rows over in order and drops a
 * <DragHandle> where the ↑↓ pair used to sit.
 *
 * Most lists answer straight to the server with `action`. A list living
 * inside one of the panel's long forms — the home page's screens — takes
 * `intent` instead: the drop posts the form it stands in, so everything typed
 * but not yet saved travels with the new order, exactly as that page's own
 * buttons already do.
 */

export interface SortableRow {
  id: string;
  content: React.ReactNode;
}

/** What a handle needs from the list it sits in. */
interface Sorting {
  /** The row under the pointer right now, if any. */
  liftedId: string | null;
  grab: (event: React.PointerEvent<HTMLElement>, id: string) => void;
  move: (clientY: number) => void;
  drop: () => void;
  cancel: () => void;
  nudge: (event: React.KeyboardEvent<HTMLElement>, id: string) => void;
}

const SortContext = createContext<Sorting | null>(null);

/** Where a row sits on the page, in document coordinates. */
interface Slot {
  top: number;
  height: number;
}

interface Drag {
  id: string;
  from: number;
  to: number;
  /** How far the pointer has carried the row since it was grabbed. */
  dy: number;
  /** The rows as they stood when it was picked up; measuring once is enough,
   *  since nothing but this row moves for the rest of the drag. */
  slots: Slot[];
  gap: number;
  ids: string[];
}

/** How near the window edge a drag has to get before the page follows it. */
const EDGE = 90;

/** Fastest the page scrolls itself while a drag hangs at the edge, per frame. */
const SPEED = 18;

/** Moves one entry of a list, the way a drop does. */
function moved<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

/** How far each row slides once the one at `from` is dropped at `to`. */
function shifted(slots: Slot[], gap: number, from: number, to: number) {
  const order = moved(
    slots.map((_, index) => index),
    from,
    to,
  );
  const out = new Array<number>(slots.length).fill(0);
  let y = slots[0].top;

  for (const index of order) {
    out[index] = y - slots[index].top;
    y += slots[index].height + gap;
  }

  return out;
}

/**
 * Which slot the dragged row is over, read from its own midline against the
 * midlines the rows started at. Those never move while the drag runs, so the
 * answer only changes when the row has genuinely passed a neighbour.
 */
function landing(slots: Slot[], from: number, dy: number) {
  const middle = (index: number) => slots[index].top + slots[index].height / 2;
  const centre = middle(from) + dy;

  let to = from;
  while (to > 0 && centre < middle(to - 1)) to -= 1;
  while (to < slots.length - 1 && centre > middle(to + 1)) to += 1;
  return to;
}

export function SortableList({
  rows,
  action,
  intent,
  className,
}: {
  rows: SortableRow[];
  /** Takes the ids in their new order and answers with a line to read out. */
  action?: (ids: string[]) => Promise<Note>;
  /** Posts the surrounding form as `<intent>:<ids>` instead of calling out. */
  intent?: string;
  className?: string;
}) {
  const push = useToast();
  const [, startTransition] = useTransition();
  // Idle whenever there is no form around this list, which is most of them.
  const { pending } = useFormStatus();
  const [order, setOrder] = useState(() => rows.map((row) => row.id));
  const [drag, setDrag] = useState<Drag | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  /** The pointer's document y where the row was picked up. */
  const origin = useRef(0);
  /** Its last position in the window, which is what the edge scroller reads. */
  const onScreen = useRef(0);
  /** The drag as the handlers see it; the state above is for the render. */
  const live = useRef<Drag | null>(null);
  /** The hidden button a form-bound list posts itself with. */
  const submit = useRef<HTMLButtonElement>(null);

  // Every save re-renders the panel with the stored order. Adopt it — unless
  // a drag is in flight, in which case the screen is the newer of the two and
  // the server is about to agree with it anyway.
  const signature = rows.map((row) => row.id).join("|");
  const [adopted, setAdopted] = useState(signature);
  if (adopted !== signature && !drag) {
    setAdopted(signature);
    setOrder(rows.map((row) => row.id));
  }

  const byId = new Map(rows.map((row) => [row.id, row]));
  const placed = new Set(order);
  const list = [
    ...order.filter((id) => byId.has(id)),
    // Anything added while this page stood open still gets drawn, at the end.
    ...rows.filter((row) => !placed.has(row.id)).map((row) => row.id),
  ];

  /** The rows of *this* list; a nested one keeps its own to itself. */
  const cards = useCallback(
    () =>
      Array.from(listRef.current?.children ?? []).filter(
        (node): node is HTMLElement =>
          node instanceof HTMLElement && node.dataset.row !== undefined,
      ),
    [],
  );

  const commit = useCallback(
    (next: string[], previous: string[]) => {
      setOrder(next);

      if (intent) {
        const button = submit.current;
        if (!button) return;
        button.value = `${intent}:${next.join(",")}`;
        button.form?.requestSubmit(button);
        return;
      }

      if (!action) return;
      startTransition(async () => {
        const { note, tone } = await action(next);
        if (tone === "err") setOrder(previous);
        push(note, tone);
      });
    },
    [action, intent, push],
  );

  const grab = useCallback(
    (event: React.PointerEvent<HTMLElement>, id: string) => {
      if (event.button !== 0 || live.current) return;

      const rowElements = cards();
      const from = rowElements.findIndex((row) => row.dataset.row === id);
      if (from < 0 || rowElements.length < 2) return;

      const rects = rowElements.map((row) => row.getBoundingClientRect());
      // Kept in document coordinates, so the page may scroll under the drag.
      const slots = rects.map((rect) => ({
        top: rect.top + window.scrollY,
        height: rect.height,
      }));

      origin.current = event.clientY + window.scrollY;
      onScreen.current = event.clientY;
      event.currentTarget.setPointerCapture(event.pointerId);
      // Keeps the drag from selecting text or focusing the handle.
      event.preventDefault();

      const started = {
        id,
        from,
        to: from,
        dy: 0,
        slots,
        gap: Math.max(0, rects[1].top - rects[0].bottom),
        ids: rowElements.map((row) => row.dataset.row as string),
      };
      live.current = started;
      setDrag(started);
    },
    [cards],
  );

  const move = useCallback((clientY: number) => {
    const state = live.current;
    if (!state) return;
    onScreen.current = clientY;

    const dy = clientY + window.scrollY - origin.current;
    const to = landing(state.slots, state.from, dy);
    if (dy === state.dy && to === state.to) return;

    const next = { ...state, dy, to };
    live.current = next;
    setDrag(next);
  }, []);

  const cancel = useCallback(() => {
    live.current = null;
    setDrag(null);
  }, []);

  const drop = useCallback(() => {
    const state = live.current;
    if (!state) return;
    live.current = null;
    setDrag(null);
    if (state.to === state.from) return;

    commit(moved(state.ids, state.from, state.to), state.ids);
  }, [commit]);

  /** The handle is a button too: the arrow keys still walk a row one step. */
  const nudge = useCallback(
    (event: React.KeyboardEvent<HTMLElement>, id: string) => {
      const step =
        event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
      if (!step) return;

      const current = cards().map((row) => row.dataset.row as string);
      const from = current.indexOf(id);
      const to = from + step;
      if (from < 0 || to < 0 || to >= current.length) return;

      event.preventDefault();
      commit(moved(current, from, to), current);
    },
    [cards, commit],
  );

  // A form-bound list is ahead of the form until it answers. A save that took
  // rebuilds the form from what was stored, this list with it; one that did
  // not leaves the list standing, so hand the order back to the server's.
  const posted = useRef(false);
  useEffect(() => {
    if (pending) {
      posted.current = true;
      return;
    }
    if (!posted.current) return;
    posted.current = false;
    setOrder(signature.split("|"));
  }, [pending, signature]);

  const dragging = drag !== null;

  useEffect(() => {
    if (!dragging) return;

    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancel();
    };
    window.addEventListener("keydown", escape);

    // A long list outruns the window, so a drag held near an edge takes the
    // page with it — gently at the line, faster the further past it goes.
    let frame = 0;
    const step = () => {
      const y = onScreen.current;
      const above = y - EDGE;
      const below = y - (window.innerHeight - EDGE);
      const speed =
        above < 0
          ? Math.max(-SPEED, above / 4)
          : below > 0
            ? Math.min(SPEED, below / 4)
            : 0;

      if (speed) {
        const was = window.scrollY;
        window.scrollBy(0, speed);
        if (window.scrollY !== was) move(onScreen.current);
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    return () => {
      window.removeEventListener("keydown", escape);
      cancelAnimationFrame(frame);
    };
  }, [dragging, cancel, move]);

  const offsets =
    drag && drag.slots.length === list.length
      ? shifted(drag.slots, drag.gap, drag.from, drag.to)
      : null;

  return (
    <SortContext.Provider
      value={{ liftedId: drag?.id ?? null, grab, move, drop, cancel, nudge }}
    >
      {intent && (
        // Never pressed by hand; the drop fills in its value and submits it,
        // so the form reads the drag as one more of its own buttons.
        <button ref={submit} type="submit" name="intent" hidden tabIndex={-1} />
      )}

      <div
        ref={listRef}
        className={className}
        data-sorting={dragging ? "true" : undefined}
      >
        {list.map((id, index) => {
          const lifted = drag?.id === id;
          const slide = lifted ? drag.dy : (offsets?.[index] ?? 0);

          return (
            <div
              key={id}
              data-row={id}
              className="adm-sortable"
              data-lifted={lifted ? "true" : undefined}
              style={
                slide
                  ? { transform: `translateY(${Math.round(slide)}px)` }
                  : undefined
              }
            >
              {byId.get(id)?.content}
            </div>
          );
        })}
      </div>
    </SortContext.Provider>
  );
}

/**
 * The grip. It goes inside a row's own markup, wherever the page wants it,
 * and does nothing at all outside a <SortableList>.
 */
export function DragHandle({
  id,
  label = "Sürükleyerek taşı",
}: {
  id: string;
  label?: string;
}) {
  const sort = useContext(SortContext);
  if (!sort) return null;

  return (
    <button
      type="button"
      className="adm-grip"
      aria-label={label}
      title="Sürükleyerek taşı — ya da ok tuşlarıyla"
      data-lifted={sort.liftedId === id ? "true" : undefined}
      onPointerDown={(event) => sort.grab(event, id)}
      onPointerMove={(event) => sort.move(event.clientY)}
      onPointerUp={sort.drop}
      onPointerCancel={sort.cancel}
      onKeyDown={(event) => sort.nudge(event, id)}
    >
      <span aria-hidden>⠿</span>
    </button>
  );
}
