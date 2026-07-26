# Enemy Animation - Design Document

## Overview

This document describes the design of the Enemy Animation feature.

The purpose of this feature is to provide visual animations for enemy entities according to their current state and facing direction.

This feature extends the Enemy Spawn module by introducing animation playback while keeping gameplay logic completely independent from rendering.

Enemy animations reuse the existing rendering infrastructure already implemented for the Player, including SpriteComposer and Phaser's Animation Manager.

Only the Skeleton enemy is included in the scope of this feature. The architecture must remain extensible for future enemy types such as Wolves, Hedgehogs and Minotaurs.

---

## Architecture

The Enemy Animation feature follows the existing rendering architecture already established for Player entities.

Gameplay systems are responsible for updating the enemy state (Idle or Walking) and facing direction.

The animation system is responsible only for converting those values into visual animations.

Enemy animations must reuse SpriteComposer whenever possible instead of introducing a second animation system.

### High-Level Architecture

```text
                    Enemy
                      │
      State / Direction Changes
                      │
                      ▼
              SpriteComposer
                      │
                      ▼
         Enemy Animation Controller
                      │
                      ▼
        Phaser Animation Manager
                      │
                      ▼
          Skeleton Sprite Playback
```

Animation flow:

1. Enemy updates its current state.
2. Enemy updates its current direction.
3. SpriteComposer receives the changes.
4. Animation Controller resolves the animation key.
5. Phaser plays the corresponding animation.
6. The Skeleton sprite is updated.

Gameplay systems never communicate directly with Phaser animations.

---

## Components and Interfaces

### Enemy

**Responsibilities**

- Store the current animation state.
- Store the current facing direction.
- Notify SpriteComposer whenever either value changes.

Enemy must never decide which animation to play.

---

### SpriteComposer

**Responsibilities**

- Coordinate visual synchronization.
- Receive animation requests from Enemy.
- Delegate animation playback.
- Keep rendering logic centralized.

SpriteComposer should be reused instead of creating duplicate rendering infrastructure.

---

### Enemy Animation Controller

**Responsibilities**

- Resolve animation keys.
- Select Idle or Walking animations.
- Select directional animations.
- Prevent unnecessary animation restarts.
- Delegate playback to Phaser.

The controller contains all animation selection logic.

---

### Phaser Animation Manager

**Responsibilities**

- Register Skeleton animations.
- Reuse existing animation definitions.
- Play animations.
- Prevent duplicate animation registration.

Animations should only be registered once during the application lifecycle.

---

### MainScene

**Responsibilities**

- Load the Skeleton spritesheet.
- Register Skeleton animations during scene initialization.

MainScene must never determine which animation should be played.

---

### Skeleton Spritesheet

**Responsibilities**

- Provide Idle frames.
- Provide Walking frames.
- Use 32×48 frame dimensions.
- Supply all directional animations.

The spritesheet is a visual resource only.

---

## Data Models

### EnemyAnimationState

Supported values:

```text
Idle

Walking
```

Future values such as Attack, Hurt and Death are outside the scope of this feature.

---

### FacingDirection

Supported values:

```text
Up

Down

Left

Right
```

These values determine which directional animation should be played.

---

### Animation Keys

Animations should follow a consistent naming convention.

Example:

```text
skeleton-idle-down

skeleton-idle-up

skeleton-idle-left

skeleton-idle-right

skeleton-walk-down

skeleton-walk-up

skeleton-walk-left

skeleton-walk-right
```

The convention must remain extensible for future enemy types.

---

## Correctness Properties

The following invariants must always hold:

- Gameplay logic must remain independent from Phaser animations.
- Enemy must never invoke Phaser animations directly.
- SpriteComposer must coordinate enemy rendering.
- Animation Controller must determine which animation should be played.
- MainScene must never contain animation selection logic.
- Animation registration must occur only once.
- Existing animation definitions must always be reused.
- Idle animations must loop continuously.
- Walking animations must loop continuously.
- Direction changes must immediately update the displayed animation.
- Duplicate animation playback logic must not exist.
- The implementation must reuse the existing Player animation infrastructure whenever possible.

---

## Error Handling

The system shall gracefully handle the following situations:

- Missing Skeleton spritesheet.
- Missing animation frames.
- Invalid animation keys.
- Duplicate animation registration.
- Invalid animation state.
- Invalid facing direction.

Animation failures must never terminate the scene.

If an animation cannot be played, the current animation should remain active.

---

## Testing Strategy

### Unit Testing

Verify that:

- Animation keys are resolved correctly.
- Animation Controller selects the correct animation.
- Duplicate animation registration is prevented.
- Invalid states are handled safely.
- Invalid directions are handled safely.

---

### Integration Testing

Verify that:

- Skeleton animations are successfully registered.
- Idle animations play correctly.
- Walking animations play correctly.
- Direction changes update the correct animation.
- Existing animation definitions are reused.
- SpriteComposer correctly delegates animation playback.

---

### End-to-End Testing

Verify that:

- Every spawned Skeleton displays the correct Idle animation.
- Walking Skeletons display the correct Walking animation.
- Direction changes update animations immediately.
- Idle and Walking transitions occur smoothly.
- Multiple Skeletons can animate simultaneously.
- Animation playback does not affect Enemy Spawn.
- MainScene remains free of animation selection logic.
- Enemy rendering remains consistent with the Player rendering architecture.