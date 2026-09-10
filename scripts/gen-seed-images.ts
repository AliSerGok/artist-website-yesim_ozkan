/**
 * Renders the placeholder artwork for the seed content: one abstract image per
 * work at that work's aspect ratio, plus a portrait for the about page.
 *
 * Needs Google Chrome and cwebp (`brew install webp`). The output is committed
 * under seed/images/, so `npm run seed:images` runs without either of them.
 *
 *   node scripts/gen-seed-images.ts
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { SEED_ABOUT, SEED_EXHIBITIONS, SEED_WORKS } from "../src/lib/seed.ts";

const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT_DIR = "seed/images";
const FULL_EDGE = 1600;
const GRID_EDGE = 800;

type Style = "paintings" | "prints" | "paper" | "room";

interface Subject {
  id: string;
  ratio: number;
  style: Style;
}

/** The studio and gallery shots that sit between the works. */
const aboutSubjects: Subject[] = SEED_ABOUT.blocks.flatMap((block, index) => {
  if (block.type === "image") {
    return [{ id: `about-b${index}`, ratio: block.ratio, style: "room" as const }];
  }
  if (block.type === "pair") {
    return [
      { id: `about-b${index}a`, ratio: block.ratioA, style: "paper" as const },
      { id: `about-b${index}b`, ratio: block.ratioB, style: "paintings" as const },
    ];
  }
  return [];
});

const subjects: Subject[] = [
  ...SEED_WORKS.map((work) => ({
    id: work.id,
    ratio: work.width / work.height,
    style: work.medium as Style,
  })),
  ...SEED_EXHIBITIONS.map((exhibition) => ({
    id: exhibition.id,
    ratio: 1.5,
    style: "room" as const,
  })),
  { id: "portrait", ratio: 0.84, style: "paper" as const },
  ...aboutSubjects,
];

/** Fits the given ratio inside a square of `edge`. */
function sizeFor(ratio: number, edge: number) {
  return ratio >= 1
    ? { width: edge, height: Math.round(edge / ratio) }
    : { width: Math.round(edge * ratio), height: edge };
}

const PAGE = (width: number, height: number, seed: number, style: string) => `
<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;overflow:hidden;background:#fff}
  canvas{display:block}
</style></head><body>
<canvas id="c" width="${width}" height="${height}"></canvas>
<script>
const W = ${width}, H = ${height}, MEDIUM = ${JSON.stringify(style)};
let s = ${seed} >>> 0;
function rnd() {
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const PALETTES = {
  paintings: {
    grounds: ["#cfc7b4", "#c6bda7", "#d3cab6", "#bdb49e"],
    darks: ["#5f5847", "#4a4536", "#6f6753", "#3a382f"],
    lights: ["#f2ecdc", "#efe6d2", "#faf6ec"],
    accents: ["#b8914f", "#9c7b45", "#8d6f52"],
  },
  prints: {
    grounds: ["#efece3", "#e9e5d9", "#f2f0e8"],
    darks: ["#2c2a24", "#403d33", "#5c5747"],
    lights: ["#fbf9f3"],
    accents: ["#8d8674", "#a9a190"],
  },
  paper: {
    grounds: ["#f4f0e6", "#f1ece0", "#f6f3ea"],
    darks: ["#3a382f", "#2b2a24", "#5c5747"],
    lights: ["#fdfbf5"],
    accents: ["#8d8b81", "#6b6455"],
  },
  room: {
    grounds: ["#e4e0d6", "#dcd8cc", "#e9e5db"],
    darks: ["#4a4536", "#5f5847", "#736b58"],
    lights: ["#f7f4ec", "#fbf9f2"],
    accents: ["#b9b09a", "#a49a85"],
  },
};

const ctx = document.getElementById("c").getContext("2d");
const P = PALETTES[MEDIUM];
const pick = (list) => list[Math.floor(rnd() * list.length)];
const short = Math.min(W, H);
const horizontal = W >= H;
const blur = (px) => { ctx.filter = "blur(" + Math.max(1, Math.round(px)) + "px)"; };

// ground
ctx.fillStyle = pick(P.grounds);
ctx.fillRect(0, 0, W, H);

// the light falling across the whole surface, dark end to light end
const from = rnd() < 0.5 ? [0, 0, W, H] : [W, 0, 0, H];
const wash = ctx.createLinearGradient(from[0], from[1], from[2], from[3]);
wash.addColorStop(0, pick(P.lights));
wash.addColorStop(0.45 + rnd() * 0.2, pick(P.grounds));
wash.addColorStop(1, pick(P.darks));
ctx.globalAlpha = 0.8;
ctx.fillStyle = wash;
ctx.fillRect(0, 0, W, H);
ctx.globalAlpha = 1;

if (MEDIUM === "paintings") {
  // where the wall meets the floor, or the edge of a window
  ctx.save();
  blur(short * 0.02);
  ctx.globalAlpha = 0.42 + rnd() * 0.18;
  ctx.fillStyle = pick(P.darks);
  if (horizontal) {
    ctx.fillRect(-W * 0.1, H * (0.52 + rnd() * 0.3), W * 1.2, H * (0.1 + rnd() * 0.22));
  } else {
    ctx.fillRect(W * (0.04 + rnd() * 0.34), -H * 0.1, W * (0.12 + rnd() * 0.26), H * 1.2);
  }
  ctx.restore();

  // the lit patch, laid over the darker side
  ctx.save();
  blur(short * 0.09);
  ctx.globalAlpha = 0.5 + rnd() * 0.2;
  ctx.fillStyle = pick(P.lights);
  ctx.fillRect(
    W * (rnd() * 0.4),
    H * (rnd() * 0.35),
    W * (0.3 + rnd() * 0.34),
    H * (0.26 + rnd() * 0.4)
  );
  ctx.restore();

  // one warm pass left partly visible
  ctx.save();
  blur(short * 0.06);
  ctx.globalAlpha = 0.16 + rnd() * 0.14;
  ctx.fillStyle = pick(P.accents);
  if (horizontal) {
    ctx.fillRect(-W * 0.1, H * rnd() * 0.7, W * 1.2, H * (0.12 + rnd() * 0.2));
  } else {
    ctx.fillRect(W * rnd() * 0.7, -H * 0.1, W * (0.14 + rnd() * 0.2), H * 1.2);
  }
  ctx.restore();
} else if (MEDIUM === "prints") {
  // flat screenprinted passes, each one a fold of the same curtain
  const fold = (shift) => {
    const t = 0.22 + rnd() * 0.44;
    ctx.beginPath();
    if (horizontal) {
      ctx.moveTo(-W * 0.05, H * t + shift);
      ctx.lineTo(W * 1.05, H * (t - 0.18 + rnd() * 0.36) + shift);
      ctx.lineTo(W * 1.05, H * 1.05);
      ctx.lineTo(-W * 0.05, H * 1.05);
    } else {
      ctx.moveTo(W * t + shift, -H * 0.05);
      ctx.lineTo(W * (t - 0.18 + rnd() * 0.36) + shift, H * 1.05);
      ctx.lineTo(W * 1.05, H * 1.05);
      ctx.lineTo(W * 1.05, -H * 0.05);
    }
    ctx.closePath();
    ctx.fill();
  };

  const passes = 2 + Math.floor(rnd() * 2);
  for (let i = 0; i < passes; i += 1) {
    ctx.globalAlpha = 0.28 + rnd() * 0.26;
    ctx.fillStyle = i === 0 ? pick(P.darks) : pick(P.accents);
    fold(short * (rnd() - 0.5) * 0.08);
  }

  // the pass that missed its registration
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = pick(P.darks);
  fold(-short * 0.03);
  ctx.globalAlpha = 1;
} else if (MEDIUM === "room") {
  // a wall with work hung on it, seen across a lit floor
  const floor = H * (0.66 + rnd() * 0.14);

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = pick(P.darks);
  ctx.fillRect(0, floor, W, H - floor);
  ctx.restore();

  ctx.save();
  blur(short * 0.03);
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = pick(P.darks);
  ctx.fillRect(0, floor - short * 0.01, W, short * 0.02);
  ctx.restore();

  // the hung works
  const hung = 2 + Math.floor(rnd() * 2);
  const bandTop = H * 0.16;
  const bandHeight = floor - bandTop - H * 0.1;
  let x = W * (0.08 + rnd() * 0.06);
  for (let i = 0; i < hung && x < W * 0.88; i += 1) {
    const h = bandHeight * (0.5 + rnd() * 0.45);
    const w = h * (0.7 + rnd() * 0.7);
    const y = bandTop + (bandHeight - h) * (0.25 + rnd() * 0.5);

    ctx.save();
    blur(short * 0.02);
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = pick(P.darks);
    ctx.fillRect(x + short * 0.012, y + short * 0.014, w, h);
    ctx.restore();

    ctx.globalAlpha = 0.62 + rnd() * 0.24;
    ctx.fillStyle = pick(P.lights);
    ctx.fillRect(x, y, w, h);

    ctx.globalAlpha = 0.16 + rnd() * 0.22;
    ctx.fillStyle = pick(P.accents);
    ctx.fillRect(x, y + h * (0.3 + rnd() * 0.4), w, h * (0.12 + rnd() * 0.2));
    ctx.globalAlpha = 1;

    x += w + W * (0.07 + rnd() * 0.1);
  }

  // daylight coming in from one side
  ctx.save();
  blur(short * 0.12);
  ctx.globalAlpha = 0.3 + rnd() * 0.2;
  ctx.fillStyle = pick(P.lights);
  ctx.fillRect(rnd() < 0.5 ? -W * 0.1 : W * 0.6, 0, W * 0.5, H);
  ctx.restore();
} else {
  // ink meeting damp paper
  ctx.save();
  blur(short * 0.06);
  const blots = 1 + Math.floor(rnd() * 2);
  for (let i = 0; i < blots; i += 1) {
    ctx.globalAlpha = 0.38 + rnd() * 0.24;
    ctx.fillStyle = pick(P.darks);
    ctx.beginPath();
    ctx.ellipse(
      W * (0.28 + rnd() * 0.44),
      H * (0.28 + rnd() * 0.44),
      W * (0.18 + rnd() * 0.24),
      H * (0.16 + rnd() * 0.26),
      rnd() * Math.PI,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();

  // the threshold itself: a drawn edge and a few searching lines
  ctx.save();
  ctx.globalAlpha = 0.5 + rnd() * 0.3;
  ctx.strokeStyle = pick(P.darks);
  ctx.lineWidth = Math.max(1.5, short * 0.006);
  ctx.beginPath();
  if (horizontal) {
    const y = H * (0.3 + rnd() * 0.4);
    ctx.moveTo(0, y);
    ctx.lineTo(W, y + H * (rnd() - 0.5) * 0.1);
  } else {
    const x = W * (0.25 + rnd() * 0.5);
    ctx.moveTo(x, 0);
    ctx.lineTo(x + W * (rnd() - 0.5) * 0.16, H);
  }
  ctx.stroke();

  for (let i = 0; i < 2 + Math.floor(rnd() * 2); i += 1) {
    ctx.globalAlpha = 0.18 + rnd() * 0.2;
    ctx.strokeStyle = pick(P.accents);
    ctx.lineWidth = Math.max(1, short * (0.002 + rnd() * 0.003));
    ctx.beginPath();
    if (horizontal) {
      const y = H * rnd();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y + H * (rnd() - 0.5) * 0.12);
    } else {
      const x = W * rnd();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + W * (rnd() - 0.5) * 0.12, H);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// grain
const grain = MEDIUM === "paper" ? 20 : MEDIUM === "prints" ? 12 : MEDIUM === "room" ? 11 : 17;
const image = ctx.getImageData(0, 0, W, H);
const data = image.data;
for (let i = 0; i < data.length; i += 4) {
  const n = (rnd() - 0.5) * grain;
  data[i] += n;
  data[i + 1] += n;
  data[i + 2] += n;
}
ctx.putImageData(image, 0, 0);

// the edges sink slightly, the way a stretched surface does
const vignette = ctx.createRadialGradient(
  W / 2, H / 2, short * 0.15,
  W / 2, H / 2, Math.max(W, H) * 0.72
);
vignette.addColorStop(0, "rgba(0,0,0,0)");
vignette.addColorStop(1, "rgba(42,38,30,0.26)");
ctx.fillStyle = vignette;
ctx.fillRect(0, 0, W, H);
document.title = "ready";
</script></body></html>`;

function hash(value: string) {
  let h = 2166136261;
  for (const character of value) {
    h ^= character.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

mkdirSync(OUT_DIR, { recursive: true });
const scratch = mkdtempSync(join(tmpdir(), "yesim-seed-"));

try {
  for (const subject of subjects) {
    const full = sizeFor(subject.ratio, FULL_EDGE);
    const grid = sizeFor(subject.ratio, GRID_EDGE);

    const html = join(scratch, `${subject.id}.html`);
    const png = join(scratch, `${subject.id}.png`);
    writeFileSync(
      html,
      PAGE(full.width, full.height, hash(subject.id), subject.style),
      "utf8",
    );

    execFileSync(CHROME, [
      "--headless",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--virtual-time-budget=4000",
      `--window-size=${full.width},${full.height}`,
      `--screenshot=${png}`,
      `file://${html}`,
    ], { stdio: "ignore" });

    execFileSync("cwebp", [
      "-quiet", "-q", "74", png,
      "-o", join(OUT_DIR, `${subject.id}-full.webp`),
    ]);
    execFileSync("cwebp", [
      "-quiet", "-q", "80", "-resize", String(grid.width), String(grid.height),
      png, "-o", join(OUT_DIR, `${subject.id}-grid.webp`),
    ]);

    console.log(
      `${subject.id.padEnd(12)} ${subject.style.padEnd(9)} ${full.width}×${full.height}`,
    );
  }
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

console.log(`\n${subjects.length} görsel → ${OUT_DIR}/`);
