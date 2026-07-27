import Phaser from "phaser";
import { Player } from "@/game/entities/characters/Player";
import { Enemy } from "@/game/entities/characters/Enemy";
import { AttackState } from "@/game/entities/characters/AttackState";
import { AttackHitbox } from "@/game/services/AttackHitbox";
import { AttackRequestService } from "@/game/services/AttackRequestService";
import type { AttackAnimationControllerInterface } from "@/game/services/AttackAnimationController";
import type { AttackRequest } from "@/game/interfaces/AttackRequest";
import type { PlayerDirection } from "@/game/services/SpriteComposer";

/**
 * PlayerAttackSystem coordinates the complete player attack workflow.
 *
 * Responsibilities:
 * - Listen for space button input.
 * - Validate attack cooldown via AttackState.
 * - Validate player attack state (not already attacking).
 * - Determine the attack direction from the Player's current facing direction.
 * - Orchestrate the attack workflow (animation, hitbox, request generation).
 *
 * This system does NOT calculate damage, modify enemy state, or communicate
 * with the backend. It only detects targets and generates AttackRequests.
 *
 * The system uses composition: it owns an AttackState instance for cooldown
 * and state management.
 *
 * Validates: Requirement 1 (Trigger Player Attack)
 */
export class PlayerAttackSystem {
  private readonly scene: Phaser.Scene;
  private readonly player: Player;
  private readonly enemies: Enemy[];
  private readonly attackState: AttackState;
  private readonly attackRequestService: AttackRequestService;
  private readonly animationController: AttackAnimationControllerInterface | null;
  private spaceKey: Phaser.Input.Keyboard.Key | null = null;

  /**
   * Creates the PlayerAttackSystem.
   *
   * Registers a left mouse button (pointer down) listener on the scene.
   * The system uses an internal AttackState for cooldown and overlap prevention.
   *
   * @param scene - The Phaser scene this system belongs to.
   * @param player - The player entity that performs attacks.
   * @param enemies - The collection of enemies for target detection.
   * @param cooldown - Optional attack cooldown in milliseconds. Defaults to AttackState default (500ms).
   * @param animationController - Optional animation controller for attack animations.
   */
  constructor(
    scene: Phaser.Scene,
    player: Player,
    enemies: Enemy[],
    cooldown?: number,
    animationController?: AttackAnimationControllerInterface
  ) {
    this.scene = scene;
    this.player = player;
    this.enemies = enemies;
    this.attackState = cooldown !== undefined ? new AttackState(cooldown) : new AttackState();
    this.attackRequestService = new AttackRequestService();
    this.animationController = animationController ?? null;

    // Register spacebar as attack input
    if (this.scene.input.keyboard) {
      this.spaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
  }

  /**
   * Updates the PlayerAttackSystem every frame.
   *
   * Checks if spacebar was just pressed and triggers attack.
   *
   * @param _time - The current game time in milliseconds.
   * @param _delta - The time elapsed since the last frame in milliseconds.
   */
  update(): void {
    if (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.attemptAttack();
    }
  }

  /**
   * Returns the internal AttackState for external inspection or testing.
   */
  getAttackState(): AttackState {
    return this.attackState;
  }

  /**
   * Executes the attack hitbox detection.
   *
   * Creates an AttackHitbox from the player's current position and the given
   * direction, then evaluates all enemies against the hitbox bounds.
   *
   * @param direction - The direction the player is attacking toward.
   * @returns Array of enemies detected inside the hitbox.
   */
  protected detectTargets(direction: PlayerDirection): Enemy[] {
    const hitbox = new AttackHitbox(
      this.player.getX(),
      this.player.getY(),
      direction
    );
    return hitbox.detectEnemies(this.enemies);
  }

  /**
   * Executes the attack animation.
   *
   * If an AttackAnimationController is available, delegates to it and handles
   * the asynchronous completion. On animation success, clears the attacking state.
   * On animation failure, logs the error, clears the attacking state, and
   * continues gameplay without interruption.
   *
   * If no controller is available, this is a no-op (attack completes synchronously).
   *
   * @param direction - The direction the player is attacking toward.
   */
  protected playAttackAnimation(direction: PlayerDirection): void {
    if (!this.animationController) {
      return;
    }

    const classId = this.player.getPlayerClass();

    // Play attack animations on all equipment layers that have attack spritesheets
    const weaponSprite = this.player.getWeaponSprite();
    const feetSprite = this.player.getFeetSprite();
    const legsSprite = this.player.getLegsSprite();
    const torsoSprite = this.player.getTorsoSprite();
    const helmetSprite = this.player.getHelmet();

    // Weapon attack (Slash.png)
    if (weaponSprite) {
      const weaponAnimKey = `${classId}-weapon-attack-${direction}`;
      if (this.scene.anims.exists(weaponAnimKey)) {
        weaponSprite.setData("isAttacking", true);
        weaponSprite.setVisible(true);
        weaponSprite.play(weaponAnimKey);
      }
    }

    // Feet attack (feets_slash.png - 64x64 frames)
    if (feetSprite) {
      const feetAnimKey = `${classId}-feet-attack-${direction}`;
      if (this.scene.anims.exists(feetAnimKey)) {
        feetSprite.setData("isAttacking", true);
        feetSprite.play(feetAnimKey);
      }
    }

    // Legs attack
    if (legsSprite) {
      const legsAnimKey = `${classId}-legs-attack-${direction}`;
      if (this.scene.anims.exists(legsAnimKey)) {
        legsSprite.setData("isAttacking", true);
        legsSprite.play(legsAnimKey);
      }
    }

    // Torso attack
    if (torsoSprite) {
      const torsoAnimKey = `${classId}-torso-attack-${direction}`;
      if (this.scene.anims.exists(torsoAnimKey)) {
        torsoSprite.setData("isAttacking", true);
        torsoSprite.play(torsoAnimKey);
      }
    }

    // Helmet attack (espadachin uses rows 12-15 of hair.png)
    if (helmetSprite) {
      const helmetAnimKey = `${classId}-helmet-attack-${direction}`;
      if (this.scene.anims.exists(helmetAnimKey)) {
        helmetSprite.setData("isAttacking", true);
        helmetSprite.play(helmetAnimKey);
      }
    }

    // Fire-and-forget: animation runs in parallel, endAttack is called on completion
    this.animationController
      .playAttack(direction)
      .then(() => {
        this.attackState.endAttack();

        // Restore the player's body to idle animation after attack completes
        const currentDir = this.player.getDirection();
        const bodySprite = this.player.getSprite();
        const idleKey = `${classId}-body-idle-${currentDir}`;
        if (bodySprite.scene && bodySprite.scene.anims.exists(idleKey)) {
          bodySprite.play(idleKey);
        }

        // Clear isAttacking flags — SpriteComposer will restore idle state on next frame
        // For weapon (uses different texture), restore explicitly
        if (weaponSprite && weaponSprite.getData("isAttacking")) {
          weaponSprite.setData("isAttacking", false);
          weaponSprite.stop();
          weaponSprite.setTexture(`${classId}-weapon`);
          weaponSprite.setDisplaySize(64, 64);
          let weaponIdleFrames: Record<string, number>;
          if (classId === "mago") {
            weaponIdleFrames = { up: 0, left: 13, down: 26, right: 39 }; // 13 cols
          } else if (classId === "gladiador") {
            weaponIdleFrames = { up: 0, left: 9, down: 18, right: 27 }; // 9 cols
          } else {
            weaponIdleFrames = { up: 0, left: 6, down: 12, right: 18 }; // 6 cols
          }
          weaponSprite.setFrame(weaponIdleFrames[currentDir] ?? 12);
        }

        // For feet (uses different texture for gladiador/espadachin/mago), restore explicitly
        if (feetSprite && feetSprite.getData("isAttacking")) {
          feetSprite.setData("isAttacking", false);
          feetSprite.stop();
          feetSprite.setTexture(`${classId}-feet`);
          const feetIdleFrames: Record<string, number> = { up: 0, left: 9, down: 18, right: 27 };
          feetSprite.setFrame(feetIdleFrames[currentDir] ?? 18);
        }

        // Legs, torso, helmet — clear flag and play idle animation (same texture)
        if (legsSprite && legsSprite.getData("isAttacking")) {
          legsSprite.setData("isAttacking", false);
          const legsIdleKey = `${classId}-legs-idle-${currentDir}`;
          if (this.scene.anims.exists(legsIdleKey)) {
            legsSprite.play(legsIdleKey);
          }
        }

        if (torsoSprite && torsoSprite.getData("isAttacking")) {
          torsoSprite.setData("isAttacking", false);
          const torsoIdleKey = `${classId}-torso-idle-${currentDir}`;
          if (this.scene.anims.exists(torsoIdleKey)) {
            torsoSprite.play(torsoIdleKey);
          }
        }

        if (helmetSprite && helmetSprite.getData("isAttacking")) {
          helmetSprite.setData("isAttacking", false);
          const helmetIdleKey = `${classId}-helmet-idle-${currentDir}`;
          if (this.scene.anims.exists(helmetIdleKey)) {
            helmetSprite.play(helmetIdleKey);
          }
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(
          `[PlayerAttackSystem] Animation failure: ${message}. Clearing attack state.`
        );
        this.attackState.endAttack();
        if (weaponSprite) weaponSprite.setData("isAttacking", false);
        if (feetSprite) feetSprite.setData("isAttacking", false);
        if (legsSprite) legsSprite.setData("isAttacking", false);
        if (torsoSprite) torsoSprite.setData("isAttacking", false);
        if (helmetSprite) helmetSprite.setData("isAttacking", false);
      });
  }

  /**
   * Called when an AttackRequest has been generated.
   *
   * Forwards the request to the Combat System via the AttackRequestService.
   * The request is forwarded regardless of whether the targets array is empty,
   * since an attack with no detected enemies is still a valid attack.
   *
   * @param request - The generated attack request.
   */
  protected onAttackRequestGenerated(request: AttackRequest): void {
    this.attackRequestService.forward(request);
  }

  /**
   * Attempts to execute an attack.
   *
   * Validates that:
   * 1. The player is not already attacking (AttackState).
   * 2. The attack cooldown has expired (AttackState).
   *
   * If validation passes, coordinates the full attack workflow:
   * 1. Start the attack (update state).
   * 2. Determine attack direction from player's current facing direction.
   * 3. Play the attack animation (async if controller available).
   * 4. Detect targets via hitbox.
   * 5. Generate the AttackRequest.
   * 6. End the attack (synchronously if no controller, deferred if controller present).
   *
   * Error handling:
   * - Attack during cooldown: silently ignored.
   * - Already attacking: silently ignored.
   * - No enemies detected: attack still completes, request generated with empty targets.
   * - Animation failure: error logged, attacking state cleared, gameplay continues.
   */
  private attemptAttack(): void {
    const currentTime = this.scene.time.now;


    // Validate attack cooldown and state via AttackState
    if (!this.attackState.canAttack(currentTime)) {
      console.log("[PlayerAttackSystem] Attack blocked — cooldown or already attacking");
      return;
    }

    // Start the attack — transitions to attacking state
    const started = this.attackState.startAttack(currentTime);
    if (!started) {
      console.warn(
        "[PlayerAttackSystem] Attack could not start — invalid player state."
      );
      return;
    }

    // Determine attack direction from the player's current facing direction
    const direction = this.player.getDirection();

    // Play attack animation (fire-and-forget if controller present)
    this.playAttackAnimation(direction);

    // Detect targets inside the attack hitbox
    const targets = this.detectTargets(direction);

    // Generate the AttackRequest (empty targets is valid — no enemy detected case)
    const attackRequest: AttackRequest = {
      attacker: this.player,
      targets,
      direction,
      timestamp: currentTime,
    };

    // Forward the request
    this.onAttackRequestGenerated(attackRequest);

    // End the attack synchronously only if no animation controller is managing
    // the animation lifecycle. When a controller is present, endAttack is called
    // upon animation completion (or on animation failure via the catch handler).
    if (!this.animationController) {
      this.attackState.endAttack();
    }
  }

  /**
   * Removes the input listener and cleans up the system.
   *
   * Should be called when the scene is destroyed or the system is no longer needed.
   */
  destroy(): void {
    if (this.spaceKey) {
      this.scene.input.keyboard?.removeKey(this.spaceKey);
      this.spaceKey = null;
    }
  }
}
