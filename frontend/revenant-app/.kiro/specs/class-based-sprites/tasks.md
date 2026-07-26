# Implementation Plan: Class-Based Sprites

## Overview

This implementation converts the current hardcoded knight-only player sprite system into a data-driven, class-based architecture supporting five player classes (Caballero, Mago, Espadachín, Gladiador, Arquero). The approach introduces a ClassSpriteRegistry for configuration, a SpriteComposer service for layered rendering, an AssetLoaderService for class-specific asset management, and a PlayerFactory for entity creation. The existing Player entity is refactored to delegate sprite composition to the new services.

## Tasks

- [x] 1. Create ClassSpriteRegistry configuration and type definitions
  - [x] 1.1 Create PlayerClass enum, EquipmentLayer type, ClassSpriteConfig interface, and the CLASS_SPRITE_REGISTRY constant in `src/game/config/ClassSpriteRegistry.ts`
    - Define `PlayerClass` enum with values: Caballero="knight", Mago="mago", Espadachin="espadachin", Gladiador="gladiador", Arquero="arquero"
    - Define `EquipmentLayer` type union: "feet" | "legs" | "torso" | "weapon" | "shield" | "helmet"
    - Define `ClassSpriteConfig` interface with classId, layers (Record<EquipmentLayer, string | null>), and helmetType ("directional" | "spritesheet")
    - Export `SHARED_BODY_KEY`, `FRAME_WIDTH`, `FRAME_HEIGHT` constants
    - Populate the full registry for all five classes with correct null values (only Caballero has shield, Espadachín has no helmet, etc.)
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 1.2 Write property tests for ClassSpriteRegistry
    - **Property 1: Registry completeness and type validity**
    - **Property 2: Shared body key invariant**
    - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 2. Implement SpriteComposer service
  - [x] 2.1 Create SpriteComposer interface and implementation in `src/game/services/SpriteComposer.ts`
    - Define `ComposedSprites` interface with body, feet, legs, torso, weapon, shield, helmet fields (nullable for equipment)
    - Define `PlayerDirection` and `PlayerState` types (export for shared use)
    - Implement `compose()` method that creates sprite layers based on ClassSpriteConfig, assigning correct depth values (body=0, feet=1, legs=2, torso=3, weapon=4, shield=4, helmet=5)
    - Skip null layers gracefully — set null in ComposedSprites and create no sprite
    - Implement `destroyEquipmentLayers()` that destroys all non-body sprites
    - Implement `syncPositions()` to update equipment layer positions relative to body with direction-based offsets (helmet, weapon/shield depth adjustments)
    - Implement `playAnimation()` to trigger correct animation on all non-null layers using the `{classId}-{layer}-{state}-{direction}` key pattern
    - Handle directional helmet type (texture swap per direction) vs spritesheet helmet type (animation play)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 2.2 Write property tests for SpriteComposer
    - **Property 5: Depth ordering invariant**
    - **Property 6: Position synchronization**
    - **Property 7: Animation key consistency**
    - **Property 8: Graceful degradation for null layers**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

  - [x] 2.3 Implement `registerAnimations()` method in SpriteComposer
    - For each non-null layer in ClassSpriteConfig, create walk and idle animations for all 4 directions
    - Use animation key pattern: `{classId}-{layer}-{state}-{direction}`
    - Walk animations: frameRate=8, repeat=-1; Idle animations: frameRate=1, repeat=0
    - Skip registration if animation key already exists in anims manager (idempotency)
    - Handle special cases: directional helmets don't need animation registration (texture swap only), spritesheet helmets do
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 2.4 Write property tests for animation registration
    - **Property 9: Animation registration completeness**
    - **Property 10: Animation and asset loading idempotency**
    - **Validates: Requirements 6.1, 6.3, 6.4**

- [x] 3. Implement AssetLoaderService
  - [x] 3.1 Create AssetLoaderService in `src/game/services/AssetLoaderService.ts`
    - Implement `loadClassAssets()` that loads all spritesheets for a given PlayerClass using registry data
    - Implement `areAssetsLoaded()` to check if all required textures exist in the scene texture cache
    - Implement `resolveAssetPath()` to map PlayerClass + EquipmentLayer to file path following the convention: `src/assets/characters/classes/{classId}/{layer}/{filename}`
    - Handle filename inconsistencies (knight uses `feet.png`, others use `feets.png`; gladiador weapon uses `Walk.png`)
    - Skip loading if assets already in texture cache (idempotency)
    - Log warning for missing asset files and continue without interruption
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 3.2 Write unit tests for AssetLoaderService
    - Test path resolution for each class and layer combination
    - Test cache-hit skip behavior
    - Test missing asset warning logging
    - **Property 4: Asset key pattern resolution**
    - **Validates: Requirements 4.3, 4.4, 4.5**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement PlayerFactory
  - [x] 5.1 Create PlayerFactory in `src/game/factories/PlayerFactory.ts`
    - Accept `PlayerFactoryOptions` with scene, x, y, and optional playerClass (defaults to Caballero)
    - Query ClassSpriteRegistry for the given PlayerClass config
    - Use AssetLoaderService to verify assets are loaded
    - Use SpriteComposer to compose sprite layers
    - Call registerAnimations for the class
    - Return a fully configured Player entity
    - Log warning and fall back to Caballero for invalid PlayerClass values
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 5.2 Write property tests for PlayerFactory
    - **Property 3: Invalid class fallback**
    - **Validates: Requirements 5.4, 5.5**

- [x] 6. Refactor Player entity to support class-based sprites
  - [x] 6.1 Extend EventBus types in `src/game/events/event-bus.types.ts`
    - Add `CLASS_CHANGE_FAILED` event with payload: `{ reason: "missing_assets" | "invalid_class"; requestedClass: string }`
    - Add `CLASS_CHANGE_SUCCESS` event with payload: `{ previousClass: PlayerClass; newClass: PlayerClass }`
    - _Requirements: 7.5, 7.6_

  - [x] 6.2 Refactor Player entity in `src/game/entities/characters/Player.ts`
    - Replace hardcoded knight sprite keys with `ClassSpriteConfig` parameter
    - Store `currentClass: PlayerClass` and `sprites: ComposedSprites`
    - Delegate sprite creation to SpriteComposer (remove inline sprite creation from constructor)
    - Delegate animation logic to SpriteComposer.playAnimation() and SpriteComposer.syncPositions()
    - Remove the static `registerAnimations()` method (now handled by SpriteComposer)
    - Remove hardcoded `HELMET_KEYS`, `WEAPON_FRAMES`, `SHIELD_FRAMES` constants
    - Expose `getPlayerClass(): PlayerClass` getter
    - Keep existing public API: move(), stop(), update(), getBody(), getSprite(), getX(), getY(), getState(), getDirection(), setPosition()
    - _Requirements: 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 6.3 Implement `changeClass()` method on Player entity
    - Accept newClass: PlayerClass parameter
    - If newClass === currentClass, return immediately (no-op)
    - If newClass is invalid (not in registry), emit `CLASS_CHANGE_FAILED` event with reason "invalid_class", retain current sprites
    - If assets for newClass are not loaded (check via AssetLoaderService), emit `CLASS_CHANGE_FAILED` event with reason "missing_assets", retain current sprites
    - On success: destroy current equipment layers via SpriteComposer, compose new layers, register animations if needed, play idle animation in current direction, emit `CLASS_CHANGE_SUCCESS`
    - Preserve world position (x, y) and facing direction throughout
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 6.4 Write property tests for class change behavior
    - **Property 11: Class switch replaces textures**
    - **Property 12: Class switch preserves state**
    - **Property 13: Failed class change retains state and emits error**
    - **Property 14: Same-class change is a no-op**
    - **Validates: Requirements 7.1, 7.2, 7.5, 7.6, 7.7**

- [x] 7. Integrate with MainScene and wire components together
  - [x] 7.1 Update MainScene to use PlayerFactory instead of direct Player instantiation
    - Replace `new Player(scene, x, y)` with `PlayerFactory.create({ scene, x, y, playerClass })`
    - Ensure AssetLoaderService loads class assets during scene preload
    - Ensure SpriteComposer.registerAnimations is called for the active class during scene create
    - Verify camera follow still targets the body sprite
    - Verify physics body remains functional for collisions
    - _Requirements: 4.1, 4.2, 4.6, 5.1, 5.2, 5.3_

  - [x] 7.2 Update asset preloading to support class-based loading
    - Modify scene preload to use AssetLoaderService for loading the selected class assets
    - Ensure shared body spritesheet is loaded once
    - Remove hardcoded knight-only asset loading if present
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The design uses TypeScript throughout, matching the existing project stack
- All new files follow the existing project directory structure (`src/game/config/`, `src/game/services/`, `src/game/factories/`)
- The refactoring preserves the Player's existing public API to minimize impact on other systems (MainScene, input handling, camera)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2"] },
    { "id": 3, "tasks": ["2.4", "5.1"] },
    { "id": 4, "tasks": ["5.2", "6.1"] },
    { "id": 5, "tasks": ["6.2"] },
    { "id": 6, "tasks": ["6.3"] },
    { "id": 7, "tasks": ["6.4", "7.1"] },
    { "id": 8, "tasks": ["7.2"] }
  ]
}
```
