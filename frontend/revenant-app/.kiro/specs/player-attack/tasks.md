# Player Attack - Tasks Document

## Overview

This implementation introduces the Player Attack feature for the Revenant game.

The feature allows the player to perform melee attacks using the left mouse button. Every valid attack creates an attack hitbox, detects all enemies inside the attack range, plays the corresponding attack animation, and generates an `AttackRequest` for the Combat System.

This feature does not calculate damage or modify enemy state.

# Implementation Plan

## Phase 1

### Objective

Implement the player attack domain model and attack state management.

### Deliverables

- Attack state
- Attack request model
- Cooldown management

---

## Phase 2

### Objective

Implement attack execution.

### Deliverables

- Mouse input handling
- Attack validation
- Attack animation
- Attack direction

---

## Phase 3

### Objective

Implement attack target detection.

### Deliverables

- Attack hitbox
- Enemy detection
- AttackRequest generation
- Combat System integration

---

## Phase 4

### Objective

Validate stability and correctness.

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

- [x] 1. Implement the player attack state.

  - Create the `AttackState` model.
  - Implement attack cooldown management.
  - Track the attacking state.
  - Prevent overlapping attacks.

---

- [x] 2. Implement the AttackRequest model.

  - Create the `AttackRequest` model.
  - Include attacker information.
  - Include detected enemy targets.
  - Include attack direction.
  - Include attack timestamp.

---

- [x] 3. Implement the PlayerAttackSystem.

  - Listen for left mouse button input.
  - Validate attack cooldown.
  - Validate player attack state.
  - Determine the attack direction.
  - Coordinate the complete attack workflow.

---

- [x] 4. Implement attack animation execution.

  - Play the correct attack animation based on player direction.
  - Prevent multiple attack animations from overlapping.
  - Restore the player to the idle or movement state after the animation finishes.

---

- [x] 5. Implement the AttackHitbox.

  - Create the attack hitbox from the player's position.
  - Configure the attack range.
  - Detect every enemy inside the hitbox.
  - Return the collection of detected enemies.

---

- [x] 6. Generate Attack Requests.

  - Create an `AttackRequest` after every valid attack.
  - Include all detected enemies.
  - Deliver the request to the local Combat System.
  - Complete the attack even when no enemies are detected.

---

- [x] 7. Implement error handling.

  - Ignore attacks while the cooldown is active.
  - Ignore attacks while already attacking.
  - Handle attacks with no detected enemies.
  - Handle animation failures gracefully.
  - Log recoverable errors without interrupting gameplay.

---

- [x] 8. Implement automated tests.

  - Create unit tests for attack cooldown validation.
  - Create unit tests for attack state transitions.
  - Create unit tests for attack hitbox generation.
  - Create unit tests for enemy detection.
  - Create unit tests for `AttackRequest` generation.
  - Create integration tests for the complete player attack workflow.

## Notes

- This feature must comply with:
  - `phaser_developer.md`
  - `react_developer.md`
  - `docs/game-directory-structure.md`
  - `docs/react-phaser-architecture.md`
  - `docs/react-phaser-events.md`
  

- Player attacks are triggered exclusively by the **left mouse button**.

- Every valid attack must generate exactly one `AttackRequest`.

- The attack hitbox must detect **all enemies** inside the attack range.

- An attack with no detected enemies is considered a valid attack and must still complete normally.

- The Combat System resolves attacks entirely on the client.
- No backend request shall be performed during normal attacks.
- A backend request shall only be sent after an enemy is defeated to persist rewards and player progression.

- The Player Attack feature must remain independent from enemy AI, dialogue, inventory, quests, stores, and backend communication.