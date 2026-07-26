import { describe, it, expect } from "vitest";
import {
  PatrolDestinationGenerator,
  PATROL_RADIUS,
} from "@/game/systems/PatrolDestinationGenerator";
import type { PatrolOrigin } from "@/game/systems/PatrolController";

/**
 * Unit tests for PatrolDestinationGenerator (Task 3).
 *
 * Validates:
 * - Requirement 2.1: Select a patrol point within the patrol area.
 * - Requirement 4.1: Restrict the destination to the patrol area.
 * - Requirement 4.3: If a patrol point falls outside the patrol area, discard it.
 * - Requirement 8.1: If a destination cannot be generated, the enemy should remain idle.
 * - Requirement 8.2: If an invalid position is generated, generate another destination.
 */

describe("PatrolDestinationGenerator", () => {
  const defaultOrigin: PatrolOrigin = { x: 200, y: 300 };

  describe("Construction", () => {
    it("should use PATROL_RADIUS as default radius", () => {
      const generator = new PatrolDestinationGenerator();

      expect(generator.getRadius()).toBe(PATROL_RADIUS);
    });

    it("should accept a custom radius", () => {
      const generator = new PatrolDestinationGenerator({ radius: 120 });

      expect(generator.getRadius()).toBe(120);
    });

    it("should accept a minimum distance configuration", () => {
      const generator = new PatrolDestinationGenerator({ minDistance: 20 });

      expect(generator.getMinDistance()).toBe(20);
    });

    it("should default minDistance to 0", () => {
      const generator = new PatrolDestinationGenerator();

      expect(generator.getMinDistance()).toBe(0);
    });
  });

  describe("Destination Generation (Requirement 2.1)", () => {
    it("should generate a patrol destination", () => {
      const generator = new PatrolDestinationGenerator();
      const destination = generator.generate(defaultOrigin);

      expect(destination).not.toBeNull();
      expect(destination).toHaveProperty("x");
      expect(destination).toHaveProperty("y");
    });

    it("should generate different destinations over multiple calls", () => {
      const generator = new PatrolDestinationGenerator();
      const destinations = new Set<string>();

      for (let i = 0; i < 20; i++) {
        const dest = generator.generate(defaultOrigin);
        if (dest) {
          destinations.add(`${dest.x},${dest.y}`);
        }
      }

      // With random generation, we expect multiple unique destinations
      expect(destinations.size).toBeGreaterThan(1);
    });
  });

  describe("Patrol Area Restriction (Requirement 4.1)", () => {
    it("should generate destinations within the patrol radius", () => {
      const generator = new PatrolDestinationGenerator({ radius: 50 });

      for (let i = 0; i < 100; i++) {
        const destination = generator.generate(defaultOrigin);
        if (destination) {
          const dx = destination.x - defaultOrigin.x;
          const dy = destination.y - defaultOrigin.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          expect(distance).toBeLessThanOrEqual(50);
        }
      }
    });

    it("should generate destinations within the default PATROL_RADIUS", () => {
      const generator = new PatrolDestinationGenerator();

      for (let i = 0; i < 100; i++) {
        const destination = generator.generate(defaultOrigin);
        if (destination) {
          const dx = destination.x - defaultOrigin.x;
          const dy = destination.y - defaultOrigin.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          expect(distance).toBeLessThanOrEqual(PATROL_RADIUS);
        }
      }
    });

    it("should work with different origins", () => {
      const generator = new PatrolDestinationGenerator({ radius: 60 });
      const origins: PatrolOrigin[] = [
        { x: 0, y: 0 },
        { x: -100, y: -200 },
        { x: 500, y: 1000 },
      ];

      for (const origin of origins) {
        for (let i = 0; i < 50; i++) {
          const destination = generator.generate(origin);
          if (destination) {
            const dx = destination.x - origin.x;
            const dy = destination.y - origin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            expect(distance).toBeLessThanOrEqual(60);
          }
        }
      }
    });
  });

  describe("Boundary Validation (Requirement 4.3)", () => {
    it("should reject destinations outside the patrol radius", () => {
      const generator = new PatrolDestinationGenerator({ radius: 50 });
      const origin: PatrolOrigin = { x: 100, y: 100 };

      // A point clearly outside the radius
      const outsidePoint = { x: 200, y: 200 };
      expect(generator.isValidDestination(outsidePoint, origin)).toBe(false);
    });

    it("should accept destinations inside the patrol radius", () => {
      const generator = new PatrolDestinationGenerator({ radius: 50 });
      const origin: PatrolOrigin = { x: 100, y: 100 };

      // A point at the origin (distance = 0)
      expect(generator.isValidDestination({ x: 100, y: 100 }, origin)).toBe(true);

      // A point within radius
      expect(generator.isValidDestination({ x: 130, y: 130 }, origin)).toBe(true);
    });

    it("should accept destinations exactly on the boundary", () => {
      const generator = new PatrolDestinationGenerator({ radius: 50 });
      const origin: PatrolOrigin = { x: 100, y: 100 };

      // Exactly 50 pixels to the right
      expect(generator.isValidDestination({ x: 150, y: 100 }, origin)).toBe(true);
    });

    it("should reject destinations just outside the boundary", () => {
      const generator = new PatrolDestinationGenerator({ radius: 50 });
      const origin: PatrolOrigin = { x: 100, y: 100 };

      // Just over 50 pixels away
      expect(generator.isValidDestination({ x: 151, y: 100 }, origin)).toBe(false);
    });
  });

  describe("Minimum Distance", () => {
    it("should reject destinations too close when minDistance is set", () => {
      const generator = new PatrolDestinationGenerator({
        radius: 80,
        minDistance: 20,
      });
      const origin: PatrolOrigin = { x: 100, y: 100 };

      // A point at the origin (distance = 0, less than minDistance)
      expect(generator.isValidDestination({ x: 100, y: 100 }, origin)).toBe(false);

      // A point very close (distance ~5, less than minDistance)
      expect(generator.isValidDestination({ x: 103, y: 104 }, origin)).toBe(false);
    });

    it("should accept destinations beyond minDistance", () => {
      const generator = new PatrolDestinationGenerator({
        radius: 80,
        minDistance: 20,
      });
      const origin: PatrolOrigin = { x: 100, y: 100 };

      // Distance is 30 (> minDistance of 20)
      expect(generator.isValidDestination({ x: 130, y: 100 }, origin)).toBe(true);
    });

    it("should generate destinations respecting minDistance when configured", () => {
      const generator = new PatrolDestinationGenerator({
        radius: 80,
        minDistance: 20,
      });

      for (let i = 0; i < 100; i++) {
        const destination = generator.generate(defaultOrigin);
        if (destination) {
          const dx = destination.x - defaultOrigin.x;
          const dy = destination.y - defaultOrigin.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          expect(distance).toBeGreaterThanOrEqual(20);
          expect(distance).toBeLessThanOrEqual(80);
        }
      }
    });
  });

  describe("Error Handling (Requirement 8.1)", () => {
    it("should return null when radius is 0 and minDistance is positive", () => {
      // With radius 0 and minDistance > 0, no valid destination can exist
      const generator = new PatrolDestinationGenerator({
        radius: 0,
        minDistance: 10,
      });

      const destination = generator.generate(defaultOrigin);
      expect(destination).toBeNull();
    });
  });

  describe("Reusability for Future AI Behaviors", () => {
    it("should be configurable with different radii for different AI modes", () => {
      const patrolGenerator = new PatrolDestinationGenerator({ radius: 80 });
      const alertGenerator = new PatrolDestinationGenerator({ radius: 40 });

      expect(patrolGenerator.getRadius()).toBe(80);
      expect(alertGenerator.getRadius()).toBe(40);
    });

    it("should work independently for multiple enemies", () => {
      const generator = new PatrolDestinationGenerator();
      const origin1: PatrolOrigin = { x: 100, y: 100 };
      const origin2: PatrolOrigin = { x: 500, y: 500 };

      const dest1 = generator.generate(origin1);
      const dest2 = generator.generate(origin2);

      // Both should generate valid destinations
      expect(dest1).not.toBeNull();
      expect(dest2).not.toBeNull();

      if (dest1 && dest2) {
        // dest1 should be near origin1
        const dx1 = dest1.x - origin1.x;
        const dy1 = dest1.y - origin1.y;
        expect(Math.sqrt(dx1 * dx1 + dy1 * dy1)).toBeLessThanOrEqual(PATROL_RADIUS);

        // dest2 should be near origin2
        const dx2 = dest2.x - origin2.x;
        const dy2 = dest2.y - origin2.y;
        expect(Math.sqrt(dx2 * dx2 + dy2 * dy2)).toBeLessThanOrEqual(PATROL_RADIUS);
      }
    });
  });
});
