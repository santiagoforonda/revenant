# Enemy Death - Tasks Document

## Overview

This implementation introduces the Enemy Death feature for the Revenant game.

The Enemy Death feature is responsible for managing the complete lifecycle of a defeated enemy. It subscribes to `EnemyDefeatedEvent` events published by the Combat System, disables the enemy, plays the death animation, removes the enemy from the active scene, and publishes an `EnemyRemovedEvent`.

The feature executes entirely on the client.

No backend communication is performed during the death sequence.

# Implementation Plan

## Phase 1

### Objective

Implement the enemy death domain models and state management.

### Deliverables

- EnemyDeathState
- EnemyRemovedEvent
- Death animation result

---

## Phase 2

### Objective

Implement the enemy death workflow.

### Deliverables

- EnemyDeathSystem
- Enemy disabling
- Death animation
- Enemy removal

---

## Phase 3

### Objective

Implement event publication and cleanup.

### Deliverables

- EnemyRemovedEvent publication
- Resource cleanup
- Event Bus integration

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

## Tasks

- [x] 1. Implement the enemy death domain models.
  - Create the `EnemyDeathState` model.
  - Create the `EnemyRemovedEvent` model.
  - Create the `DeathAnimationResult` model.
  - Ensure the models accurately represent the enemy death lifecycle.

---

- [x] 2. Implement the DeathAnimationController.
  - Create the `DeathAnimationController`.
  - Play the configured death animation.
  - Notify when the animation finishes.
  - Prevent additional animations during the death sequence.

---

- [x] 3. Implement the EnemyDeathSystem.
  - Subscribe to `EnemyDefeatedEvent` events from the Event Bus.
  - Coordinate the complete enemy death workflow.
  - Start the death sequence exactly once for each enemy.
  - Ignore duplicate defeat events.

---

- [x] 4. Implement enemy removal.
  - Disable enemy movement.
  - Disable enemy AI.
  - Disable collisions.
  - Disable combat participation.
  - Remove the enemy from the active scene after the animation completes.
  - Release all Phaser resources.

---

- [x] 5. Publish enemy removal events.
  - Publish an `EnemyRemovedEvent` after the enemy has been removed.
  - Ensure exactly one removal event is generated per enemy.
  - Integrate the event with the Event Bus.
  - Prevent duplicate event publication.

---

- [x] 6. Implement resource cleanup.
  - Remove the enemy from update loops.
  - Remove the enemy from collision systems.
  - Destroy Phaser GameObjects.
  - Release animation and physics resources.
  - Ensure cleanup completes before publishing `EnemyRemovedEvent`.

---

- [x] 7. Implement error handling.
  - Handle duplicate `EnemyDefeatedEvent` events.
  - Handle animation failures.
  - Handle already removed enemies.
  - Handle resource cleanup failures.
  - Log recoverable errors without interrupting gameplay.

---

- [x] 8. Implement automated tests.
  - Create unit tests for `EnemyDeathSystem`.
  - Create unit tests for `DeathAnimationController`.
  - Create unit tests for enemy removal.
  - Create unit tests for resource cleanup.
  - Create unit tests for `EnemyRemovedEvent` publication.
  - Create integration tests for the complete enemy death workflow.
  - Verify that no backend communication occurs during the death sequence.

## Notes

- This feature must comply with:
  - `phaser_developer.md`
  - `react_developer.md`
  - `docs/game-directory-structure.md`
  - `docs/react-phaser-architecture.md`
  - `docs/react-phaser-events.md`

- The Enemy Death feature must subscribe to `EnemyDefeatedEvent` events published by the Combat System.

- Every defeated enemy must execute exactly one death sequence.

- Enemy movement, AI, collisions and combat participation must be disabled immediately when the death sequence begins.

- The death animation must complete before the enemy is removed from the active scene, unless the animation fails.

- Every removed enemy must publish exactly one `EnemyRemovedEvent`.

- The Enemy Death feature must execute entirely on the client.

- The Enemy Death feature must never perform HTTP requests.

- Backend communication is **strictly prohibited** during the death sequence.

- Backend persistence is performed exclusively by the Reward System after the `EnemyRemovedEvent` has been published.

- The Enemy Death feature must remain independent from combat resolution, player input, HUD updates, rewards, inventory, quests, stores and enemy AI behavior.