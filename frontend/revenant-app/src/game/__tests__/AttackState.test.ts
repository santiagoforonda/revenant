import { describe, it, expect } from "vitest";
import { AttackState, DEFAULT_ATTACK_COOLDOWN_MS } from "../entities/characters/AttackState";

describe("AttackState", () => {
  describe("Construction", () => {
    it("should initialize with default cooldown", () => {
      const state = new AttackState();

      expect(state.getCooldown()).toBe(DEFAULT_ATTACK_COOLDOWN_MS);
      expect(state.getIsAttacking()).toBe(false);
      expect(state.getLastAttackTime()).toBe(-Infinity);
    });

    it("should accept a custom cooldown value", () => {
      const state = new AttackState(1000);

      expect(state.getCooldown()).toBe(1000);
    });
  });

  describe("startAttack", () => {
    it("should enter the attacking state on a valid attack", () => {
      const state = new AttackState(500);

      const started = state.startAttack(1000);

      expect(started).toBe(true);
      expect(state.getIsAttacking()).toBe(true);
      expect(state.getLastAttackTime()).toBe(1000);
    });

    it("should reject an attack while already attacking", () => {
      const state = new AttackState(500);
      state.startAttack(1000);

      const second = state.startAttack(1100);

      expect(second).toBe(false);
      expect(state.getLastAttackTime()).toBe(1000);
    });

    it("should reject an attack while cooldown is active", () => {
      const state = new AttackState(500);
      state.startAttack(1000);
      state.endAttack();

      // 200ms later — cooldown has not expired (needs 500ms)
      const started = state.startAttack(1200);

      expect(started).toBe(false);
      expect(state.getIsAttacking()).toBe(false);
    });

    it("should allow an attack after cooldown expires", () => {
      const state = new AttackState(500);
      state.startAttack(1000);
      state.endAttack();

      // 500ms later — cooldown has expired
      const started = state.startAttack(1500);

      expect(started).toBe(true);
      expect(state.getIsAttacking()).toBe(true);
      expect(state.getLastAttackTime()).toBe(1500);
    });
  });

  describe("endAttack", () => {
    it("should leave the attacking state", () => {
      const state = new AttackState(500);
      state.startAttack(1000);

      state.endAttack();

      expect(state.getIsAttacking()).toBe(false);
    });

    it("should be safe to call when not attacking", () => {
      const state = new AttackState(500);

      state.endAttack();

      expect(state.getIsAttacking()).toBe(false);
    });
  });

  describe("isCooldownExpired", () => {
    it("should return true when no attack has been made", () => {
      const state = new AttackState(500);

      expect(state.isCooldownExpired(0)).toBe(true);
    });

    it("should return false while cooldown is active", () => {
      const state = new AttackState(500);
      state.startAttack(1000);
      state.endAttack();

      expect(state.isCooldownExpired(1200)).toBe(false);
    });

    it("should return true exactly when cooldown duration has passed", () => {
      const state = new AttackState(500);
      state.startAttack(1000);
      state.endAttack();

      expect(state.isCooldownExpired(1500)).toBe(true);
    });

    it("should return true after cooldown duration has passed", () => {
      const state = new AttackState(500);
      state.startAttack(1000);
      state.endAttack();

      expect(state.isCooldownExpired(2000)).toBe(true);
    });
  });

  describe("canAttack", () => {
    it("should return true initially", () => {
      const state = new AttackState(500);

      expect(state.canAttack(0)).toBe(true);
    });

    it("should return false while attacking", () => {
      const state = new AttackState(500);
      state.startAttack(1000);

      expect(state.canAttack(1100)).toBe(false);
    });

    it("should return false during cooldown after attack ends", () => {
      const state = new AttackState(500);
      state.startAttack(1000);
      state.endAttack();

      expect(state.canAttack(1200)).toBe(false);
    });

    it("should return true after cooldown expires and not attacking", () => {
      const state = new AttackState(500);
      state.startAttack(1000);
      state.endAttack();

      expect(state.canAttack(1500)).toBe(true);
    });
  });

  describe("Overlapping attack prevention", () => {
    it("should prevent multiple consecutive attack starts", () => {
      const state = new AttackState(500);

      expect(state.startAttack(1000)).toBe(true);
      expect(state.startAttack(1001)).toBe(false);
      expect(state.startAttack(1002)).toBe(false);
      expect(state.startAttack(1500)).toBe(false);
    });

    it("should allow attack after end + cooldown", () => {
      const state = new AttackState(300);

      expect(state.startAttack(0)).toBe(true);
      state.endAttack();

      expect(state.startAttack(200)).toBe(false); // cooldown active
      expect(state.startAttack(300)).toBe(true);  // cooldown expired
    });
  });

  describe("Configurable cooldown", () => {
    it("should respect a zero cooldown", () => {
      const state = new AttackState(0);
      state.startAttack(1000);
      state.endAttack();

      const started = state.startAttack(1000);

      expect(started).toBe(true);
    });

    it("should respect a long cooldown", () => {
      const state = new AttackState(5000);
      state.startAttack(1000);
      state.endAttack();

      expect(state.startAttack(3000)).toBe(false);
      expect(state.startAttack(5999)).toBe(false);
      expect(state.startAttack(6000)).toBe(true);
    });
  });
});
