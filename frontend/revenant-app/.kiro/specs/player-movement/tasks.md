# Player Movement - Tasks Document

## Overview

This document defines the implementation tasks for the Player Movement feature.

The objective is to implement keyboard-controlled player movement using the **W**, **A**, **S**, and **D** keys, integrate movement with Phaser Arcade Physics, synchronize the helmet entity, and enable map collision handling while preserving the project's architecture.

---

# Implementation Plan

### Phase 1 - Keyboard Input

**Objectives**

- Register the WASD keyboard controls.
- Capture keyboard input during the game loop.

**Deliverables**

- Keyboard input initialized.
- Movement direction detection implemented.

---

### Phase 2 - Player Movement

**Objectives**

- Implement player movement using Arcade Physics.
- Maintain a constant movement speed.
- Stop movement when no input is detected.

**Deliverables**

- Four-direction movement.
- Idle behavior.
- Walking behavior.

---

### Phase 3 - Helmet Synchronization

**Objectives**

- Synchronize the helmet sprite with the player.

**Deliverables**

- Helmet follows the player during movement.
- Helmet remains aligned while idle.

---

### Phase 4 - Map Collision

**Objectives**

- Connect the player to the map collision layer.

**Deliverables**

- Player cannot pass through collidable tiles.
- Movement remains possible on walkable tiles.

---

### Phase 5 - Camera Validation

**Objectives**

- Verify camera behavior during movement.

**Deliverables**

- Camera follows the player correctly.
- Camera respects world bounds.

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
        "task-8",
        "task-9"
      ]
    },
    {
      "wave": 5,
      "tasks": [
        "task-10",
        "task-11"
      ]
    },
    {
      "wave": 6,
      "tasks": [
        "task-12",
        "task-13"
      ]
    }
  ]
}
```

---

## Tasks

- [x] 1. Register the WASD keyboard controls in the MainScene.

  - Create cursor key bindings for W, A, S, D.

---

- [x] 2. Process keyboard input during every update cycle.

  - Read active keys each frame.
  - Determine movement direction vector.

---

- [x] 3. Implement four-direction player movement using Phaser Arcade Physics.

  - Enable Arcade Physics on the player body.
  - Apply velocity based on input direction.

---

- [x] 4. Implement constant player movement speed.

  - Define a movement speed constant.
  - Normalize diagonal movement.

---

- [x] 5. Stop player movement when no movement key is pressed.

  - Set velocity to zero when no input is active.

---

- [x] 6. Implement the player Idle and Walking states.

  - Track whether the player is moving or idle.
  - Update state each frame based on velocity.

---

- [x] 7. Update the player's movement direction.

  - Track the last facing direction.

---

- [x] 8. Synchronize the helmet sprite with the player's position.

  - Update helmet position every frame to match the player body.

---

- [x] 9. Preserve the helmet visual offset while moving.

  - Maintain correct layering during movement.

---

- [x] 10. Configure player collision with the map collision layer.

  - Set collision tiles on the appropriate tilemap layer.
  - Add collider between player and collision layer.

---

- [x] 11. Prevent movement through collidable tiles.

  - Verify that the player stops at collidable boundaries.

---

- [x] 12. Verify camera tracking during player movement.

  - Confirm camera follows the player sprite.

---

- [x] 13. Verify camera world bounds.

  - Confirm camera does not scroll beyond map edges.

---

## Notes

- This feature MUST comply with the steering documents:
  - `phaser_developer.md`
  - `react_developer.md`

- This feature MUST comply with the architecture documentation located under:

  - `docs/architecture/`

- The movement system belongs exclusively to the Phaser module.

- No backend communication shall be introduced.

- The Player entity owns the movement behavior.

- The Helmet shall remain an independent render entity synchronized with the Player.

- This feature does not include:
  - Player animations.
  - Enemy movement.
  - NPC movement.
  - Combat.
  - Item interaction.