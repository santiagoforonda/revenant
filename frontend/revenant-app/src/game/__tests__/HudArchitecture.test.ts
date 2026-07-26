import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Architecture Compliance Tests for Game HUD (Task 8).
 *
 * Validates:
 * - The HUD never communicates directly with React.
 * - The HUD never communicates directly with backend services.
 * - The Event Bus is the only communication channel between Phaser and React.
 * - MainScene contains no HUD rendering logic.
 * - The HUD remains reusable by future gameplay features.
 */

const HUD_MANAGER_PATH = resolve(__dirname, "../ui/hud/HudManager.ts");
const MAIN_SCENE_PATH = resolve(__dirname, "../scenes/MainScene.ts");
const GAME_PAGE_PATH = resolve(__dirname, "../pages/GamePage.tsx");

const hudManagerSource = readFileSync(HUD_MANAGER_PATH, "utf-8");
const mainSceneSource = readFileSync(MAIN_SCENE_PATH, "utf-8");
const gamePageSource = readFileSync(GAME_PAGE_PATH, "utf-8");

/**
 * Extracts all import statements from a source string.
 */
function extractImports(source: string): string[] {
  return source.match(/^import\s+.*$/gm) || [];
}

describe("HUD Architecture Compliance", () => {
  describe("HUD never communicates directly with React", () => {
    const imports = extractImports(hudManagerSource);

    it("should not import from 'react' or 'react-dom'", () => {
      for (const stmt of imports) {
        expect(stmt).not.toMatch(/from\s+["']react["']/);
        expect(stmt).not.toMatch(/from\s+["']react-dom["']/);
      }
    });

    it("should not import runtime modules from @/auth (store, services)", () => {
      for (const stmt of imports) {
        expect(stmt).not.toMatch(/from\s+["']@\/auth\/store/);
        expect(stmt).not.toMatch(/from\s+["']@\/auth\/services/);
      }
    });

    it("should only import types (not runtime values) from @/auth", () => {
      const authImports = imports.filter((stmt) => stmt.includes("@/auth"));
      for (const stmt of authImports) {
        // Every @/auth import must be a type-only import
        expect(stmt).toMatch(/^import\s+type\s+/);
      }
    });

    it("should not contain React hooks or JSX", () => {
      expect(hudManagerSource).not.toMatch(/\buseState\b/);
      expect(hudManagerSource).not.toMatch(/\buseEffect\b/);
      expect(hudManagerSource).not.toMatch(/\buseRef\b/);
      expect(hudManagerSource).not.toMatch(/\buseCallback\b/);
      expect(hudManagerSource).not.toMatch(/\bJSX\b/);
      expect(hudManagerSource).not.toMatch(/<\w+[^>]*\/>/); // Self-closing JSX
    });
  });

  describe("HUD never communicates directly with backend services", () => {
    it("should not import axios", () => {
      expect(hudManagerSource).not.toMatch(/import\s+.*from\s+["']axios["']/);
      expect(hudManagerSource).not.toMatch(/\baxios\./);
    });

    it("should not use fetch()", () => {
      expect(hudManagerSource).not.toMatch(/\bfetch\s*\(/);
    });

    it("should not use XMLHttpRequest", () => {
      expect(hudManagerSource).not.toMatch(/\bXMLHttpRequest\b/);
    });

    it("should not import API or HTTP service modules", () => {
      const imports = extractImports(hudManagerSource);
      for (const stmt of imports) {
        expect(stmt).not.toMatch(/from\s+["'].*[Aa]pi/);
        expect(stmt).not.toMatch(/from\s+["'].*[Hh]ttp/);
        expect(stmt).not.toMatch(/from\s+["']@\/api/);
      }
    });

    it("should not contain HTTP method calls", () => {
      expect(hudManagerSource).not.toMatch(/\.get\s*\(\s*["'`]https?:/);
      expect(hudManagerSource).not.toMatch(/\.post\s*\(\s*["'`]https?:/);
      expect(hudManagerSource).not.toMatch(/\.put\s*\(\s*["'`]https?:/);
      expect(hudManagerSource).not.toMatch(/\.delete\s*\(\s*["'`]https?:/);
    });
  });

  describe("Event Bus is the only communication channel between Phaser and React", () => {
    it("should only import from allowed modules in HudManager", () => {
      const imports = extractImports(hudManagerSource);
      const allowedPatterns = [
        /from\s+["']phaser["']/, // Phaser library
        /from\s+["']@\/auth\/interfaces\/auth-response["']/, // Type-only interface
        /from\s+["']@\/game\/events\/event-bus["']/, // Event Bus
        /from\s+["']@\/game\/events\/event-bus\.types["']/, // Event Bus types
      ];

      for (const stmt of imports) {
        const matchesAllowed = allowedPatterns.some((pattern) =>
          pattern.test(stmt)
        );
        expect(matchesAllowed).toBe(true);
      }
    });

    it("should use eventBus for emitting events (not direct React calls)", () => {
      // HudManager should reference eventBus for communication
      expect(hudManagerSource).toContain("eventBus.emit");
      expect(hudManagerSource).toContain("eventBus.on");
    });

    it("should communicate with game only through eventBus in GamePage", () => {
      // GamePage should use eventBus for communication with Phaser
      expect(gamePageSource).toContain("eventBus.on");
      expect(gamePageSource).toContain("eventBus.emit");
    });

    it("should not import Phaser internals in GamePage (except game instance creation)", () => {
      // GamePage imports Phaser only for creating the Game instance — that's allowed
      // But it should NOT import HudManager or other game UI modules
      expect(gamePageSource).not.toMatch(/import.*HudManager/);
      expect(gamePageSource).not.toMatch(/import.*from\s+["'].*\/ui\/hud/);
    });

    it("should not directly call Phaser scene methods from GamePage", () => {
      // GamePage should not call scene.add, scene.create, etc.
      expect(gamePageSource).not.toMatch(/\.scene\.add\.text\(/);
      expect(gamePageSource).not.toMatch(/\.scene\.add\.rectangle\(/);
      expect(gamePageSource).not.toMatch(/\.scene\.add\.container\(/);
    });
  });

  describe("MainScene contains no HUD rendering logic", () => {
    it("should not contain add.text() calls for HUD purposes", () => {
      // MainScene should delegate all text creation to HudManager
      // It should NOT create HUD text elements directly
      expect(mainSceneSource).not.toMatch(/this\.add\.text\(/);
    });

    it("should not contain HUD layout constants", () => {
      // Layout constants like PADDING, BAR_WIDTH, etc. belong in HudManager
      expect(mainSceneSource).not.toMatch(/HUD_PADDING/);
      expect(mainSceneSource).not.toMatch(/BAR_WIDTH/);
      expect(mainSceneSource).not.toMatch(/BAR_HEIGHT/);
      expect(mainSceneSource).not.toMatch(/FONT_SIZE.*=.*["']\d+px["']/);
    });

    it("should not create or style HUD elements directly", () => {
      // MainScene should not create rectangles for health/exp bars
      expect(mainSceneSource).not.toMatch(/this\.add\.rectangle\(/);
      // Should not set colors for HUD bars
      expect(mainSceneSource).not.toMatch(/setFillStyle/);
      expect(mainSceneSource).not.toMatch(/healthBar/);
      expect(mainSceneSource).not.toMatch(/expBar/);
    });

    it("should only create HudManager and delegate to it", () => {
      // MainScene should contain HudManager instantiation
      expect(mainSceneSource).toContain("new HudManager");
      // MainScene should call hudManager.update()
      expect(mainSceneSource).toContain("hudManager.update()");
    });

    it("should import HudManager from the hud module", () => {
      expect(mainSceneSource).toMatch(/import\s+.*HudManager.*from/);
    });
  });

  describe("HUD remains reusable by future gameplay features", () => {
    it("should expose setPlayerData as a public method", () => {
      expect(hudManagerSource).toMatch(/\bsetPlayerData\s*\(/);
      // Should NOT be private or protected
      expect(hudManagerSource).not.toMatch(/private\s+setPlayerData/);
      expect(hudManagerSource).not.toMatch(/protected\s+setPlayerData/);
    });

    it("should expose setHealth as a public method", () => {
      expect(hudManagerSource).toMatch(/\bsetHealth\s*\(/);
      expect(hudManagerSource).not.toMatch(/private\s+setHealth/);
      expect(hudManagerSource).not.toMatch(/protected\s+setHealth/);
    });

    it("should expose setExperience as a public method", () => {
      expect(hudManagerSource).toMatch(/\bsetExperience\s*\(/);
      expect(hudManagerSource).not.toMatch(/private\s+setExperience/);
      expect(hudManagerSource).not.toMatch(/protected\s+setExperience/);
    });

    it("should expose setGold as a public method", () => {
      expect(hudManagerSource).toMatch(/\bsetGold\s*\(/);
      expect(hudManagerSource).not.toMatch(/private\s+setGold/);
      expect(hudManagerSource).not.toMatch(/protected\s+setGold/);
    });

    it("should expose setLevel as a public method", () => {
      expect(hudManagerSource).toMatch(/\bsetLevel\s*\(/);
      expect(hudManagerSource).not.toMatch(/private\s+setLevel/);
      expect(hudManagerSource).not.toMatch(/protected\s+setLevel/);
    });

    it("should expose update as a public method", () => {
      expect(hudManagerSource).toMatch(/\bupdate\s*\(\s*\)\s*:\s*void/);
      // Ensure the public update() method is not declared private or protected
      expect(hudManagerSource).not.toMatch(/private\s+update\s*\(/);
      expect(hudManagerSource).not.toMatch(/protected\s+update\s*\(/);
    });

    it("should expose destroy as a public method for cleanup", () => {
      expect(hudManagerSource).toMatch(/\bdestroy\s*\(\s*\)\s*:\s*void/);
      expect(hudManagerSource).not.toMatch(/private\s+destroy/);
      expect(hudManagerSource).not.toMatch(/protected\s+destroy/);
    });

    it("should expose getLogoutButton as a public method", () => {
      expect(hudManagerSource).toMatch(/\bgetLogoutButton\s*\(/);
      expect(hudManagerSource).not.toMatch(/private\s+getLogoutButton/);
      expect(hudManagerSource).not.toMatch(/protected\s+getLogoutButton/);
    });

    it("should accept any Phaser.Scene (not tied to MainScene specifically)", () => {
      // Constructor should accept Phaser.Scene, not MainScene
      expect(hudManagerSource).toMatch(/constructor\s*\(\s*scene\s*:\s*Phaser\.Scene\s*\)/);
      // Should not import MainScene
      expect(hudManagerSource).not.toMatch(/import.*MainScene/);
    });

    it("should clean up event subscriptions in destroy()", () => {
      // The destroy method should call eventBus.off to unsubscribe
      expect(hudManagerSource).toContain("eventBus.off");
    });
  });
});
