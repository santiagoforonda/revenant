# Enemy Detection - Tasks Document

## Overview

This document defines the implementation tasks for the Enemy Detection feature.

The objective is to implement a dedicated detection system that continuously evaluates whether the player is inside an enemy's configurable detection radius.

This feature extends the Enemy Patrol module without introducing pursuit, combat, pathfinding, or movement behavior.

# Implementation Plan

## Phase 1 - Detection Infrastructure

**Objectives**

- Introduce the detection architecture.
- Create a Detection Controller for every enemy.
- Integrate the detection update cycle.

**Deliverables**

- Detection Controller.
- Detection state management.
- Scene integration.

---

## Phase 2 - Detection Evaluation

**Objectives**

- Evaluate the distance between enemies and the player.
- Detect state transitions.

**Deliverables**

- Distance calculation.
- Detection radius validation.
- Detection state transitions.

---

## Phase 3 - AI Integration

**Objectives**

- Notify future AI systems.
- Prevent duplicate detection events.

**Deliverables**

- Detection events.
- Stable state transitions.
- Architecture validation.

---

## Phase 4 - Validation

**Objectives**

- Validate detection behavior.
- Ensure compliance with the project architecture.

**Deliverables**

- Stable Enemy Detection system.
- Successful integration with Enemy Patrol.

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

- [x] 1. Implement the Detection Controller.

  - Create the Detection Controller component.
  - Initialize one Detection Controller for every spawned enemy.
  - Store the detection radius for each enemy.
  - Maintain the current detection state.

---

- [x] 2. Integrate the detection update cycle.

  - Update every Detection Controller during the MainScene update loop.
  - Keep detection evaluation independent for every enemy.
  - Ensure MainScene only invokes controller updates.

---

- [x] 3. Implement distance evaluation.

  - Calculate the distance between the enemy and the player.
  - Compare the calculated distance against the configured detection radius.
  - Support configurable detection radii for different enemy types.
  - Handle invalid detection radius values safely.

---

- [x] 4. Implement detection state transitions.

  - Detect when the player enters the detection radius.
  - Detect when the player leaves the detection radius.
  - Prevent duplicate detection events.
  - Maintain the current detection state until a transition occurs.

---

- [x] 5. Implement AI notification events.

  - Notify future AI systems when the player is detected.
  - Notify future AI systems when the player is lost.
  - Expose detection state changes through the Detection Controller.
  - Avoid coupling Detection Controller with future AI modules.

---

- [x] 6. Preserve architecture separation.

  - Ensure Enemy Detection never controls enemy movement.
  - Ensure Enemy Detection never starts combat.
  - Ensure Enemy Detection never communicates with the backend.
  - Ensure Enemy Patrol remains independent from Enemy Detection.

---

- [x] 7. Validate detection behavior.

  - Verify every enemy initializes a Detection Controller.
  - Verify detection updates execute every frame.
  - Verify player detection occurs when entering the configured radius.
  - Verify detection loss occurs when leaving the configured radius.
  - Verify multiple enemies evaluate detection independently.

---

- [x] 8. Validate architecture compliance.

  - Verify detection events occur only once per state transition.
  - Verify duplicate detection events never occur.
  - Verify MainScene contains no detection logic.
  - Verify Enemy Detection remains reusable by future Chase, Return, and Combat modules.
  - Verify the feature remains independent from backend communication, pathfinding, and combat.

---

## Notes

- This feature MUST comply with:
  - `phaser_developer.md`
  - `react_developer.md`

- This feature MUST comply with the architecture documentation located under:

  ```text
  docs/architecture/
  ```

- Detection logic MUST be implemented through a dedicated `DetectionController`.

- Detection MUST be evaluated every update cycle.

- Each enemy MUST maintain its own detection state independently.

- Detection events MUST only be emitted when the detection state changes.

- Enemy Detection MUST NOT move enemies.

- Enemy Detection MUST NOT start combat.

- Enemy Detection MUST NOT trigger animations directly.

- MainScene MUST only update Detection Controllers and MUST NOT contain detection logic.

- Enemy Detection MUST remain reusable by future modules including:
  - Enemy Chase
  - Enemy Return
  - Enemy Combat

- Out of scope:
  - Enemy chase.
  - Enemy return.
  - Combat.
  - Damage.
  - Pathfinding.
  - Attack logic.
  - Attack animations.
  - Death handling.
  - Loot.
  - Rewards.
  - Backend communication.
```