import type { DamageCalculation } from "@/game/interfaces/DamageCalculation";

/**
 * DamageCalculator — calculates the final damage dealt to a target.
 *
 * Responsibilities:
 * - Read attacker attack value.
 * - Read target armor value.
 * - Calculate final damage (attack - armor).
 * - Guarantee non-negative damage (minimum 0).
 *
 * This service is stateless and reusable.
 * It does not render graphics, manage scenes, or perform backend communication.
 */
export class DamageCalculator {
  /**
   * Calculates the final damage dealt to a target after armor reduction.
   *
   * The formula is: finalDamage = max(0, attack - armor)
   *
   * This guarantees the result is always non-negative, even when
   * armor exceeds the attack value.
   *
   * @param attack - The attacker's attack value.
   * @param armor - The target's armor value.
   * @returns A DamageCalculation containing the input values and computed final damage.
   */
  calculate(attack: number, armor: number): DamageCalculation {
    const finalDamage = Math.max(0, attack - armor);

    return {
      attack,
      armor,
      finalDamage,
    };
  }
}
