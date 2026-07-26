# Enemy Patrol - Tasks Document

## Overview

This document defines the implementation tasks for the Enemy Patrol feature.

The objective is to implement autonomous patrol behavior for enemies while they are in their passive state. Every enemy shall move around its original spawn position, alternating between Idle and Walking states.

This feature extends the Enemy Spawn and Enemy Animation modules without introducing player detection, combat, or pathfinding.

# Implementation Plan

## Phase 1 - Patrol Infrastructure

**Objectives**

- Introduce the patrol architecture.
- Store each enemy's patrol origin.
- Prepare the patrol update cycle.

**Deliverables**

- Patrol Controller.
- Patrol origin management.
- Patrol update integration.

---

## Phase 2 - Patrol Destination System

**Objectives**

- Generate valid patrol destinations.
- Restrict movement to the patrol area.

**Deliverables**

- Patrol destination generator.
- Patrol boundary validation.

---

## Phase 3 - Patrol Movement

**Objectives**

- Move enemies toward patrol destinations.
- Synchronize movement with Enemy Animation.

**Deliverables**

- Autonomous patrol movement.
- Idle/Walking transitions.
- Direction updates.

---

## Phase 4 - Validation

**Objectives**

- Validate patrol behavior.
- Verify architecture compliance.

**Deliverables**

- Stable patrol system.
- Successful integration with Enemy Animation.

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

- [x] 1. Implement the Patrol Controller.

  - Create the Patrol Controller component.
  - Initialize patrol behavior for every spawned enemy.
  - Store the enemy spawn position as the patrol origin.
  - Integrate the controller into the existing Enemy architecture.

---

- [x] 2. Integrate the patrol update cycle.

  - Update Patrol Controllers during every game loop.
  - Ensure patrol logic executes independently for every enemy.
  - Keep MainScene responsible only for invoking controller updates.

---

- [x] 3. Implement the Patrol Destination Generator.

  - Generate random patrol destinations.
  - Restrict generated destinations to the configured patrol radius.
  - Reject invalid destinations outside the patrol area.
  - Prepare destination generation for future AI behaviors.

---

- [x] 4. Implement patrol boundary validation.

  - Validate every generated patrol destination.
  - Prevent enemies from leaving the patrol area.
  - Regenerate invalid destinations automatically.
  - Preserve the original patrol origin.

---

- [x] 5. Implement patrol movement.

  - Move enemies toward the current patrol destination.
  - Stop movement when the destination is reached.
  - Update enemy position continuously during movement.
  - Support simultaneous patrol for multiple enemies.

---

- [x] 6. Synchronize patrol with Enemy Animation.

  - Switch enemies to the Walking state while moving.
  - Switch enemies to the Idle state after reaching a destination.
  - Update facing direction while moving.
  - Reuse the existing Enemy Animation infrastructure without duplicating animation logic.

---

- [x] 7. Implement patrol cycle management.

  - Introduce an idle delay between patrol movements.
  - Start a new patrol cycle after the idle period expires.
  - Repeat patrol behavior continuously throughout the enemy lifetime.
  - Recover gracefully from interrupted patrol cycles.

---

- [x] 8. Validate patrol behavior.

  - Verify every spawned enemy begins patrolling automatically.
  - Verify patrol movement remains inside the patrol area.
  - Verify Idle and Walking transitions occur correctly.
  - Verify Enemy Animation remains synchronized with patrol behavior.
  - Verify multiple enemies patrol independently.
  - Verify MainScene contains no patrol decision logic.
  - Verify patrol remains independent from combat, player detection, backend communication, and future AI systems.

---

## Notes

- This feature MUST comply with:
  - `phaser_developer.md`
  - `react_developer.md`

- This feature MUST comply with the architecture documentation located under:

  ```text
  docs/architecture/
  ```

- Patrol behavior MUST be implemented through a dedicated Patrol Controller.

- Patrol destinations MUST always remain inside the configured patrol area.

- Enemy Animation MUST continue to manage all animation playback.

- Enemy Patrol MUST never invoke Phaser animations directly.

- MainScene MUST only update Patrol Controllers and MUST NOT contain patrol decision logic.

- Enemy Patrol MUST remain reusable by future AI modules such as Detection, Chase, Return, and Combat.

- This feature is limited to passive autonomous movement.

- Out of scope:
  - Player detection.
  - Enemy chase.
  - Pathfinding.
  - Combat.
  - Damage.
  - Health management.
  - Loot.
  - Experience rewards.
  - Gold rewards.
  - Respawn mechanics.
  - Attack animations.
  - Hurt animations.
  - Death animations.
  - Backend communication.
```