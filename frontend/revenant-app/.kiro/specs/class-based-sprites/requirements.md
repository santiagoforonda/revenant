# Requirements Document

## Introduction

This feature implements a class-based player sprite system where each player class (Caballero, Mago, Espadachín, Gladiador, Arquero) has unique visual equipment sprites layered on top of a shared body sprite. The system uses Phaser's layered sprite composition to render players with class-specific helmets, torsos, legs, feet, weapons, and shields while maintaining the same base body across all classes.

## Glossary

- **Sprite_Composer**: The system responsible for assembling multiple sprite layers into a single composite player character
- **Player_Class**: One of the five character archetypes that determines which equipment sprites are rendered (Caballero, Mago, Espadachín, Gladiador, Arquero)
- **Sprite_Layer**: An individual visual component rendered at a specific depth (body, feet, legs, torso, weapon, shield, helmet)
- **Body_Layer**: The base sprite layer shared across all player classes
- **Equipment_Layer**: A sprite layer that varies depending on the selected Player_Class (helmet, torso, legs, feet, weapon, shield)
- **Class_Sprite_Registry**: A configuration mapping that associates each Player_Class with its corresponding asset keys for each Equipment_Layer
- **Player_Factory**: The factory responsible for creating Player entities with the correct sprite configuration based on Player_Class

## Requirements

### Requirement 1: Class-Based Sprite Registry

**User Story:** As a developer, I want a centralized configuration that maps each player class to its sprite asset keys, so that sprite resolution is data-driven and easy to extend.

#### Acceptance Criteria

1. THE Class_Sprite_Registry SHALL define a non-empty string asset key for each Equipment_Layer (helmet, torso, legs, feet, weapon, and shield) for each of the five Player_Class values: Caballero, Mago, Espadachín, Gladiador, and Arquero, except where a layer is explicitly absent for a given class
2. THE Class_Sprite_Registry SHALL use a single shared Body_Layer asset key across all Player_Class entries
3. IF a Player_Class entry does not require a specific Equipment_Layer (e.g., only Caballero has a shield; Espadachín has no helmet), THEN THE Class_Sprite_Registry SHALL represent that layer with a null value so the Sprite_Composer skips rendering it
4. IF the Sprite_Composer receives a Player_Class value that does not exist in the Class_Sprite_Registry, THEN THE Sprite_Composer SHALL fall back to the Caballero class configuration
5. WHEN a new Player_Class is added to the Class_Sprite_Registry, THE Sprite_Composer SHALL support the new class without requiring changes to its rendering logic, by resolving layers solely from registry data

### Requirement 2: Shared Body Layer

**User Story:** As a developer, I want all player classes to use the same body sprite, so that the base character animation is consistent regardless of class selection.

#### Acceptance Criteria

1. THE Sprite_Composer SHALL render the Body_Layer using the same spritesheet asset for all Player_Class values
2. THE Body_Layer SHALL serve as the physics-enabled base sprite for collision detection and movement
3. THE Body_Layer SHALL maintain consistent frame dimensions (64x64 pixels) and animation frame layout across all player classes

### Requirement 3: Class-Specific Equipment Rendering

**User Story:** As a developer, I want each player class to display unique equipment sprites, so that players can visually distinguish between classes.

#### Acceptance Criteria

1. WHEN a Player entity is created with a specific Player_Class, THE Sprite_Composer SHALL load and render the Equipment_Layer sprites corresponding to that Player_Class using the asset keys prefixed with the Player_Class identifier (e.g., "knight-body", "knight-torso")
2. THE Sprite_Composer SHALL render Equipment_Layer sprites in the following depth order from bottom to top: Body_Layer (depth 0), feet (depth 1), legs (depth 2), torso (depth 3), weapon (depth 4), shield (depth 4), helmet (depth 5)
3. WHILE the Player entity moves, THE Sprite_Composer SHALL update the position of all Equipment_Layer sprites to match the Body_Layer position each frame, applying per-layer directional offsets where defined (e.g., helmet offset, weapon offset based on facing direction)
4. WHILE the Player entity is animated, THE Sprite_Composer SHALL play the walk or idle animation on all Equipment_Layer sprites using the same frame rate and triggering all layer animations on the same frame that the Body_Layer animation changes
5. IF one or more Equipment_Layer sprites fail to load for the given Player_Class, THEN THE Sprite_Composer SHALL render the Player using only the successfully loaded layers without interrupting gameplay

### Requirement 4: Asset Loading by Class

**User Story:** As a developer, I want sprite assets to be loaded based on the selected player class, so that only the necessary assets are loaded into memory.

#### Acceptance Criteria

1. WHEN the game preloads assets for a Player entity, THE asset loader SHALL load the shared Body_Layer spritesheet (64x64 pixel frames)
2. WHEN the game preloads assets for a Player entity, THE asset loader SHALL load only the six Equipment_Layer spritesheets (helmet, torso, legs, feet, weapon, shield) corresponding to the selected Player_Class, without loading Equipment_Layer assets for other Player_Class values
3. WHEN the asset loader resolves file paths for Equipment_Layer assets, THE asset loader SHALL use the Class_Sprite_Registry to map each Equipment_Layer to its corresponding spritesheet path for the selected Player_Class
4. IF an Equipment_Layer asset file is missing or fails to load for a given Player_Class, THEN THE asset loader SHALL log a warning indicating the missing layer and Player_Class, skip that layer, and continue game initialization without interruption
5. IF the asset loader is requested to load assets for a Player_Class whose assets are already present in the texture cache, THEN THE asset loader SHALL skip re-loading those assets
6. WHEN a Player_Class change occurs at runtime and the new class assets are not present in the texture cache, THE asset loader SHALL load the Equipment_Layer spritesheets for the new Player_Class before the Sprite_Composer performs the layer replacement

### Requirement 5: Player Factory Integration

**User Story:** As a developer, I want the Player Factory to accept a player class parameter, so that it creates fully configured player entities with the correct sprites.

#### Acceptance Criteria

1. WHEN the Player_Factory creates a Player entity, THE Player_Factory SHALL accept a Player_Class parameter that is one of the five defined Player_Class values
2. WHEN the Player_Factory creates a Player entity, THE Player_Factory SHALL resolve all sprite asset keys from the Class_Sprite_Registry using the provided Player_Class
3. THE Player_Factory SHALL pass the resolved asset keys to the Sprite_Composer for layer construction
4. IF no Player_Class is specified, THEN THE Player_Factory SHALL default to the Caballero class
5. IF the Player_Factory receives an invalid Player_Class value not present in the Class_Sprite_Registry, THEN THE Player_Factory SHALL log a warning and fall back to the Caballero class

### Requirement 6: Animation Registration per Class

**User Story:** As a developer, I want animations to be registered dynamically based on the player class, so that each class has correct walk and idle animations for all its layers.

#### Acceptance Criteria

1. WHEN animations are registered for a Player entity, THE animation system SHALL create walk and idle animations for each Equipment_Layer (body, feet, legs, torso, weapon, shield) using the asset keys from the Class_Sprite_Registry, producing a total of 48 animations per Player_Class (6 layers × 2 states × 4 directions)
2. THE animation system SHALL generate animation keys using the pattern: `{Player_Class}-{layer}-{state}-{direction}` where Player_Class is the class identifier, layer is the Equipment_Layer name, state is "walk" or "idle", and direction is one of "up", "down", "left", or "right"
3. THE animation system SHALL configure walk animations with a frame rate of 8 fps and infinite looping, and idle animations with a frame rate of 1 fps and no looping
4. WHEN the animation system attempts to register an animation key that already exists, THE animation system SHALL skip registration of that animation and proceed to the next without error
5. WHEN the Player_Class changes at runtime, THE animation system SHALL register the new class animations if they have not been registered previously, verified by checking whether the animation keys for the new class already exist in the Phaser animation manager

### Requirement 7: Runtime Class Switching

**User Story:** As a developer, I want to support changing a player's class at runtime, so that the visual representation updates immediately when a class change occurs.

#### Acceptance Criteria

1. WHEN the Player entity receives a class change instruction, THE Sprite_Composer SHALL destroy the current Equipment_Layer sprites and render the Equipment_Layer sprites corresponding to the new Player_Class as resolved from the Class_Sprite_Registry
2. WHEN the Player entity changes class, THE Sprite_Composer SHALL preserve the current world position coordinates and facing direction of the Player entity
3. WHEN the Player entity changes class, THE Sprite_Composer SHALL transition to the idle animation of the new class in the current facing direction
4. THE Sprite_Composer SHALL complete a class change within a single frame update cycle, meaning all Equipment_Layer sprites are replaced and the idle animation is playing before the next frame renders
5. IF the Player entity receives a class change instruction specifying a Player_Class whose Equipment_Layer assets have not been preloaded, THEN THE Sprite_Composer SHALL retain the current class sprites unchanged and emit an error event indicating the class change failed due to missing assets
6. IF the Player entity receives a class change instruction specifying a Player_Class value not defined in the Class_Sprite_Registry, THEN THE Sprite_Composer SHALL retain the current class sprites unchanged and emit an error event indicating an invalid Player_Class was requested
7. IF the Player entity receives a class change instruction specifying the same Player_Class already active, THEN THE Sprite_Composer SHALL ignore the instruction without modifying sprites or animations
