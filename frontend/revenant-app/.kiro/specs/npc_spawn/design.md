# NPC Spawn - Design Document

## Overview

The NPC Spawn feature is responsible for loading, creating, and positioning every NPC that belongs to the current map.

The feature combines NPC definitions received from the backend with the spawn points defined in the Tiled map and creates the corresponding game entities inside the active Phaser scene.

This feature is limited to NPC spawning only.

The following functionality is explicitly out of scope:

- NPC interaction
- Dialog system
- Quest system
- Store system
- NPC AI
- NPC movement

This specification complies with the architectural documentation defined under `docs/architecture/` and the steering documents for the Revenant project.

---

## Architecture

The NPC Spawn feature follows the architecture already defined for the game module.

Responsibilities are distributed as follows:

- React is responsible for backend communication.
- Phaser is responsible for rendering and gameplay.
- The Event Bus coordinates communication between React and Phaser.
- The Spawn feature is responsible only for NPC creation.

### High-Level Architecture

```text
Player enters a map
        │
        ▼
React requests NPC data
        │
        ▼
Backend returns NPC list
        │
        ▼
React publishes NPC data through the Event Bus
        │
        ▼
NpcSpawnManager receives the event
        │
        ▼
SpawnLoader loads NPC spawn points from Tiled
        │
        ▼
NpcFactory creates NPC entities
        │
        ▼
NPCs are added to the active Phaser Scene
```

---

## Components and Interfaces

### NpcSpawnManager

#### Responsibility

Coordinates the NPC spawning process.

#### Responsibilities

- Receive NPC data from the Event Bus.
- Coordinate the spawning workflow.
- Match NPCs with spawn points.
- Register created NPCs in the active scene.

#### Dependencies

- NpcFactory
- SpawnLoader
- Phaser Scene

---

### SpawnLoader

#### Responsibility

Loads NPC spawn points from the Tiled object layer.

#### Responsibilities

- Read the object layer.
- Locate NPC spawn definitions.
- Return the collection of spawn points.

#### Output

```text
NpcSpawnPoint[]
```

---

### NpcFactory

#### Responsibility

Creates NPC entities.

#### Responsibilities

- Instantiate NPC objects.
- Create Phaser sprites.
- Assign idle animations.
- Initialize NPC metadata.

#### Input

```text
NpcDto
NpcSpawnPoint
```

#### Output

```text
Npc
```

---

### Npc

#### Responsibility

Represents an NPC inside the game world.

#### Properties

- id
- name
- description
- phrases
- sprite
- position

#### Responsibilities

- Store NPC information.
- Maintain idle animation.
- Expose position for future interaction systems.

---

### Event Bus

#### Responsibility

Transfers NPC data from React to Phaser.

#### Responsibilities

- Receive NPC data after the backend request.
- Publish the spawn event.
- Decouple React from Phaser.

---

### Backend API

The backend exposes the endpoint:

```text
GET /api/world/maps/npc/{mapId}
```

The frontend consumes this endpoint before starting the spawning process.

---

## Data Models

### NpcDto

Represents the backend response.

```text
NpcDto

id
idMap
name
description
phrases
```

This DTO is received from the backend and must not be modified.

---

### NpcSpawnPoint

Represents a spawn location extracted from the Tiled map.

```text
NpcSpawnPoint

npcId
x
y
```

---

### Npc

Represents the instantiated game entity.

```text
Npc

id
name
description
phrases
sprite
position
```

---

## Correctness Properties

The following properties must always hold.

### Backend communication

- Phaser SHALL never perform HTTP requests.
- NPC data SHALL always be obtained through React.
- NPC data SHALL always be transferred through the Event Bus.

---

### Spawn consistency

- Every spawned NPC SHALL have a corresponding backend definition.
- Every spawned NPC SHALL have exactly one spawn point.
- NPCs SHALL only be spawned inside the active map.

---

### Scene consistency

- Every created NPC SHALL be registered in the active Phaser Scene.
- NPC creation SHALL not interrupt scene initialization if a single NPC fails.

---

### Separation of responsibilities

- The Spawn feature SHALL only create NPCs.
- Dialogue logic SHALL not be implemented.
- Store logic SHALL not be implemented.
- Quest logic SHALL not be implemented.
- AI logic SHALL not be implemented.

---

## Error Handling

### Backend request failure

If the backend request fails:

- No NPCs are spawned.
- The error is logged.
- Scene initialization continues.

---

### Missing spawn point

If an NPC has no matching spawn point:

- The NPC is skipped.
- A warning is logged.
- Remaining NPCs continue spawning.

---

### Invalid NPC data

If the backend returns invalid NPC information:

- The NPC is ignored.
- The error is logged.
- Remaining NPCs continue spawning.

---

### Factory creation failure

If the factory cannot create an NPC:

- The NPC is discarded.
- The error is logged.
- Remaining NPCs continue spawning.

---

## Testing Strategy

### Unit Testing

Verify:

- NpcFactory creates valid NPC entities.
- SpawnLoader correctly reads spawn points.
- NpcSpawnManager correctly matches NPCs with spawn points.

---

### Integration Testing

Verify:

- NPC data received from React reaches Phaser through the Event Bus.
- NPCs are spawned at the expected positions.
- All NPCs returned by the backend are instantiated.

---

### End-to-End Testing

Verify the following gameplay flow:

```text
Load Map

↓

Backend returns NPC list

↓

React publishes NPC data

↓

Phaser receives the event

↓

Spawn points are loaded

↓

NPCs are instantiated

↓

NPCs appear in the correct positions

↓

Scene initialization completes successfully
```

The feature is considered complete when every NPC defined for the current map appears exactly once at its configured spawn location without affecting the initialization of the scene.