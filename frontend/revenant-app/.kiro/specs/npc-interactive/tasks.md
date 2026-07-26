# NPC Interaction - Tasks Document

## Overview

This implementation introduces the NPC Interaction feature for the Revenant game.

The feature allows the player to interact with NPCs that are already spawned in the current map. When the player enters the interaction radius (15 pixels), an interaction indicator is displayed. Pressing the **E** key triggers the interaction and displays the next dialogue phrase of the selected NPC.

This feature does not include branching dialogues, quests, stores, NPC AI, or cutscenes.

# Implementation Plan

## Phase 1

### Objective

Prepare the NPC entity for interactions.

### Deliverables

- Dialogue state management
- Dialogue progression logic
- NPC interaction methods

---

## Phase 2

### Objective

Implement the interaction detection system.

### Deliverables

- Distance detection
- Nearest NPC selection
- Interaction indicator
- Keyboard input handling

---

## Phase 3

### Objective

Implement dialogue triggering.

### Deliverables

- Dialog window integration
- Sequential dialogue
- Dialogue reset logic

---

## Phase 4

### Objective

Validate feature correctness.

### Deliverables

- Error handling
- Unit tests
- Integration tests

---

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": [
        "task-1",
        "task-2"
      ]
    },
    {
      "wave": 2,
      "tasks": [
        "task-3",
        "task-4",
        "task-5"
      ]
    },
    {
      "wave": 3,
      "tasks": [
        "task-6",
        "task-7"
      ]
    },
    {
      "wave": 4,
      "tasks": [
        "task-8"
      ]
    }
  ]
}
```

## Tasks

- [x] 1. Extend the NPC entity to support dialogue progression.

  - Add the dialogue index state.
  - Implement the `getNextPhrase()` method.
  - Implement the `interact()` method.
  - Restart the dialogue sequence after the last phrase.

---

- [x] 2. Implement dialogue state management.

  - Ensure every NPC maintains its own dialogue index.
  - Prevent dialogue state sharing between NPC instances.
  - Validate dialogue progression with multiple NPCs.

---

- [x] 3. Implement the NPC interaction system.

  - Create the `NpcInteractionSystem`.
  - Execute interaction checks during the update cycle.
  - Detect nearby NPCs.
  - Select the nearest interactable NPC.

---

- [x] 4. Implement the interaction indicator.

  - Create the interaction indicator UI.
  - Display the indicator above the selected NPC.
  - Hide the indicator when no NPC is interactable.
  - Ensure only one indicator is visible at any time.

---

- [x] 5. Implement keyboard interaction.

  - Register the **E** key.
  - Detect interaction requests.
  - Validate the interaction radius.
  - Trigger the selected NPC interaction.

---

- [x] 6. Integrate the dialogue window.

  - Display the dialogue returned by the NPC.
  - Update the displayed dialogue after every interaction.
  - Support sequential dialogue progression.
  - Restart the dialogue after the last phrase.

---

- [x] 7. Implement interaction error handling.

  - Handle NPCs without dialogue.
  - Handle invalid dialogue indices.
  - Prevent interaction outside the interaction radius.
  - Log recoverable interaction errors.

---

- [x] 8. Implement automated tests.

  - Create unit tests for dialogue progression.
  - Create unit tests for nearest NPC detection.
  - Create unit tests for interaction radius validation.
  - Create integration tests for keyboard interaction.
  - Create end-to-end tests for the complete NPC interaction flow.

## Notes

- This feature must comply with:
  - `phaser_developer.md`
  - `react_developer.md`
  - `docs/game-directory-structure.md`
  - `docs/react-phaser-architecture.md`
  - `docs/react-phaser-events.md`

- NPCs must already exist in the scene before interaction begins.

- The interaction radius is fixed at **15 pixels**.

- Only the nearest NPC may be interacted with.

- The interaction indicator must only be displayed for the currently selected NPC.

- Each NPC is responsible for maintaining its own dialogue progression.

- The interaction system must not communicate with the backend.

- Quest, store, AI, and branching dialogue functionality are intentionally out of scope for this feature.