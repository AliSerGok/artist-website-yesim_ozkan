"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const IDS = ["bird1", "bird2", "bird3", "bird4"];

interface Spot {
  x: number;
  y: number;
}

interface Position extends Spot {
  flip: number;
}

/**
 * Four birds that live along the header. They fly in, perch on the nav links,
 * hop, stretch, occasionally chase each other or line up, and scatter when the
 * cursor comes near or the reader changes page. Purely decorative: they never
 * take a click, and they stay away if reduced motion is asked for.
 */
export function PerchedBirds() {
  const pathname = usePathname();
  const scatterAll = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const birds = IDS.map((id) => document.getElementById(id)).filter(
      (bird): bird is HTMLElement => bird !== null,
    );
    if (birds.length === 0) return;

    const at = new Map<string, Position>();

    /** Timers are tracked so a page change can cancel the whole flock. */
    const timers = new Set<number>();
    const later = (run: () => void, ms: number) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        run();
      }, ms);
      timers.add(timer);
    };

    const heightOf = (bird: HTMLElement) =>
      bird.getBoundingClientRect().height || 17;

    /** Somewhere in the header a bird can stand: a nav link, or its bottom rule. */
    const perchSpots = (bird: HTMLElement): Spot[] => {
      const height = heightOf(bird);
      const spots: Spot[] = [];

      document
        .querySelectorAll(".hdr-nav a, .hdr-lang a, .hdr .burger")
        .forEach((node) => {
          const rect = node.getBoundingClientRect();
          if (rect.width > 8 && rect.top - height >= 0) {
            spots.push({
              x: rect.left + rect.width * (0.15 + Math.random() * 0.7),
              y: rect.top - height,
            });
          }
        });

      const header = document.querySelector(".hdr");
      if (header) {
        const rect = header.getBoundingClientRect();
        for (let i = 0; i < 3; i += 1) {
          spots.push({
            x: rect.left + rect.width * (0.08 + Math.random() * 0.84),
            y: rect.bottom - height,
          });
        }
      }

      return spots;
    };

    const place = (
      bird: HTMLElement,
      x: number,
      y: number,
      flip: number,
      ms: number,
      ease = "cubic-bezier(0.35, 0.05, 0.4, 1)",
    ) => {
      bird.style.transition = ms
        ? `transform ${ms}ms ${ease}, opacity 300ms ease`
        : "none";
      bird.style.transform = `translate3d(${x}px, ${y}px, 0) scaleX(${flip})`;
      at.set(bird.id, { x, y, flip });
    };

    /** Crosses the screen in a few wandering legs and lands on the target. */
    const flyTo = (bird: HTMLElement, target: Spot, speed = 14) => {
      const from = at.get(bird.id) ?? { x: 0, y: 20, flip: 1 };
      const flip = target.x < from.x ? -1 : 1;
      const distance = Math.abs(target.x - from.x) || 180;
      const duration = Math.max(4200, Math.min(16000, distance * speed));

      bird.classList.add("flying");
      bird.style.opacity = "1";

      const legs = 3 + Math.floor(Math.random() * 3);
      const weights = Array.from(
        { length: legs },
        () => 0.7 + Math.random() * 0.6,
      );
      const total = weights.reduce((sum, weight) => sum + weight, 0);

      let elapsed = 0;
      for (let leg = 0; leg < legs; leg += 1) {
        const last = leg === legs - 1;
        const progress = (leg + 1) / legs;
        const legMs = duration * (weights[leg] / total);

        const x = last
          ? target.x
          : from.x +
            (target.x - from.x) * progress +
            (Math.random() - 0.5) * Math.min(140, distance * 0.5);
        const swing = (leg % 2 ? -1 : 1) * (18 + Math.random() * 40);
        const y = last
          ? target.y
          : Math.max(
              0,
              from.y +
                (target.y - from.y) * progress -
                24 -
                Math.random() * 30 +
                swing,
            );
        const legFlip = last ? flip : x < from.x ? -1 : 1;

        later(
          () =>
            place(
              bird,
              x,
              y,
              legFlip,
              legMs,
              last
                ? "cubic-bezier(0.3, 0.1, 0.2, 1)"
                : "cubic-bezier(0.45, 0.05, 0.55, 0.95)",
            ),
          elapsed,
        );
        elapsed += legMs;
      }

      later(() => bird.classList.remove("flying"), duration + 60);
      return duration;
    };

    const scatter = (bird: HTMLElement, fromX: number) => {
      if (bird.classList.contains("flying")) return;
      const position = at.get(bird.id);
      if (!position) return;

      const direction = position.x < fromX ? -1 : 1;
      const x = Math.max(
        -60,
        Math.min(
          window.innerWidth + 60,
          position.x + direction * (120 + Math.random() * 160),
        ),
      );

      bird.classList.add("flying");
      place(
        bird,
        x,
        Math.max(0, position.y - 30 - Math.random() * 30),
        direction,
        900,
        "cubic-bezier(0.2, 0.7, 0.3, 1)",
      );

      later(() => {
        const spots = perchSpots(bird);
        if (spots.length) {
          flyTo(bird, spots[Math.floor(Math.random() * spots.length)], 11);
        } else {
          bird.classList.remove("flying");
        }
      }, 1100);
    };

    scatterAll.current = () => {
      birds.forEach((bird, index) => {
        later(
          () =>
            scatter(
              bird,
              window.innerWidth / 2 + (index % 2 ? 200 : -200),
            ),
          index * 110,
        );
      });
    };

    birds.forEach((bird, index) => {
      const cycle = () => {
        const spots = perchSpots(bird);
        if (spots.length === 0) {
          later(cycle, 1400);
          return;
        }

        const roll = Math.random();
        let duration: number;

        if (roll < 0.18 && birds.length > 1) {
          // Go and bother a neighbour.
          const neighbour = at.get(birds[(index + 1) % birds.length].id);
          duration = flyTo(
            bird,
            neighbour
              ? {
                  x: neighbour.x + (Math.random() > 0.5 ? 30 : -30),
                  y: neighbour.y,
                }
              : spots[0],
            10,
          );
        } else if (roll < 0.34) {
          // Line up with the others along the header.
          const header = document.querySelector(".hdr");
          const rect = header?.getBoundingClientRect();
          const left = rect?.left ?? 0;
          const width = rect?.width ?? 800;
          const bottom = rect?.bottom ?? 60;
          duration = flyTo(
            bird,
            {
              x: left + width * 0.5 + (index - 1.5) * 26,
              y: bottom - heightOf(bird),
            },
            14,
          );
        } else {
          duration = flyTo(
            bird,
            spots[Math.floor(Math.random() * spots.length)],
            14,
          );
        }

        const sit = 5200 + Math.random() * 9000;

        later(() => {
          bird.classList.remove("hopping");
          void bird.offsetWidth;
          bird.classList.add("hopping");
        }, duration + sit * 0.3);

        later(() => {
          bird.classList.remove("stretch");
          void bird.offsetWidth;
          bird.classList.add("stretch");
          later(() => bird.classList.remove("stretch"), 1600);
        }, duration + sit * 0.62);

        later(cycle, duration + sit);
      };

      // They arrive from off screen.
      place(
        bird,
        index % 2 ? window.innerWidth + 50 : -50,
        24,
        index % 2 ? -1 : 1,
        0,
      );
      later(cycle, 600 + index * 1500);
    });

    const onMouseMove = (event: MouseEvent) => {
      for (const bird of birds) {
        if (bird.classList.contains("flying")) continue;
        const position = at.get(bird.id);
        if (!position) continue;
        if (
          Math.abs(event.clientX - position.x) < 46 &&
          Math.abs(event.clientY - position.y) < 46
        ) {
          scatter(bird, event.clientX);
        }
      }
    };

    const onClick = (event: MouseEvent) => {
      for (const bird of birds) {
        const position = at.get(bird.id);
        if (
          position &&
          Math.abs(event.clientX - position.x) < 90 &&
          Math.abs(event.clientY - position.y) < 70
        ) {
          scatter(bird, event.clientX);
        }
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("click", onClick, true);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      scatterAll.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("click", onClick, true);
    };
  }, []);

  /** Changing page startles them. */
  const settled = useRef(false);
  useEffect(() => {
    if (!settled.current) {
      settled.current = true;
      return;
    }
    scatterAll.current?.();
  }, [pathname]);

  return (
    <>
      {IDS.map((id) => (
        <div key={id} id={id} className="bird flying" aria-hidden="true">
          <div className="hop">
            <div className="tail" />
            <div className="body" />
            <div className="wing-b" />
            <div className="wing-a" />
            <div className="head" />
            <div className="beak" />
          </div>
        </div>
      ))}
    </>
  );
}
