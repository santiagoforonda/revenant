import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HudManager } from "@/game/ui/hud/HudManager";
import { eventBus } from "@/game/events/event-bus";
import type { LoginResponse } from "@/auth/interfaces/auth-response";

/**
 * Unit tests for HudManager (Task 7).
 *
 * Validates:
 * - HUD remains fixed during camera movement (scrollFactor = 0).
 * - Username, class, level, and gold are displayed correctly.
 * - Health Bar updates correctly.
 * - Experience Bar updates correctly.
 * - Logout button emits the expected event.
 */

// --- Mock Phaser Scene ---

interface MockText {
  setText: ReturnType<typeof vi.fn>;
  setInteractive: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  setColor: ReturnType<typeof vi.fn>;
  text: string;
  _listeners: Record<string, (() => void)[]>;
}

interface MockRectangle {
  setSize: ReturnType<typeof vi.fn>;
  setPosition: ReturnType<typeof vi.fn>;
  setFillStyle: ReturnType<typeof vi.fn>;
  y: number;
  _width: number;
  _height: number;
  _fillColor: number;
}

interface MockContainer {
  setScrollFactor: ReturnType<typeof vi.fn>;
  setDepth: ReturnType<typeof vi.fn>;
  add: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  _scrollFactor: number;
}

function createMockText(): MockText {
  const mockText: MockText = {
    setText: vi.fn().mockImplementation(function (this: MockText, value: string) {
      this.text = value;
      return this;
    }),
    setInteractive: vi.fn().mockReturnThis(),
    on: vi.fn().mockImplementation(function (this: MockText, event: string, callback: () => void) {
      if (!this._listeners[event]) {
        this._listeners[event] = [];
      }
      this._listeners[event].push(callback);
      return this;
    }),
    setColor: vi.fn().mockReturnThis(),
    text: "",
    _listeners: {},
  };
  // Bind implementations to the mock instance
  mockText.setText = vi.fn().mockImplementation((value: string) => {
    mockText.text = value;
    return mockText;
  });
  mockText.on = vi.fn().mockImplementation((event: string, callback: () => void) => {
    if (!mockText._listeners[event]) {
      mockText._listeners[event] = [];
    }
    mockText._listeners[event].push(callback);
    return mockText;
  });
  mockText.setInteractive = vi.fn().mockReturnValue(mockText);
  mockText.setColor = vi.fn().mockReturnValue(mockText);
  return mockText;
}

function createMockRectangle(x: number, y: number, _width: number, _height: number, fillColor: number): MockRectangle {
  const rect: MockRectangle = {
    setSize: vi.fn().mockImplementation((w: number, h: number) => {
      rect._width = w;
      rect._height = h;
      return rect;
    }),
    setPosition: vi.fn().mockReturnThis(),
    setFillStyle: vi.fn().mockImplementation((color: number) => {
      rect._fillColor = color;
      return rect;
    }),
    y,
    _width,
    _height,
    _fillColor: fillColor,
  };
  rect.setSize = vi.fn().mockImplementation((w: number, h: number) => {
    rect._width = w;
    rect._height = h;
    return rect;
  });
  rect.setPosition = vi.fn().mockReturnValue(rect);
  rect.setFillStyle = vi.fn().mockImplementation((color: number) => {
    rect._fillColor = color;
    return rect;
  });
  return rect;
}

interface MockScene {
  add: {
    text: ReturnType<typeof vi.fn>;
    container: ReturnType<typeof vi.fn>;
    rectangle: ReturnType<typeof vi.fn>;
  };
  _texts: MockText[];
  _rectangles: MockRectangle[];
  _container: MockContainer;
}

function createMockScene(): MockScene {
  const texts: MockText[] = [];
  const rectangles: MockRectangle[] = [];

  const container: MockContainer = {
    setScrollFactor: vi.fn().mockImplementation((factor: number) => {
      container._scrollFactor = factor;
      return container;
    }),
    setDepth: vi.fn().mockReturnThis(),
    add: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    _scrollFactor: 1,
  };
  container.setScrollFactor = vi.fn().mockImplementation((factor: number) => {
    container._scrollFactor = factor;
    return container;
  });
  container.setDepth = vi.fn().mockReturnValue(container);
  container.add = vi.fn().mockReturnValue(container);

  const scene: MockScene = {
    add: {
      text: vi.fn().mockImplementation((_x: number, _y: number, content: string) => {
        const text = createMockText();
        text.text = content;
        texts.push(text);
        return text;
      }),
      container: vi.fn().mockReturnValue(container),
      rectangle: vi.fn().mockImplementation((x: number, y: number, w: number, h: number, color: number) => {
        const rect = createMockRectangle(x, y, w, h, color);
        rectangles.push(rect);
        return rect;
      }),
    },
    _texts: texts,
    _rectangles: rectangles,
    _container: container,
  };

  return scene;
}

function createTestLoginResponse(): LoginResponse {
  return {
    token: "test-token",
    tokenType: "Bearer",
    username: "TestPlayer",
    mapId: 1,
    posX: 100,
    posY: 200,
    healthPoints: 80,
    strongPoints: 10,
    speedAttackPoints: 5,
    gold: 500,
    level: 7,
    experience: 45,
    typePlayer: "CABALLERO",
    inventory: [],
  };
}

describe("HudManager", () => {
  let mockScene: MockScene;
  let hudManager: HudManager;

  beforeEach(() => {
    vi.clearAllMocks();
    eventBus.removeAllListeners();
    mockScene = createMockScene();
    hudManager = new HudManager(mockScene as unknown as Phaser.Scene);
  });

  afterEach(() => {
    hudManager.destroy();
    eventBus.removeAllListeners();
  });

  describe("HUD remains fixed during camera movement", () => {
    it("should set scrollFactor to 0 on the container", () => {
      // The container's setScrollFactor should have been called with 0
      // to ensure the HUD does not move with the camera.
      expect(mockScene._container.setScrollFactor).toHaveBeenCalledWith(0);
    });

    it("should have a scrollFactor value of 0 after initialization", () => {
      expect(mockScene._container._scrollFactor).toBe(0);
    });
  });

  describe("Username, class, level, and gold are displayed correctly", () => {
    it("should display the username from player data", () => {
      const data = createTestLoginResponse();
      hudManager.setPlayerData(data);

      const usernameText = mockScene._texts[0]; // First text created = username
      expect(usernameText.setText).toHaveBeenCalledWith("TestPlayer");
    });

    it("should display the player class formatted as title case", () => {
      const data = createTestLoginResponse();
      hudManager.setPlayerData(data);

      const classText = mockScene._texts[1]; // Second text = class
      expect(classText.setText).toHaveBeenCalledWith("Caballero");
    });

    it("should display the player level with 'Lv.' prefix", () => {
      const data = createTestLoginResponse();
      hudManager.setPlayerData(data);

      const levelText = mockScene._texts[2]; // Third text = level
      expect(levelText.setText).toHaveBeenCalledWith("Lv. 7");
    });

    it("should display the player gold with 'Gold:' prefix", () => {
      const data = createTestLoginResponse();
      hudManager.setPlayerData(data);

      const goldText = mockScene._texts[3]; // Fourth text = gold
      expect(goldText.setText).toHaveBeenCalledWith("Gold: 500");
    });

    it("should display all player types correctly", () => {
      const data = createTestLoginResponse();
      data.typePlayer = "MAGO";
      hudManager.setPlayerData(data);

      const classText = mockScene._texts[1];
      expect(classText.setText).toHaveBeenCalledWith("Mago");
    });
  });

  describe("Health Bar updates correctly", () => {
    it("should update health bar fill to 50% width when health is 50/100", () => {
      hudManager.setHealth(50, 100);

      // The health bar fill is the 2nd rectangle (index 1): bg=0, fill=1
      const healthFill = mockScene._rectangles[1];
      // BAR_WIDTH = 80, 50% = 40
      expect(healthFill.setSize).toHaveBeenCalledWith(40, 8);
    });

    it("should display empty state when health is 0/100", () => {
      hudManager.setHealth(0, 100);

      const healthFill = mockScene._rectangles[1];
      expect(healthFill.setSize).toHaveBeenCalledWith(0, 8);
    });

    it("should change to low-health color when health is at or below 25%", () => {
      hudManager.setHealth(25, 100);

      const healthFill = mockScene._rectangles[1];
      // LOW_HEALTH_THRESHOLD = 0.25, COLOR_HEALTH_LOW = 0xcc0000
      expect(healthFill.setFillStyle).toHaveBeenCalledWith(0xcc0000);
    });

    it("should use normal health color when above 25%", () => {
      hudManager.setHealth(50, 100);

      const healthFill = mockScene._rectangles[1];
      // COLOR_HEALTH_OK = 0x00cc00
      expect(healthFill.setFillStyle).toHaveBeenCalledWith(0x00cc00);
    });

    it("should update the health value text display", () => {
      hudManager.setHealth(50, 100);

      // Health value text is the 5th text (index 4): username=0, class=1, level=2, gold=3, healthLabel=4, healthValue=5
      const healthValueText = mockScene._texts[5];
      expect(healthValueText.setText).toHaveBeenCalledWith("50/100");
    });

    it("should clamp health ratio to max 1 when current exceeds max", () => {
      hudManager.setHealth(150, 100);

      const healthFill = mockScene._rectangles[1];
      // Clamped to 1, so width = 80 * 1 = 80
      expect(healthFill.setSize).toHaveBeenCalledWith(80, 8);
    });
  });

  describe("Experience Bar updates correctly", () => {
    it("should update experience bar fill to 75% width when experience is 75/100", () => {
      hudManager.setExperience(75, 100);

      // The experience bar fill is the 4th rectangle (index 3): healthBg=0, healthFill=1, expBg=2, expFill=3
      const expFill = mockScene._rectangles[3];
      // BAR_WIDTH = 80, 75% = 60
      expect(expFill.setSize).toHaveBeenCalledWith(60, 8);
    });

    it("should update the experience value text display", () => {
      hudManager.setExperience(75, 100);

      // Exp value text is the 8th text (index 7): username=0, class=1, level=2, gold=3, healthLabel=4, healthValue=5, expLabel=6, expValue=7
      const expValueText = mockScene._texts[7];
      expect(expValueText.setText).toHaveBeenCalledWith("75/100");
    });

    it("should display empty state when experience is 0", () => {
      hudManager.setExperience(0, 100);

      const expFill = mockScene._rectangles[3];
      expect(expFill.setSize).toHaveBeenCalledWith(0, 8);
    });

    it("should display full bar when experience equals max", () => {
      hudManager.setExperience(100, 100);

      const expFill = mockScene._rectangles[3];
      expect(expFill.setSize).toHaveBeenCalledWith(80, 8);
    });
  });

  describe("Logout button emits expected event", () => {
    it("should emit LOGOUT_REQUESTED when the logout button is clicked", () => {
      const emitSpy = vi.spyOn(eventBus, "emit");

      // The logout button is the last text element (index 8)
      const logoutButton = mockScene._texts[8];

      // Simulate pointer down event
      const pointerdownListeners = logoutButton._listeners["pointerdown"];
      expect(pointerdownListeners).toBeDefined();
      expect(pointerdownListeners.length).toBeGreaterThan(0);

      pointerdownListeners[0]();

      expect(emitSpy).toHaveBeenCalledWith("LOGOUT_REQUESTED");
    });

    it("should register the logout button as interactive", () => {
      const logoutButton = mockScene._texts[8];
      expect(logoutButton.setInteractive).toHaveBeenCalled();
    });

    it("should register a pointerdown listener on the logout button", () => {
      const logoutButton = mockScene._texts[8];
      expect(logoutButton.on).toHaveBeenCalledWith("pointerdown", expect.any(Function));
    });
  });
});
