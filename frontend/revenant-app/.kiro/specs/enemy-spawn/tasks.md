# Enemy Spawn - Tasks Document

## Overview

This document defines the implementation tasks for the Enemy Spawn feature.

The objective is to instantiate enemies by combining the spawn information defined in the Tiled Object Layer with the enemy statistics retrieved from the backend.

Enemy movement, animations, combat, artificial intelligence, and rewards are outside the scope of this feature.

# Implementation Plan

## Phase 1 - Backend Integration

**Objectives**

- Implement communication with the backend.
- Retrieve the enemy catalog for the active map.

**Deliverables**

- EnemyService.
- Backend integration.
- Enemy catalog retrieval.

---

## Phase 2 - Spawn Processing

**Objectives**

- Read the Tiled Object Layer.
- Process enemy spawn objects.

**Deliverables**

- Enemy spawn discovery.
- Spawn information extraction.

---

## Phase 3 - Enemy Creation

**Objectives**

- Match spawn objects with backend data.
- Instantiate Enemy entities.

**Deliverables**

- Enemy Factory.
- Enemy entities added to the scene.

---

## Phase 4 - Validation

**Objectives**

- Validate enemy spawning.
- Validate backend integration.

**Deliverables**

- Successful enemy creation.
- Stable scene initialization.

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
        "task-4"
      ]
    },
    {
      "wave": 3,
      "tasks": [
        "task-5",
        "task-6"
      ]
    },
    {
      "wave": 4,
      "tasks": [
        "task-7",
        "task-8"
      ]
    }
  ]
}
```

---

## Tasks

- [x] 1. Implement the EnemyService.

  - Consume `GET /api/world/maps/enemies/{mapId}`.
  - Deserialize the backend response.
  - Return the enemy catalog for the current map.

---

- [x] 2. Build the enemy lookup table.

  - Index the backend response using `enemyId`.
  - Expose efficient enemy lookup by identifier.
  - Handle empty backend responses.

---

- [x] 3. Read the enemy spawn Object Layer.

  - Locate the enemy spawn layer.
  - Read every spawn object.
  - Extract position and `enemyId`.

---

- [x] 4. Validate spawn objects.

  - Ignore objects without an `enemyId`.
  - Ignore invalid spawn definitions.
  - Process only valid spawn objects.

---

- [x] 5. Implement the EnemyFactory.

  - Receive backend enemy data.
  - Receive spawn position.
  - Instantiate the appropriate Enemy entity.
  - Initialize enemy statistics.

---

- [x] 6. Spawn enemies into the scene.

  - Match each spawn object with its backend definition.
  - Create one Enemy entity for every valid spawn object.
  - Add every created enemy to the active Phaser scene.

---

- [x] 7. Validate backend integration.

  - Verify successful enemy retrieval.
  - Verify graceful handling of backend failures.
  - Verify empty responses do not create enemies.

---

- [x] 8. Validate gameplay integration.

  - Verify every Skeleton spawn (`enemyId = 15`) creates an independent Skeleton entity.
  - Verify all Skeleton entities use the backend statistics.
  - Verify every Skeleton appears at the coordinates defined in the Tiled Object Layer.
  - Verify scene initialization completes successfully.

---

## Notes

- This feature MUST comply with:
  - `phaser_developer.md`
  - `react_developer.md`

- This feature MUST comply with the architecture documentation located under:

  ```text
  docs/architecture/
  ```

- Reuse the existing Phaser architecture whenever possible.

- The backend is the source of truth for enemy statistics.

- The Tiled Object Layer is the source of truth for enemy spawn positions.

- Enemy entities MUST be created exclusively through the EnemyFactory.

- MainScene MUST orchestrate the spawning process but MUST NOT instantiate Enemy entities directly.

- MainScene MUST NOT contain backend communication logic.

- This feature MUST consume the existing backend endpoint:

  ```text
  GET /api/world/maps/enemies/{mapId}
  ```

- This feature is limited to enemy spawning only.

- Out of scope:
  - Enemy movement.
  - Enemy animations.
  - Enemy AI.
  - Combat.
  - Player interaction.
  - Loot.
  - Gold rewards.
  - Experience rewards.
  - Health bars.
  - Damage calculation.
  - Respawn mechanics.