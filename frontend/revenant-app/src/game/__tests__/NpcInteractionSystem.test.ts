import { describe, it, expect, beforeEach } from "vitest";
import {
  NpcInteractionSystem,
  INTERACTION_RADIUS,
} from "../systems/NpcInteractionSystem";
import type { Player } from "../entities/characters/Player";
import type { Npc } from "../entities/characters/Npc";

/**
 * Creates a mock Player with fixed x/y positions.
 */
function createMockPlayer(x: number, y: number): Player {
  return {
    getX: () => x,
    getY: () => y,
  } as unknown as Player;
}

/**
 * Creates a mock Npc with fixed x/y positions and id/name.
 */
function createMockNpc(id: number, x: number, y: number, interactionRadius: number | null = null): Npc {
  return {
    getX: () => x,
    getY: () => y,
    getId: () => id,
    getName: () => `NPC_${id}`,
    getInteractionRadius: () => interactionRadius,
  } as unknown as Npc;
}

describe("NpcInteractionSystem", () => {
  describe("Nearest NPC Detection", () => {
    it("should return null when no NPCs exist", () => {
      const player = createMockPlayer(100, 100);
      const system = new NpcInteractionSystem(player, []);

      system.update();

      expect(system.getSelectedNpc()).toBeNull();
    });

    it("should select the NPC when player is within interaction radius", () => {
      const player = createMockPlayer(100, 100);
      const npc = createMockNpc(1, 110, 100); // 10px away
      const system = new NpcInteractionSystem(player, [npc]);

      system.update();

      expect(system.getSelectedNpc()).toBe(npc);
    });

    it("should select the nearest NPC when multiple NPCs are within radius", () => {
      const player = createMockPlayer(100, 100);
      const npcFar = createMockNpc(1, 112, 100); // 12px away
      const npcClose = createMockNpc(2, 105, 100); // 5px away
      const system = new NpcInteractionSystem(player, [npcFar, npcClose]);

      system.update();

      expect(system.getSelectedNpc()).toBe(npcClose);
    });

    it("should return null when player is far from all NPCs", () => {
      const player = createMockPlayer(0, 0);
      const npc = createMockNpc(1, 200, 200); // far away
      const system = new NpcInteractionSystem(player, [npc]);

      system.update();

      expect(system.getSelectedNpc()).toBeNull();
    });

    it("should update selection when positions change", () => {
      let playerX = 100;
      const player = {
        getX: () => playerX,
        getY: () => 100,
      } as unknown as Player;

      const npc = createMockNpc(1, 110, 100); // 10px away initially
      const system = new NpcInteractionSystem(player, [npc]);

      system.update();
      expect(system.getSelectedNpc()).toBe(npc);

      // Move player far away
      playerX = 500;
      system.update();
      expect(system.getSelectedNpc()).toBeNull();
    });
  });

  describe("Interaction Radius Validation", () => {
    it("should report not interactable when player is far from NPCs", () => {
      const player = createMockPlayer(0, 0);
      const npc = createMockNpc(1, 100, 100);
      const system = new NpcInteractionSystem(player, [npc]);

      system.update();

      expect(system.isInteractable()).toBe(false);
    });

    it("should report interactable when player is within 40px of an NPC", () => {
      const player = createMockPlayer(100, 100);
      const npc = createMockNpc(1, 110, 100); // 10px away
      const system = new NpcInteractionSystem(player, [npc]);

      system.update();

      expect(system.isInteractable()).toBe(true);
    });

    it("should be interactable at exactly the boundary distance (40px)", () => {
      // Place NPC exactly 40px away on X axis
      const player = createMockPlayer(100, 100);
      const npc = createMockNpc(1, 140, 100); // exactly 40px
      const system = new NpcInteractionSystem(player, [npc]);

      system.update();

      expect(system.isInteractable()).toBe(true);
      expect(system.getSelectedNpc()).toBe(npc);
    });

    it("should NOT be interactable at 41px distance", () => {
      const player = createMockPlayer(100, 100);
      const npc = createMockNpc(1, 141, 100); // 41px away
      const system = new NpcInteractionSystem(player, [npc]);

      system.update();

      expect(system.isInteractable()).toBe(false);
      expect(system.getSelectedNpc()).toBeNull();
    });

    it("should export the INTERACTION_RADIUS constant as 40", () => {
      expect(INTERACTION_RADIUS).toBe(40);
    });
  });

  describe("Distance Calculation", () => {
    it("should return Infinity when no NPC is selected", () => {
      const player = createMockPlayer(0, 0);
      const system = new NpcInteractionSystem(player, []);

      system.update();

      expect(system.getDistance()).toBe(Infinity);
    });

    it("should return correct Euclidean distance to the selected NPC", () => {
      // Distance between (0,0) and (3,4) = 5
      const player = createMockPlayer(0, 0);
      const npc = createMockNpc(1, 3, 4);
      const system = new NpcInteractionSystem(player, [npc]);

      system.update();

      expect(system.getDistance()).toBe(5);
    });

    it("should return distance to the nearest NPC when multiple are in range", () => {
      const player = createMockPlayer(100, 100);
      const npcA = createMockNpc(1, 112, 100); // 12px
      const npcB = createMockNpc(2, 107, 100); // 7px
      const system = new NpcInteractionSystem(player, [npcA, npcB]);

      system.update();

      expect(system.getDistance()).toBe(7);
    });

    it("should return Infinity when NPC is outside the radius", () => {
      const player = createMockPlayer(0, 0);
      const npc = createMockNpc(1, 100, 100); // far away
      const system = new NpcInteractionSystem(player, [npc]);

      system.update();

      expect(system.getDistance()).toBe(Infinity);
    });
  });
});
