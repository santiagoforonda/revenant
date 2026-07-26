import Phaser from "phaser";
import { eventBus } from "@/game/events/event-bus";
import type { Enemy } from "@/game/entities/characters/Enemy";
import type { CombatResolvedEvent, EnemyDefeatedEvent } from "@/game/interfaces/CombatEvents";

/**
 * Internal structure holding the Phaser objects for one enemy's health bar.
 */
interface EnemyBarEntry {
  /** The Enemy entity this bar represents. */
  readonly enemy: Enemy;
  /** Maximum health (from enemy.getStats().healthPoints). */
  readonly maxHealth: number;
  /** Current remaining health. */
  currentHealth: number;
  /** Dark background rectangle for the bar. */
  readonly barBg: Phaser.GameObjects.Rectangle;
  /** Colored fill rectangle representing remaining HP ratio. */
  readonly barFill: Phaser.GameObjects.Rectangle;
  /** Text showing "name currentHP/maxHP". */
  readonly label: Phaser.GameObjects.Text;
}

/**
 * EnemyHealthBarHud manages the lifecycle of enemy health bar entries in the HUD layer.
 * It subscribes to COMBAT_RESOLVED and ENEMY_DEFEATED events, creates/updates/removes
 * individual bar entries, and handles camera integration.
 *
 * Rendered in a second row below the existing player HUD managed by HudManager.
 * Follows the same camera isolation pattern: dedicated HUD camera, depth >= 1000,
 * and scene.cameras.main.ignore() on all HUD elements.
 */
export class EnemyHealthBarHud {
  private readonly scene: Phaser.Scene;
  private readonly hudCamera: Phaser.Cameras.Scene2D.Camera;
  private readonly entries: Map<Enemy, EnemyBarEntry> = new Map();
  private readonly hudElements: Phaser.GameObjects.GameObject[] = [];
  private rowBackground: Phaser.GameObjects.Rectangle;
  private destroyed: boolean = false;

  // Layout constants
  private static readonly ROW_Y = 24;
  private static readonly ENTRY_HEIGHT = 20;
  private static readonly PADDING_X = 10;
  private static readonly PADDING_Y = 2;
  private static readonly BAR_WIDTH = 80;
  private static readonly BAR_HEIGHT = 10;
  private static readonly LABEL_OFFSET_X = 4;
  private static readonly HUD_DEPTH = 1000;
  private static readonly FONT_SIZE = "10px";
  private static readonly FONT_FAMILY = "monospace";
  private static readonly COLOR_BAR_BG = 0x333333;
  private static readonly COLOR_BAR_FILL = 0xcc3333;

  // Bound handlers for proper cleanup
  private readonly boundOnCombatResolved = (event: CombatResolvedEvent): void => {
    this.onCombatResolved(event);
  };

  private readonly boundOnEnemyDefeated = (event: EnemyDefeatedEvent): void => {
    this.onEnemyDefeated(event);
  };

  constructor(scene: Phaser.Scene, hudCamera: Phaser.Cameras.Scene2D.Camera) {
    this.scene = scene;
    this.hudCamera = hudCamera;

    // Subscribe to combat events
    eventBus.on("COMBAT_RESOLVED", this.boundOnCombatResolved);
    eventBus.on("ENEMY_DEFEATED", this.boundOnEnemyDefeated);

    // Create a hidden row background rectangle spanning the screen width at ROW_Y
    const gameWidth = this.scene.scale.width;
    this.rowBackground = this.scene.add.rectangle(
      gameWidth / 2,
      EnemyHealthBarHud.ROW_Y,
      gameWidth,
      0,
      0x000000,
      0.7
    );
    this.rowBackground.setDepth(EnemyHealthBarHud.HUD_DEPTH);
    this.rowBackground.setVisible(false);

    // Isolate from main camera
    this.scene.cameras.main.ignore(this.rowBackground);
    // Ensure HUD camera renders the row background
    this.rowBackground.cameraFilter &= ~this.hudCamera.id;
    this.hudElements.push(this.rowBackground);
  }

  /**
   * Handles COMBAT_RESOLVED events — creates or updates enemy health bars.
   */
  onCombatResolved(event: CombatResolvedEvent): void {
    // Guard: if destroyed or scene is no longer active
    if (this.destroyed || !this.scene?.sys?.isActive()) {
      return;
    }

    const target = event.target;
    const remainingHealth = event.remainingHealth;

    if (this.entries.has(target)) {
      const entry = this.entries.get(target)!;
      entry.currentHealth = remainingHealth;
      this.refreshBar(entry);
      return;
    }

    // New enemy
    const maxHealth = target.getStats().healthPoints;
    const name = target.getName();

    // Create barBg — dark background rectangle
    const barBg = this.scene.add.rectangle(
      EnemyHealthBarHud.PADDING_X + EnemyHealthBarHud.BAR_WIDTH / 2,
      0, // will be positioned by reflowLayout
      EnemyHealthBarHud.BAR_WIDTH,
      EnemyHealthBarHud.BAR_HEIGHT,
      EnemyHealthBarHud.COLOR_BAR_BG
    );
    barBg.setDepth(EnemyHealthBarHud.HUD_DEPTH);

    // Create barFill — red fill rectangle
    const ratio = maxHealth > 0
      ? Math.max(0, Math.min(1, remainingHealth / maxHealth))
      : 0;
    const fillWidth = EnemyHealthBarHud.BAR_WIDTH * ratio;
    const barFill = this.scene.add.rectangle(
      EnemyHealthBarHud.PADDING_X + fillWidth / 2,
      0, // will be positioned by reflowLayout
      fillWidth,
      EnemyHealthBarHud.BAR_HEIGHT,
      EnemyHealthBarHud.COLOR_BAR_FILL
    );
    barFill.setDepth(EnemyHealthBarHud.HUD_DEPTH);

    // Create label text
    const label = this.scene.add.text(
      EnemyHealthBarHud.PADDING_X + EnemyHealthBarHud.BAR_WIDTH + EnemyHealthBarHud.LABEL_OFFSET_X,
      0, // will be positioned by reflowLayout
      `${name} ${remainingHealth}/${maxHealth}`,
      {
        fontSize: EnemyHealthBarHud.FONT_SIZE,
        fontFamily: EnemyHealthBarHud.FONT_FAMILY,
        color: "#ffffff",
      }
    );
    label.setDepth(EnemyHealthBarHud.HUD_DEPTH);

    // Camera isolation — main camera ignores HUD elements
    this.scene.cameras.main.ignore(barBg);
    this.scene.cameras.main.ignore(barFill);
    this.scene.cameras.main.ignore(label);

    // Ensure HUD camera renders these elements.
    // The HudManager's addedtoscene listener may have already ignored them;
    // clear the HUD camera's filter bit so they become visible on the HUD camera.
    barBg.cameraFilter &= ~this.hudCamera.id;
    barFill.cameraFilter &= ~this.hudCamera.id;
    label.cameraFilter &= ~this.hudCamera.id;

    // Track in hudElements
    this.hudElements.push(barBg, barFill, label);

    // Store entry in map
    const entry: EnemyBarEntry = {
      enemy: target,
      maxHealth,
      currentHealth: remainingHealth,
      barBg,
      barFill,
      label,
    };
    this.entries.set(target, entry);

    // Show row background and reflow
    this.rowBackground.setVisible(true);
    this.reflowLayout();
  }

  /**
   * Handles ENEMY_DEFEATED events — removes defeated enemy health bars.
   */
  onEnemyDefeated(event: EnemyDefeatedEvent): void {
    // Guard: if destroyed or scene is no longer active
    if (this.destroyed || !this.scene?.sys?.isActive()) {
      return;
    }

    const enemy = event.enemy;

    if (!this.entries.has(enemy)) {
      return;
    }

    const entry = this.entries.get(enemy)!;

    // Destroy game objects
    entry.barBg.destroy();
    entry.barFill.destroy();
    entry.label.destroy();

    // Remove from hudElements array (in-place removal to respect readonly reference)
    const objectsToRemove = new Set<Phaser.GameObjects.GameObject>([entry.barBg, entry.barFill, entry.label]);
    for (let i = this.hudElements.length - 1; i >= 0; i--) {
      if (objectsToRemove.has(this.hudElements[i])) {
        this.hudElements.splice(i, 1);
      }
    }

    // Remove from entries map
    this.entries.delete(enemy);

    // Reflow remaining entries
    this.reflowLayout();

    // Hide row background if no entries remain
    if (this.entries.size === 0) {
      this.rowBackground.setVisible(false);
    }
  }

  /**
   * Updates the fill width and label text for an existing entry.
   */
  private refreshBar(entry: EnemyBarEntry): void {
    const ratio = entry.maxHealth > 0
      ? Math.max(0, Math.min(1, entry.currentHealth / entry.maxHealth))
      : 0;
    const fillWidth = EnemyHealthBarHud.BAR_WIDTH * ratio;
    const bgLeftX = entry.barBg.x - EnemyHealthBarHud.BAR_WIDTH / 2;
    entry.barFill.setPosition(bgLeftX + fillWidth / 2, entry.barBg.y);
    entry.barFill.setSize(fillWidth, EnemyHealthBarHud.BAR_HEIGHT);
    entry.label.setText(`${entry.enemy.getName()} ${entry.currentHealth}/${entry.maxHealth}`);
  }

  /**
   * Repositions all entries vertically and resizes the row background.
   */
  private reflowLayout(): void {
    let index = 0;
    for (const entry of this.entries.values()) {
      const y = EnemyHealthBarHud.ROW_Y + index * EnemyHealthBarHud.ENTRY_HEIGHT
                + EnemyHealthBarHud.ENTRY_HEIGHT / 2;
      entry.barBg.setPosition(
        EnemyHealthBarHud.PADDING_X + EnemyHealthBarHud.BAR_WIDTH / 2, y
      );
      const ratio = entry.maxHealth > 0
        ? Math.max(0, Math.min(1, entry.currentHealth / entry.maxHealth))
        : 0;
      const fillWidth = EnemyHealthBarHud.BAR_WIDTH * ratio;
      const bgLeftX = entry.barBg.x - EnemyHealthBarHud.BAR_WIDTH / 2;
      entry.barFill.setPosition(bgLeftX + fillWidth / 2, y);
      entry.barFill.setSize(fillWidth, EnemyHealthBarHud.BAR_HEIGHT);
      entry.label.setPosition(
        EnemyHealthBarHud.PADDING_X + EnemyHealthBarHud.BAR_WIDTH
          + EnemyHealthBarHud.LABEL_OFFSET_X,
        y - EnemyHealthBarHud.ENTRY_HEIGHT / 2 + EnemyHealthBarHud.PADDING_Y
      );
      index++;
    }
    // Resize row background to fit all entries
    if (this.rowBackground) {
      const totalHeight = this.entries.size * EnemyHealthBarHud.ENTRY_HEIGHT;
      this.rowBackground.setSize(this.scene.scale.width, totalHeight);
      this.rowBackground.setPosition(
        this.scene.scale.width / 2,
        EnemyHealthBarHud.ROW_Y + totalHeight / 2
      );
    }
  }

  /**
   * Cleans up all resources: unsubscribes events, destroys game objects.
   */
  destroy(): void {
    this.destroyed = true;

    // Unsubscribe from EventBus
    eventBus.off("COMBAT_RESOLVED", this.boundOnCombatResolved);
    eventBus.off("ENEMY_DEFEATED", this.boundOnEnemyDefeated);

    // Destroy all entry game objects
    for (const entry of this.entries.values()) {
      entry.barBg.destroy();
      entry.barFill.destroy();
      entry.label.destroy();
    }

    // Destroy row background
    if (this.rowBackground) {
      this.rowBackground.destroy();
    }

    // Clear collections
    this.entries.clear();
    this.hudElements.splice(0, this.hudElements.length);
  }
}
