import Phaser from "phaser";
import { Player } from "../entities/characters/Player";
import { Enemy } from "../entities/characters/Enemy";
import { enemyService } from "../services/EnemyService";
import { enemyFactory } from "../factories/EnemyFactory";
import { playerFactory } from "@/game/factories/PlayerFactory";
import { assetLoaderService } from "@/game/services/AssetLoaderService";
import {
  CLASS_SPRITE_REGISTRY,
  SHARED_BODY_KEY,
  FRAME_WIDTH,
  FRAME_HEIGHT,
  PlayerClass,
  PLAYER_TYPE_TO_CLASS,
} from "@/game/config/ClassSpriteRegistry";
import type { EquipmentLayer } from "@/game/config/ClassSpriteRegistry";
import { EnemyType } from "@/game/config/EnemySpriteRegistry";
import { enemyAnimationRegistrar } from "@/game/services/EnemyAnimationRegistrar";
import { PatrolController } from "@/game/systems/PatrolController";
import { DetectionController } from "@/game/systems/DetectionController";
import { ChaseController } from "@/game/systems/ChaseController";
import { ReturnController } from "@/game/systems/ReturnController";
import { PlayerAttackSystem } from "@/game/systems/PlayerAttackSystem";
import { CombatSystem } from "@/game/systems/CombatSystem";
import { EnemyDeathSystem } from "@/game/systems/EnemyDeathSystem";
import { AttackAnimationController } from "@/game/services/AttackAnimationController";
import { CooldownIndicator } from "@/game/ui/CooldownIndicator";
import { HudManager } from "@/game/ui/hud";
import { EnemyHealthBarHud } from "@/game/ui/hud/EnemyHealthBarHud";
import { eventBus } from "@/game/events/event-bus";
import type { LoginResponse } from "@/auth/interfaces/auth-response";
import type { Npc } from "../entities/characters/Npc";
import type { NpcDto } from "../interfaces/NpcResponse";
import { npcSpawnManager } from "../managers/NpcSpawnManager";
import { NpcInteractionSystem } from "../systems/NpcInteractionSystem";
import { InteractionIndicator } from "../ui/InteractionIndicator";
import { NpcInputHandler } from "../systems/NpcInputHandler";
import { DialogWindow } from "../ui/DialogWindow";

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
  private npcs: Npc[] = [];
  private patrolControllers: PatrolController[] = [];
  private detectionControllers: DetectionController[] = [];
  private chaseControllers: ChaseController[] = [];
  private returnControllers: ReturnController[] = [];
  private wasdKeys!: WasdKeys;
  private map!: Phaser.Tilemaps.Tilemap;
  private playerClass: PlayerClass = PlayerClass.Caballero;
  private playerData: LoginResponse | null = null;
  private hudManager!: HudManager;
  private enemyHealthBarHud!: EnemyHealthBarHud;
  private playerAttackSystem!: PlayerAttackSystem;
  private combatSystem!: CombatSystem;
  private enemyDeathSystem!: EnemyDeathSystem;
  private cooldownIndicator!: CooldownIndicator;
  private pendingNpcData: NpcDto[] | null = null;
  private sceneReady: boolean = false;
  private npcInteractionSystem: NpcInteractionSystem | null = null;
  private interactionIndicator: InteractionIndicator | null = null;
  private npcInputHandler: NpcInputHandler | null = null;
  private dialogWindow!: DialogWindow;

  constructor() {
    super({ key: "MainScene" });

    // Subscribe to NPC_DATA_LOADED early (in constructor) to capture data
    // that arrives before create() finishes. Data is stored and processed
    // once the scene is ready.
    eventBus.on("NPC_DATA_LOADED", (npcData) => {
      if (this.sceneReady) {
        this.spawnNpcsFromBackend(npcData);
      } else {
        this.pendingNpcData = npcData;
      }
    });
  }

  /**
   * Init phase — receives scene data from the game launcher.
   * Used to pass the player class resolved from the backend response
   * and the full player data for HUD initialization.
   */
  init(data: { playerClass?: PlayerClass; playerData?: LoginResponse }): void {
    if (data.playerClass) {
      this.playerClass = data.playerClass;
    }
    if (data.playerData) {
      this.playerData = data.playerData;
    }
  }

  /**
   * Preload phase — load the Tiled map and all tileset images.
   */
  preload(): void {
    // Load class-based player assets using the registry and asset loader
    this.preloadPlayerAssets(this.playerClass);

    // Load skeleton spritesheet for enemies using AssetLoaderService.
    // The service uses EnemySpriteRegistry which defines 32×48 frame dimensions.
    // This must complete before animation registration occurs in the create() phase.
    assetLoaderService.preloadEnemySpritesheet(this, EnemyType.Skeleton);

    // Load lobos (wolves) spritesheet for enemies using AssetLoaderService.
    // The service uses EnemySpriteRegistry which defines 32×48 frame dimensions.
    assetLoaderService.preloadEnemySpritesheet(this, EnemyType.Wolf);

    // Load hedgehog spritesheet for enemies using AssetLoaderService.
    // The service uses EnemySpriteRegistry which defines 32×48 frame dimensions.
    assetLoaderService.preloadEnemySpritesheet(this, EnemyType.Hedgehog);

    // Load minotauro spritesheet for enemies using AssetLoaderService.
    // The service uses EnemySpriteRegistry which defines 32×48 frame dimensions.
    assetLoaderService.preloadEnemySpritesheet(this, EnemyType.Minotaur);

    // Load NPC sprites (static images for idle NPCs)
    this.load.image("sea_maid", "/src/assets/characters/classes/npc/world_one/sea_maid.png");
    this.load.image("traveling_merchant", "/src/assets/characters/classes/npc/world_one/traveling_merchant.png");
    this.load.image("old_hermit", "/src/assets/characters/classes/npc/world_one/old_hermit.png");
    this.load.image("forest_healer", "/src/assets/characters/classes/npc/world_one/forest_healer.png");
    this.load.image("guard", "/src/assets/characters/classes/npc/world_one/guard.png");

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

    // Create the player entity through the PlayerFactory.
    // The factory resolves the class config, verifies assets, and registers animations internally.
    this.player = playerFactory.create({ scene: this, x: initialX, y: initialY, playerClass: this.playerClass });

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
    this.cameras.main.setZoom(1.3);

    // Center the camera on the player immediately on scene start
    this.cameras.main.centerOn(this.player.getX(), this.player.getY());

    // --- HUD Integration ---
    // Create the HUD Manager after the player and camera are configured.
    // MainScene only coordinates the HUD lifecycle — no rendering logic here.
    this.hudManager = new HudManager(this);

    // --- Enemy Health Bar HUD ---
    // Create the enemy health bar HUD using the same HUD camera as HudManager.
    this.enemyHealthBarHud = new EnemyHealthBarHud(this, this.hudManager.getHudCamera());

    // Initialize HUD with player data passed through scene init.
    // This avoids the race condition where GAME_INITIALIZED is emitted
    // before MainScene.create() subscribes to it.
    if (this.playerData) {
      this.hudManager.setPlayerData(this.playerData);
    }

    // Also subscribe to GAME_INITIALIZED for future re-initialization scenarios.
    const onGameInitialized = (data: LoginResponse) => {
      this.hudManager.setPlayerData(data);
    };
    eventBus.on("GAME_INITIALIZED", onGameInitialized);

    // --- Dialog Window Integration ---
    // Create the DialogWindow after HUD. It listens to NPC_DIALOGUE events
    // and displays dialogue text at the bottom of the screen.
    this.dialogWindow = new DialogWindow(this);

    // --- Enemy Animation Registration ---
    // Register Skeleton animations once during scene creation.
    // The registrar verifies the spritesheet is loaded and prevents duplicate registration.
    enemyAnimationRegistrar.registerAnimations(this, EnemyType.Skeleton);

    // Register Minotaur animations using the same infrastructure.
    enemyAnimationRegistrar.registerAnimations(this, EnemyType.Minotaur);

    // Register Hedgehog animations (rows 0-3).
    enemyAnimationRegistrar.registerAnimations(this, EnemyType.Hedgehog);

    // Register Wolf animations (rows 8-11).
    enemyAnimationRegistrar.registerAnimations(this, EnemyType.Wolf);

    // --- Enemy Spawning ---
    // Spawn enemies asynchronously after scene initialization
    this.spawnEnemies(1); // mapId = 1 for map_one

    // --- Combat System Integration ---
    // CombatSystem listens to ATTACK_REQUEST events and resolves combat.
    // Uses player's strongPoints from login data as the attack value.
    const playerAttack = this.playerData?.strongPoints ?? 10;
    this.combatSystem = new CombatSystem(playerAttack);
    this.combatSystem.start();
    console.log(`[MainScene] CombatSystem started — playerAttack=${playerAttack} (from strongPoints)`);

    // PlayerAttackSystem listens for left-click and generates ATTACK_REQUEST events.
    // Uses the enemies array reference — enemies added asynchronously are visible.
    // The AttackAnimationController plays the attack animation on the body sprite.
    const attackAnimController = new AttackAnimationController(
      this.player.getSprite(),
      CLASS_SPRITE_REGISTRY[this.playerClass]
    );
    this.playerAttackSystem = new PlayerAttackSystem(
      this, this.player, this.enemies, undefined, attackAnimController
    );
    console.log("[MainScene] PlayerAttackSystem initialized — left-click triggers attack");

    // Cooldown indicator — shows a symbol above the player during attack cooldown
    this.cooldownIndicator = new CooldownIndicator(
      this, this.player, this.playerAttackSystem.getAttackState()
    );

    // EnemyDeathSystem listens for ENEMY_DEFEATED and handles the death sequence:
    // disable → death animation → destroy sprite → emit ENEMY_REMOVED.
    this.enemyDeathSystem = new EnemyDeathSystem();
    this.enemyDeathSystem.start();
    console.log("[MainScene] EnemyDeathSystem started — enemies will be removed on defeat");

    // Debug: log combat events for troubleshooting
    eventBus.on("COMBAT_RESOLVED", (event) => {
      console.log(`[MainScene][Combat] COMBAT_RESOLVED — target: ${event.target.getName()} (id=${event.target.getId()}), damage: ${event.damage}, remainingHP: ${event.remainingHealth}`);
    });
    eventBus.on("ENEMY_DEFEATED", (event) => {
      console.log(`[MainScene][Combat] ENEMY_DEFEATED — enemy: ${event.enemy.getName()} (id=${event.enemy.getId()})`);
    });

    // Clean up defeated enemies from tracking arrays after the death system removes them.
    eventBus.on("ENEMY_REMOVED", (event) => {
      const removedEnemy = event.enemy;
      const enemyId = removedEnemy.getId();
      console.log(`[MainScene] ENEMY_REMOVED — removing enemy id=${enemyId} from tracking arrays`);

      // Remove from enemies array
      const enemyIndex = this.enemies.indexOf(removedEnemy);
      if (enemyIndex !== -1) {
        this.enemies.splice(enemyIndex, 1);
      }

      // Remove associated controllers
      const patrolIdx = this.patrolControllers.findIndex(
        (c) => c.getEnemy() === removedEnemy
      );
      if (patrolIdx !== -1) this.patrolControllers.splice(patrolIdx, 1);

      const detectionIdx = this.detectionControllers.findIndex(
        (c) => c.getEnemy() === removedEnemy
      );
      if (detectionIdx !== -1) this.detectionControllers.splice(detectionIdx, 1);

      const chaseIdx = this.chaseControllers.findIndex(
        (c) => c.getEnemy() === removedEnemy
      );
      if (chaseIdx !== -1) this.chaseControllers.splice(chaseIdx, 1);

      const returnIdx = this.returnControllers.findIndex(
        (c) => c.getEnemy() === removedEnemy
      );
      if (returnIdx !== -1) this.returnControllers.splice(returnIdx, 1);
    });

    // --- NPC Spawning via Event Bus ---
    // Mark scene as ready so NPC data received after this point is processed immediately.
    // If NPC data arrived before create() finished (race condition), process it now.
    this.sceneReady = true;
    if (this.pendingNpcData) {
      this.spawnNpcsFromBackend(this.pendingNpcData);
      this.pendingNpcData = null;
    }

    // --- NPC Interaction Initialization ---
    // Initialize the NPC interaction subsystem (system + indicator + input handler).
    // If NPCs haven't been spawned yet, this is a no-op and will be retried
    // once spawnNpcsFromBackend() completes asynchronously.
    this.initNpcInteraction();

    // --- Scene Shutdown Cleanup ---
    // Destroy HUD components when the scene shuts down to prevent resource leaks.
    this.events.on("shutdown", () => {
      eventBus.off("GAME_INITIALIZED", onGameInitialized);
      this.playerAttackSystem.destroy();
      this.combatSystem.destroy();
      this.enemyDeathSystem.destroy();
      this.cooldownIndicator.destroy();
      this.enemyHealthBarHud.destroy();
      this.hudManager.destroy();
    });
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
      // Process enemySpawn and bossSpawn objects
      if (obj.name !== "enemySpawn" && obj.name !== "bossSpawn") continue;

      // Extract enemyId from custom properties.
      // enemySpawn uses "enemyId", bossSpawn uses "id"
      // Phaser may expose properties as an array [{name, value}] or as a flat object {key: value}
      let enemyId: number | undefined;
      const propName = obj.name === "bossSpawn" ? "id" : "enemyId";

      if (Array.isArray(obj.properties)) {
        const prop = obj.properties.find(
          (p: { name: string; value: unknown }) => p.name === propName
        );
        enemyId = prop?.value as number | undefined;
      } else if (obj.properties && typeof obj.properties === "object") {
        enemyId = (obj.properties as Record<string, unknown>)[propName] as number | undefined;
      }

      if (enemyId === undefined) {
        console.warn(`[MainScene] Spawn object at (${obj.x}, ${obj.y}) missing ${propName}`);
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

        // Initialize patrol behavior for the spawned enemy (Requirement 1.1, 1.2)
        const patrolController = new PatrolController(enemy, spawnX, spawnY);
        this.patrolControllers.push(patrolController);

        // Initialize detection behavior for the spawned enemy
        const detectionController = new DetectionController(enemy, this.player);
        this.detectionControllers.push(detectionController);

        // Initialize chase behavior for the spawned enemy (Requirement 1.1, 6.1)
        const chaseController = new ChaseController(enemy, this.player);
        this.chaseControllers.push(chaseController);

        // Initialize return behavior for the spawned enemy
        const returnController = new ReturnController(enemy, spawnX, spawnY, patrolController);
        this.returnControllers.push(returnController);

        // Wire detection → chase: chase begins/stops based on detection events
        detectionController.onDetectionChange(chaseController.handleDetectionEvent);

        // Wire detection → return: return begins on PlayerLost, cancels on PlayerDetected
        detectionController.onDetectionChange(returnController.handleDetectionEvent);

        // Coordinate patrol with detection: deactivate patrol when player detected.
        // Patrol reactivation is handled by the ReturnController after reaching spawn.
        detectionController.onDetectionChange((event) => {
          if (event === "PlayerDetected") {
            patrolController.deactivate();
          }
        });
      }
    }

    console.log(`[MainScene] Spawned ${this.enemies.length} enemies`);
  }

  /**
   * Spawns NPCs for the current map using data received from the backend.
   * Called by the Event Bus integration when NPC data is received.
   *
   * NPC sprites are added to the scene and depth is configured
   * within the Npc constructor (depth = 2, consistent with enemies).
   *
   * @param npcData - Array of NPC DTOs from the backend.
   */
  private spawnNpcsFromBackend(npcData: NpcDto[]): void {
    npcSpawnManager.spawnNpcs(this, this.map, npcData);
    this.npcs = npcSpawnManager.getSpawnedNpcs();
    console.log(`[MainScene] Spawned ${this.npcs.length} NPCs`);
    this.initNpcInteraction();
  }

  /**
   * Initializes (or reinitializes) the NPC interaction subsystem.
   *
   * Creates the NpcInteractionSystem, InteractionIndicator, and NpcInputHandler.
   * If previously initialized, destroys existing instances to avoid duplicates.
   *
   * Called at the end of create() and after spawnNpcsFromBackend() to refresh
   * the NPC list when NPCs are loaded asynchronously via the Event Bus.
   */
  private initNpcInteraction(): void {
    // Destroy previous instances if reinitializing (e.g., after NPC data refresh)
    if (this.npcInteractionSystem) {
      this.npcInteractionSystem = null;
    }
    if (this.interactionIndicator) {
      this.interactionIndicator.destroy();
      this.interactionIndicator = null;
    }
    if (this.npcInputHandler) {
      this.npcInputHandler.destroy();
      this.npcInputHandler = null;
    }

    // Only initialize if player and NPCs are available
    if (!this.player || this.npcs.length === 0) {
      return;
    }

    this.npcInteractionSystem = new NpcInteractionSystem(this.player, this.npcs);
    this.interactionIndicator = new InteractionIndicator(this);
    this.npcInputHandler = new NpcInputHandler(this);
  }

  /**
   * Preloads all sprite assets for the given player class using the registry
   * and AssetLoaderService for data-driven path resolution.
   *
   * Queues loads directly via this.load so Phaser's built-in preload lifecycle
   * handles the actual loading (avoids calling load.start() manually).
   *
   * @param playerClass - The player class whose assets should be preloaded.
   */
  private preloadPlayerAssets(playerClass: PlayerClass): void {
    const config = CLASS_SPRITE_REGISTRY[playerClass];

    // Load the shared body spritesheet (used by all classes)
    this.load.spritesheet(
      SHARED_BODY_KEY,
      "/src/assets/characters/classes/knight/body/body.png",
      { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
    );

    // Load the body attack spritesheet for this class
    const classId = playerClass as string;
    const attackKey = `${classId}-body-attack`;
    this.load.spritesheet(
      attackKey,
      `/src/assets/characters/classes/${classId}/body/body_attack.png`,
      { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
    );

    // Load class-specific weapon attack spritesheet (Slash.png) if available
    // Slash.png uses 192x192 frame size (6 cols × 4 rows = 1152x768)
    if (playerClass === PlayerClass.Gladiador) {
      this.load.spritesheet(
        "gladiador-weapon-attack",
        "/src/assets/characters/classes/gladiador/weapon/Slash.png",
        { frameWidth: 192, frameHeight: 192 }
      );
      // Load attack spritesheets for feet, legs, torso (all 384x256, 64x64 frames, 6 cols × 4 rows)
      this.load.spritesheet(
        "gladiador-feet-attack",
        "/src/assets/characters/classes/gladiador/feet/feets_slash.png",
        { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
      );
      this.load.spritesheet(
        "gladiador-legs-attack",
        "/src/assets/characters/classes/gladiador/legs/legs_slash.png",
        { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
      );
      this.load.spritesheet(
        "gladiador-torso-attack",
        "/src/assets/characters/classes/gladiador/torso/torso_slash.png",
        { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
      );
      // Helmet slash: 384x256, 64x64 frames (6 cols × 4 rows)
      this.load.spritesheet(
        "gladiador-helmet-attack",
        "/src/assets/characters/classes/gladiador/helmet/helmet_slash.png",
        { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
      );
    }

    // Load espadachin attack spritesheets
    if (playerClass === PlayerClass.Espadachin) {
      // Weapon Slash.png: 768x512, 128x128 frames (6 cols × 4 rows)
      this.load.spritesheet(
        "espadachin-weapon-attack",
        "/src/assets/characters/classes/espadachin/weapon/Slash.png",
        { frameWidth: 128, frameHeight: 128 }
      );
      // Feet slash: 384x256, 64x64 frames (6 cols × 4 rows)
      this.load.spritesheet(
        "espadachin-feet-attack",
        "/src/assets/characters/classes/espadachin/feet/feets_slash.png",
        { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
      );
      // Legs and torso attack frames are in rows 12-15 of the same legs.png/torso.png
      // (already loaded as espadachin-legs and espadachin-torso)
      // Animations will be registered using those existing textures with row 12-15 frame indices
    }

    // Load mago attack spritesheets
    if (playerClass === PlayerClass.Mago) {
      // Weapon Slash.png: 1536x768, 192x192 frames (8 cols × 4 rows)
      this.load.spritesheet(
        "mago-weapon-attack",
        "/src/assets/characters/classes/mago/weapon/Slash.png",
        { frameWidth: 192, frameHeight: 192 }
      );
      // Feet, helmet, torso slash: 512x256, 64x64 frames (8 cols × 4 rows)
      this.load.spritesheet(
        "mago-feet-attack",
        "/src/assets/characters/classes/mago/feet/feets_slash.png",
        { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
      );
      this.load.spritesheet(
        "mago-helmet-attack",
        "/src/assets/characters/classes/mago/helmet/helmet_slash.png",
        { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
      );
      // Note: legs slash file is misnamed "helmet_slash.png" inside the legs folder
      this.load.spritesheet(
        "mago-legs-attack",
        "/src/assets/characters/classes/mago/legs/helmet_slash.png",
        { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
      );
      this.load.spritesheet(
        "mago-torso-attack",
        "/src/assets/characters/classes/mago/torso/torso_slash.png",
        { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
      );
    }

    // Load knight attack spritesheets
    if (playerClass === PlayerClass.Caballero) {
      // Weapon Slash.png: 768x512, 128x128 frames (6 cols × 4 rows)
      this.load.spritesheet(
        "knight-weapon-attack",
        "/src/assets/characters/classes/knight/weapon/Slash.png",
        { frameWidth: 128, frameHeight: 128 }
      );
      // Feet, legs, torso slash: all 384x256, 64x64 frames (6 cols × 4 rows)
      this.load.spritesheet(
        "knight-feet-attack",
        "/src/assets/characters/classes/knight/feet/feets_slash.png",
        { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
      );
      this.load.spritesheet(
        "knight-legs-attack",
        "/src/assets/characters/classes/knight/legs/legs_slash.png",
        { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
      );
      this.load.spritesheet(
        "knight-torso-attack",
        "/src/assets/characters/classes/knight/torso/torso_slash.png",
        { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
      );
      // Helmet slash: 384x256, 64x64 frames (6 cols × 4 rows)
      this.load.spritesheet(
        "knight-helmet-attack",
        "/src/assets/characters/classes/knight/helmet/helmet_slash.png",
        { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
      );
    }

    // Load each non-null equipment layer spritesheet
    const layers: EquipmentLayer[] = ["feet", "legs", "torso", "weapon", "shield"];
    for (const layer of layers) {
      const assetKey = config.layers[layer];
      if (assetKey === null) {
        continue;
      }
      const path = assetLoaderService.resolveAssetPath(playerClass, layer);
      this.load.spritesheet(assetKey, path, {
        frameWidth: FRAME_WIDTH,
        frameHeight: FRAME_HEIGHT,
      });
    }

    // Load helmet based on helmetType
    const helmetKey = config.layers.helmet;
    if (helmetKey !== null) {
      const classId = playerClass as string;
      if (config.helmetType === "directional") {
        const basePath = `/src/assets/characters/classes/${classId}/helmet`;
        this.load.image(`${helmetKey}-s`, `${basePath}/s.png`);
        this.load.image(`${helmetKey}-n`, `${basePath}/n.png`);
        this.load.image(`${helmetKey}-e`, `${basePath}/e.png`);
        this.load.image(`${helmetKey}-w`, `${basePath}/w.png`);
      } else {
        const helmetPath = assetLoaderService.resolveAssetPath(playerClass, "helmet");
        this.load.spritesheet(
          helmetKey,
          helmetPath,
          { frameWidth: FRAME_WIDTH, frameHeight: FRAME_HEIGHT }
        );
      }
    }
  }

  /**
   * Update phase — runs every frame during gameplay.
   * Reads WASD input and forwards movement commands to the Player entity.
   * Updates all patrol controllers so enemies move autonomously.
   *
   * @param _time - The current game time in milliseconds (unused).
   * @param delta - The time elapsed since the last frame in milliseconds.
   */
  update(_time: number, delta: number): void {
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

    // Update all patrol controllers independently.
    // Each controller manages patrol behavior for a single enemy.
    // MainScene only invokes the update — no patrol decision logic lives here.
    for (const controller of this.patrolControllers) {
      controller.update(delta);
    }

    // Update all detection controllers independently.
    // Each controller evaluates detection for a single enemy.
    // MainScene only invokes the update — no detection logic lives here.
    for (const controller of this.detectionControllers) {
      controller.update();
    }

    // Update all chase controllers independently.
    // Each controller manages pursuit behavior for a single enemy.
    // MainScene only invokes the update — no chase logic lives here.
    for (const controller of this.chaseControllers) {
      controller.update(delta);
    }

    // Update all return controllers independently.
    // Each controller manages return-to-spawn behavior for a single enemy.
    // MainScene only invokes the update — no return logic lives here.
    for (const controller of this.returnControllers) {
      controller.update(delta);
    }

    // Update the HUD every frame for any time-based animations or logic.
    this.hudManager.update();

    // Update attack system (checks spacebar input)
    this.playerAttackSystem.update(_time, delta);

    // Update cooldown indicator position and visibility
    this.cooldownIndicator.update();

    // --- NPC Interaction Update ---
    // Update the interaction system, indicator, and handle E key press.
    // MainScene only coordinates — no interaction logic lives here.
    if (this.npcInteractionSystem && this.interactionIndicator && this.npcInputHandler) {
      this.npcInteractionSystem.update();
      this.interactionIndicator.update(this.npcInteractionSystem.getSelectedNpc());

      if (this.npcInputHandler.isInteractPressed() && this.npcInteractionSystem.isInteractable()) {
        const npc = this.npcInteractionSystem.getSelectedNpc();
        if (npc) {
          try {
            const phrase = npc.interact();
            eventBus.emit("NPC_DIALOGUE", { npcName: npc.getName(), phrase });
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(
              `[MainScene] NPC interaction error for "${npc.getName()}" (id=${npc.getId()}): ${errorMessage}`
            );
          }
        }
      }
    }
  }
}
