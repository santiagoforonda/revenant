# Enemy Animation - Tasks Document

## Overview

This document defines the implementation tasks for the Enemy Animation feature.

The objective is to animate spawned Skeleton enemies according to their current state and facing direction while reusing the existing rendering architecture already implemented for the Player.

This feature is limited to visual animation playback and does not include movement, artificial intelligence, combat, or health management.

# Implementation Plan

## Phase 1 - Animation Registration

**Objectives**

- Load the Skeleton spritesheet.
- Register all Skeleton animations.

**Deliverables**

- Skeleton spritesheet loaded.
- Idle animations registered.
- Walking animations registered.

---

## Phase 2 - Animation Infrastructure

**Objectives**

- Implement the enemy animation controller.
- Integrate SpriteComposer with enemy animation playback.

**Deliverables**

- Enemy Animation Controller.
- SpriteComposer integration.

---

## Phase 3 - Animation Playback

**Objectives**

- Play Idle animations.
- Play Walking animations.
- Handle directional transitions.

**Deliverables**

- Functional Idle animations.
- Functional Walking animations.
- Smooth animation transitions.

---

## Phase 4 - Validation

**Objectives**

- Validate animation playback.
- Verify architectural compliance.

**Deliverables**

- Stable animation system.
- Successful gameplay integration.

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

- [x] 1. Load the Skeleton spritesheet.

  - Register the Skeleton spritesheet using the existing AssetLoaderService.
  - Verify the spritesheet uses 32×48 frames.
  - Ensure the asset is available before animation registration.

---

- [x] 2. Register Skeleton animations.

  - Register Idle animations for all four directions.
  - Register Walking animations for all four directions.
  - Prevent duplicate animation registration.
  - Reuse existing animation definitions whenever possible.

---

- [x] 3. Implement the Enemy Animation Controller.

  - Create the component responsible for animation selection.
  - Resolve animation keys based on enemy state.
  - Resolve animation keys based on facing direction.
  - Prevent unnecessary animation restarts.

---

- [x] 4. Integrate SpriteComposer with enemy animations.

  - Connect Enemy state changes to SpriteComposer.
  - Delegate animation playback through SpriteComposer.
  - Ensure Enemy never invokes Phaser animations directly.
  - Reuse the existing Player rendering infrastructure whenever possible.

---

- [x] 5. Implement Idle animation playback.

  - Play the correct Idle animation.
  - Loop Idle animations continuously.
  - Update Idle animations when the enemy changes direction.
  - Avoid restarting an already playing Idle animation.

---

- [x] 6. Implement Walking animation playback.

  - Play the correct Walking animation.
  - Loop Walking animations continuously.
  - Transition smoothly between Idle and Walking.
  - Update Walking animations immediately after direction changes.

---

- [x] 7. Validate animation behavior.

  - Verify every animation is registered correctly.
  - Verify duplicate animation registration is prevented.
  - Verify invalid animation states are handled safely.
  - Verify invalid directions do not break animation playback.
  - Verify missing animation keys do not crash the scene.

---

- [x] 8. Validate gameplay integration.

  - Verify every spawned Skeleton displays the correct Idle animation.
  - Verify Walking animations synchronize with enemy movement.
  - Verify multiple Skeletons animate simultaneously.
  - Verify SpriteComposer coordinates enemy rendering correctly.
  - Verify MainScene contains no animation selection logic.
  - Verify the implementation remains consistent with the Player rendering architecture.

---

## Notes

- This feature MUST comply with:
  - `phaser_developer.md`
  - `react_developer.md`

- This feature MUST comply with the architecture documentation located under:

  ```text
  docs/architecture/
  ```

- Reuse the existing rendering infrastructure whenever possible.

- Enemy animations MUST integrate with SpriteComposer.

- Enemy entities MUST expose state and direction changes without directly invoking Phaser animations.

- Animation playback MUST be coordinated by the Enemy Animation Controller.

- Animation registration MUST occur only once during the application lifecycle.

- Existing animation definitions MUST always be reused.

- MainScene MUST NOT contain animation selection logic.

- This feature is limited to visual animation playback.

- Out of scope:
  - Enemy movement.
  - Enemy AI.
  - Combat.
  - Damage.
  - Health management.
  - Player interaction.
  - Loot.
  - Gold rewards.
  - Experience rewards.
  - Respawn mechanics.
  - Attack animations.
  - Hurt animations.
  - Death animations.
```