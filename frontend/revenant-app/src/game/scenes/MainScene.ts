import Phaser from "phaser";
import { Player } from "../entities/characters/Player";
import { Enemy } from "../entities/characters/Enemy";
import { enemyService } from "../services/EnemyService";
import { enemyFactory } from "../factories/EnemyFactory";

/**
 * MainScene is the primary gameplay scene for Revenant.
 *
 * This scene is responsible for:
 * - Loading and rendering the current Tiled map.
 * - Spawning the player entity.
 * - Registering WASD keyboard input.
 * - Forwarding movement commands to the Player entity.
 * - Configuring map collisions.
 * - Maintaining camera tracking.
 *
 * Currently validates the Tiled map integration, player movement, and collision pipeline.
 */

/** Base path for world1 assets */
const IMAGES_BASE = "/src/assets/images/world1";
const MAPS_BASE = "/src/assets/maps/world1";

/** Constant movement speed in pixels per second */
const PLAYER_SPEED = 120;

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

/** WASD key map type for type-safe keyboard access */
interface WasdKeys {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
}

export class MainScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private wasdKeys!: WasdKeys;
  private map!: Phaser.Tilemaps.Tilemap;

  constructor() {
    super({ key: "MainScene" });
  }

  /**
   * Preload phase — load the Tiled map and all tileset images.
   */
  preload(): void {
    // Load knight body spritesheet (64x64 per frame)
    this.load.spritesheet(
      "knight-body",
      "/src/assets/characters/classes/knight/body/body.png",
      { frameWidth: 64, frameHeight: 64 }
    );

    // Load knight torso spritesheet (64x64 per frame)
    this.load.spritesheet(
      "knight-torso",
      "/src/assets/characters/classes/knight/torso/torso.png",
      { frameWidth: 64, frameHeight: 64 }
    );

    // Load knight legs spritesheet (64x64 per frame)
    this.load.spritesheet(
      "knight-legs",
      "/src/assets/characters/classes/knight/legs/legs.png",
      { frameWidth: 64, frameHeight: 64 }
    );

    // Load knight feet spritesheet (64x64 per frame)
    this.load.spritesheet(
      "knight-feet",
      "/src/assets/characters/classes/knight/feet/feet.png",
      { frameWidth: 64, frameHeight: 64 }
    );

    // Load knight weapon spritesheet (64x64 per frame, 6 cols × 4 rows)
    this.load.spritesheet(
      "knight-weapon",
      "/src/assets/characters/classes/knight/weapon/weapon.png",
      { frameWidth: 64, frameHeight: 64 }
    );

    // Load knight shield spritesheet (64x64 per frame, 8 cols × 4 rows)
    this.load.spritesheet(
      "knight-shield",
      "/src/assets/characters/classes/knight/shield/shield.png",
      { frameWidth: 64, frameHeight: 64 }
    );

    // Load knight helmet images (one per direction, 128x128 single images)
    this.load.image("knight-helmet-s", "/src/assets/characters/classes/knight/helmet/s.png");
    this.load.image("knight-helmet-n", "/src/assets/characters/classes/knight/helmet/n.png");
    this.load.image("knight-helmet-e", "/src/assets/characters/classes/knight/helmet/e.png");
    this.load.image("knight-helmet-w", "/src/assets/characters/classes/knight/helmet/w.png");

    // Load skeleton spritesheet for enemies (64x64 per frame)
    this.load.spritesheet(
      "skeleton",
      "/src/assets/characters/classes/skeleton/skeleton.png",
      { frameWidth: 64, frameHeight: 64 }
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
   * Create phase — build the tilemap, spawn player, configure input, collisions, and camera.
   */
  create(): void {
    console.log("MainScene initialized successfully");

    // Create the tilemap from the loaded JSON
    const map = this.make.tilemap({ key: "map-one" });
    this.map = map;

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

    // Layers that should render ABOVE the player (structures, rooftops, decorations)
    // These layers contain buildings, mills, caves, etc. that should visually occlude the player
    const ABOVE_PLAYER_LAYERS = new Set([
      "molino",
      "casas",
      "decoraciones-aldea",
      "cementerio-tumbas",
      "cementerio-decoracion",
      "entrada-cueva",
      "decoraciones-cueva",
      "decoraciones-finales",
    ]);

    // Create every tile layer using all available tilesets
    for (const layerData of map.layers) {
      const layer = map.createLayer(layerData.name, addedTilesets);
      if (!layer) {
        console.error(`[MainScene] Failed to create layer: "${layerData.name}"`);
        continue;
      }

      // Layers with structures render above the player (depth 10+)
      if (ABOVE_PLAYER_LAYERS.has(layerData.name)) {
        layer.setDepth(10);
      }
    }

    // Instantiate the Player entity at the map's player spawn point
    // Future: read spawn coordinates from the object layer
    const initialX = 192;
    const initialY = 56;

    // Register player and helmet animations before creating the player
    Player.registerAnimations(this);

    this.player = new Player(this, initialX, initialY);

    // --- Collision Configuration ---
    // Only tiles with blocking object types should prevent player movement.
    // Blocking types: "wall", "building", "water", "rock"
    // The "camino" type defines walkable path areas and must NOT block.
    // Decorative elements without objectgroup also do NOT block.
    const BLOCKING_TYPES = new Set(["wall", "building", "water", "rock"]);
    const collisionLayers: Phaser.Tilemaps.TilemapLayer[] = [];

    for (const layerData of map.layers) {
      const layer = map.getLayer(layerData.name)?.tilemapLayer;
      if (!layer || !(layer instanceof Phaser.Tilemaps.TilemapLayer)) continue;

      let layerHasCollision = false;

      // Iterate every tile in this layer and enable collision only
      // on tiles whose tileset objectgroup contains a blocking type
      layer.forEachTile((tile: Phaser.Tilemaps.Tile) => {
        if (!tile || tile.index === -1) return;

        const tileData = tile.tileset?.getTileData(tile.index);
        if (!tileData) return;

        const objectgroup = (tileData as Record<string, unknown>)["objectgroup"] as
          | { objects?: { type?: string }[] }
          | undefined;

        if (objectgroup?.objects) {
          const hasBlockingObject = objectgroup.objects.some(
            (obj) => obj.type && BLOCKING_TYPES.has(obj.type)
          );
          if (hasBlockingObject) {
            tile.setCollision(true);
            layerHasCollision = true;
          }
        }
      });

      if (layerHasCollision) {
        collisionLayers.push(layer);
      }
    }

    // Add physics collider between the player and every layer that has blocking tiles
    for (const layer of collisionLayers) {
      this.physics.add.collider(this.player.getBody(), layer);
    }

    if (collisionLayers.length === 0) {
      console.warn("[MainScene] No blocking collision tiles found in any layer");
    }

    // --- WASD Keyboard Input ---
    this.wasdKeys = this.input.keyboard!.addKeys("W,A,S,D") as WasdKeys;

    // --- Camera Configuration ---
    // Set camera bounds to match the full tilemap dimensions.
    // This prevents the camera from scrolling beyond the map edges.
    const mapWidthPx = map.widthInPixels;
    const mapHeightPx = map.heightInPixels;
    this.cameras.main.setBounds(0, 0, mapWidthPx, mapHeightPx);

    // Follow the player's body sprite. The camera will automatically
    // track the player as they move through the world.
    this.cameras.main.startFollow(this.player.getSprite());

    // Zoom in to get a closer view of the player
    this.cameras.main.setZoom(2);

    // Center the camera on the player immediately on scene start
    this.cameras.main.centerOn(this.player.getX(), this.player.getY());

    // --- Enemy Spawning ---
    // Spawn enemies asynchronously after scene initialization
    this.spawnEnemies(1); // mapId = 1 for map_one
  }

  /**
   * Spawns enemies by combining Tiled spawn data with backend statistics.
   * This method orchestrates the workflow but does not create entities directly.
   *
   * @param mapId - The map identifier to fetch enemies for.
   */
  private async spawnEnemies(mapId: number): Promise<void> {
    // Step 1: Retrieve enemy catalog from backend
    const enemyCatalog = await enemyService.getEnemiesByMap(mapId);
    if (!enemyCatalog || enemyCatalog.length === 0) {
      console.warn("[MainScene] No enemies retrieved from backend");
      return;
    }

    // Step 2: Build efficient lookup table indexed by enemyId
    const enemyLookup = enemyService.buildLookupTable(enemyCatalog);

    // Step 3: Read the enemy spawn objects from the Tiled Object Layer
    const objectLayer = this.map.getObjectLayer("objectos");
    if (!objectLayer) {
      console.warn("[MainScene] Enemy spawn object layer 'objectos' not found");
      return;
    }

    // Step 4: Process each spawn object
    for (const obj of objectLayer.objects) {
      // Only process enemySpawn objects
      if (obj.name !== "enemySpawn") continue;

      // Extract enemyId from custom properties.
      // Phaser may expose properties as an array [{name, value}] or as a flat object {key: value}
      let enemyId: number | undefined;

      if (Array.isArray(obj.properties)) {
        const prop = obj.properties.find(
          (p: { name: string; value: unknown }) => p.name === "enemyId"
        );
        enemyId = prop?.value as number | undefined;
      } else if (obj.properties && typeof obj.properties === "object") {
        enemyId = (obj.properties as Record<string, unknown>)["enemyId"] as number | undefined;
      }

      if (enemyId === undefined) {
        console.warn(`[MainScene] Spawn object at (${obj.x}, ${obj.y}) missing enemyId`);
        continue;
      }

      // Match spawn object with backend data
      const enemyStats = enemyLookup.get(enemyId);
      if (!enemyStats) {
        console.warn(`[MainScene] No backend data for enemyId=${enemyId}`);
        continue;
      }

      // Step 5: Create enemy through the factory (returns null if no sprite available)
      const spawnX = obj.x ?? 0;
      const spawnY = obj.y ?? 0;
      const enemy = enemyFactory.create(this, spawnX, spawnY, enemyStats);
      if (enemy) {
        this.enemies.push(enemy);
      }
    }

    console.log(`[MainScene] Spawned ${this.enemies.length} enemies`);
  }

  /**
   * Update phase — runs every frame during gameplay.
   * Reads WASD input and forwards movement commands to the Player entity.
   */
  update(): void {
    const keys = this.wasdKeys;
    let vx = 0;
    let vy = 0;

    if (keys.A.isDown) vx -= 1;
    if (keys.D.isDown) vx += 1;
    if (keys.W.isDown) vy -= 1;
    if (keys.S.isDown) vy += 1;

    if (vx !== 0 || vy !== 0) {
      // Normalize diagonal movement so speed stays constant
      const length = Math.sqrt(vx * vx + vy * vy);
      vx /= length;
      vy /= length;
      this.player.move(vx * PLAYER_SPEED, vy * PLAYER_SPEED);
    } else {
      this.player.stop();
    }

    // Synchronize helmet with physics body position
    this.player.update();
  }
}
