import Phaser from "phaser";
import { eventBus } from "@/game/events/event-bus";
import type { NpcDialoguePayload } from "@/game/events/event-bus.types";

/**
 * DialogWindow — UI component that displays NPC dialogue text at the bottom
 * of the screen when the player interacts with an NPC.
 *
 * This component is purely presentational. It does not execute gameplay logic,
 * manage dialogue progression, or communicate with the backend.
 *
 * Listens to the NPC_DIALOGUE event from the EventBus and renders the
 * NPC name and phrase in a fixed-position panel.
 *
 * Uses a dedicated camera (no zoom, no scroll) to ensure the dialog renders
 * at a fixed screen position regardless of the main camera's zoom and scroll.
 */
export class DialogWindow {
  private readonly scene: Phaser.Scene;

  private background: Phaser.GameObjects.Rectangle;
  private npcNameText: Phaser.GameObjects.Text;
  private phraseText: Phaser.GameObjects.Text;
  private dialogCamera: Phaser.Cameras.Scene2D.Camera;
  private dialogElements: Phaser.GameObjects.GameObject[] = [];
  private onObjectAdded: (gameObject: Phaser.GameObjects.GameObject) => void;

  private hideTimer: Phaser.Time.TimerEvent | null = null;

  private static readonly DEPTH = 200;
  private static readonly BG_HEIGHT = 60;
  private static readonly BG_ALPHA = 0.8;
  private static readonly BG_COLOR = 0x000000;
  private static readonly NPC_NAME_FONT_SIZE = "12px";
  private static readonly PHRASE_FONT_SIZE = "11px";
  private static readonly FONT_FAMILY = "monospace";
  private static readonly NPC_NAME_COLOR = "#ffdd57";
  private static readonly PHRASE_COLOR = "#ffffff";
  private static readonly AUTO_HIDE_DELAY = 12000;
  private static readonly PADDING_X = 12;
  private static readonly NAME_OFFSET_Y = 10;
  private static readonly PHRASE_OFFSET_Y = 28;

  // Bound listener for proper cleanup
  private readonly onNpcDialogue = (data: NpcDialoguePayload): void => {
    this.handleDialogue(data);
  };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const gameWidth = this.scene.scale.width;
    const gameHeight = this.scene.scale.height;

    // Create a dedicated dialog camera — no zoom, no scroll.
    // This ensures the dialog renders at fixed screen position regardless
    // of the main camera's zoom (1.3) and scroll (following player).
    this.dialogCamera = this.scene.cameras.add(0, 0, undefined, undefined, false, "dialogCamera");
    this.dialogCamera.setScroll(0, 0);
    this.dialogCamera.setZoom(1);

    // Background rectangle at the bottom of the screen
    this.background = this.scene.add.rectangle(
      gameWidth / 2,
      gameHeight - DialogWindow.BG_HEIGHT / 2,
      gameWidth,
      DialogWindow.BG_HEIGHT,
      DialogWindow.BG_COLOR,
      DialogWindow.BG_ALPHA
    );
    this.background.setDepth(DialogWindow.DEPTH);
    this.background.setVisible(false);

    // NPC name text
    this.npcNameText = this.scene.add.text(
      DialogWindow.PADDING_X,
      gameHeight - DialogWindow.BG_HEIGHT + DialogWindow.NAME_OFFSET_Y,
      "",
      {
        fontSize: DialogWindow.NPC_NAME_FONT_SIZE,
        fontFamily: DialogWindow.FONT_FAMILY,
        color: DialogWindow.NPC_NAME_COLOR,
      }
    );
    this.npcNameText.setDepth(DialogWindow.DEPTH);
    this.npcNameText.setVisible(false);

    // Phrase text
    this.phraseText = this.scene.add.text(
      DialogWindow.PADDING_X,
      gameHeight - DialogWindow.BG_HEIGHT + DialogWindow.PHRASE_OFFSET_Y,
      "",
      {
        fontSize: DialogWindow.PHRASE_FONT_SIZE,
        fontFamily: DialogWindow.FONT_FAMILY,
        color: DialogWindow.PHRASE_COLOR,
        wordWrap: { width: gameWidth - DialogWindow.PADDING_X * 2 },
      }
    );
    this.phraseText.setDepth(DialogWindow.DEPTH);
    this.phraseText.setVisible(false);

    // Collect dialog elements for camera management
    this.dialogElements = [this.background, this.npcNameText, this.phraseText];

    // Main camera ignores dialog elements (they are rendered by dialogCamera only)
    this.scene.cameras.main.ignore(this.dialogElements);

    // Dialog camera ignores all existing scene objects EXCEPT dialog elements
    const nonDialogElements = this.scene.children.list.filter(
      (child) => !this.dialogElements.includes(child)
    );
    if (nonDialogElements.length > 0) {
      this.dialogCamera.ignore(nonDialogElements);
    }

    // Any new game object added after this point should be ignored by dialogCamera
    this.onObjectAdded = (gameObject: Phaser.GameObjects.GameObject) => {
      if (!this.dialogElements.includes(gameObject)) {
        this.dialogCamera.ignore(gameObject);
      }
    };
    this.scene.events.on("addedtoscene", this.onObjectAdded);

    // Subscribe to NPC dialogue events
    eventBus.on("NPC_DIALOGUE", this.onNpcDialogue);
  }

  /**
   * Handles incoming NPC_DIALOGUE events.
   * Shows the dialog panel when a phrase is provided, hides otherwise.
   */
  private handleDialogue(data: NpcDialoguePayload): void {
    if (data.phrase === null) {
      this.hide();
      return;
    }

    this.show(data.npcName, data.phrase);
  }

  /**
   * Shows the dialog window with the given NPC name and phrase.
   * Resets the auto-hide timer on each new interaction.
   */
  private show(npcName: string, phrase: string): void {
    this.npcNameText.setText(npcName);
    this.phraseText.setText(phrase);

    this.background.setVisible(true);
    this.npcNameText.setVisible(true);
    this.phraseText.setVisible(true);

    this.resetHideTimer();
  }

  /**
   * Hides the dialog window and cancels any pending auto-hide timer.
   */
  private hide(): void {
    this.background.setVisible(false);
    this.npcNameText.setVisible(false);
    this.phraseText.setVisible(false);

    this.cancelHideTimer();
  }

  /**
   * Resets the auto-hide timer. The dialog will hide after AUTO_HIDE_DELAY ms
   * unless a new dialogue event arrives first.
   */
  private resetHideTimer(): void {
    this.cancelHideTimer();

    this.hideTimer = this.scene.time.delayedCall(
      DialogWindow.AUTO_HIDE_DELAY,
      () => {
        this.hide();
      }
    );
  }

  /**
   * Cancels the current auto-hide timer if one exists.
   */
  private cancelHideTimer(): void {
    if (this.hideTimer) {
      this.hideTimer.destroy();
      this.hideTimer = null;
    }
  }

  /**
   * Destroys all dialog elements and unsubscribes from the EventBus.
   */
  destroy(): void {
    eventBus.off("NPC_DIALOGUE", this.onNpcDialogue);
    this.scene.events.off("addedtoscene", this.onObjectAdded);
    this.cancelHideTimer();
    this.background.destroy();
    this.npcNameText.destroy();
    this.phraseText.destroy();
    this.scene.cameras.remove(this.dialogCamera);
    this.dialogElements = [];
  }
}
