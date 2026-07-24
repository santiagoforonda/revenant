import Phaser from "phaser";
import { Player } from "../entities/characters/Player";

/**
 * MainScene is the primary gameplay scene for Revenant.
 *
 * This scene will eventually be responsible for:
 * - Loading and rendering the current Tiled map.
 * - Spawning the player entity.
 * - Spawning enemies and NPCs.
 * - Initializing physics and camera.
 * - Starting the gameplay loop.
 *
 * Currently validates the Tiled map integration and rendering pipeline.
 */

/** Base path for world1 assets */
const IMAGES_BASE = "/src/assets/images/world1";
const MAPS_BASE = "/src/assets/maps/world1";

/**
 * Tileset configuration — maps tileset names (as they appear in the Tiled JSON)
 * to their corresponding image file paths.
 */
const TILESETS: { name: string; path: string }[] = [
  { name: "caminos", path: `${IMAGES_BASE}/ChatGPT Image 22 jul 2026, 09_35_19 a.m.png` },
  { name: "ChatGPT Image 22 jul 2026, 09_32_55 a.m", path: `${IMAGES_BASE}/ChatGPT Image 22 jul 2026, 09_32_55 a.m.png` },
  { name: "cementerio", path: `${IMAGES_BASE}/cementerio.png` },
  { name: "laguna", path: `${IMAGES_BASE}/laguna.png` },
  { name: "flores", path: `${IMAGES_BASE}/flores.png` },
  { name: "molino-review", path: `${IMAGES_BASE}/molino-removebg-preview.png` },
  { name: "casas", path: `${IMAGES_BASE}/casas.png` },
  { name: "cueva-minotauro", path: `${IMAGES_BASE}/cueva-minotauro.png` },
];

export class MainScene extends Phaser.Scene {
  private player!: Player;

  constructor() {
    super({ key: "MainScene" });
  }

  /**
   * Preload phase — load the Tiled map and all tileset images.
   */
  preload(): void {
    // Load knight body spritesheet (32x48 per frame)
    this.load.spritesheet(
      "knight-body",
      "/src/assets/characters/classes/knight/body/body.png",
      { frameWidth: 32, frameHeight: 48 }
    );

    // Load knight helmet spritesheet (32x48 per frame)
    this.load.spritesheet(
      "knight-helmet",
      "/src/assets/characters/classes/knight/helmet/leather_helmet.png",
      { frameWidth: 32, frameHeight: 48 }
    );

    // Load the Tiled map JSON (embedded version with resolved tilesets)
    this.load.tilemapTiledJSON("map-one", `${MAPS_BASE}/map_one_embedded.json`);

    // Load every tileset image referenced by the map
    for (const tileset of TILESETS) {
      this.load.image(tileset.name, tileset.path);
    }

    // Error handler for failed asset loads
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      console.error(
        `[MainScene] Failed to load asset: "${file.key}" from "${file.url}"`
      );
    });
  }

  /**
   * Create phase — build the tilemap and render all layers.
   */
  create(): void {
    console.log("MainScene initialized successfully");

    // Create the tilemap from the loaded JSON
    const map = this.make.tilemap({ key: "map-one" });

    // Add each tileset to the map
    const addedTilesets: Phaser.Tilemaps.Tileset[] = [];
    for (const tileset of TILESETS) {
      const ts = map.addTilesetImage(tileset.name, tileset.name);
      if (ts) {
        addedTilesets.push(ts);
      } else {
        console.error(`[MainScene] Failed to add tileset: "${tileset.name}"`);
      }
    }

    // Create every tile layer using all available tilesets
    for (const layerData of map.layers) {
      const layer = map.createLayer(layerData.name, addedTilesets);
      if (!layer) {
        console.error(`[MainScene] Failed to create layer: "${layerData.name}"`);
      }
    }

    // Instantiate the Player entity at the map's player spawn point
    // Future: read spawn coordinates from the object layer
    const initialX = 192;
    const initialY = 56;
    this.player = new Player(this, initialX, initialY);

    // --- Camera Configuration ---
    // Set camera bounds to match the full tilemap dimensions.
    // This prevents the camera from scrolling beyond the map edges.
    const mapWidthPx = map.widthInPixels;
    const mapHeightPx = map.heightInPixels;
    this.cameras.main.setBounds(0, 0, mapWidthPx, mapHeightPx);

    // Follow the player's body sprite. The camera will automatically
    // track the player as they move through the world.
    // Future: adjust lerp, deadzone, and zoom here.
    this.cameras.main.startFollow(this.player.getSprite());

    // Zoom in to get a closer view of the player
    this.cameras.main.setZoom(2);

    // Center the camera on the player immediately on scene start
    this.cameras.main.centerOn(this.player.getX(), this.player.getY());
  }

  /**
   * Update phase — runs every frame during gameplay.
   */
  update(): void {
    // Future: player movement, AI, collision checks
  }
}
