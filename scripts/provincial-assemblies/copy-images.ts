/**
 * Copy matched provincial assembly member images from
 *   data/provincial assemblies/<assembly>/*.{jpg,jpeg,png}
 * into
 *   public/representatives/<assembly>/<slug>.<ext>
 *
 * Also rewrites each members.json so imageLocalPath holds the relative
 * web path (e.g. "kp/suriya-bibi.jpeg") used downstream by the API.
 *
 * Usage: npx tsx scripts/provincial-assemblies/copy-images.ts
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";
import type { Assembly, ProvincialMember } from "./lib/types";
import { slugify } from "./lib/slugify";

const THUMB_WIDTH = 320;
const JPEG_QUALITY = 78;

const ASSEMBLIES: {
  assembly: Assembly;
  sourceDir: string;
  jsonPath: string;
}[] = [
  {
    assembly: "kp",
    sourceDir: "data/provincial assemblies/kp",
    jsonPath: "data/provincial assemblies/kp/members.json",
  },
  {
    assembly: "balochistan",
    sourceDir: "data/provincial assemblies/balochistan",
    jsonPath: "data/provincial assemblies/balochistan/members.json",
  },
  {
    assembly: "sindh",
    sourceDir: "data/provincial assemblies/sindh",
    jsonPath: "data/provincial assemblies/sindh/members.json",
  },
];

const PUBLIC_ROOT = path.resolve("public/representatives");

function uniqueSlug(base: string, used: Set<string>): string {
  if (!used.has(base)) return base;
  let i = 2;
  while (used.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

async function copyForAssembly(assembly: Assembly, jsonPath: string): Promise<{
  copied: number;
  skipped: number;
  missing: number;
}> {
  const absJson = path.resolve(jsonPath);
  const members: ProvincialMember[] = JSON.parse(
    fs.readFileSync(absJson, "utf8"),
  );

  const outDir = path.join(PUBLIC_ROOT, assembly);
  fs.mkdirSync(outDir, { recursive: true });

  const used = new Set<string>();
  let copied = 0;
  let skipped = 0;
  let missing = 0;

  for (const m of members) {
    if (!m.imageSourcePath) {
      missing++;
      m.imageLocalPath = null;
      continue;
    }
    const base = slugify(m.nameClean || m.name);
    const slug = uniqueSlug(`${base}-${m.sequenceNumber}`, used);
    used.add(slug);
    const filename = `${slug}.jpg`; // normalize to jpg after resize
    const outPath = path.join(outDir, filename);

    if (fs.existsSync(outPath)) {
      skipped++;
    } else {
      await sharp(m.imageSourcePath)
        .rotate() // respect EXIF orientation
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toFile(outPath);
      copied++;
    }
    m.imageLocalPath = `${assembly}/${filename}`;
  }

  fs.writeFileSync(absJson, JSON.stringify(members, null, 2));

  return { copied, skipped, missing };
}

async function main() {
  for (const { assembly, jsonPath } of ASSEMBLIES) {
    const { copied, skipped, missing } = await copyForAssembly(
      assembly,
      jsonPath,
    );
    console.log(
      `${assembly}: copied=${copied} skipped=${skipped} missing=${missing}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
