# NPC Spawn - Tasks Document

## Overview

This implementation introduces the NPC Spawn feature for the Revenant game.

The feature is responsible for creating every NPC that belongs to the current map by combining the NPC definitions received from the backend with the spawn points defined in the Tiled map.

This feature does not include NPC interaction, dialogues, quests, stores, or AI behavior.

Usse the Id specific to each NPC

1	Sea Maid	sea_maid.png
2	Traveling Merchant	traveling_merchant.png
3	Old Hermit	old_hermit.png
4	Forest Healer	forest_healer.png
5	Guard	guard.png

# Implementation Plan

## Phase 1

### Objective

Implement the core domain objects required for NPC spawning.

### Deliverables

- Npc entity
- NpcFactory
- Spawn point model

---

## Phase 2

### Objective

Implement the NPC spawning workflow.

### Deliverables

- SpawnLoader
- NpcSpawnManager
- NPC registration inside the scene

---

## Phase 3

### Objective

Integrate backend data with the spawning system.

### Deliverables

- Event Bus integration
- NPC creation from backend data
- Complete spawn flow

---

## Phase 4

### Objective

Validate robustness and stability.

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
        "task-2",
        "task-3"
      ]
    },
    {
      "wave": 2,
      "tasks": [
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

- [x] 1. Implement the NPC domain model.

  - Create the `Npc` entity.
  - Define NPC properties.
  - Configure sprite initialization.
  - Configure idle animation support.

---

- [x] 2. Implement the NpcFactory.

  - Create NPC entities from backend data.
  - Initialize Phaser sprites.
  - Assign idle animations.
  - Configure initial NPC state.

---

- [x] 3. Implement the SpawnLoader.

  - Read NPC spawn points from the Tiled object layer.
  - Build the `NpcSpawnPoint` collection.
  - Validate spawn point integrity.

---

- [x] 4. Implement the NpcSpawnManager.

  - Coordinate the complete spawning process.
  - Match backend NPCs with spawn points.
  - Delegate entity creation to the factory.
  - Register spawned NPCs in the active scene.

---

- [x] 5. Register NPCs inside the active Phaser Scene.

  - Add NPC sprites to the scene.
  - Configure rendering order.
  - Store spawned NPC references.

---

- [x] 6. Integrate backend NPC data.

  - Receive NPC data through the Event Bus.
  - Trigger the spawning process.
  - Spawn every NPC belonging to the active map.

---

- [x] 7. Implement error handling.

  - Handle backend data inconsistencies.
  - Handle missing spawn points.
  - Handle NPC creation failures.
  - Continue spawning remaining NPCs after recoverable errors.

---

- [x] 8. Implement automated tests.

  - Create unit tests for `NpcFactory`.
  - Create unit tests for `SpawnLoader`.
  - Create unit tests for `NpcSpawnManager`.
  - Create integration tests for the complete NPC spawning workflow.

## Notes

- This feature must comply with:
  - `phaser_developer.md`
  - `react_developer.md`
  - `docs/game-directory-structure.md`
  - `docs/react-phaser-events.md`
  - `docs/react-phaser-architecture.md`

- Phaser must never perform HTTP requests directly.

- NPC data must always be received through the Event Bus after being retrieved by React.

- NPC positions are defined exclusively in Tiled.

- NPC definitions are provided exclusively by the backend.

- Interaction, dialogue, quests, stores, movement, and AI are intentionally out of scope for this feature.