# Enemy Patrol - Design Document

## Overview

This document describes the design of the Enemy Patrol feature.

The purpose of this feature is to provide autonomous movement for enemies while they are in a passive state. Every enemy shall patrol around its original spawn position defined in the Tiled map, creating a more dynamic and immersive world.

This feature extends the Enemy Spawn and Enemy Animation modules by introducing autonomous movement. It does not include player detection, pursuit, combat, pathfinding, or any other artificial intelligence behaviors.

The patrol system must remain completely independent from rendering. Enemy animations will continue to be handled by the existing Enemy Animation module.

---

## Architecture

The Enemy Patrol feature introduces a dedicated Patrol Controller responsible for controlling enemy movement during the passive state.

The patrol system determines when an enemy should remain idle, choose a patrol destination, move toward that destination, and begin a new patrol cycle.

Movement decisions are isolated from rendering. Enemy state changes are propagated to the existing Enemy Animation system, which is responsible for updating the visual representation.

### High-Level Architecture

```text
                 Enemy Spawn
                      │
                      ▼
                   Enemy
                      │
                      ▼
             Patrol Controller
                      │
       ┌──────────────┴──────────────┐
       ▼                             ▼
 Patrol Destination          Enemy Movement
       │                             │
       └──────────────┬──────────────┘
                      ▼
        Enemy State / Direction
                      │
                      ▼
          Enemy Animation Module
                      │
                      ▼
           EnemySpriteComposer
                      │
                      ▼
       EnemyAnimationController
                      │
                      ▼
          Phaser Animation Manager
```

Enemy Patrol is responsible only for deciding movement.

Enemy Animation remains responsible for animation playback.

---

## Components and Interfaces

### Enemy

**Responsibilities**

- Store the spawn position.
- Store the current world position.
- Store the current movement state.
- Store the current facing direction.
- Expose movement operations to the Patrol Controller.

Enemy must not contain patrol decision logic.

---

### Patrol Controller

**Responsibilities**

- Initialize patrol behavior.
- Store the patrol origin.
- Select patrol destinations.
- Control idle timers.
- Control enemy movement.
- Update movement state.
- Update facing direction.

The Patrol Controller is the only component responsible for autonomous patrol behavior.

---

### Patrol Destination Generator

**Responsibilities**

- Generate valid patrol destinations.
- Restrict generated positions to the patrol area.
- Reject invalid destinations.
- Produce randomized movement.

This component must remain deterministic with respect to the configured patrol radius.

---

### Enemy Movement System

**Responsibilities**

- Move enemies toward patrol destinations.
- Notify the Patrol Controller when movement is completed.
- Update the enemy position.
- Update the enemy direction.

Movement implementation must remain reusable by future AI systems.

---

### Enemy Animation Module

**Responsibilities**

- Receive state updates.
- Receive direction updates.
- Play Idle animations.
- Play Walking animations.

Enemy Patrol never plays animations directly.

---

### MainScene

**Responsibilities**

- Update Patrol Controllers during the game loop.
- Keep patrol execution synchronized with the scene update cycle.

MainScene must not implement patrol logic.

---

## Data Models

### Patrol State

Supported values:

```text
Idle

Walking
```

These states are synchronized with the Enemy Animation module.

---

### Patrol Origin

Represents the original spawn position.

```text
spawnX

spawnY
```

The patrol origin never changes during the enemy's lifetime.

---

### Patrol Destination

Represents the temporary target selected by the Patrol Controller.

```text
destinationX

destinationY
```

A new destination is generated every patrol cycle.

---

### Patrol Area

Represents the maximum movement region around the spawn position.

Example:

```text
Spawn Position

        ○

Movement Radius

      5 tiles
```

The patrol area determines where destinations may be generated.

---

## Correctness Properties

The following invariants must always hold:

- Every enemy must preserve its original spawn position.
- Patrol destinations must always remain inside the patrol area.
- Patrol movement must always begin from the current enemy position.
- Idle periods must always occur between patrol movements.
- Enemy state transitions must remain synchronized with Enemy Animation.
- Enemy Patrol must never invoke Phaser animations directly.
- Enemy Patrol must never communicate with the backend.
- Enemy Patrol must never contain combat logic.
- Enemy Patrol must remain independent from player detection.
- Enemy Patrol must remain reusable by future AI behaviors.

---

## Error Handling

The system shall gracefully handle the following situations:

- Invalid patrol destinations.
- Patrol destinations outside the patrol radius.
- Movement interruptions.
- Missing enemy references.
- Invalid movement state transitions.
- Unexpected patrol failures.

Whenever patrol execution cannot continue safely, the enemy shall transition to the Idle state and wait for the next patrol cycle.

The scene must never terminate because of patrol failures.

---

## Testing Strategy

### Unit Testing

Verify that:

- Patrol destinations are generated correctly.
- Patrol destinations remain inside the patrol area.
- Idle timers work correctly.
- Patrol state transitions are valid.
- Direction updates are calculated correctly.

---

### Integration Testing

Verify that:

- Spawned enemies automatically begin patrol behavior.
- Patrol movement updates enemy position.
- Enemy Animation receives state changes.
- Walking animations play during movement.
- Idle animations play while waiting.
- Patrol cycles repeat correctly.
- Multiple enemies patrol simultaneously.

---

### End-to-End Testing

Verify that:

- Every spawned Skeleton begins patrolling automatically.
- Patrol movement remains inside the configured patrol radius.
- Idle and Walking states transition correctly.
- Enemy animations remain synchronized with patrol behavior.
- Multiple enemies patrol independently.
- Patrol behavior continues throughout the lifetime of the scene.
- Patrol remains independent from player detection, combat, and backend communication.
```