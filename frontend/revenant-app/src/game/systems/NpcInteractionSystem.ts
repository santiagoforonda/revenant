import { Player } from "@/game/entities/characters/Player";
import { Npc } from "@/game/entities/characters/Npc";

/**
 * Interaction radius in pixels.
 * An NPC is considered interactable only when the player is within this distance.
 */
export const INTERACTION_RADIUS = 40;

/**
 * NpcInteractionSystem is responsible for detecting nearby NPCs and selecting
 * the nearest interactable NPC based on the player's current position.
 *
 * Responsibilities:
 * - Execute every update cycle.
 * - Calculate the Euclidean distance between the player and each NPC.
 * - Determine the nearest NPC within the interaction radius.
 * - Expose the currently selected NPC (or null if none in range).
 *
 * This system follows the Single Responsibility Principle:
 * it manages ONLY proximity detection and NPC selection.
 * It does NOT render UI, handle input, or communicate with the backend.
 *
 * Designed to be consumed by other systems (InteractionIndicator, KeyboardInput)
 * that react to the selected NPC state.
 */
export class NpcInteractionSystem {
  private readonly player: Player;
  private readonly npcs: Npc[];
  private selectedNpc: Npc | null;
  private distanceToSelected: number;

  /**
   * Creates the NpcInteractionSystem.
   *
   * @param player - The player entity whose position is evaluated.
   * @param npcs - The collection of NPCs to evaluate proximity against.
   */
  constructor(player: Player, npcs: Npc[]) {
    this.player = player;
    this.npcs = npcs;
    this.selectedNpc = null;
    this.distanceToSelected = Infinity;
  }

  /**
   * Updates the interaction system.
   *
   * Called every frame by the scene update loop.
   * Evaluates the distance between the player and each NPC,
   * selects the nearest NPC within the interaction radius,
   * and updates the internal selection state.
   *
   * If no NPC is within range, the selection is cleared.
   */
  update(): void {
    let nearestNpc: Npc | null = null;
    let nearestDistance = Infinity;

    for (const npc of this.npcs) {
      const distance = this.calculateDistance(npc);
      const radius = npc.getInteractionRadius() ?? INTERACTION_RADIUS;

      if (distance <= radius && distance < nearestDistance) {
        nearestNpc = npc;
        nearestDistance = distance;
      }
    }

    this.selectedNpc = nearestNpc;
    this.distanceToSelected = nearestNpc !== null ? nearestDistance : Infinity;
  }

  /**
   * Returns the currently selected (nearest interactable) NPC, or null if none is in range.
   */
  getSelectedNpc(): Npc | null {
    return this.selectedNpc;
  }

  /**
   * Returns the distance to the currently selected NPC.
   * Returns Infinity if no NPC is selected.
   */
  getDistance(): number {
    return this.distanceToSelected;
  }

  /**
   * Returns whether any NPC is currently within the interaction radius.
   */
  isInteractable(): boolean {
    return this.selectedNpc !== null;
  }

  /**
   * Calculates the Euclidean distance between the player and an NPC.
   *
   * @param npc - The NPC to measure distance to.
   * @returns The distance in pixels between the player and the NPC.
   */
  private calculateDistance(npc: Npc): number {
    const dx = this.player.getX() - npc.getX();
    const dy = this.player.getY() - npc.getY();

    return Math.sqrt(dx * dx + dy * dy);
  }
}
