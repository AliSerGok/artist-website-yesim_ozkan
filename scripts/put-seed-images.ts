/**
 * Puts the generated placeholder artwork into R2 and points the seed rows at
 * it, so a fresh database shows real images instead of hatched boxes.
 *
 *   node scripts/put-seed-images.ts            # local dev storage
 *   node scripts/put-seed-images.ts --remote   # the deployed bucket
 *
 * Safe to re-run: it overwrites the same keys, and only fills in records whose
 * image is still unset, so nothing the artist uploaded is ever replaced.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { SEED_ABOUT } from "../src/lib/seed.ts";

const IMAGE_DIR = "seed/images";
const BUCKET = "yesim-media";
const DATABASE = "yesim-content";
const CACHE = "public, max-age=31536000, immutable";

const remote = process.argv.includes("--remote");
const target = remote ? "--remote" : "--local";

if (!existsSync(IMAGE_DIR)) {
  console.error(`${IMAGE_DIR} yok. Önce: node scripts/gen-seed-images.ts`);
  process.exit(1);
}

/** Where each generated file belongs in the bucket. */
function keyFor(id: string): string {
  if (id === "portrait") return "pages/about/portrait";
  if (id.startsWith("about-")) return `pages/about/${id.slice("about-".length)}`;
  if (/^e\d+$/.test(id)) return `exhibitions/${id}/seed`;
  return `works/${id}/seed`;
}

const files = readdirSync(IMAGE_DIR)
  .filter((name) => name.endsWith(".webp"))
  .map((name) => {
    const match = /^(.+)-(full|grid)\.webp$/.exec(name);
    return match ? { name, id: match[1], variant: match[2] } : null;
  })
  .filter((entry) => entry !== null);

const wrangler = (args: string[]) =>
  execFileSync("npx", ["wrangler", ...args], { stdio: "inherit" });

console.log(`${files.length} dosya → ${BUCKET} (${remote ? "uzak" : "yerel"})`);

for (const file of files) {
  wrangler([
    "r2", "object", "put",
    `${BUCKET}/${keyFor(file.id)}-${file.variant}.webp`,
    "--file", join(IMAGE_DIR, file.name),
    "--content-type", "image/webp",
    "--cache-control", CACHE,
    target,
  ]);
}

const ids = [...new Set(files.map((file) => file.id))].sort();
const workIds = ids.filter((id) => /^w\d+$/.test(id));
const exhibitionIds = ids.filter((id) => /^e\d+$/.test(id));

/**
 * The about page is one JSON document, so its images are patched in by path.
 * The paths come from the seed itself, which keeps them in step with it.
 */
const aboutPaths: [string, string][] = [
  ["$.portraitKey", keyFor("portrait")],
];
SEED_ABOUT.blocks.forEach((block, index) => {
  if (block.type === "image") {
    aboutPaths.push([
      `$.blocks[${index}].imageKey`,
      keyFor(`about-b${index}`),
    ]);
  }
  if (block.type === "pair") {
    aboutPaths.push([
      `$.blocks[${index}].imageKeyA`,
      keyFor(`about-b${index}a`),
    ]);
    aboutPaths.push([
      `$.blocks[${index}].imageKeyB`,
      keyFor(`about-b${index}b`),
    ]);
  }
});

const statements = [
  ...workIds.map(
    (id) =>
      `UPDATE works SET image_key = '${keyFor(id)}', updated_at = datetime('now') WHERE id = '${id}' AND image_key IS NULL;`,
  ),
  ...exhibitionIds.map(
    (id) =>
      `UPDATE exhibitions SET image_key = '${keyFor(id)}', updated_at = datetime('now') WHERE id = '${id}' AND image_key IS NULL;`,
  ),
  `UPDATE pages SET data = json_set(data, ${aboutPaths
    .map(([path, key]) => `'${path}', '${key}'`)
    .join(", ")}), updated_at = datetime('now')
     WHERE key = 'about' AND json_extract(data, '$.portraitKey') IS NULL;`,
];

// Written as a file rather than --command so the JSON quoting survives the shell.
const sqlPath = join(IMAGE_DIR, ".link.sql");
writeFileSync(sqlPath, statements.join("\n") + "\n", "utf8");

try {
  wrangler(["d1", "execute", DATABASE, "--file", sqlPath, target, "--yes"]);
} finally {
  unlinkSync(sqlPath);
}

console.log(
  `\n${workIds.length} iş, ${exhibitionIds.length} sergi, portre ve ${
    aboutPaths.length - 1
  } sayfa görseli bağlandı.`,
);
