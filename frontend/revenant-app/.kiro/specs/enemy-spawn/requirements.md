# Requirements Document

## Introduction

This document defines the functional requirements for the Enemy Spawn feature.

The purpose of this feature is to instantiate enemies in the game world by combining the spawn information defined in the Tiled map with the enemy statistics provided by the backend.

The Tiled map is the source of truth for enemy spawn locations, while the backend is the source of truth for enemy attributes.

This feature belongs exclusively to the Phaser game module and introduces the first integration between the frontend game client and the backend API.

---

## Glossary

| Term | Definition |
|------|------------|
| Enemy Spawn | An object placed in the Tiled Object Layer that defines where an enemy should appear. |
| Enemy Service | Frontend service responsible for retrieving enemy data from the backend API. |
| Enemy Factory | Component responsible for creating Enemy entities from backend data and spawn information. |
| Enemy Entity | A Phaser entity representing an enemy in the game world. |
| Enemy Response | DTO returned by the backend containing the enemy statistics. |
| Spawn Point | Position defined in Tiled where an enemy instance should be created. |
| Object Layer | Tiled layer containing enemy spawn objects. |

---

## Requirements

### Requirement 1:Retrieve Enemy Data

**User Story**

As a player, I want the game to retrieve the enemy information from the backend so that every spawned enemy uses the official game data.

#### Acceptance Criteria

1. WHEN a map is loaded THEN the system SHALL request the enemy catalog using `GET /api/world/maps/enemies/{mapId}`.
2. WHEN the backend responds successfully THEN the system SHALL store the retrieved enemy data for the current map.
3. IF the backend request fails THEN the system SHALL not create any enemy entities.
4. IF the backend returns an empty collection THEN the system SHALL not create any enemy entities.

---

### Requirement 2: Read Enemy Spawn Objects

**User Story**

As a level designer, I want to define enemy spawn locations inside Tiled so that enemy placement can be managed visually.

#### Acceptance Criteria

1. WHEN a map is loaded THEN the system SHALL read the enemy spawn Object Layer.
2. WHEN an enemy spawn object is found THEN the system SHALL read its position.
3. WHEN an enemy spawn object is found THEN the system SHALL read its `enemyId` property.
4. IF an object does not contain an `enemyId` property THEN the system SHALL ignore the object.

---

### Requirement 3: Match Spawn Objects with Backend Data

**User Story**

As a developer, I want each spawn object to be matched with the corresponding backend data so that spawned enemies receive the correct attributes.

#### Acceptance Criteria

1. WHEN an enemy spawn object is processed THEN the system SHALL search the backend response for the matching enemy identifier.
2. IF a matching enemy exists THEN the system SHALL create an Enemy entity.
3. IF no matching enemy exists THEN the system SHALL ignore the spawn object.
4. WHERE multiple spawn objects reference the same enemy identifier THEN the system SHALL create one Enemy entity for each spawn object.

---

### Requirement 4: Create Enemy Entities

**User Story**

As a player, I want enemies to appear in the correct locations so that the game world matches the level design.

#### Acceptance Criteria

1. WHEN an Enemy entity is created THEN the system SHALL position it using the coordinates defined in Tiled.
2. WHEN an Enemy entity is created THEN the system SHALL initialize its statistics using the backend response.
3. WHEN an Enemy entity is created THEN the system SHALL add it to the active Phaser scene.
4. WHEN multiple spawn objects exist THEN the system SHALL create one Enemy entity for each valid spawn object.

---

### Requirement 5: Enemy Factory

**User Story**

As a developer, I want enemy creation to be centralized so that new enemy types can be added without modifying the scene.

#### Acceptance Criteria

1. WHEN an enemy is spawned THEN the system SHALL create it through the Enemy Factory.
2. WHEN the Enemy Factory receives backend data THEN it SHALL instantiate the appropriate Enemy entity.
3. WHEN additional enemy types are introduced THEN the factory SHALL remain extensible without modifying the spawning workflow.

---

### Requirement 6: Architecture Compliance

**User Story**

As a developer, I want the enemy spawning system to preserve the existing project architecture so that future gameplay systems remain maintainable.

#### Acceptance Criteria

1. WHEN implementing enemy spawning THEN the system SHALL keep backend communication inside the Enemy Service.
2. WHEN implementing enemy spawning THEN the MainScene SHALL not contain backend communication logic.
3. WHEN implementing enemy spawning THEN the Enemy Factory SHALL be responsible for entity creation.
4. WHEN implementing enemy spawning THEN the Tiled map SHALL remain responsible only for enemy spawn positions and identifiers.
5. WHEN implementing enemy spawning THEN the backend SHALL remain responsible only for enemy statistics.
6. WHEN implementing this feature THEN the system SHALL not implement enemy AI, combat, animations, player interaction, or reward distribution.