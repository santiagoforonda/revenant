# Requirements Document

## Introduction

The Player Attack feature enables the player to perform melee attacks against enemies in the game world.

When the player presses the left mouse button, the system validates whether an attack can be executed. If the attack is valid, the player performs the corresponding attack animation, detects all enemies inside the attack range, and generates an attack request for the Combat System.

This feature is responsible only for attack execution.

The following functionality is explicitly out of scope:

- Damage calculation
- Enemy health modification
- Enemy death
- Experience rewards
- Gold rewards
- Loot generation
- Skill system
- Combo system

---

## Glossary

| Term | Description |
|------|-------------|
| Attack Range | Maximum distance where an enemy can be hit by the player's attack. |
| Attack Cooldown | Minimum time between two consecutive attacks. |
| Attack Direction | Direction in which the player performs the attack. |
| Attack Hitbox | Area used to detect enemies affected by the attack. |
| Attack Request | Information generated after a successful attack that is consumed by the Combat System. |

---

## Requirements

## Requirement 1 - Trigger Player Attack

**User Story:** As a player, I want to attack using the left mouse button so that I can fight enemies.

### Acceptance Criteria

1. WHEN the player presses the left mouse button THEN the system SHALL attempt to execute an attack.
2. IF the player is currently attacking THEN the system SHALL ignore additional attack requests.
3. IF the attack cooldown has not finished THEN the system SHALL ignore the attack request.
4. WHEN an attack starts THEN the system SHALL enter the attacking state.

---

## Requirement 2 - Play Attack Animation

**User Story:** As a player, I want my character to perform an attack animation whenever I attack.

### Acceptance Criteria

1. WHEN an attack begins THEN the system SHALL play the attack animation corresponding to the player's current direction.
2. WHEN the attack animation finishes THEN the player SHALL return to the idle or movement state.
3. WHILE the attack animation is playing THEN no additional attack animation SHALL start.
4. THE attack animation SHALL complete regardless of whether an enemy is hit.

---

## Requirement 3 - Detect Attack Targets

**User Story:** As a player, I want my attack to affect every enemy inside the attack range.

### Acceptance Criteria

1. WHEN an attack is executed THEN the system SHALL create an attack hitbox.
2. WHEN the hitbox is evaluated THEN the system SHALL detect every enemy inside the attack range.
3. IF no enemy is inside the attack range THEN the attack SHALL still complete successfully.
4. EACH detected enemy SHALL be included in the generated attack request.

---

## Requirement 4 - Generate Attack Request

**User Story:** As a developer, I want every attack to generate a combat request so that the Combat System can process it.

### Acceptance Criteria

1. WHEN an attack successfully executes THEN the system SHALL generate an Attack Request.
2. THE Attack Request SHALL include the attacking player.
3. THE Attack Request SHALL include every enemy detected by the attack hitbox.
4. THE Attack Request SHALL include the attack direction.
5. THE Attack Request SHALL be delivered to the Combat System.

---

## Requirement 5 - Attack Cooldown

**User Story:** As a player, I want attacks to respect a cooldown so that attacks cannot be spammed.

### Acceptance Criteria

1. AFTER an attack begins THEN the attack cooldown SHALL start.
2. WHILE the cooldown is active THEN additional attacks SHALL not be executed.
3. WHEN the cooldown expires THEN the player SHALL be allowed to attack again.
4. THE cooldown SHALL be configurable.

---

## Requirement 6 - Attack State Management

**User Story:** As a developer, I want the player attack state to be managed consistently.

### Acceptance Criteria

1. WHEN an attack starts THEN the player SHALL enter the attacking state.
2. WHEN the attack finishes THEN the player SHALL leave the attacking state.
3. THE attacking state SHALL prevent overlapping attacks.
4. THE attacking state SHALL not affect player health or enemy state.

---

## Requirement 7 - Responsibility Separation

**User Story:** As a developer, I want the attack system to remain independent from combat resolution.

### Acceptance Criteria

1. The Player Attack feature SHALL detect attack requests.
2. The Player Attack feature SHALL play attack animations.
3. The Player Attack feature SHALL detect attack targets.
4. The Player Attack feature SHALL generate Attack Requests.
5. The Player Attack feature SHALL not calculate damage.
6. The Player Attack feature SHALL not modify enemy health.
7. The Player Attack feature SHALL not remove enemies from the scene.
8. The Player Attack feature SHALL not grant experience or gold.
9. The Player Attack feature SHALL not communicate with the backend.