# Player Animation - Design Document

## Overview

This document describes the design of the Player Animation feature.

The purpose of this feature is to animate the player according to its current movement state and direction. The animation system consumes the movement information already exposed by the `Player` entity and updates both the body and helmet animations accordingly.

This feature belongs exclusively to the Phaser game module and does not require backend communication.

---

## Architecture

The Player Animation feature extends the existing movement system by reacting to changes in the player's state and direction.

The movement system remains the source of truth for the player's state (`Idle` or `Walking`) and facing direction (`Up`, `Down`, `Left`, `Right`).

The animation system is responsible only for selecting and playing the appropriate animations for both the player body and the helmet.

### High-Level Architecture

```text
Keyboard Input
        │
        ▼
Movement System
        │
        ▼
Player State
(State + Direction)
        │
        ▼
Animation Controller
        │
        ├────────────► Body Sprite Animation
        │
        └────────────► Helmet Sprite Animation
```

The animation controller shall never determine movement or direction.

It shall only react to state changes produced by the movement system.

---

## Components and Interfaces

### MainScene

**Responsibilities**

- Register player and helmet animations during scene initialization.
- Invoke the animation update during the game loop.

**Dependencies**

- Player
- Phaser Animation Manager

---

### Player

**Responsibilities**

- Maintain the current movement state.
- Maintain the current facing direction.
- Expose the current state and direction.
- Trigger animation updates when required.

**Dependencies**

- Body Sprite
- Helmet Sprite

---

### Animation Controller

**Responsibilities**

- Select the correct animation according to the player's state.
- Play body animations.
- Play helmet animations.
- Prevent unnecessary animation restarts.

**Dependencies**

- Player
- Phaser Animation Manager

---

### Body Sprite

**Responsibilities**

- Render the player's body.
- Play the selected animation.

---

### Helmet Sprite

**Responsibilities**

- Render the equipped helmet.
- Play the corresponding helmet animation.
- Remain synchronized with the body animation.

---

## Data Models

This feature does not introduce new domain models.

No backend entities are modified.

No DTOs are introduced.

The feature consumes the existing player properties:

- Movement State
- Facing Direction

No persistent data is created.

---

## Correctness Properties

The following invariants must always hold:

- The movement system remains the only component responsible for determining movement state.
- The animation system never modifies player movement.
- The helmet animation always matches the body animation.
- Body and helmet always represent the same direction.
- Idle animations preserve the player's last facing direction.
- Phaser continues to own all animation execution.
- No backend communication is introduced.

---

## Error Handling

The system shall handle the following situations gracefully:

- Missing animation definitions.
- Attempting to play an animation that is already active.
- Missing helmet animations.
- Missing body animations.

Animation failures shall not interrupt gameplay or player movement.

---

## Testing Strategy

### Unit Testing

Verify that:

- The correct animation is selected for every movement state.
- The correct animation is selected for every direction.
- Animation changes are triggered only when state or direction changes.

### Integration Testing

Verify that:

- Player movement updates the correct animations.
- Helmet animations remain synchronized with body animations.
- Idle animations preserve the last movement direction.

### End-to-End Testing

Verify that:

- Walking in all four directions plays the correct animations.
- Releasing movement keys transitions to the corresponding idle animation.
- Body and helmet remain synchronized during the entire gameplay session.
- Player movement remains unaffected by the animation system.