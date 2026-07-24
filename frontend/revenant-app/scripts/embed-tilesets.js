/**
 * embed-tilesets.js
 *
 * Resolves external .tsx tileset references in a Tiled JSON map file
 * and produces a fully embedded version that Phaser can parse.
 *
 * Usage: node scripts/embed-tilesets.js
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MAPS_DIR = resolve(__dirname, "../src/assets/maps/world1");
const INPUT_FILE = resolve(MAPS_DIR, "map_one.json");
const OUTPUT_FILE = resolve(MAPS_DIR, "map_one_embedded.json");

/**
 * Parses a Tiled .tsx XML file and extracts tileset data as a JSON object.
 */
function parseTsx(tsxPath) {
  const xml = readFileSync(tsxPath, "utf-8");

  // Extract tileset attributes
  const tilesetMatch = xml.match(
    /<tileset\s+version="[^"]*"\s+tiledversion="[^"]*"\s+name="([^"]*)"\s+tilewidth="(\d+)"\s+tileheight="(\d+)"\s+tilecount="(\d+)"\s+columns="(\d+)">/
  );

  if (!tilesetMatch) {
    throw new Error(`Failed to parse tileset from: ${tsxPath}`);
  }

  const [, name, tilewidth, tileheight, tilecount, columns] = tilesetMatch;

  // Extract image attributes
  const imageMatch = xml.match(
    /<image\s+source="([^"]*)"\s+width="(\d+)"\s+height="(\d+)"\/>/
  );

  if (!imageMatch) {
    throw new Error(`Failed to parse image from: ${tsxPath}`);
  }

  const [, imageSource, imageWidth, imageHeight] = imageMatch;

  // Resolve image path relative to the map file (not the tsx file)
  // The embedded JSON should reference images relative to the map location
  const tsxDir = dirname(tsxPath);
  const absoluteImagePath = resolve(tsxDir, imageSource);
  const relativeToMap = absoluteImagePath
    .replace(resolve(MAPS_DIR), "")
    .replace(/\\/g, "/");

  // Build the image path relative to the map folder
  const mapRelativeImage = "../../images/world1/" + absoluteImagePath.split("images/world1/")[1];

  const tileset = {
    columns: parseInt(columns),
    image: mapRelativeImage,
    imageheight: parseInt(imageHeight),
    imagewidth: parseInt(imageWidth),
    margin: 0,
    name,
    spacing: 0,
    tilecount: parseInt(tilecount),
    tileheight: parseInt(tileheight),
    tilewidth: parseInt(tilewidth),
  };

  // Extract tile collision objects if present
  const tileRegex = /<tile\s+id="(\d+)">([\s\S]*?)<\/tile>/g;
  const tiles = [];
  let tileMatch;

  while ((tileMatch = tileRegex.exec(xml)) !== null) {
    const tileId = parseInt(tileMatch[1]);
    const tileContent = tileMatch[2];

    // Check for objectgroup (collision data)
    if (tileContent.includes("<objectgroup")) {
      const objects = [];
      const objRegex = /<object\s+([^>]*?)\/>/g;
      let objMatch;

      while ((objMatch = objRegex.exec(tileContent)) !== null) {
        const attrs = objMatch[1];
        const obj = {};

        const idM = attrs.match(/id="(\d+)"/);
        const typeM = attrs.match(/type="([^"]*)"/);
        const xM = attrs.match(/x="([^"]*)"/);
        const yM = attrs.match(/y="([^"]*)"/);
        const wM = attrs.match(/width="([^"]*)"/);
        const hM = attrs.match(/height="([^"]*)"/);

        if (idM) obj.id = parseInt(idM[1]);
        if (typeM) obj.type = typeM[1];
        if (xM) obj.x = parseFloat(xM[1]);
        if (yM) obj.y = parseFloat(yM[1]);
        if (wM) obj.width = parseFloat(wM[1]);
        if (hM) obj.height = parseFloat(hM[1]);
        obj.name = "";
        obj.opacity = 1;
        obj.rotation = 0;
        obj.visible = true;

        objects.push(obj);
      }

      if (objects.length > 0) {
        tiles.push({
          id: tileId,
          objectgroup: {
            draworder: "index",
            id: 2,
            name: "",
            objects,
            opacity: 1,
            type: "objectgroup",
            visible: true,
            x: 0,
            y: 0,
          },
        });
      }
    }
  }

  if (tiles.length > 0) {
    tileset.tiles = tiles;
  }

  return tileset;
}

// Main
const mapJson = JSON.parse(readFileSync(INPUT_FILE, "utf-8"));

const resolvedTilesets = mapJson.tilesets.map((ts) => {
  if (ts.source) {
    // External tileset — resolve it
    const tsxPath = resolve(MAPS_DIR, ts.source);
    console.log(`Resolving: ${ts.source}`);
    const embedded = parseTsx(tsxPath);
    embedded.firstgid = ts.firstgid;
    return embedded;
  }
  // Already embedded
  return ts;
});

mapJson.tilesets = resolvedTilesets;

writeFileSync(OUTPUT_FILE, JSON.stringify(mapJson), "utf-8");
console.log(`\nEmbedded map written to: ${OUTPUT_FILE}`);
