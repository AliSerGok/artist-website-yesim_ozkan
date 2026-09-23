"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { dict } from "@/lib/dictionary";
import type { Lang } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";

export interface HomeSlide {
  title: string;
  /** Italic tail after the title: the year of a work, or whatever was typed. */
  aside: string;
  caption: string;
  /** Placeholder line, for a work whose picture has not been uploaded yet. */
  slot: string;
  imageKey: string | null;
  /** Where the slide leads, or null when it leads nowhere. */
  href: string | null;
}

/** How long a screen holds before the next one comes in. */
const HOLD = 6000;

/**
 * The opening screen: two slides at a time, side by side, turning on their
 * own every few seconds. A screen the list leaves with a single slide gives
 * it the full width rather than pairing it with a repeat.
 */
export function HomeSlideshow({
  lang,
  screens,
}: {
  lang: Lang;
  /** Each screen already holds what it shows: one slide, or two. */
  screens: HomeSlide[][];
}) {
  const t = dict(lang);
  const pairs = screens.length;
  const [pair, setPair] = useState(0);

  const go = useCallback(
    (next: number) => setPair(((next % pairs) + pairs) % pairs),
    [pairs],
  );

  /* The clock restarts after every move, so a click is never cut short. */
  useEffect(() => {
    if (pairs < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(
      () => setPair((current) => (current + 1) % pairs),
      HOLD,
    );

    return () => window.clearTimeout(timer);
  }, [pair, pairs]);

  if (pairs === 0) return null;

  /* A screen carries two slides, or one given the whole width on its own. */
  const shown = screens[pair] ?? [];
  const left = shown[0] ?? null;
  const right = shown[1] ?? null;

  if (!left) return null;

  /* The screen coming next, which after the last one is the first again. */
  const ahead = pairs > 1 ? (screens[(pair + 1) % pairs] ?? []) : [];

  return (
    <>
      <div
        className="home-grid"
        style={{ "--panes": shown.length } as React.CSSProperties}
      >
        {/* Keyed by the pair, so each turn replays the pane's animation. */}
        <Pane key={`${pair}-a`} slide={left} />
        {right && <Pane key={`${pair}-b`} slide={right} />}
      </div>

      {/* The next pair is fetched while this one is being looked at. */}
      <div aria-hidden className="home-ahead">
        {ahead.map((slide, index) =>
          slide.imageKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={index}
              src={mediaUrl(slide.imageKey, "full")}
              alt=""
            />
          ) : null,
        )}
      </div>

      {pairs > 1 && (
        <div className="home-dots">
          <button
            type="button"
            className="home-arrow"
            aria-label={t.previous}
            onClick={() => go(pair - 1)}
          >
            ←
          </button>

          {Array.from({ length: pairs }, (_, index) => (
            <button
              key={index}
              type="button"
              className="home-dot"
              data-active={index === pair}
              aria-label={`${index + 1} / ${pairs}`}
              aria-current={index === pair ? "true" : undefined}
              onClick={() => go(index)}
            />
          ))}

          <button
            type="button"
            className="home-arrow"
            aria-label={t.next}
            onClick={() => go(pair + 1)}
          >
            →
          </button>
        </div>
      )}
    </>
  );
}

function Pane({ slide }: { slide: HomeSlide }) {
  const picture = slide.imageKey ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={mediaUrl(slide.imageKey, "full")} alt={slide.title} loading="eager" />
  ) : (
    <div className="slot">
      <span lang="en">{slide.slot}</span>
    </div>
  );

  return (
    <figure className="home-pane">
      {/* A slide that leads nowhere is a picture, not a link. */}
      {slide.href ? (
        <Link
          href={slide.href}
          className="home-link"
          aria-label={slide.imageKey ? undefined : slide.title}
        >
          {picture}
        </Link>
      ) : (
        <div className="home-link">{picture}</div>
      )}

      <figcaption className="home-cap">
        <div className="font-serif text-[clamp(19px,2vw,26px)] leading-[1.2] text-bg">
          {slide.title}
          {slide.aside && <span className="italic opacity-80">, {slide.aside}</span>}
        </div>
        <div className="mt-[5px] text-[11px] tracking-[0.06em] text-[rgba(253,253,252,0.82)]">
          {slide.caption}
        </div>
      </figcaption>
    </figure>
  );
}
