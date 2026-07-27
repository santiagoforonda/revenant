

export interface DamageCalculationPLayer{
     /** The attacker's raw attack value. */
  readonly attack: number;

  /** The target's armor value used for damage reduction. */
  readonly health: number;

  /** The final damage after armor reduction. Always non-negative. */
  readonly finalDamage: number;
}