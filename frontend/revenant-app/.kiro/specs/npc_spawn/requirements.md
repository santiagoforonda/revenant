# Requirements Document

## Introduction

This document defines the functional requirements for the NPC Spawn Module of the Revenant frontend.

The objective of this module is to load, instantiate, and place all NPCs that belong to the current map.

This module is only responsible for NPC creation. It does not implement interaction, dialogues, quests, or stores.

## Glossary

- **NPC**: Non-Player Character — a game entity controlled by the system, not the player.
- **NpcFactory**: A factory class responsible for creating NPC entities based on type and configuration.
- **Spawn Point**: A predefined position in the Tiled map where an NPC should be placed.
- **Tiled Map**: A map created with the Tiled editor, containing layers, tilesets, and object layers.
- **Event Bus**: The communication bridge between React and Phaser modules.

## Requirements

### Requirement 1: Automatic NPC Loading

**User Story:** As a player, I want the NPCs of the current map to appear automatically so that the world feels populated.

#### Acceptance Criteria

1. WHEN a map is loaded THEN the system SHALL request the NPC list associated with the current map from the backend.
2. IF the backend returns one or more NPCs THEN the system SHALL instantiate every NPC in the current map.
3. IF the backend returns no NPCs THEN the system SHALL complete the loading process without errors.
4. WHEN an NPC cannot be created THEN the system SHALL continue spawning the remaining NPCs.

### Requirement 2: NPC Positioning

**User Story:** As a player, I want every NPC to appear in its predefined location.

#### Acceptance Criteria

1. WHEN an NPC is instantiated THEN the system SHALL place it using the spawn point defined in the Tiled map.
2. IF no spawn point exists for an NPC THEN the system SHALL skip that NPC and log a warning.
3. WHEN multiple NPCs exist THEN each NPC SHALL be positioned independently.

### Requirement 3: Centralized NPC Creation

**User Story:** As a developer, I want NPC creation to be centralized so new NPC types can be added easily.

#### Acceptance Criteria

1. WHEN an NPC is created THEN the system SHALL use the NpcFactory.
2. WHEN the factory receives NPC information THEN it SHALL return the appropriate NPC entity.
3. IF the NPC type is not supported THEN the factory SHALL reject the creation and log the error.

### Requirement 4: NPC Visual Representation

**User Story:** As a player, I want NPCs to appear with their corresponding visual representation.

#### Acceptance Criteria

1. WHEN an NPC is spawned THEN the system SHALL assign the correct sprite.
2. WHEN an NPC is created THEN the system SHALL load its idle animation.
3. WHEN the NPC finishes loading THEN it SHALL remain visible until removed from the scene.

### Requirement 5: Static NPC Behavior

**User Story:** As a player, I want NPCs to remain static until interaction is implemented.

#### Acceptance Criteria

1. WHEN an NPC is spawned THEN the system SHALL not move it automatically.
2. WHEN the player approaches an NPC THEN the NPC SHALL remain idle.
3. UNTIL the interaction module is implemented, the NPC SHALL not respond to player input.

### Requirement 6: Module Isolation

**User Story:** As a developer, I want NPC spawning to be isolated from interaction logic.

#### Acceptance Criteria

1. The NPC Spawn Module SHALL only create and position NPCs.
2. The module SHALL not open dialogue windows.
3. The module SHALL not perform HTTP requests outside of the NPC loading process.
4. The module SHALL not implement store functionality.
5. The module SHALL not implement quest functionality.

### Requirement 7: Scene Registration

**User Story:** As a developer, I want spawned NPCs to be registered inside the current scene.

#### Acceptance Criteria

1. WHEN an NPC is created THEN the system SHALL add it to the active Phaser scene.
2. WHEN all NPCs have been spawned THEN the module SHALL expose the created NPC collection.
3. The spawned NPC collection SHALL be available for future interaction systems.