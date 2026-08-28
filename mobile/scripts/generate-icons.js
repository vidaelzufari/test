#!/usr/bin/env node
/**
 * Rasterizes assets/brand/icon-source.svg into every PNG asset app.config.ts
 * references. Run after any change to the source SVG:
 *   npm run generate:icons
 * Requires the `sharp` dev dependency (not installed by default — this
 * script is intentionally the only thing that needs it, so it's not a
 * runtime dependency of the app).
 */
const path = require("path");
const fs = require("fs");

const ASSETS_DIR = path.join(__dirname, "..", "assets");
const SOURCE_SVG = path.join(ASSETS_DIR, "brand", "icon-source.svg");

const TARGETS = [
  { file: "icon.png", size: 1024 },
  { file: "adaptive-icon-foreground.png", size: 1024 },
  { file: "splash.png", size: 1284 },
  { file: "favicon.png", size: 196 },
];

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.error(
      "Missing dev dependency `sharp`. Install it once with `npm install --save-dev sharp`, then re-run `npm run generate:icons`."
    );
    process.exit(1);
  }

  const svg = fs.readFileSync(SOURCE_SVG);

  for (const target of TARGETS) {
    const outPath = path.join(ASSETS_DIR, target.file);
    await sharp(svg, { density: 384 })
      .resize(target.size, target.size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outPath);
    console.log(`wrote ${path.relative(process.cwd(), outPath)} (${target.size}x${target.size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
