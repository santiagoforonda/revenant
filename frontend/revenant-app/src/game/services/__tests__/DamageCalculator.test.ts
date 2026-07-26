import { describe, it, expect, beforeEach } from "vitest";
import { DamageCalculator } from "@/game/services/DamageCalculator";

/**
 * Unit tests for DamageCalculator.
 *
 * Validates: Requirement 2 (Calculate Combat Damage)
 *
 * Validates:
 * - Damage is calculated using attacker attack and target armor.
 * - Final damage is never negative.
 * - The calculation returns a structured DamageCalculation result.
 * - Damage calculation is deterministic for the same inputs.
 */
describe("DamageCalculator", () => {
  let calculator: DamageCalculator;

  beforeEach(() => {
    calculator = new DamageCalculator();
  });

  it("should calculate damage as attack minus armor", () => {
    const result = calculator.calculate(10, 3);

    expect(result.finalDamage).toBe(7);
  });

  it("should return zero damage when armor equals attack", () => {
    const result = calculator.calculate(5, 5);

    expect(result.finalDamage).toBe(0);
  });

  it("should return zero damage when armor exceeds attack", () => {
    const result = calculator.calculate(3, 10);

    expect(result.finalDamage).toBe(0);
  });

  it("should never return negative damage", () => {
    const result = calculator.calculate(0, 100);

    expect(result.finalDamage).toBeGreaterThanOrEqual(0);
  });

  it("should return full attack damage when armor is zero", () => {
    const result = calculator.calculate(15, 0);

    expect(result.finalDamage).toBe(15);
  });

  it("should include the attack value in the result", () => {
    const result = calculator.calculate(8, 2);

    expect(result.attack).toBe(8);
  });

  it("should include the armor value in the result", () => {
    const result = calculator.calculate(8, 2);

    expect(result.armor).toBe(2);
  });

  it("should be deterministic for the same inputs", () => {
    const first = calculator.calculate(12, 4);
    const second = calculator.calculate(12, 4);

    expect(first.finalDamage).toBe(second.finalDamage);
  });

  it("should handle zero attack and zero armor", () => {
    const result = calculator.calculate(0, 0);

    expect(result.finalDamage).toBe(0);
  });
});
