import Phaser from "phaser";
import type { Npc } from "../entities/characters/Npc";

/**
 * InteractionIndicator — UI component that shows a visual "[E] Talk"
 * indicator above the nearest interactable NPC.
 *
 * This component is purely presentational. It does not execute
 * gameplay logic or communicate with the backend.
 */
export class InteractionIndicator {
  private readonly scene: Phaser.Scene;
  private readonly keyText: Phaser.GameObjects.Text;
  private readonly actionText: Phaser.GameObjects.Text;

  private static readonly DEPTH = 100;
  private static readonly KEY_OFFSET_Y = -30;
  private static readonly ACTION_OFFSET_Y = -18;
  private static readonly FONT_SIZE = "10px";
  private static readonly FONT_FAMILY = "monospace";
  private static readonly KEY_COLOR = "#ffffff";
  private static readonly ACTION_COLOR = "#ffdd57";

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.keyText = this.scene.add.text(0, 0, "[E]", {
      fontSize: InteractionIndicator.FONT_SIZE,
      fontFamily: InteractionIndicator.FONT_FAMILY,
      color: InteractionIndicator.KEY_COLOR,
    });
    this.keyText.setOrigin(0.5);
    this.keyText.setDepth(InteractionIndicator.DEPTH);
    this.keyText.setVisible(false);

    this.actionText = this.scene.add.text(0, 0, "Talk", {
      fontSize: InteractionIndicator.FONT_SIZE,
      fontFamily: InteractionIndicator.FONT_FAMILY,
      color: InteractionIndicator.ACTION_COLOR,
    });
    this.actionText.setOrigin(0.5);
    this.actionText.setDepth(InteractionIndicator.DEPTH);
    this.actionText.setVisible(false);
  }

  /**
   * Shows the indicator above the given NPC.
   * Positions the "[E]" and "Talk" texts centered above the NPC sprite.
   */
  show(npc: Npc): void {
    const x = npc.getX();
    const y = npc.getY();

    this.keyText.setPosition(x, y + InteractionIndicator.KEY_OFFSET_Y);
    this.keyText.setVisible(true);

    this.actionText.setPosition(x, y + InteractionIndicator.ACTION_OFFSET_Y);
    this.actionText.setVisible(true);
  }

  /**
   * Hides both text elements of the indicator.
   */
  hide(): void {
    this.keyText.setVisible(false);
    this.actionText.setVisible(false);
  }

  /**
   * Updates the indicator based on the current interactable NPC.
   * Shows above the NPC if one is provided, hides otherwise.
   */
  update(npc: Npc | null): void {
    if (npc) {
      this.show(npc);
    } else {
      this.hide();
    }
  }

  /**
   * Destroys the text elements and cleans up resources.
   */
  destroy(): void {
    this.keyText.destroy();
    this.actionText.destroy();
  }
}
