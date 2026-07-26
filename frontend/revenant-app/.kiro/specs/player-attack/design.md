# Player Attack - Design Document

## Overview

The Player Attack feature enables the player to perform melee attacks against enemies in the game world.

When the player presses the left mouse button, the system validates whether an attack can be executed. If the attack is allowed, the player performs the corresponding attack animation, creates an attack hitbox based on the player's current direction, detects every enemy inside the attack range, and generates an `AttackRequest`.

The `AttackRequest` is processed entirely by the local Combat System. No backend communication occurs during attack execution.

The Combat System is responsible for resolving the attack locally. Only when an enemy is defeated will another module persist the combat result to the backend.

This feature is responsible only for attack execution.

The following functionality is explicitly out of scope:

- Damage calculation
- Critical hits
- Enemy health modification
- Enemy death
- Experience rewards
- Gold rewards
- Loot generation
- Backend communication
- Skill system
- Combo attacks

This specification complies with the architecture defined under `docs/architecture/`.

---

## Architecture

The Player Attack feature executes entirely inside the Phaser game loop.

The feature is independent from enemy AI, reward calculation and backend persistence.

Every attack is resolved locally.

## High-Level Architecture

```text
Left Mouse Button

        │

        ▼

PlayerAttackSystem

        │

        ▼

Validate Attack State

        │

        ▼

Play Attack Animation

        │

        ▼

Create Attack Hitbox

        │

        ▼

Detect Enemies

        │

        ▼

Generate AttackRequest

        │

        ▼

CombatSystem

        │

        ▼

Resolve Combat Locally
```

---

## Components and Interfaces

## PlayerAttackSystem

### Responsibility

Coordinates the complete player attack workflow.

### Responsibilities

- Listen for left mouse button input.
- Validate attack cooldown.
- Validate attack state.
- Determine attack direction.
- Create the attack hitbox.
- Detect enemies inside the attack range.
- Generate an AttackRequest.
- Deliver the AttackRequest to the Combat System.

### Dependencies

- Player
- Enemy Collection
- AttackHitbox
- AttackAnimation
- CombatSystem

---

## AttackHitbox

### Responsibility

Represents the area affected by the player's attack.

### Responsibilities

- Build the attack area.
- Detect every enemy inside the attack range.
- Return the collection of affected enemies.

### Input

```text
Player Position
Attack Direction
Attack Range
```

### Output

```text
Enemy[]
```

---

## AttackAnimation

### Responsibility

Controls the player's attack animation.

### Responsibilities

- Select the correct animation.
- Play the animation.
- Notify when the animation finishes.

---

## AttackRequest

### Responsibility

Represents a player attack waiting to be processed.

### Properties

```text
attacker

targets[]

direction

timestamp
```

The AttackRequest contains only information required to resolve the combat locally.

It contains no networking information.

---

## CombatSystem

### Responsibility

Processes attack requests locally.

### Responsibilities

- Receive AttackRequest objects.
- Resolve the attack locally.
- Apply combat rules.
- Notify subsequent systems when an enemy is defeated.

The CombatSystem is not responsible for backend persistence.

---

## Player

### Responsibility

Acts as the attack initiator.

### Responsibilities

- Maintain attack state.
- Maintain attack cooldown.
- Provide position.
- Provide attack direction.

---

## Data Models

## AttackRequest

```text
AttackRequest

attacker

targets[]

direction

timestamp
```

---

## AttackHitbox

```text
AttackHitbox

position

direction

range

width

height
```

---

## AttackState

```text
AttackState

isAttacking

cooldown

lastAttackTime
```

---

## Correctness Properties

## Attack Validation

- The player SHALL only attack when the cooldown has expired.
- The player SHALL not begin another attack while already attacking.
- Every valid attack SHALL generate exactly one AttackRequest.

---

## Target Detection

- Every enemy inside the attack hitbox SHALL be included in the AttackRequest.
- Enemies outside the attack hitbox SHALL never be included.
- An attack SHALL complete successfully even when no enemies are detected.

---

## Combat Integration

- Every AttackRequest SHALL be delivered to the local CombatSystem.
- Player Attack SHALL never resolve combat directly.
- Player Attack SHALL never calculate damage.
- Player Attack SHALL never modify enemy state.

---

## Local Combat

- Combat SHALL be resolved entirely on the client.
- Attack execution SHALL never require backend communication.
- Attack execution SHALL not depend on network availability.

---

## Separation of Responsibilities

- Player Attack SHALL only execute attacks.
- Player Attack SHALL not calculate damage.
- Player Attack SHALL not modify enemy health.
- Player Attack SHALL not remove enemies.
- Player Attack SHALL not calculate rewards.
- Player Attack SHALL not communicate with the backend.

---

# Error Handling

## Attack During Cooldown

If the player attempts to attack while the cooldown is active:

- The attack is ignored.
- No animation is played.
- No AttackRequest is generated.

---

## No Enemy Detected

If no enemy is inside the attack hitbox:

- The attack animation completes normally.
- An AttackRequest with an empty target collection is generated.
- Gameplay continues normally.

---

## Animation Failure

If the attack animation cannot be played:

- The error is logged.
- The attacking state is cleared.
- Gameplay continues.

---

## Invalid Player State

If the player cannot attack because of an invalid state:

- The attack request is rejected.
- No hitbox is created.
- No AttackRequest is generated.

---

# Testing Strategy

## Unit Testing

Verify:

- Attack cooldown validation.
- Attack state transitions.
- Attack direction calculation.
- Attack hitbox generation.
- Enemy detection.
- AttackRequest creation.

---

## Integration Testing

Verify:

- Left mouse button triggers an attack.
- The correct attack animation is played.
- The attack hitbox detects every enemy inside the attack range.
- An AttackRequest is delivered to the CombatSystem.
- Multiple enemies are included in the same AttackRequest.
- No backend communication occurs during attack execution.

---

## End-to-End Testing

Verify the following gameplay flow:

```text
Player presses Left Mouse Button

↓

Attack cooldown validation

↓

Attack animation starts

↓

Attack hitbox is created

↓

Enemies inside the hitbox are detected

↓

AttackRequest is generated

↓

CombatSystem receives the AttackRequest

↓

Combat is resolved locally

↓

Attack animation finishes

↓

Player returns to idle state
```

The feature is considered complete when the player can execute melee attacks, detect every enemy inside the attack area, generate an `AttackRequest`, and deliver it to the local CombatSystem without performing any backend communication.