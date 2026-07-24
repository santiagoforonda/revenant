# Design Document

## Overview

This document describes the design for the Player Movement feature.

The objective of this feature is to allow the player to move through the game world using the **W**, **A**, **S**, and **D** keys while respecting the architectural principles defined in `game-directory-structure.md`.

The movement system will become the foundation for future gameplay mechanics including combat, NPC interaction, enemy AI, item collection, and exploration.

No backend communication is required for this feature.

---

## Architecture

## High-Level Flow

```text
Keyboard Input
        │
        ▼
MainScene
        │
        ▼
Player
        │
        ▼
Arcade Physics
        │
        ├────────────► Helmet Sprite
        │
        ▼
Collision Layer
        │
        ▼
Camera
```

The MainScene is responsible for reading keyboard input every frame.

The Player entity is responsible for updating its movement using Arcade Physics.

The Helmet sprite is synchronized with the Player after every movement update.

The collision layer prevents the player from crossing blocked tiles.

The camera continuously follows the player's position.

---

## Components and Interfaces

## MainScene

### Responsibilities

- Register the WASD keyboard keys.
- Read player input during the update loop.
- Forward movement information to the Player entity.
- Configure map collisions.
- Maintain camera tracking.

### Out of Scope

MainScene must not:

- Implement movement calculations.
- Manipulate player position directly.
- Implement gameplay rules.

---

## Player

### Responsibilities

- Store the player movement state.
- Update movement velocity.
- Update player direction.
- Expose current position.
- Synchronize body and helmet sprites.

### Public Interface

The Player entity should provide methods similar to:

- move()
- stop()
- setDirection()
- update()
- getPosition()
- getBody()
- getHelmet()

The exact implementation remains internal to the entity.

---

## Helmet

### Responsibilities

The helmet remains an independent sprite.

It is responsible only for visual representation.

Its position is updated from the Player every frame.

The helmet must never implement movement logic.

---

## Collision Layer

### Responsibilities

- Define the walkable and blocked areas.
- Prevent the Player from crossing solid tiles.
- Work through Phaser Arcade Physics.

---

## Camera

### Responsibilities

- Follow the Player continuously.
- Respect world bounds.
- Preserve the configured zoom level.

---

## Data Models

This feature does not introduce new domain models.

No backend entities are modified.

No REST endpoints are added.

No DTOs are required.

The movement state exists only during gameplay inside the Phaser module.

---

## Error Handling

The movement system should gracefully handle the following situations:

- Missing keyboard input.
- Missing collision layer.
- Invalid player spawn position.

The game should continue running whenever possible without crashing the current scene.

---

## Testing Strategy

The implementation should verify:

- Movement in the four directions.
- Player stops immediately after releasing movement keys.
- Camera continues following the player.
- Player cannot cross collidable tiles.
- Helmet remains synchronized with the player.
- Movement speed remains constant throughout gameplay.

---

# Design Decisions

- Phaser Arcade Physics will be used for all player movement.
- Keyboard input will use the WASD keys exclusively.
- The Player entity owns the movement behavior.
- The Helmet remains an independent render entity synchronized by the Player.
- Movement logic remains independent from rendering responsibilities.
- This feature does not communicate with the backend.