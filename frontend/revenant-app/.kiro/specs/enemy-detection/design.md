# Enemy Detection - Design Document

## Overview

This document describes the design of the Enemy Detection feature.

The purpose of this feature is to determine whether the player is inside an enemy's configurable detection radius.

Enemy Detection is the first reactive behavior of the enemy AI. It extends the passive patrol system by monitoring the player's position and notifying future AI systems when the player enters or leaves the detection area.

This feature does not implement pursuit, combat, pathfinding, or movement decisions.

---

## Architecture

Enemy Detection introduces a dedicated Detection Controller responsible exclusively for evaluating the distance between the enemy and the player.

The Detection Controller continuously evaluates the player's position relative to the enemy's current position.

Whenever the player crosses the detection boundary, the controller updates the enemy detection state and notifies future AI systems.

Enemy Detection never decides how the enemy should react.

### High-Level Architecture

```text
               Player Position
                      │
                      ▼
            Detection Controller
                      ▲
                      │
               Enemy Position
                      │
                      ▼
            Detection Evaluation
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
 Player Detected          Player Not Detected
         │                         │
         └────────────┬────────────┘
                      ▼
             Enemy Detection State
                      │
                      ▼
          Future Enemy AI Systems
           (Chase, Return, Combat)
```

The Detection Controller only determines whether the player is inside the configured detection radius.

Future AI systems decide how to react.

---

## Components and Interfaces

### Enemy

**Responsibilities**

- Store the current world position.
- Store the current detection state.
- Expose the detection state to future AI systems.

Enemy must not perform distance calculations.

---

### Player

**Responsibilities**

- Expose its current world position.

The Player is not aware of the enemy detection system.

---

### Detection Controller

**Responsibilities**

- Evaluate the distance between the enemy and the player.
- Determine whether the player is inside the detection radius.
- Detect state transitions.
- Notify the enemy AI when the detection state changes.
- Avoid duplicate detection events.

The Detection Controller contains all detection logic.

---

### Detection Radius

**Responsibilities**

- Define the maximum detection distance.
- Allow different enemy types to use different detection ranges.
- Be configurable independently for each enemy type.

The detection radius is a gameplay configuration value.

---

### MainScene

**Responsibilities**

- Update Detection Controllers during each game loop.
- Provide access to player and enemy references.

MainScene must not contain detection logic.

---

## Data Models

### Detection State

Supported values:

```text
NotDetected

Detected
```

These values represent whether the player is currently inside the enemy's detection radius.

---

### Detection Radius

Represents the maximum distance for successful detection.

Example:

```text
Detection Radius

      ○───────────────○

        Enemy Position
```

The exact radius value is configurable for each enemy type.

---

### Detection Event

Supported events:

```text
PlayerDetected

PlayerLost
```

These events notify future AI systems when the detection state changes.

---

## Correctness Properties

The following invariants must always hold:

- Detection must be evaluated every update cycle.
- Detection calculations must use the current player position.
- Detection calculations must use the current enemy position.
- Detection events must only occur when the detection state changes.
- Duplicate detection events must never be generated.
- Enemy Detection must never control enemy movement.
- Enemy Detection must never start combat.
- Enemy Detection must never communicate with the backend.
- Detection logic must remain independent from Enemy Patrol.
- Future AI systems must consume detection events without modifying the Detection Controller.

---

## Error Handling

The system shall gracefully handle the following situations:

- Missing player reference.
- Missing enemy reference.
- Invalid detection radius.
- Invalid enemy state.
- Unexpected detection failures.

Whenever detection cannot be evaluated safely, the controller shall preserve the current detection state.

The scene must never terminate because of detection failures.

---

## Testing Strategy

### Unit Testing

Verify that:

- Distance calculations are correct.
- Detection state changes occur correctly.
- Duplicate detection events are prevented.
- Invalid detection radius values are handled safely.
- Missing references are handled safely.

---

### Integration Testing

Verify that:

- Every spawned enemy initializes a Detection Controller.
- Detection updates execute every game loop.
- Detection events occur when entering the detection radius.
- Detection loss events occur when leaving the detection radius.
- Multiple enemies detect the player independently.

---

### End-to-End Testing

Verify that:

- Patrolling enemies detect the player when entering their detection radius.
- Detection remains active while the player stays inside the radius.
- Detection is cleared when the player leaves the radius.
- Detection events occur only once per state transition.
- Multiple enemies detect the player independently.
- Enemy Detection remains independent from Patrol, Chase, Combat, and backend communication.
- Future AI modules can consume detection events without modifying the Detection Controller.