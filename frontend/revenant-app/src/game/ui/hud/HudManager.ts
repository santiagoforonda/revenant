import Phaser from "phaser";
import type { LoginResponse, PlayerType } from "@/auth/interfaces/auth-response";
import { eventBus } from "@/game/events/event-bus";
import type { PlayerStatsPayload } from "@/game/events/event-bus.types";

/**
 * Player data subset consumed by the HUD for display purposes.
 * Derived from the LoginResponse to avoid coupling to the full session model.
 */
export interface HudPlayerData {
  username: string;
  typePlayer: PlayerType;
  level: number;
  gold: number;
  healthPoints: number;
  experience: number;
}

/**
 * HudManager is responsible for rendering and managing all HUD elements
 * within a Phaser scene. All elements are rendered on a dedicated HUD camera
 * that has no zoom or scroll, ensuring the HUD remains fixed and properly
 * sized regardless of the main camera's configuration.
 *
 * Layout: single horizontal row at the top of the screen.
 */
export class HudManager {
  private scene: Phaser.Scene;
  private hudCamera: Phaser.Cameras.Scene2D.Camera;

  // Text elements
  private usernameText: Phaser.GameObjects.Text;
  private classText: Phaser.GameObjects.Text;
  private levelText: Phaser.GameObjects.Text;
  private goldText: Phaser.GameObjects.Text;

  // Bar backgrounds and fills
  private healthBarBg: Phaser.GameObjects.Rectangle;
  private healthBarFill: Phaser.GameObjects.Rectangle;
  private expBarBg: Phaser.GameObjects.Rectangle;
  private expBarFill: Phaser.GameObjects.Rectangle;

  // Bar labels and value text
  private healthValueText: Phaser.GameObjects.Text;
  private expValueText: Phaser.GameObjects.Text;

  // Logout button
  private logoutButton: Phaser.GameObjects.Text;

  // Background bar for the full HUD row
  private hudBackground: Phaser.GameObjects.Rectangle;

  // All HUD game objects for camera management
  private hudElements: Phaser.GameObjects.GameObject[] = [];

  // Current player state
  private currentHealth: number = 0;
  private maxHealth: number = 100;
  private currentExperience: number = 0;
  private maxExperience: number = 100;
  private destroyed: boolean = false;

  // Bound listener for proper cleanup
  private readonly onPlayerStatsUpdated = (data: PlayerStatsPayload): void => {
    this.updatePlayerStats(data);
  };

  // Layout constants
  private static readonly ROW_HEIGHT = 24;
  private static readonly PADDING_X = 10;
  private static readonly PADDING_Y = 4;
  private static readonly BAR_WIDTH = 80;
  private static readonly BAR_HEIGHT = 10;
  private static readonly GAP = 16;
  private static readonly FONT_SIZE = "11px";
  private static readonly FONT_FAMILY = "monospace";
  private static readonly HUD_DEPTH = 1000;
  private static readonly LOW_HEALTH_THRESHOLD = 0.25;
  private static readonly COLOR_HEALTH_OK = 0x00cc00;
  private static readonly COLOR_HEALTH_LOW = 0xcc0000;
  private static readonly COLOR_EXP = 0x3399ff;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Create a dedicated HUD camera — no zoom, no scroll.
    // The main camera keeps its zoom for gameplay; HUD renders at 1:1 scale.
    this.hudCamera = this.scene.cameras.add(0, 0, undefined, undefined, false, "hudCamera");
    this.hudCamera.setScroll(0, 0);
    this.hudCamera.setZoom(1);

    const gameWidth = this.scene.scale.width;
    const centerY = HudManager.ROW_HEIGHT / 2;

    // --- Background bar spanning full width ---
    this.hudBackground = this.scene.add.rectangle(
      gameWidth / 2,
      centerY,
      gameWidth,
      HudManager.ROW_HEIGHT,
      0x000000,
      0.7
    );
    this.hudBackground.setDepth(HudManager.HUD_DEPTH - 1);

    // --- Layout: all elements in a single row ---
    // Elements from left to right:
    // [Username] [Class] [Lv.X] [HP ████ 95/100] [XP ████ 45/100] [Gold: 500] [Logout]

    let cursorX = HudManager.PADDING_X;
    const textY = HudManager.PADDING_Y;

    // Username
    this.usernameText = this.scene.add.text(cursorX, textY, "", {
      fontSize: HudManager.FONT_SIZE,
      fontFamily: HudManager.FONT_FAMILY,
      color: "#ffffff",
    });
    this.usernameText.setDepth(HudManager.HUD_DEPTH);
    cursorX += 80; // reserve space

    // Class
    this.classText = this.scene.add.text(cursorX, textY, "", {
      fontSize: HudManager.FONT_SIZE,
      fontFamily: HudManager.FONT_FAMILY,
      color: "#cccccc",
    });
    this.classText.setDepth(HudManager.HUD_DEPTH);
    cursorX += 75;

    // Level
    this.levelText = this.scene.add.text(cursorX, textY, "", {
      fontSize: HudManager.FONT_SIZE,
      fontFamily: HudManager.FONT_FAMILY,
      color: "#ffdd57",
    });
    this.levelText.setDepth(HudManager.HUD_DEPTH);
    cursorX += 45;

    // HP bar section
    const hpLabelText = this.scene.add.text(cursorX, textY, "HP", {
      fontSize: HudManager.FONT_SIZE,
      fontFamily: HudManager.FONT_FAMILY,
      color: "#00cc00",
    });
    hpLabelText.setDepth(HudManager.HUD_DEPTH);
    cursorX += 22;

    const barY = centerY;

    this.healthBarBg = this.scene.add.rectangle(
      cursorX + HudManager.BAR_WIDTH / 2,
      barY,
      HudManager.BAR_WIDTH,
      HudManager.BAR_HEIGHT,
      0x333333
    );
    this.healthBarBg.setDepth(HudManager.HUD_DEPTH);

    this.healthBarFill = this.scene.add.rectangle(
      cursorX + HudManager.BAR_WIDTH / 2,
      barY,
      HudManager.BAR_WIDTH,
      HudManager.BAR_HEIGHT,
      HudManager.COLOR_HEALTH_OK
    );
    this.healthBarFill.setDepth(HudManager.HUD_DEPTH);
    cursorX += HudManager.BAR_WIDTH + 4;

    this.healthValueText = this.scene.add.text(cursorX, textY, "0/100", {
      fontSize: HudManager.FONT_SIZE,
      fontFamily: HudManager.FONT_FAMILY,
      color: "#ffffff",
    });
    this.healthValueText.setDepth(HudManager.HUD_DEPTH);
    cursorX += 52 + HudManager.GAP;

    // XP bar section
    const xpLabelText = this.scene.add.text(cursorX, textY, "XP", {
      fontSize: HudManager.FONT_SIZE,
      fontFamily: HudManager.FONT_FAMILY,
      color: "#3399ff",
    });
    xpLabelText.setDepth(HudManager.HUD_DEPTH);
    cursorX += 22;

    this.expBarBg = this.scene.add.rectangle(
      cursorX + HudManager.BAR_WIDTH / 2,
      barY,
      HudManager.BAR_WIDTH,
      HudManager.BAR_HEIGHT,
      0x333333
    );
    this.expBarBg.setDepth(HudManager.HUD_DEPTH);

    this.expBarFill = this.scene.add.rectangle(
      cursorX + HudManager.BAR_WIDTH / 2,
      barY,
      HudManager.BAR_WIDTH,
      HudManager.BAR_HEIGHT,
      HudManager.COLOR_EXP
    );
    this.expBarFill.setDepth(HudManager.HUD_DEPTH);
    cursorX += HudManager.BAR_WIDTH + 4;

    this.expValueText = this.scene.add.text(cursorX, textY, "0/100", {
      fontSize: HudManager.FONT_SIZE,
      fontFamily: HudManager.FONT_FAMILY,
      color: "#ffffff",
    });
    this.expValueText.setDepth(HudManager.HUD_DEPTH);
    cursorX += 52 + HudManager.GAP;

    // Gold
    this.goldText = this.scene.add.text(cursorX, textY, "", {
      fontSize: HudManager.FONT_SIZE,
      fontFamily: HudManager.FONT_FAMILY,
      color: "#ffd700",
    });
    this.goldText.setDepth(HudManager.HUD_DEPTH);
    cursorX += 70;

    // Logout button — positioned at the far right
    this.logoutButton = this.scene.add.text(
      gameWidth - HudManager.PADDING_X - 60,
      textY,
      "[ Logout ]",
      {
        fontSize: HudManager.FONT_SIZE,
        fontFamily: HudManager.FONT_FAMILY,
        color: "#ff4444",
        backgroundColor: "#333333",
        padding: { x: 4, y: 2 },
      }
    );
    this.logoutButton.setDepth(HudManager.HUD_DEPTH);
    this.logoutButton.setInteractive({ useHandCursor: true });
    this.logoutButton.on("pointerdown", () => {
      eventBus.emit("LOGOUT_REQUESTED");
    });

    // Collect all HUD elements for camera management
    this.hudElements = [
      this.hudBackground,
      this.usernameText,
      this.classText,
      this.levelText,
      hpLabelText,
      this.healthBarBg,
      this.healthBarFill,
      this.healthValueText,
      xpLabelText,
      this.expBarBg,
      this.expBarFill,
      this.expValueText,
      this.goldText,
      this.logoutButton,
    ];

    // --- Camera visibility setup ---
    // Main camera ignores HUD elements (only game world is rendered by main camera).
    this.scene.cameras.main.ignore(this.hudElements);

    // HUD camera ignores ALL existing game objects except HUD elements.
    // This prevents the HUD camera from rendering the game world
    // (which would show an unzoomed, non-following duplicate of the scene).
    const nonHudElements = this.scene.children.list.filter(
      (child) => !this.hudElements.includes(child)
    );
    if (nonHudElements.length > 0) {
      this.hudCamera.ignore(nonHudElements);
    }

    // Listen for new game objects added to the scene AFTER HUD creation.
    // Any non-HUD object added later must also be ignored by the HUD camera.
    this.scene.events.on("addedtoscene", (gameObject: Phaser.GameObjects.GameObject) => {
      if (!this.hudElements.includes(gameObject)) {
        this.hudCamera.ignore(gameObject);
      }
    });

    // Subscribe to player stats updates for runtime synchronization
    eventBus.on("PLAYER_STATS_UPDATED", this.onPlayerStatsUpdated);
  }

  /**
   * Sets the player data on the HUD from a LoginResponse payload.
   * Initializes all displayed values at once.
   */
  setPlayerData(data: LoginResponse): void {
    if (this.destroyed) return;

    this.usernameText.setText(data.username);
    this.classText.setText(this.formatPlayerType(data.typePlayer));
    this.levelText.setText(`Lv. ${data.level}`);
    this.goldText.setText(`Gold: ${data.gold}`);

    this.currentHealth = data.healthPoints;
    this.currentExperience = data.experience;

    this.updateHealthBar();
    this.updateExperienceBar();
  }

  /**
   * Updates the displayed health value and refreshes the health bar.
   */
  setHealth(current: number, max?: number): void {
    this.currentHealth = current;
    if (max !== undefined) {
      this.maxHealth = max;
    }
    this.updateHealthBar();
  }

  /**
   * Updates the displayed experience value and refreshes the experience bar.
   */
  setExperience(current: number, max?: number): void {
    this.currentExperience = current;
    if (max !== undefined) {
      this.maxExperience = max;
    }
    this.updateExperienceBar();
  }

  /**
   * Updates the displayed gold value.
   */
  setGold(gold: number): void {
    this.goldText.setText(`Gold: ${gold}`);
  }

  /**
   * Updates the displayed level value.
   */
  setLevel(level: number): void {
    this.levelText.setText(`Lv. ${level}`);
  }

  /**
   * Updates HUD elements from a partial player stats payload.
   * Called when PLAYER_STATS_UPDATED is emitted during gameplay.
   */
  private updatePlayerStats(data: PlayerStatsPayload): void {
    if (data.gold !== undefined) {
      this.setGold(data.gold);
    }
    if (data.level !== undefined) {
      this.setLevel(data.level);
    }
    if (data.healthPoints !== undefined) {
      this.setHealth(data.healthPoints);
    }
    if (data.experience !== undefined) {
      this.setExperience(data.experience);
    }
  }

  /**
   * Formats a raw PlayerType value to title case for display.
   * Example: "CABALLERO" → "Caballero"
   */
  private formatPlayerType(type: PlayerType): string {
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }

  /**
   * Returns the logout button for external event binding.
   */
  getLogoutButton(): Phaser.GameObjects.Text {
    return this.logoutButton;
  }

  /**
   * Returns the dedicated HUD camera for use by other HUD components.
   */
  getHudCamera(): Phaser.Cameras.Scene2D.Camera {
    return this.hudCamera;
  }

  /**
   * Registers an external game object as a HUD element.
   * This prevents the HUD camera's addedtoscene listener from ignoring it.
   * Used by external HUD components (e.g., EnemyHealthBarHud) that create
   * game objects after HudManager initialization.
   */
  registerHudElement(gameObject: Phaser.GameObjects.GameObject): void {
    this.hudElements.push(gameObject);
  }

  /**
   * Per-frame update. Placeholder for future animations or time-based HUD updates.
   */
  update(): void {
    // No-op for now
  }

  /**
   * Destroys all HUD elements and removes them from the scene.
   */
  destroy(): void {
    this.destroyed = true;
    eventBus.off("PLAYER_STATS_UPDATED", this.onPlayerStatsUpdated);
    this.scene.events.off("addedtoscene");
    for (const element of this.hudElements) {
      element.destroy();
    }
    this.hudElements = [];
    this.scene.cameras.remove(this.hudCamera);
  }

  /**
   * Refreshes the health bar fill based on current/max ratio.
   */
  private updateHealthBar(): void {
    if (this.destroyed || !this.healthBarFill) return;

    const ratio = this.maxHealth > 0
      ? Math.max(0, Math.min(1, this.currentHealth / this.maxHealth))
      : 0;
    const fillWidth = HudManager.BAR_WIDTH * ratio;

    const barColor = ratio <= HudManager.LOW_HEALTH_THRESHOLD
      ? HudManager.COLOR_HEALTH_LOW
      : HudManager.COLOR_HEALTH_OK;
    this.healthBarFill.setFillStyle(barColor);

    this.healthBarFill.setSize(fillWidth, HudManager.BAR_HEIGHT);
    // Align fill to left edge of the background bar
    const bgLeftX = this.healthBarBg.x - HudManager.BAR_WIDTH / 2;
    this.healthBarFill.setPosition(bgLeftX + fillWidth / 2, this.healthBarBg.y);

    this.healthValueText.setText(`${this.currentHealth}/${this.maxHealth}`);
  }

  /**
   * Refreshes the experience bar fill based on current/max ratio.
   */
  private updateExperienceBar(): void {
    if (this.destroyed || !this.expBarFill) return;

    const ratio = this.maxExperience > 0
      ? Math.max(0, Math.min(1, this.currentExperience / this.maxExperience))
      : 0;
    const fillWidth = HudManager.BAR_WIDTH * ratio;

    this.expBarFill.setSize(fillWidth, HudManager.BAR_HEIGHT);
    const bgLeftX = this.expBarBg.x - HudManager.BAR_WIDTH / 2;
    this.expBarFill.setPosition(bgLeftX + fillWidth / 2, this.expBarBg.y);

    this.expValueText.setText(`${this.currentExperience}/${this.maxExperience}`);
  }
}
