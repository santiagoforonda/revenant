# Enemy Spawn - Design Document

## Overview

This document describes the design of the Enemy Spawn feature.

The purpose of this feature is to instantiate enemies in the game world by combining the spawn information defined in the Tiled map with the enemy data retrieved from the backend.

The frontend shall use the Tiled Object Layer as the source of truth for enemy locations and the backend as the source of truth for enemy attributes.

This feature introduces the first gameplay integration between the Phaser client and the Revenant backend.

---

## Architecture

The Enemy Spawn feature is responsible only for creating enemy entities.

Enemy behavior, animations, combat, collisions, rewards, and artificial intelligence belong to future specifications.

The spawning workflow is divided into four responsibilities:

- Retrieve the enemy catalog from the backend.
- Read the enemy spawn objects from the Tiled map.
- Match each spawn object with its backend definition.
- Instantiate the corresponding Enemy entity.

### High-Level Architecture

```text
                  MainScene
                      │
                      ▼
             EnemyService (API)
                      │
                      ▼
 GET /api/world/maps/enemies/{mapId}
                      │
                      ▼
            EnemyResponse Collection
                      │
                      ▼
          Build Enemy Lookup Table
                      │
                      ▼
        Read Tiled Object Layer
                      │
                      ▼
             Enemy Spawn Objects
                      │
                      ▼
               Enemy Factory
                      │
                      ▼
              Enemy Entities
                      │
                      ▼
          Add Enemies to MainScene
```

The backend never determines enemy positions.

The Tiled map never defines enemy statistics.

Each system owns a single responsibility.

---

## Components and Interfaces

### MainScene

**Responsibilities**

- Load the current map.
- Request the enemy catalog for the active map.
- Read the enemy spawn Object Layer.
- Delegate enemy creation to the Enemy Factory.
- Add created enemies to the Phaser scene.

**Dependencies**

- EnemyService
- EnemyFactory
- Tiled Map

---

### EnemyService

**Responsibilities**

- Consume the backend endpoint:

```text
GET /api/world/maps/enemies/{mapId}
```

- Retrieve the enemy catalog.
- Expose enemy definitions to the game.

**Dependencies**

- Revenant API Client

---

### EnemyFactory

**Responsibilities**

- Receive backend enemy data.
- Receive spawn information from Tiled.
- Instantiate the correct Enemy entity.
- Initialize enemy statistics.
- Initialize spawn position.

The factory must centralize enemy creation.

---

### Enemy Entity

**Responsibilities**

- Store enemy statistics.
- Store spawn position.
- Expose enemy information for future gameplay systems.

This feature does not implement movement or AI.

---

### Tiled Object Layer

**Responsibilities**

- Define enemy spawn locations.
- Define the `enemyId` property for each spawn object.

The Object Layer does not define gameplay statistics.

---

## Data Models

### Backend Model

The feature consumes the existing `EnemyResponse` returned by:

```text
GET /api/world/maps/enemies/{mapId}
```

The response contains:

- id
- id_map
- healthPoints
- damagePoints
- armorPoints
- goldReward
- xpReward
- speedAttackPoints
- name
- description

No backend models are modified.

---

### Tiled Spawn Object

Each enemy spawn object shall contain:

- Position (x, y)
- enemyId

The `enemyId` property references the backend enemy identifier.

Example:

```text
Enemy Spawn

x = 640
y = 352

enemyId = 15
```

---

### Enemy Lookup Table

After retrieving the backend response, the Enemy Service should expose a lookup structure indexed by enemy identifier.

Example:

```text
15 → Skeleton

16 → Wolf

17 → Hedgehog

18 → Minotaur
```

This lookup allows efficient matching between spawn objects and backend data.

---

## Correctness Properties

The following invariants must always hold:

- The backend remains the source of truth for enemy statistics.
- The Tiled map remains the source of truth for enemy spawn positions.
- Every spawned enemy must correspond to a valid backend definition.
- Every valid spawn object creates exactly one Enemy entity.
- Multiple spawn objects may reference the same backend enemy definition.
- Enemy creation must always occur through the Enemy Factory.
- MainScene must not instantiate Enemy entities directly.
- MainScene must not contain backend communication logic.
- This feature must not implement AI, animations, combat, rewards, or player interaction.

---

## Error Handling

The system shall gracefully handle the following situations:

- Backend request failure.
- Empty backend response.
- Missing enemy spawn layer.
- Spawn object without `enemyId`.
- Spawn object referencing an unknown enemy.
- Invalid enemy data returned by the backend.

Failures shall prevent the creation of invalid enemies without interrupting the game.

---

## Testing Strategy

### Unit Testing

Verify that:

- EnemyService retrieves enemy data correctly.
- EnemyFactory creates the correct Enemy entity.
- Spawn objects are correctly matched using `enemyId`.
- Invalid spawn objects are ignored.

---

### Integration Testing

Verify that:

- Enemy data is successfully retrieved from the backend.
- Tiled spawn objects create enemies at the correct positions.
- Enemy statistics are initialized using backend data.
- Multiple spawn points referencing the same enemy create independent instances.

---

### End-to-End Testing

Verify that:

- Loading map 1 requests `GET /api/world/maps/enemies/1`.
- Every Skeleton spawn (`enemyId = 15`) creates a Skeleton entity.
- All spawned Skeletons share the backend statistics.
- Every Skeleton appears at the coordinates defined in the Tiled Object Layer.
- The scene loads successfully even when no enemies are returned by the backend.