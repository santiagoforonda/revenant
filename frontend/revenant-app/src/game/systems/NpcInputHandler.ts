import Phaser from "phaser";

/**
 * NpcInputHandler registers and monitors the interaction key (E).
 *
 * Responsibilities:
 * - Register the E key.
 * - Detect single-press interaction requests.
 *
 * This handler does NOT:
 * - Validate interaction radius (that's the system's job).
 * - Trigger NPC interaction directly.
 * - Render UI.
 */
export class NpcInputHandler {
  private readonly eKey: Phaser.Input.Keyboard.Key;

  constructor(scene: Phaser.Scene) {
    this.eKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  /**
   * Returns true if the E key was just pressed this frame (single press, not held).
   */
  isInteractPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.eKey);
  }

  /**
   * Cleans up the registered key.
   */
  destroy(): void {
    this.eKey.destroy();
  }
}
