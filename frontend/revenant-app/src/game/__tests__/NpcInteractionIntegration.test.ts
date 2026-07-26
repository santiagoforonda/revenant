import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Npc } from "../entities/characters/Npc";
import {
  NpcInteractionSystem,
  INTERACTION_RADIUS,
} from "../systems/NpcInteractionSystem";
import { eventBus } from "../events/event-bus";
import type { NpcDialoguePayload } from "../events/event-bus.types";
import type { NpcDto } from "../interfaces/NpcResponse";
import type { Player } from "../entities/characters/Player";

/**
 * Creates a mock Phaser scene that returns sprites with the correct x/y coordinates.
 */
function createMockScene(): Phaser.Scene {
  return {
    textures: { exists: vi.fn().mockReturnValue(true) },
    add: {
      sprite: vi.fn((x: number, y: number) => ({
        x,
        y,
        setDepth: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(),
        play: vi.fn().mockReturnThis(),
      })),
    },
    anims: { exists: vi.fn().mockReturnValue(false) },
  } as unknown as Phaser.Scene;
}

/**
 * Creates NPC data.
 */
function createNpcDto(id: number, name: string, phrases: string[]): NpcDto {
  return {
    id,
    id_map: 1,
    name,
    description: `Test NPC ${name}`,
    phrases,
  };
}

/**
 * Creates a mock Player at a given position.
 */
function createMockPlayer(x: number, y: number): Player {
  return {
    getX: () => x,
    getY: () => y,
  } as unknown as Player;
}

describe("NPC Interaction Integration", () => {
  let scene: Phaser.Scene;

  beforeEach(() => {
    scene = createMockScene();
  });

  afterEach(() => {
    eventBus.removeAllListeners();
  });

  describe("Full Interaction Flow", () => {
    it("should detect NPC in range, interact, and return the correct phrase", () => {
      const npc = new Npc(
        scene,
        110,
        100,
        createNpcDto(1, "Guard", ["Hello traveler!", "Safe travels."]),
        "guard_sprite"
      );
      const player = createMockPlayer(100, 100); // 10px away
      const system = new NpcInteractionSystem(player, [npc]);

      // System detects NPC
      system.update();
      expect(system.isInteractable()).toBe(true);
      expect(system.getSelectedNpc()).toBe(npc);

      // Interact and get first phrase
      const phrase = npc.interact();
      expect(phrase).toBe("Hello traveler!");
    });

    it("should emit NPC_DIALOGUE event with correct payload on interaction", () => {
      const npc = new Npc(
        scene,
        105,
        100,
        createNpcDto(1, "Merchant", ["Welcome!", "Buy something."]),
        "merchant_sprite"
      );
      const player = createMockPlayer(100, 100);
      const system = new NpcInteractionSystem(player, [npc]);

      const receivedEvents: NpcDialoguePayload[] = [];
      eventBus.on("NPC_DIALOGUE", (payload: NpcDialoguePayload) => {
        receivedEvents.push(payload);
      });

      system.update();

      // Simulate what the game loop does: check if interactable, then interact and emit event
      if (system.isInteractable()) {
        const selectedNpc = system.getSelectedNpc()!;
        const phrase = selectedNpc.interact();
        eventBus.emit("NPC_DIALOGUE", {
          npcName: selectedNpc.getName(),
          phrase,
        });
      }

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toEqual({
        npcName: "Merchant",
        phrase: "Welcome!",
      });
    });

    it("should NOT emit event when player is outside interaction radius", () => {
      const npc = new Npc(
        scene,
        200,
        200,
        createNpcDto(1, "Guard", ["Hello!"]),
        "guard_sprite"
      );
      const player = createMockPlayer(0, 0); // far away
      const system = new NpcInteractionSystem(player, [npc]);

      const receivedEvents: NpcDialoguePayload[] = [];
      eventBus.on("NPC_DIALOGUE", (payload: NpcDialoguePayload) => {
        receivedEvents.push(payload);
      });

      system.update();

      // Player presses E but nothing should happen
      if (system.isInteractable()) {
        const selectedNpc = system.getSelectedNpc()!;
        const phrase = selectedNpc.interact();
        eventBus.emit("NPC_DIALOGUE", {
          npcName: selectedNpc.getName(),
          phrase,
        });
      }

      expect(receivedEvents).toHaveLength(0);
    });
  });

  describe("Sequential Dialogue via System", () => {
    it("should emit different phrases on sequential interactions", () => {
      const npc = new Npc(
        scene,
        105,
        100,
        createNpcDto(1, "Elder", ["First words.", "Second words.", "Third words."]),
        "elder_sprite"
      );
      const player = createMockPlayer(100, 100);
      const system = new NpcInteractionSystem(player, [npc]);

      const receivedEvents: NpcDialoguePayload[] = [];
      eventBus.on("NPC_DIALOGUE", (payload: NpcDialoguePayload) => {
        receivedEvents.push(payload);
      });

      system.update();

      // Three sequential interactions
      for (let i = 0; i < 3; i++) {
        if (system.isInteractable()) {
          const selectedNpc = system.getSelectedNpc()!;
          const phrase = selectedNpc.interact();
          eventBus.emit("NPC_DIALOGUE", {
            npcName: selectedNpc.getName(),
            phrase,
          });
        }
      }

      expect(receivedEvents).toHaveLength(3);
      expect(receivedEvents[0].phrase).toBe("First words.");
      expect(receivedEvents[1].phrase).toBe("Second words.");
      expect(receivedEvents[2].phrase).toBe("Third words.");
    });

    it("should restart dialogue from first phrase after exhausting all phrases", () => {
      const npc = new Npc(
        scene,
        105,
        100,
        createNpcDto(1, "Guard", ["Hello!", "Goodbye!"]),
        "guard_sprite"
      );
      const player = createMockPlayer(100, 100);
      const system = new NpcInteractionSystem(player, [npc]);

      const receivedEvents: NpcDialoguePayload[] = [];
      eventBus.on("NPC_DIALOGUE", (payload: NpcDialoguePayload) => {
        receivedEvents.push(payload);
      });

      system.update();

      // Interact 3 times (should cycle back)
      for (let i = 0; i < 3; i++) {
        if (system.isInteractable()) {
          const selectedNpc = system.getSelectedNpc()!;
          const phrase = selectedNpc.interact();
          eventBus.emit("NPC_DIALOGUE", {
            npcName: selectedNpc.getName(),
            phrase,
          });
        }
      }

      expect(receivedEvents[0].phrase).toBe("Hello!");
      expect(receivedEvents[1].phrase).toBe("Goodbye!");
      expect(receivedEvents[2].phrase).toBe("Hello!"); // Restarted
    });
  });

  describe("Multiple NPCs Maintain Separate State", () => {
    it("should maintain independent dialogue state for different NPCs", () => {
      const npcA = new Npc(
        scene,
        105,
        100,
        createNpcDto(1, "Guard", ["G1", "G2", "G3"]),
        "guard_sprite"
      );
      const npcB = new Npc(
        scene,
        200,
        200,
        createNpcDto(2, "Merchant", ["M1", "M2", "M3"]),
        "merchant_sprite"
      );

      // Player near NPC A
      let playerX = 100;
      let playerY = 100;
      const player = {
        getX: () => playerX,
        getY: () => playerY,
      } as unknown as Player;

      const system = new NpcInteractionSystem(player, [npcA, npcB]);

      // Interact with Guard twice
      system.update();
      expect(system.getSelectedNpc()).toBe(npcA);
      expect(npcA.interact()).toBe("G1");
      expect(npcA.interact()).toBe("G2");

      // Move player near Merchant
      playerX = 200;
      playerY = 205; // 5px away from npcB
      system.update();
      expect(system.getSelectedNpc()).toBe(npcB);

      // Merchant should start from its own first phrase
      expect(npcB.interact()).toBe("M1");

      // Move player back near Guard
      playerX = 100;
      playerY = 100;
      system.update();
      expect(system.getSelectedNpc()).toBe(npcA);

      // Guard should continue from where it left off (G3)
      expect(npcA.interact()).toBe("G3");
    });
  });

  describe("NPC Without Phrases", () => {
    it("should emit NPC_DIALOGUE with null phrase for NPC without dialogue", () => {
      const npc = new Npc(
        scene,
        105,
        100,
        createNpcDto(1, "Silent", []),
        "silent_sprite"
      );
      const player = createMockPlayer(100, 100);
      const system = new NpcInteractionSystem(player, [npc]);

      const receivedEvents: NpcDialoguePayload[] = [];
      eventBus.on("NPC_DIALOGUE", (payload: NpcDialoguePayload) => {
        receivedEvents.push(payload);
      });

      system.update();

      if (system.isInteractable()) {
        const selectedNpc = system.getSelectedNpc()!;
        const phrase = selectedNpc.interact();
        eventBus.emit("NPC_DIALOGUE", {
          npcName: selectedNpc.getName(),
          phrase,
        });
      }

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0]).toEqual({
        npcName: "Silent",
        phrase: null,
      });
    });
  });

  describe("End-to-End Gameplay Flow", () => {
    it("should complete the full interaction cycle: approach → detect → interact → advance → cycle", () => {
      const npc = new Npc(
        scene,
        110,
        100,
        createNpcDto(1, "Elder", ["Greetings.", "How may I help?", "Farewell."]),
        "elder_sprite"
      );

      let playerX = 500;
      const player = {
        getX: () => playerX,
        getY: () => 100,
      } as unknown as Player;

      const system = new NpcInteractionSystem(player, [npc]);
      const receivedEvents: NpcDialoguePayload[] = [];
      eventBus.on("NPC_DIALOGUE", (payload: NpcDialoguePayload) => {
        receivedEvents.push(payload);
      });

      // Step 1: Player is far away — no interaction possible
      system.update();
      expect(system.isInteractable()).toBe(false);
      expect(system.getSelectedNpc()).toBeNull();

      // Step 2: Player approaches NPC (within 25px radius)
      playerX = 100; // now 10px from NPC at x=110
      system.update();
      expect(system.isInteractable()).toBe(true);
      expect(system.getSelectedNpc()).toBe(npc);

      // Step 3: Player presses E — first phrase
      const selected1 = system.getSelectedNpc()!;
      const phrase1 = selected1.interact();
      eventBus.emit("NPC_DIALOGUE", { npcName: selected1.getName(), phrase: phrase1 });
      expect(phrase1).toBe("Greetings.");

      // Step 4: Player presses E again — second phrase
      const phrase2 = selected1.interact();
      eventBus.emit("NPC_DIALOGUE", { npcName: selected1.getName(), phrase: phrase2 });
      expect(phrase2).toBe("How may I help?");

      // Step 5: Player presses E — third phrase
      const phrase3 = selected1.interact();
      eventBus.emit("NPC_DIALOGUE", { npcName: selected1.getName(), phrase: phrase3 });
      expect(phrase3).toBe("Farewell.");

      // Step 6: Player presses E — dialogue restarts from first phrase
      const phrase4 = selected1.interact();
      eventBus.emit("NPC_DIALOGUE", { npcName: selected1.getName(), phrase: phrase4 });
      expect(phrase4).toBe("Greetings.");

      // Verify all events were emitted correctly
      expect(receivedEvents).toHaveLength(4);
      expect(receivedEvents.map((e) => e.phrase)).toEqual([
        "Greetings.",
        "How may I help?",
        "Farewell.",
        "Greetings.",
      ]);
      expect(receivedEvents.every((e) => e.npcName === "Elder")).toBe(true);
    });

    it("should handle player leaving and re-entering interaction radius", () => {
      const npc = new Npc(
        scene,
        110,
        100,
        createNpcDto(1, "Guard", ["First.", "Second."]),
        "guard_sprite"
      );

      let playerX = 100;
      const player = {
        getX: () => playerX,
        getY: () => 100,
      } as unknown as Player;

      const system = new NpcInteractionSystem(player, [npc]);

      // Player is in range, interact once
      system.update();
      expect(system.isInteractable()).toBe(true);
      expect(npc.interact()).toBe("First.");

      // Player leaves radius
      playerX = 500;
      system.update();
      expect(system.isInteractable()).toBe(false);
      expect(system.getSelectedNpc()).toBeNull();

      // Player returns to radius — NPC should continue from where it left off
      playerX = 100;
      system.update();
      expect(system.isInteractable()).toBe(true);
      expect(npc.interact()).toBe("Second.");
    });
  });
});
