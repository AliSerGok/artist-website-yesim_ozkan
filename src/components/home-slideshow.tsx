"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Lightbox } from "@/components/lightbox";
import { HomeCaption } from "@/components/home-caption";
import type { GalleryWork } from "@/components/work-gallery";
import { dict } from "@/lib/dictionary";
import type { StyleMap } from "@/lib/type-style";
import type { Lang } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { seriesHref, workHref, workInPath } from "@/lib/routes";

/**
 * What a click on a slide does. Every one of them ends in the same viewer the
 * grid opens; they differ in what is left underneath it, which is what the
 * Back button walks out through.
 */
export type HomeTarget =
  /** A work standing on its own: the viewer opens over the home page. */
  | { kind: "work"; slug: string }
  /**
   * A work inside a series: the series page is opened first and the viewer
   * over it, so Back leaves the work at the series before the home page.
   */
  | { kind: "series"; slug: string; seriesSlug: string }
  /** A picture that is no work: the viewer shows it, the address stays put. */
  | { kind: "image"; work: GalleryWork }
  /** A picture the panel gave a link of its own: it simply leads there. */
  | { kind: "link"; href: string };

export interface HomeSlide {
  /** The faces chosen for the name and for the line under it. */
  styles: StyleMap<"title" | "caption">;
  /** Also what the picture is called, even when nothing is written over it. */
  title: string;
  /** Italic tail after the title: the year of a work, or whatever was typed. */
  aside: string;
  caption: string;
  /** Asked to stay bare: the picture alone, with no writing laid over it. */
  bare: boolean;
  /** Placeholder line, for a work whose picture has not been uploaded yet. */
  slot: string;
  imageKey: string | null;
  /** What a click does, or null when the slide leads nowhere. */
  target: HomeTarget | null;
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
  singles,
}: {
  lang: Lang;
  /** Each screen already holds what it shows: one slide, or two. */
  screens: HomeSlide[][];
  /**
   * The works standing outside a series, in grid order, so the viewer opened
   * from here walks the same neighbours it walks on the works page.
   */
  singles: GalleryWork[];
}) {
  const t = dict(lang);
  const router = useRouter();
  const pairs = screens.length;
  const [pair, setPair] = useState(0);

  /** The viewer, and the list it is walking, or null while it is closed. */
  const [viewer, setViewer] = useState<{
    works: GalleryWork[];
    index: number;
  } | null>(null);

  const go = useCallback(
    (next: number) => setPair(((next % pairs) + pairs) % pairs),
    [pairs],
  );

  /* The clock restarts after every move, so a click is never cut short. It
     stops altogether while the viewer is up, which is not a slideshow. */
  useEffect(() => {
    if (pairs < 2 || viewer) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(
      () => setPair((current) => (current + 1) % pairs),
      HOLD,
    );

    return () => window.clearTimeout(timer);
  }, [pair, pairs, viewer]);

  /**
   * Answers whether the click was taken. Said no, the slide is left to its
   * own link: a work the grid does not list — its series withdrawn under it,
   * say — is better followed to its page than not answering the click.
   */
  const open = useCallback(
    (target: HomeTarget): boolean => {
      if (target.kind === "series") {
        /*
         * Through the series page rather than straight to the work: it is the
         * page that renders under the viewer and the one Back uncovers, and
         * it opens the viewer itself the moment it arrives.
         */
        router.push(
          `${seriesHref(lang, target.seriesSlug)}?work=${target.slug}`,
        );
        return true;
      }

      if (target.kind === "work") {
        const index = singles.findIndex((work) => work.slug === target.slug);
        if (index < 0) return false;
        window.history.pushState(null, "", workHref(lang, target.slug));
        setViewer({ works: singles, index });
        return true;
      }

      if (target.kind === "image") {
        /* Nothing to name in the address; the entry is only there so that
           Back closes the viewer and leaves the home page standing. */
        window.history.pushState(null, "", window.location.href);
        setViewer({ works: [target.work], index: 0 });
        return true;
      }

      /* A link of its own is followed, not opened. */
      return false;
    },
    [lang, router, singles],
  );

  const step = useCallback(
    (index: number) => {
      if (!viewer) return;
      const work = viewer.works[index];
      if (!work) return;
      // Replace, so one Back press leaves the viewer rather than walking it.
      if (work.slug) {
        window.history.replaceState(null, "", workHref(lang, work.slug));
      }
      setViewer({ works: viewer.works, index });
    },
    [lang, viewer],
  );

  const close = useCallback(() => {
    window.history.back();
  }, []);

  /** Back and forward move in and out of the viewer. */
  useEffect(() => {
    const onPopState = () => {
      const slug = workInPath(window.location.pathname);
      const index = slug
        ? singles.findIndex((work) => work.slug === slug)
        : -1;
      setViewer(index >= 0 ? { works: singles, index } : null);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [singles]);

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
        <Pane key={`${pair}-a`} lang={lang} slide={left} onOpen={open} />
        {right && (
          <Pane key={`${pair}-b`} lang={lang} slide={right} onOpen={open} />
        )}
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

      {viewer && (
        <Lightbox
          lang={lang}
          works={viewer.works}
          index={viewer.index}
          onStep={step}
          onClose={close}
        />
      )}
    </>
  );
}

function Pane({
  lang,
  slide,
  onOpen,
}: {
  lang: Lang;
  slide: HomeSlide;
  onOpen: (target: HomeTarget) => boolean;
}) {
  /*
   * A slide told to stay bare, and one that was simply left unwritten, come
   * to the same thing: no line over the picture, and so no dark wash under
   * the line either — the picture reaches the bottom edge on its own.
   */
  const written =
    !slide.bare && Boolean(slide.title || slide.aside || slide.caption);

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
      <Opener lang={lang} slide={slide} onOpen={onOpen}>
        {picture}
      </Opener>

      {written && (
        <HomeCaption
          title={slide.title}
          aside={slide.aside}
          caption={slide.caption}
          styles={slide.styles}
        />
      )}

    </figure>
  );
}

/**
 * What the picture sits in. A slide standing for a work keeps a real link to
 * it, so it can be shared, opened in a new tab and crawled; a plain click
 * opens the viewer instead of walking off to the page.
 */
function Opener({
  lang,
  slide,
  onOpen,
  children,
}: {
  lang: Lang;
  slide: HomeSlide;
  onOpen: (target: HomeTarget) => boolean;
  children: React.ReactNode;
}) {
  const t = dict(lang);
  const target = slide.target;

  /* A slide that leads nowhere is a picture, not a link. */
  if (!target) return <div className="home-link">{children}</div>;

  if (target.kind === "link") {
    return (
      <Link href={target.href} className="home-link">
        {children}
      </Link>
    );
  }

  if (target.kind === "image") {
    return (
      <button
        type="button"
        onClick={() => onOpen(target)}
        // A picture left unnamed still has to say what the button does.
        aria-label={slide.title || t.enlarge}
        className="home-link cursor-zoom-in border-0 bg-transparent p-0"
      >
        {children}
      </button>
    );
  }

  return (
    <Link
      href={workHref(lang, target.slug)}
      className="home-link cursor-zoom-in"
      aria-label={slide.imageKey ? undefined : slide.title}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
        if (onOpen(target)) event.preventDefault();
      }}
    >
      {children}
    </Link>
  );
}
