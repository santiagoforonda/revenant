# Implementation Plan: Enemy Health Bar HUD

## Overview

Implement the `EnemyHealthBarHud` class that subscribes to combat events on the EventBus and renders enemy health bars in the HUD layer below the existing player HUD. The implementation follows the same camera isolation pattern as `HudManager` and integrates into `MainScene`.

## Tasks

- [x] 1. Create EnemyHealthBarHud class with layout constants and initialization
  - [x] 1.1 Create `src/game/ui/hud/EnemyHealthBarHud.ts` with the class skeleton, layout constants, and constructor
    - Define the `EnemyBarEntry` interface (enemy, maxHealth, currentHealth, barBg, barFill, label)
    - Declare private fields: `scene`, `hudCamera`, `entries` Map, `hudElements` array, `rowBackground`
    - Define all static layout constants (ROW_Y=24, ENTRY_HEIGHT=20, PADDING_X=10, BAR_WIDTH=80, BAR_HEIGHT=10, etc.)
    - Constructor receives `Phaser.Scene` and `Phaser.Cameras.Scene2D.Camera` (the HUD camera)
    - In the constructor: subscribe to `COMBAT_RESOLVED` and `ENEMY_DEFEATED` on the EventBus using bound handlers
    - Create a hidden row background rectangle at ROW_Y spanning the screen width with alpha 0.7, depth 1000
    - Call `scene.cameras.main.ignore()` on the row background and register it in `hudElements`
    - _Requirements: 4.1, 4.2, 4.3, 5.1_

- [x] 2. Implement combat event handlers and bar rendering
  - [x] 2.1 Implement the `onCombatResolved` handler
    - Extract `target` (Enemy) and `remainingHealth` from the event payload
    - If `entries.has(target)`: update `currentHealth` and call `refreshBar(entry)`
    - If new enemy: read `maxHealth` from `target.getStats().healthPoints`, read name from `target.getName()`
    - Create `barBg` (dark rectangle), `barFill` (red rectangle), and `label` (Text showing "name currentHP/maxHP")
    - Set depth to 1000 on all new game objects
    - Call `scene.cameras.main.ignore()` on each new object
    - Add new objects to `hudElements` array
    - Store the new `EnemyBarEntry` in the `entries` Map
    - Show row background (setVisible true), call `reflowLayout()`
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 2.1, 2.3, 4.2, 4.3, 4.4_

  - [x] 2.2 Implement the `onEnemyDefeated` handler
    - Extract `enemy` from the event payload
    - If `entries.has(enemy)`: retrieve the entry, call `destroy()` on barBg, barFill, and label
    - Remove destroyed objects from `hudElements` array
    - Delete entry from `entries` Map
    - Call `reflowLayout()` to reposition remaining bars
    - If `entries.size === 0`: hide the row background
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 2.3 Implement the `refreshBar` and `reflowLayout` private methods
    - `refreshBar(entry)`: recalculate fill width as `BAR_WIDTH * clamp(currentHealth/maxHealth, 0, 1)`, reposition barFill left-aligned, update label text
    - `reflowLayout()`: iterate entries by insertion order, position each bar at Y = ROW_Y + index * ENTRY_HEIGHT + ENTRY_HEIGHT / 2, resize row background to fit all entries
    - _Requirements: 1.4, 2.2_

- [x] 3. Implement destroy lifecycle and scene integration
  - [x] 3.1 Implement the `destroy` method on EnemyHealthBarHud
    - Unsubscribe bound handlers from `COMBAT_RESOLVED` and `ENEMY_DEFEATED` on EventBus
    - Iterate all entries and destroy barBg, barFill, label for each
    - Destroy rowBackground
    - Clear `entries` Map and `hudElements` array
    - _Requirements: 5.2, 5.3_

  - [x] 3.2 Integrate EnemyHealthBarHud into MainScene
    - In `MainScene.ts`: import `EnemyHealthBarHud`
    - After `this.hudManager = new HudManager(this)`, instantiate `EnemyHealthBarHud` passing `this` (scene) and the HUD camera from HudManager
    - Expose a `getHudCamera()` method on HudManager (or pass the camera directly from scene cameras by name "hudCamera")
    - Call `enemyHealthBarHud.destroy()` in MainScene's shutdown/destroy lifecycle
    - _Requirements: 4.1, 5.2, 5.3_

- [x] 4. Checkpoint - Verify integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 5. Write property-based tests for EnemyHealthBarHud
  - [ ]* 5.1 Write property test: combat event creates or updates exactly one entry per enemy
    - **Property 1: Combat event creates or updates exactly one entry per enemy**
    - **Validates: Requirements 1.1, 1.5, 2.1, 2.3**

  - [ ]* 5.2 Write property test: health text format consistency
    - **Property 2: Health text format consistency**
    - **Validates: Requirements 1.3**

  - [ ]* 5.3 Write property test: bar fill width proportionality
    - **Property 3: Bar fill width proportionality**
    - **Validates: Requirements 1.4**

  - [ ]* 5.4 Write property test: vertical stacking order
    - **Property 4: Vertical stacking order**
    - **Validates: Requirements 2.2**

  - [ ]* 5.5 Write property test: defeat removes entry and reflows
    - **Property 5: Defeat removes entry and reflows**
    - **Validates: Requirements 3.1, 3.2**

  - [ ]* 5.6 Write property test: destroy cleans up all resources
    - **Property 6: Destroy cleans up all resources**
    - **Validates: Requirements 5.2, 5.3**

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The HUD camera reference can be obtained from HudManager via a new `getHudCamera()` accessor or by querying `scene.cameras.getCamera("hudCamera")`
- The implementation follows the exact same camera isolation pattern used by HudManager (depth ≥ 1000, main camera ignores HUD objects)
- Property tests validate universal correctness properties from the design document
- The EnemyHealthBarHud is a Phaser UI component — no React involvement per steering rules

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3.1", "3.2"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6"] }
  ]
}
```
