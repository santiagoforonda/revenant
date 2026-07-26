import Phaser from "phaser";
import type { Player } from "@/game/entities/characters/Player";
import type { AttackState } from "@/game/entities/characters/AttackState";

/**
 * CooldownIndicator renders a small circular cooldown indicator above the player
 * to show when the attack is recharging.
 *
 * Displays a spinning/fading sword icon (⚔) above the player during cooldown.
 * Hidden when the attack is ready.
 */
export class CooldownIndicator {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly attackState: AttackState;
  private readonly indicator: Phaser.GameObjects.Text;
  private readonly cooldownMs: number;

  private static readonly OFFSET_Y = -28;
  private static readonly FONT_SIZE = "12px";
  private static readonly DEPTH = 6;

  constructor(
    scene: Phaser.Scene,
    player: Player,
    attackState: AttackState,
    cooldownMs: number = 500
  ) {
    this.scene = scene;
    this.player = player;
    this.attackState = attackState;
    this.cooldownMs = cooldownMs;

    // Create a text indicator — sword symbol ⚔ shown during cooldown
    this.indicator = this.scene.add.text(0, 0, "⚔", {
      fontSize: CooldownIndicator.FONT_SIZE,
      color: "#ff4444",
      stroke: "#000000",
      strokeThickness: 2,
    });
    this.indicator.setOrigin(0.5, 0.5);
    this.indicator.setDepth(CooldownIndicator.DEPTH);
    this.indicator.setVisible(false);
  }

  /**
   * Updates the cooldown indicator position and visibility.
   * Called every frame from the scene update loop.
   */
  update(): void {
    const currentTime = this.scene.time.now;
    const canAttack = this.attackState.canAttack(currentTime);

    if (canAttack) {
      this.indicator.setVisible(false);
      return;
    }

    // Show indicator above player during cooldown
    this.indicator.setVisible(true);
    this.indicator.setPosition(
      this.player.getX(),
      this.player.getY() + CooldownIndicator.OFFSET_Y
    );

    // Pulse alpha based on cooldown progress
    const lastAttackTime = this.attackState.getLastAttackTime();
    const elapsed = currentTime - lastAttackTime;
    const progress = Math.min(1, elapsed / this.cooldownMs);
    this.indicator.setAlpha(1 - progress * 0.7);
  }

  /**
   * Destroys the indicator and releases resources.
   */
  destroy(): void {
    this.indicator.destroy();
  }
}
