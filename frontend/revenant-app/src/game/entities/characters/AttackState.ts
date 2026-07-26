/** Default attack cooldown in milliseconds. */
export const DEFAULT_ATTACK_COOLDOWN_MS = 500;

/**
 * Manages the player's attack state including cooldown tracking and
 * prevention of overlapping attacks.
 *
 * This class is composable and independent — it can be used by any entity
 * that needs attack state management without coupling to Player internals.
 *
 * Validates: Requirements 5 (Attack Cooldown), 6 (Attack State Management)
 */
export class AttackState {
  private isAttacking: boolean = false;
  private readonly cooldown: number;
  private lastAttackTime: number = -Infinity;

  /**
   * Creates a new AttackState instance.
   *
   * @param cooldown - Time in milliseconds between consecutive attacks.
   *                   Defaults to DEFAULT_ATTACK_COOLDOWN_MS.
   */
  constructor(cooldown: number = DEFAULT_ATTACK_COOLDOWN_MS) {
    this.cooldown = cooldown;
  }

  /**
   * Attempts to begin an attack.
   *
   * Returns true if the attack was started successfully.
   * Returns false if the attack was rejected because:
   *   - The entity is already attacking (overlapping attack prevention).
   *   - The cooldown has not expired.
   *
   * @param currentTime - The current timestamp in milliseconds.
   */
  startAttack(currentTime: number): boolean {
    if (this.isAttacking) {
      return false;
    }

    if (!this.isCooldownExpired(currentTime)) {
      return false;
    }

    this.isAttacking = true;
    this.lastAttackTime = currentTime;
    return true;
  }

  /**
   * Ends the current attack, transitioning out of the attacking state.
   * This should be called when the attack animation finishes.
   */
  endAttack(): void {
    this.isAttacking = false;
  }

  /**
   * Returns whether the entity is currently in the attacking state.
   */
  getIsAttacking(): boolean {
    return this.isAttacking;
  }

  /**
   * Returns the configured cooldown duration in milliseconds.
   */
  getCooldown(): number {
    return this.cooldown;
  }

  /**
   * Returns the timestamp of the last attack.
   */
  getLastAttackTime(): number {
    return this.lastAttackTime;
  }

  /**
   * Returns whether the cooldown has expired and a new attack is allowed.
   *
   * @param currentTime - The current timestamp in milliseconds.
   */
  isCooldownExpired(currentTime: number): boolean {
    return currentTime - this.lastAttackTime >= this.cooldown;
  }

  /**
   * Returns whether an attack can be performed right now.
   * Checks both that the entity is not attacking and that the cooldown has expired.
   *
   * @param currentTime - The current timestamp in milliseconds.
   */
  canAttack(currentTime: number): boolean {
    return !this.isAttacking && this.isCooldownExpired(currentTime);
  }
}
