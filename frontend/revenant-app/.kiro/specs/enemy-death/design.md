# Enemy Death - Design Document

## Overview

The Enemy Death feature is responsible for managing the complete lifecycle of an enemy after it has been defeated.

The feature subscribes to `EnemyDefeatedEvent` events published by the Combat System. Once an enemy is defeated, the Enemy Death feature disables every gameplay behavior associated with the enemy, plays the death animation, removes the enemy from the active scene, and publishes an `EnemyRemovedEvent`.

The Enemy Death feature is executed entirely on the client.

The Reward System consumes the `EnemyRemovedEvent` to calculate rewards and persist player progression.

The following functionality is explicitly out of scope:

- Combat resolution
- Damage calculation
- Reward calculation
- Experience calculation
- Gold calculation
- Loot generation
- Backend persistence
- Enemy respawn

This specification complies with the architecture defined under `docs/architecture/`.

---

## Architecture

The Enemy Death feature is responsible for the final stage of the enemy lifecycle.

It receives defeat notifications from the Combat System and publishes removal notifications for downstream systems.

## High-Level Architecture

```text
CombatSystem

        │

        ▼

EnemyDefeatedEvent

        │

        ▼

EnemyDeathSystem

        │

        ▼

Disable Enemy

        │

        ▼

Play Death Animation

        │

        ▼

Remove Enemy

        │

        ▼

EnemyRemovedEvent

        │

        ▼

RewardSystem
```

---

## Components and Interfaces

## EnemyDeathSystem

### Responsibility

Coordinates the complete enemy death sequence.

### Responsibilities

- Subscribe to `EnemyDefeatedEvent`.
- Start the death sequence.
- Disable enemy behavior.
- Play the death animation.
- Remove the enemy from the scene.
- Publish `EnemyRemovedEvent`.

### Dependencies

- Enemy
- DeathAnimationController
- Event Bus
- Phaser Scene

---

## DeathAnimationController

### Responsibility

Controls the enemy death animation.

### Responsibilities

- Play the configured death animation.
- Notify when the animation finishes.
- Prevent additional animations during the death sequence.

---

## Enemy

### Responsibility

Represents a defeated enemy.

### Responsibilities

- Stop movement.
- Disable AI.
- Disable collisions.
- Disable combat participation.
- Destroy its Phaser resources when requested.

### Public Methods

```text
disable()

destroy()

isDead()
```

---

## EnemyRemovedEvent

### Responsibility

Notifies downstream systems that an enemy has been completely removed from the game world.

### Properties

```text
enemy

timestamp
```

The event is consumed by the Reward System.

---

## Data Models

## EnemyRemovedEvent

```text
EnemyRemovedEvent

enemy

timestamp
```

---

## EnemyDeathState

```text
EnemyDeathState

isDead

isRemoving

animationFinished

removed
```

---

## DeathAnimationResult

```text
DeathAnimationResult

completed

duration
```

---

## Correctness Properties

## Death Sequence

- Every defeated enemy SHALL begin exactly one death sequence.
- The death sequence SHALL execute in the following order:
  1. Disable enemy behavior.
  2. Play the death animation.
  3. Remove the enemy.
  4. Publish `EnemyRemovedEvent`.
- The sequence SHALL not be interrupted.

---

## Enemy State

- A defeated enemy SHALL immediately stop moving.
- A defeated enemy SHALL immediately stop executing AI behaviors.
- A defeated enemy SHALL immediately stop participating in combat.
- A defeated enemy SHALL immediately stop generating collisions.

---

## Animation Consistency

- The death animation SHALL play exactly once.
- No other animation SHALL execute during the death sequence.
- The enemy SHALL remain visible until the animation finishes.

---

## Scene Consistency

- Removed enemies SHALL no longer exist in the active scene.
- Removed enemies SHALL no longer receive update calls.
- Removed enemies SHALL release all Phaser resources.
- Removed enemies SHALL no longer participate in collision detection.

---

## Event Generation

- Every removed enemy SHALL generate exactly one `EnemyRemovedEvent`.
- The event SHALL only be published after the enemy has been removed from the scene.
- The event SHALL never perform backend communication.

---

## Local Execution

- Enemy removal SHALL execute entirely on the client.
- The feature SHALL never perform HTTP requests.
- Backend persistence SHALL be delegated to the Reward System.

---

## Separation of Responsibilities

- Enemy Death SHALL only manage the enemy removal lifecycle.
- Enemy Death SHALL not calculate damage.
- Enemy Death SHALL not calculate rewards.
- Enemy Death SHALL not update the HUD.
- Enemy Death SHALL not persist player progression.
- Enemy Death SHALL not communicate with the backend.

---

# Error Handling

## Duplicate Defeat Event

If multiple `EnemyDefeatedEvent` events are received for the same enemy:

- Only the first event is processed.
- Subsequent events are ignored.
- The error is logged.

---

## Animation Failure

If the death animation cannot be played:

- The enemy is removed immediately.
- The error is logged.
- `EnemyRemovedEvent` is still published.

---

## Enemy Already Removed

If the enemy has already been removed:

- The removal request is ignored.
- No duplicate events are published.

---

## Resource Cleanup Failure

If resource cleanup fails:

- Remaining resources continue to be released.
- The error is logged.
- Gameplay continues normally.

---

# Testing Strategy

## Unit Testing

Verify:

- Death sequence execution.
- Enemy behavior disabling.
- Death animation execution.
- Enemy removal.
- Resource cleanup.
- EnemyRemovedEvent publication.

---

## Integration Testing

Verify:

- `EnemyDefeatedEvent` triggers the death sequence.
- Enemy AI is disabled immediately.
- Enemy collisions are disabled.
- Death animation completes successfully.
- Enemy is removed from the scene.
- `EnemyRemovedEvent` is published exactly once.
- No backend communication occurs during the death sequence.

---

## End-to-End Testing

Verify the following gameplay flow:

```text
CombatSystem defeats an enemy

↓

EnemyDefeatedEvent is published

↓

EnemyDeathSystem receives the event

↓

Enemy movement and AI are disabled

↓

Death animation starts

↓

Death animation finishes

↓

Enemy is removed from the scene

↓

EnemyRemovedEvent is published

↓

RewardSystem receives the event
```

The feature is considered complete when every defeated enemy executes exactly one death sequence, is removed cleanly from the scene after the death animation, publishes a single `EnemyRemovedEvent`, and performs no backend communication during the entire process.