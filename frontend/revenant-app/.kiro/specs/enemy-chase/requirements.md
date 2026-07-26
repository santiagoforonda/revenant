# Requirements Document

## Introduction

This document defines the functional requirements for the Enemy Chase feature.

The purpose of this feature is to allow enemies to actively pursue the player after the Enemy Detection module has detected the player's presence.

Enemy Chase is responsible only for moving the enemy toward the player's current position. It does not implement combat, attack logic, damage calculation, pathfinding, or enemy return behavior.

This feature extends the Enemy Detection module and serves as the transition between passive AI and combat AI.

---

## Glossary

| Term | Definition |
|------|------------|
| Chase Controller | Component responsible for pursuing the detected player. |
| Chase State | State indicating that the enemy is actively pursuing the player. |
| Detection Controller | Component responsible for determining whether the player is inside the detection radius. |
| Chase Target | The current world position of the detected player. |
| Chase Speed | The movement speed used while pursuing the player. |
| Detection Radius | Distance at which an enemy detects the player. |
| Lost Target | Situation where the player leaves the detection radius. |

---

# Requirements

## Requirement 1 - Chase Initialization

**User Story**

As a player, I want enemies to begin chasing me immediately after detecting me.

#### Acceptance Criteria

1. WHEN the Detection Controller reports that the player has been detected THEN the Chase Controller SHALL initialize pursuit.
2. WHEN pursuit begins THEN the enemy SHALL enter the Chase state.
3. WHEN chase is initialized THEN the controller SHALL use the player's current position as the chase target.
4. IF chase initialization fails THEN the enemy SHALL remain in its previous state without crashing the game.

---

## Requirement 2 - Player Pursuit

**User Story**

As a player, I want enemies to continuously move toward my position while I remain detected.

#### Acceptance Criteria

1. WHILE the player remains detected THEN the enemy SHALL continuously move toward the player's current position.
2. WHEN the player changes position THEN the chase target SHALL be updated.
3. WHEN the enemy moves THEN its position SHALL be updated continuously.
4. WHILE chasing THEN the enemy SHALL remain in the Chase state.

---

## Requirement 3 - Chase Direction

**User Story**

As a player, I want enemies to face the direction in which they are moving during pursuit.

#### Acceptance Criteria

1. WHEN the enemy moves during pursuit THEN its facing direction SHALL be updated.
2. WHEN movement direction changes THEN the facing direction SHALL be recalculated.
3. WHEN the enemy stops chasing THEN the last facing direction SHALL be preserved.
4. WHILE chasing THEN the walking animation SHALL match the current direction.

---

## Requirement 4 - Chase Termination

**User Story**

As a player, I want enemies to stop chasing me after I leave their detection range.

#### Acceptance Criteria

1. WHEN the Detection Controller reports that the player is no longer detected THEN the Chase Controller SHALL stop pursuit.
2. WHEN pursuit ends THEN the enemy SHALL exit the Chase state.
3. WHEN chase terminates THEN the enemy SHALL stop moving toward the player.
4. WHEN chase finishes THEN control SHALL be transferred to the future Enemy Return module.

---

## Requirement 5 - Continuous Chase Evaluation

**User Story**

As a player, I want enemies to continuously update their pursuit so that they always follow my latest position.

#### Acceptance Criteria

1. WHILE chasing THEN the Chase Controller SHALL evaluate the player's current position every update cycle.
2. WHEN the player changes direction THEN the chase path SHALL be updated.
3. WHEN the enemy reaches the player's current position THEN the controller SHALL continue tracking future player movement.
4. WHEN neither the player nor the enemy moves THEN the current chase state SHALL remain unchanged.

---

## Requirement 6 - AI Integration

**User Story**

As a developer, I want Enemy Chase to cooperate with the existing AI modules without assuming responsibility for combat.

#### Acceptance Criteria

1. WHEN the Detection Controller reports player detection THEN the Chase Controller SHALL begin pursuit.
2. WHEN the Detection Controller reports detection loss THEN the Chase Controller SHALL stop pursuit.
3. WHEN implementing this feature THEN Enemy Chase SHALL not implement attack behavior.
4. WHEN implementing this feature THEN Enemy Chase SHALL not implement damage calculation.

---

## Requirement 7 - Architecture Compliance

**User Story**

As a developer, I want Enemy Chase to remain isolated from other gameplay systems.

#### Acceptance Criteria

1. WHEN implementing this feature THEN Enemy Chase SHALL remain independent from Enemy Patrol.
2. WHEN implementing this feature THEN Enemy Chase SHALL remain independent from Enemy Combat.
3. WHEN implementing this feature THEN Enemy Chase SHALL remain independent from backend communication.
4. WHEN implementing this feature THEN pursuit logic SHALL be implemented through a dedicated Chase Controller.
5. WHEN implementing this feature THEN the Chase Controller SHALL react only to Detection Controller state changes.

---

## Requirement 8 - Error Handling

**User Story**

As a developer, I want chase failures to be handled safely without affecting the game.

#### Acceptance Criteria

1. IF the player reference becomes unavailable THEN the Chase Controller SHALL stop pursuit safely.
2. IF the enemy reference becomes unavailable THEN the Chase Controller SHALL terminate its update cycle.
3. IF an invalid chase target is detected THEN the enemy SHALL stop moving until a valid target becomes available.
4. IF an unexpected chase error occurs THEN the enemy SHALL stop chasing without terminating the scene.

---

## Requirement 9 - Scope Limitation

**User Story**

As a developer, I want this feature to remain focused exclusively on pursuit behavior.

#### Acceptance Criteria

1. WHEN implementing this feature THEN combat SHALL NOT be implemented.
2. WHEN implementing this feature THEN attack animations SHALL NOT be implemented.
3. WHEN implementing this feature THEN damage calculation SHALL NOT be implemented.
4. WHEN implementing this feature THEN pathfinding SHALL NOT be implemented.
5. WHEN implementing this feature THEN enemy return behavior SHALL NOT be implemented.
6. WHEN implementing this feature THEN Enemy Chase SHALL only move the enemy toward the detected player's current position.