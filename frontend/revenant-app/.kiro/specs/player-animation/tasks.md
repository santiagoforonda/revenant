# Player Animation - Tasks Document

## Overview

This document defines the implementation tasks for the Player Animation feature.

The objective is to implement the player animation system using the existing movement state and direction exposed by the `Player` entity. The implementation shall animate both the player body and the helmet while preserving the current project architecture.

# Implementation Plan

## Phase 1 - Animation Registration

**Objectives**

- Register all player body animations.
- Register all helmet animations.

**Deliverables**

- Body animations available through Phaser Animation Manager.
- Helmet animations available through Phaser Animation Manager.

---

## Phase 2 - Animation Controller

**Objectives**

- Implement animation selection based on movement state and direction.
- Prevent unnecessary animation restarts.

**Deliverables**

- Walking animations.
- Idle animations.
- Animation state management.

---

## Phase 3 - Helmet Synchronization

**Objectives**

- Synchronize helmet animations with body animations.

**Deliverables**

- Helmet animations always match the body animations.

---

## Phase 4 - Validation

**Objectives**

- Validate animation behavior during gameplay.

**Deliverables**

- Correct animation transitions.
- Stable animation playback.

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

- [x] 1. Register all player body animations.

  - Create idle animations for the four directions.
  - Create walking animations for the four directions.
  - Register each animation only once.

---

- [x] 2. Register all helmet animations.

  - Create idle helmet animations.
  - Create walking helmet animations.
  - Register each animation only once.

---

- [x] 3. Implement the animation controller.

  - Read the player's current movement state.
  - Read the player's current facing direction.
  - Determine the animation that should be played.

---

- [x] 4. Implement walking animation playback.

  - Play the correct walking animation for each direction.
  - Avoid restarting an animation that is already playing.

---

- [x] 5. Implement idle animation playback.

  - Play the correct idle animation.
  - Preserve the player's last facing direction.

---

- [x] 6. Synchronize helmet animations.

  - Play the corresponding helmet animation.
  - Keep helmet and body animations synchronized.
  - Ensure both sprites always face the same direction.

---

- [x] 7. Validate animation transitions.

  - Verify transitions between Idle and Walking.
  - Verify transitions between movement directions.
  - Verify continuous animation playback.

---

- [x] 8. Validate gameplay integration.

  - Verify that player movement continues working correctly.
  - Verify that the animation system does not affect movement behavior.
  - Verify that body and helmet remain synchronized throughout gameplay.

---

## Notes

- This feature MUST comply with:
  - `phaser_developer.md`
  - `react_developer.md`

- This feature MUST comply with the architecture documentation located under:

  ```text
  docs/architecture/
  ```

- Reuse the existing `Player` entity and `MainScene`.

- Do not modify the movement system implemented in the previous feature.

- The animation system shall consume the player's movement state and direction without becoming responsible for movement logic.

- The helmet shall remain an independent sprite synchronized with the player.

- This feature is limited to player animations only.

- Out of scope:
  - Enemy animations.
  - NPC animations.
  - Combat animations.
  - Attack animations.
  - Equipment system changes.
  - Backend communication.
  - React UI modifications.