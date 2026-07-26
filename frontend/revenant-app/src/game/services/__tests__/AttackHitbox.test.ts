import { describe, it, expect } from "vitest";
import { AttackHitbox } from "@/game/services/AttackHitbox";
import type { Enemy } from "@/game/entities/characters/Enemy";

/**
 * Unit tests for AttackHitbox.
 *
 * Validates: Requirement 3 (Detect Attack Targets)
 *
 * Validates:
 * - Hitbox bounds are calculated correctly for each direction
 * - Enemies inside the hitbox are detected
 * - Enemies outside the hitbox are excluded
 * - Empty enemy collection returns empty result
 * - Default range and width configuration
 * - Custom configuration overrides defaults
 */

/** Creates a minimal mock Enemy with a given position */
function createMockEnemy(x: number, y: number): Enemy {
  return {
    getX: () => x,
    getY: () => y,
  } as unknown as Enemy;
}

describe("AttackHitbox", () => {
  describe("construction and defaults", () => {
    it("should use default range of 48 pixels when no config is provided", () => {
      const hitbox = new AttackHitbox(100, 100, "right");
      expect(hitbox.getRange()).toBe(48);
    });

    it("should use default width of 48 pixels when no config is provided", () => {
      const hitbox = new AttackHitbox(100, 100, "right");
      expect(hitbox.getWidth()).toBe(48);
    });

    it("should allow overriding range via config", () => {
      const hitbox = new AttackHitbox(100, 100, "right", { range: 64 });
      expect(hitbox.getRange()).toBe(64);
    });

    it("should allow overriding width via config", () => {
      const hitbox = new AttackHitbox(100, 100, "right", { width: 32 });
      expect(hitbox.getWidth()).toBe(32);
    });

    it("should store the player position", () => {
      const hitbox = new AttackHitbox(150, 200, "down");
      expect(hitbox.getPosition()).toEqual({ x: 150, y: 200 });
    });

    it("should store the attack direction", () => {
      const hitbox = new AttackHitbox(100, 100, "left");
      expect(hitbox.getDirection()).toBe("left");
    });
  });

  describe("bounds calculation - right direction", () => {
    it("should extend the hitbox to the right of the player", () => {
      const hitbox = new AttackHitbox(100, 100, "right", { range: 48, width: 48 });
      const bounds = hitbox.getBounds();

      expect(bounds.x).toBe(100);
      expect(bounds.y).toBe(76); // 100 - 48/2
      expect(bounds.w).toBe(48);
      expect(bounds.h).toBe(48);
    });
  });

  describe("bounds calculation - left direction", () => {
    it("should extend the hitbox to the left of the player", () => {
      const hitbox = new AttackHitbox(100, 100, "left", { range: 48, width: 48 });
      const bounds = hitbox.getBounds();

      expect(bounds.x).toBe(52); // 100 - 48
      expect(bounds.y).toBe(76); // 100 - 48/2
      expect(bounds.w).toBe(48);
      expect(bounds.h).toBe(48);
    });
  });

  describe("bounds calculation - down direction", () => {
    it("should extend the hitbox below the player", () => {
      const hitbox = new AttackHitbox(100, 100, "down", { range: 48, width: 48 });
      const bounds = hitbox.getBounds();

      expect(bounds.x).toBe(76); // 100 - 48/2
      expect(bounds.y).toBe(100);
      expect(bounds.w).toBe(48);
      expect(bounds.h).toBe(48);
    });
  });

  describe("bounds calculation - up direction", () => {
    it("should extend the hitbox above the player", () => {
      const hitbox = new AttackHitbox(100, 100, "up", { range: 48, width: 48 });
      const bounds = hitbox.getBounds();

      expect(bounds.x).toBe(76); // 100 - 48/2
      expect(bounds.y).toBe(52); // 100 - 48
      expect(bounds.w).toBe(48);
      expect(bounds.h).toBe(48);
    });
  });

  describe("detectEnemies - enemies inside the hitbox", () => {
    it("should detect an enemy directly in front (right)", () => {
      const hitbox = new AttackHitbox(100, 100, "right", { range: 48, width: 48 });
      const enemy = createMockEnemy(120, 100);

      const result = hitbox.detectEnemies([enemy]);
      expect(result).toContain(enemy);
    });

    it("should detect an enemy directly in front (left)", () => {
      const hitbox = new AttackHitbox(100, 100, "left", { range: 48, width: 48 });
      const enemy = createMockEnemy(70, 100);

      const result = hitbox.detectEnemies([enemy]);
      expect(result).toContain(enemy);
    });

    it("should detect an enemy directly below (down)", () => {
      const hitbox = new AttackHitbox(100, 100, "down", { range: 48, width: 48 });
      const enemy = createMockEnemy(100, 120);

      const result = hitbox.detectEnemies([enemy]);
      expect(result).toContain(enemy);
    });

    it("should detect an enemy directly above (up)", () => {
      const hitbox = new AttackHitbox(100, 100, "up", { range: 48, width: 48 });
      const enemy = createMockEnemy(100, 70);

      const result = hitbox.detectEnemies([enemy]);
      expect(result).toContain(enemy);
    });

    it("should detect multiple enemies inside the hitbox", () => {
      const hitbox = new AttackHitbox(100, 100, "right", { range: 48, width: 48 });
      const enemy1 = createMockEnemy(110, 95);
      const enemy2 = createMockEnemy(130, 105);

      const result = hitbox.detectEnemies([enemy1, enemy2]);
      expect(result).toHaveLength(2);
      expect(result).toContain(enemy1);
      expect(result).toContain(enemy2);
    });

    it("should detect an enemy at the exact lower-left corner of the hitbox", () => {
      // Right direction: bounds start at (100, 76)
      const hitbox = new AttackHitbox(100, 100, "right", { range: 48, width: 48 });
      const enemy = createMockEnemy(100, 76);

      const result = hitbox.detectEnemies([enemy]);
      expect(result).toContain(enemy);
    });
  });

  describe("detectEnemies - enemies outside the hitbox", () => {
    it("should not detect an enemy behind the player (attacking right)", () => {
      const hitbox = new AttackHitbox(100, 100, "right", { range: 48, width: 48 });
      const enemy = createMockEnemy(50, 100);

      const result = hitbox.detectEnemies([enemy]);
      expect(result).toHaveLength(0);
    });

    it("should not detect an enemy behind the player (attacking left)", () => {
      const hitbox = new AttackHitbox(100, 100, "left", { range: 48, width: 48 });
      const enemy = createMockEnemy(150, 100);

      const result = hitbox.detectEnemies([enemy]);
      expect(result).toHaveLength(0);
    });

    it("should not detect an enemy beyond the attack range", () => {
      const hitbox = new AttackHitbox(100, 100, "right", { range: 48, width: 48 });
      const enemy = createMockEnemy(200, 100);

      const result = hitbox.detectEnemies([enemy]);
      expect(result).toHaveLength(0);
    });

    it("should not detect an enemy outside the width (too far sideways)", () => {
      const hitbox = new AttackHitbox(100, 100, "right", { range: 48, width: 48 });
      // Width is 48, centered at y=100, so bounds are y: 76 to 124
      const enemy = createMockEnemy(120, 200);

      const result = hitbox.detectEnemies([enemy]);
      expect(result).toHaveLength(0);
    });

    it("should not detect an enemy at the exclusive upper boundary", () => {
      // Right direction: bounds are x: [100, 148), y: [76, 124)
      const hitbox = new AttackHitbox(100, 100, "right", { range: 48, width: 48 });
      const enemy = createMockEnemy(148, 100);

      const result = hitbox.detectEnemies([enemy]);
      expect(result).toHaveLength(0);
    });
  });

  describe("detectEnemies - mixed inside/outside", () => {
    it("should only return enemies inside the hitbox", () => {
      const hitbox = new AttackHitbox(100, 100, "right", { range: 48, width: 48 });
      const insideEnemy = createMockEnemy(120, 100);
      const outsideEnemy = createMockEnemy(200, 100);

      const result = hitbox.detectEnemies([insideEnemy, outsideEnemy]);
      expect(result).toHaveLength(1);
      expect(result).toContain(insideEnemy);
      expect(result).not.toContain(outsideEnemy);
    });
  });

  describe("detectEnemies - empty collection", () => {
    it("should return an empty array when no enemies are provided", () => {
      const hitbox = new AttackHitbox(100, 100, "right");
      const result = hitbox.detectEnemies([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("detectEnemies - custom configuration", () => {
    it("should detect enemies within a larger range", () => {
      const hitbox = new AttackHitbox(100, 100, "right", { range: 96, width: 48 });
      const enemy = createMockEnemy(180, 100);

      const result = hitbox.detectEnemies([enemy]);
      expect(result).toContain(enemy);
    });

    it("should detect enemies within a wider hitbox", () => {
      const hitbox = new AttackHitbox(100, 100, "right", { range: 48, width: 96 });
      // Width of 96 means y bounds are: 100 - 48 = 52 to 100 + 48 = 148
      const enemy = createMockEnemy(120, 55);

      const result = hitbox.detectEnemies([enemy]);
      expect(result).toContain(enemy);
    });

    it("should not detect enemies outside a narrower hitbox", () => {
      const hitbox = new AttackHitbox(100, 100, "right", { range: 48, width: 16 });
      // Width of 16 means y bounds are: 100 - 8 = 92 to 100 + 8 = 108
      const enemy = createMockEnemy(120, 110);

      const result = hitbox.detectEnemies([enemy]);
      expect(result).toHaveLength(0);
    });
  });
});
