import { describe, it, expect, vi, beforeEach } from "vitest";
import { Npc } from "./Npc";
import type { NpcDto } from "../../interfaces/NpcResponse";

/**
 * Creates a minimal mock Phaser.Scene for testing purposes.
 */
function createMockScene() {
  return {
    textures: {
      exists: vi.fn().mockReturnValue(true),
    },
    add: {
      sprite: vi.fn().mockReturnValue({
        setDepth: vi.fn().mockReturnThis(),
        setScale: vi.fn().mockReturnThis(),
        play: vi.fn(),
        x: 100,
        y: 200,
      }),
    },
    anims: {
      exists: vi.fn().mockReturnValue(false),
    },
  } as unknown as Phaser.Scene;
}

function createNpcData(phrases: string[]): NpcDto {
  return {
    id: 1,
    id_map: 1,
    name: "Test NPC",
    description: "A test NPC",
    phrases,
  };
}

describe("Npc - Dialogue Progression", () => {
  let scene: Phaser.Scene;

  beforeEach(() => {
    scene = createMockScene();
  });

  describe("getNextPhrase()", () => {
    it("should return null when NPC has no phrases", () => {
      const npc = new Npc(scene, 0, 0, createNpcData([]), "sprite");

      expect(npc.getNextPhrase()).toBeNull();
    });

    it("should return the first phrase on first call", () => {
      const npc = new Npc(scene, 0, 0, createNpcData(["Hello", "Goodbye"]), "sprite");

      expect(npc.getNextPhrase()).toBe("Hello");
    });

    it("should advance to the next phrase on subsequent calls", () => {
      const npc = new Npc(scene, 0, 0, createNpcData(["A", "B", "C"]), "sprite");

      expect(npc.getNextPhrase()).toBe("A");
      expect(npc.getNextPhrase()).toBe("B");
      expect(npc.getNextPhrase()).toBe("C");
    });

    it("should cycle back to the first phrase after the last", () => {
      const npc = new Npc(scene, 0, 0, createNpcData(["A", "B"]), "sprite");

      expect(npc.getNextPhrase()).toBe("A");
      expect(npc.getNextPhrase()).toBe("B");
      expect(npc.getNextPhrase()).toBe("A");
    });

    it("should always return the same phrase when only one exists", () => {
      const npc = new Npc(scene, 0, 0, createNpcData(["Only"]), "sprite");

      expect(npc.getNextPhrase()).toBe("Only");
      expect(npc.getNextPhrase()).toBe("Only");
      expect(npc.getNextPhrase()).toBe("Only");
    });
  });

  describe("interact()", () => {
    it("should return null when NPC has no phrases", () => {
      const npc = new Npc(scene, 0, 0, createNpcData([]), "sprite");

      expect(npc.interact()).toBeNull();
    });

    it("should return the next phrase via interact()", () => {
      const npc = new Npc(scene, 0, 0, createNpcData(["Hi", "Bye"]), "sprite");

      expect(npc.interact()).toBe("Hi");
      expect(npc.interact()).toBe("Bye");
    });

    it("should cycle dialogue through interact()", () => {
      const npc = new Npc(scene, 0, 0, createNpcData(["X", "Y"]), "sprite");

      expect(npc.interact()).toBe("X");
      expect(npc.interact()).toBe("Y");
      expect(npc.interact()).toBe("X");
    });
  });

  describe("getCurrentPhraseIndex()", () => {
    it("should start at 0", () => {
      const npc = new Npc(scene, 0, 0, createNpcData(["A", "B"]), "sprite");

      expect(npc.getCurrentPhraseIndex()).toBe(0);
    });

    it("should advance after getNextPhrase()", () => {
      const npc = new Npc(scene, 0, 0, createNpcData(["A", "B", "C"]), "sprite");

      npc.getNextPhrase();
      expect(npc.getCurrentPhraseIndex()).toBe(1);

      npc.getNextPhrase();
      expect(npc.getCurrentPhraseIndex()).toBe(2);
    });

    it("should reset to 0 after cycling past the last phrase", () => {
      const npc = new Npc(scene, 0, 0, createNpcData(["A", "B"]), "sprite");

      npc.getNextPhrase(); // index -> 1
      npc.getNextPhrase(); // index -> 0 (cycled)
      expect(npc.getCurrentPhraseIndex()).toBe(0);
    });

    it("should remain 0 when NPC has no phrases", () => {
      const npc = new Npc(scene, 0, 0, createNpcData([]), "sprite");

      npc.getNextPhrase();
      expect(npc.getCurrentPhraseIndex()).toBe(0);
    });
  });

  describe("Error Handling - Invalid Dialogue Index", () => {
    it("should reset to 0 and return the first phrase when index is negative", () => {
      const npc = new Npc(scene, 0, 0, createNpcData(["A", "B", "C"]), "sprite");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Force an invalid negative index
      (npc as unknown as { currentPhraseIndex: number }).currentPhraseIndex = -5;

      const phrase = npc.getNextPhrase();
      expect(phrase).toBe("A");
      expect(npc.getCurrentPhraseIndex()).toBe(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid dialogue index -5")
      );

      warnSpy.mockRestore();
    });

    it("should reset to 0 and return the first phrase when index exceeds phrases length", () => {
      const npc = new Npc(scene, 0, 0, createNpcData(["A", "B"]), "sprite");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Force an out-of-bounds index
      (npc as unknown as { currentPhraseIndex: number }).currentPhraseIndex = 99;

      const phrase = npc.getNextPhrase();
      expect(phrase).toBe("A");
      expect(npc.getCurrentPhraseIndex()).toBe(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid dialogue index 99")
      );

      warnSpy.mockRestore();
    });

    it("should reset to 0 and return the first phrase when index is NaN", () => {
      const npc = new Npc(scene, 0, 0, createNpcData(["X", "Y"]), "sprite");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Force NaN index
      (npc as unknown as { currentPhraseIndex: number }).currentPhraseIndex = NaN;

      const phrase = npc.getNextPhrase();
      expect(phrase).toBe("X");
      expect(npc.getCurrentPhraseIndex()).toBe(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid dialogue index NaN")
      );

      warnSpy.mockRestore();
    });

    it("should reset to 0 and return the first phrase when index is Infinity", () => {
      const npc = new Npc(scene, 0, 0, createNpcData(["Hello"]), "sprite");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Force Infinity index
      (npc as unknown as { currentPhraseIndex: number }).currentPhraseIndex = Infinity;

      const phrase = npc.getNextPhrase();
      expect(phrase).toBe("Hello");
      expect(npc.getCurrentPhraseIndex()).toBe(0); // (0 + 1) % 1 = 0
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Invalid dialogue index Infinity")
      );

      warnSpy.mockRestore();
    });

    it("should not log a warning when index is valid", () => {
      const npc = new Npc(scene, 0, 0, createNpcData(["A", "B"]), "sprite");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      npc.getNextPhrase();
      expect(warnSpy).not.toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });
});
