import { describe, it, expect, vi, beforeEach } from "vitest";
import { Npc } from "../entities/characters/Npc";
import type { NpcDto } from "../interfaces/NpcResponse";

/**
 * Mock Phaser.Scene to satisfy Npc constructor requirements.
 * NPCs need a scene with textures and add.sprite functionality.
 */
function createMockScene(): Phaser.Scene {
  const mockSprite = {
    x: 0,
    y: 0,
    setDepth: vi.fn().mockReturnThis(),
    setScale: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
  };

  const mockScene = {
    textures: {
      exists: vi.fn().mockReturnValue(true),
    },
    add: {
      sprite: vi.fn().mockReturnValue(mockSprite),
    },
    anims: {
      exists: vi.fn().mockReturnValue(false),
    },
  } as unknown as Phaser.Scene;

  return mockScene;
}

/**
 * Creates an NpcDto with the given phrases for testing.
 */
function createNpcDto(
  id: number,
  name: string,
  phrases: string[]
): NpcDto {
  return {
    id,
    id_map: 1,
    name,
    description: `Test NPC ${name}`,
    phrases,
  };
}

describe("NPC Dialogue State Management", () => {
  let scene: Phaser.Scene;

  beforeEach(() => {
    scene = createMockScene();
  });

  describe("Each NPC maintains its own dialogue index", () => {
    it("should start each NPC at the first phrase independently", () => {
      const npcA = new Npc(
        scene,
        0,
        0,
        createNpcDto(1, "Guard", ["Hello!", "Move along.", "Stop!"]),
        "guard_sprite"
      );
      const npcB = new Npc(
        scene,
        100,
        100,
        createNpcDto(2, "Merchant", ["Welcome!", "Buy something.", "Goodbye."]),
        "merchant_sprite"
      );

      const phraseA: string | null = npcA.getNextPhrase();
      const phraseB: string | null = npcB.getNextPhrase();

      expect(phraseA).toBe("Hello!");
      expect(phraseB).toBe("Welcome!");
    });

    it("should advance dialogue index independently per NPC", () => {
      const npcA = new Npc(
        scene,
        0,
        0,
        createNpcDto(1, "Guard", ["A1", "A2", "A3"]),
        "guard_sprite"
      );
      const npcB = new Npc(
        scene,
        100,
        100,
        createNpcDto(2, "Merchant", ["B1", "B2", "B3"]),
        "merchant_sprite"
      );

      // Advance NPC A twice
      expect(npcA.getNextPhrase()).toBe("A1");
      expect(npcA.getNextPhrase()).toBe("A2");

      // NPC B should still be at its first phrase
      expect(npcB.getNextPhrase()).toBe("B1");
    });
  });

  describe("Dialogue state is not shared between NPC instances", () => {
    it("should not share state when NPCs have the same phrase list", () => {
      const sharedPhrases: string[] = ["Shared1", "Shared2", "Shared3"];

      const npcA = new Npc(
        scene,
        0,
        0,
        createNpcDto(1, "NPC A", [...sharedPhrases]),
        "npc_sprite"
      );
      const npcB = new Npc(
        scene,
        100,
        100,
        createNpcDto(2, "NPC B", [...sharedPhrases]),
        "npc_sprite"
      );

      // Advance NPC A through all phrases
      expect(npcA.getNextPhrase()).toBe("Shared1");
      expect(npcA.getNextPhrase()).toBe("Shared2");
      expect(npcA.getNextPhrase()).toBe("Shared3");

      // NPC B state must remain unaffected
      expect(npcB.getNextPhrase()).toBe("Shared1");
      expect(npcB.getNextPhrase()).toBe("Shared2");
    });

    it("should not share state when many NPCs are created", () => {
      const npcs: Npc[] = [];
      for (let i = 0; i < 5; i++) {
        npcs.push(
          new Npc(
            scene,
            i * 50,
            0,
            createNpcDto(i, `NPC_${i}`, [`Phrase_${i}_0`, `Phrase_${i}_1`]),
            "npc_sprite"
          )
        );
      }

      // Advance only the third NPC
      expect(npcs[2].getNextPhrase()).toBe("Phrase_2_0");
      expect(npcs[2].getNextPhrase()).toBe("Phrase_2_1");

      // All other NPCs should still be at their first phrase
      expect(npcs[0].getNextPhrase()).toBe("Phrase_0_0");
      expect(npcs[1].getNextPhrase()).toBe("Phrase_1_0");
      expect(npcs[3].getNextPhrase()).toBe("Phrase_3_0");
      expect(npcs[4].getNextPhrase()).toBe("Phrase_4_0");
    });
  });

  describe("Dialogue progression with multiple NPCs", () => {
    it("should allow interleaved interactions without interference", () => {
      const npcA = new Npc(
        scene,
        0,
        0,
        createNpcDto(1, "Guard", ["G1", "G2", "G3"]),
        "guard_sprite"
      );
      const npcB = new Npc(
        scene,
        100,
        100,
        createNpcDto(2, "Merchant", ["M1", "M2", "M3"]),
        "merchant_sprite"
      );

      // Interleave interactions
      expect(npcA.getNextPhrase()).toBe("G1");
      expect(npcB.getNextPhrase()).toBe("M1");
      expect(npcA.getNextPhrase()).toBe("G2");
      expect(npcB.getNextPhrase()).toBe("M2");
      expect(npcA.getNextPhrase()).toBe("G3");
      expect(npcB.getNextPhrase()).toBe("M3");
    });

    it("should restart dialogue independently per NPC after reaching the end", () => {
      const npcA = new Npc(
        scene,
        0,
        0,
        createNpcDto(1, "Guard", ["G1", "G2"]),
        "guard_sprite"
      );
      const npcB = new Npc(
        scene,
        100,
        100,
        createNpcDto(2, "Merchant", ["M1", "M2", "M3"]),
        "merchant_sprite"
      );

      // Exhaust NPC A's phrases (2 phrases)
      expect(npcA.getNextPhrase()).toBe("G1");
      expect(npcA.getNextPhrase()).toBe("G2");

      // NPC A should restart
      expect(npcA.getNextPhrase()).toBe("G1");

      // NPC B should still be progressing through its own sequence
      expect(npcB.getNextPhrase()).toBe("M1");
      expect(npcB.getNextPhrase()).toBe("M2");
      expect(npcB.getNextPhrase()).toBe("M3");

      // NPC B should restart independently
      expect(npcB.getNextPhrase()).toBe("M1");
    });

    it("should handle interact() method maintaining separate state", () => {
      const npcA = new Npc(
        scene,
        0,
        0,
        createNpcDto(1, "Guard", ["Hello!", "Goodbye!"]),
        "guard_sprite"
      );
      const npcB = new Npc(
        scene,
        100,
        100,
        createNpcDto(2, "Merchant", ["Welcome!", "Come again!"]),
        "merchant_sprite"
      );

      // Use interact() which internally calls getNextPhrase()
      expect(npcA.interact()).toBe("Hello!");
      expect(npcB.interact()).toBe("Welcome!");
      expect(npcA.interact()).toBe("Goodbye!");
      expect(npcB.interact()).toBe("Come again!");

      // Both restart independently
      expect(npcA.interact()).toBe("Hello!");
      expect(npcB.interact()).toBe("Welcome!");
    });
  });

  describe("Dialogue restart correctness per NPC", () => {
    it("should cycle through phrases repeatedly for a single NPC", () => {
      const npc = new Npc(
        scene,
        0,
        0,
        createNpcDto(1, "Guard", ["A", "B", "C"]),
        "guard_sprite"
      );

      // First cycle
      expect(npc.getNextPhrase()).toBe("A");
      expect(npc.getNextPhrase()).toBe("B");
      expect(npc.getNextPhrase()).toBe("C");

      // Second cycle
      expect(npc.getNextPhrase()).toBe("A");
      expect(npc.getNextPhrase()).toBe("B");
      expect(npc.getNextPhrase()).toBe("C");

      // Third cycle start
      expect(npc.getNextPhrase()).toBe("A");
    });

    it("should return null for NPC with no phrases", () => {
      const npc = new Npc(
        scene,
        0,
        0,
        createNpcDto(1, "Silent", []),
        "silent_sprite"
      );

      expect(npc.getNextPhrase()).toBeNull();
      expect(npc.interact()).toBeNull();
    });

    it("should always return the same phrase for NPC with single phrase", () => {
      const npc = new Npc(
        scene,
        0,
        0,
        createNpcDto(1, "Repeater", ["Only line"]),
        "repeater_sprite"
      );

      expect(npc.getNextPhrase()).toBe("Only line");
      expect(npc.getNextPhrase()).toBe("Only line");
      expect(npc.getNextPhrase()).toBe("Only line");
    });
  });
});
