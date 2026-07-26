# Requirements Document

## Introduction

This feature adds enemy health bars to the game HUD. When combat begins (COMBAT_RESOLVED event), the targeted enemy's health bar appears in a second row below the existing player HUD. Multiple enemy health bars are displayed simultaneously if the player attacks different enemies. Each bar shows current HP as a numeric fraction (e.g., 75/100). The bar disappears immediately when the corresponding enemy is defeated (ENEMY_DEFEATED event).

## Glossary

- **EnemyHealthBarHud**: A Phaser UI component rendered in the HUD layer that displays one or more enemy health bars below the player HUD row.
- **HudManager**: The existing manager responsible for rendering and coordinating all HUD elements within the Phaser scene using a dedicated HUD camera.
- **CombatSystem**: The game system that processes attack requests, calculates damage, updates enemy health, and emits COMBAT_RESOLVED and ENEMY_DEFEATED events.
- **Enemy**: A game entity representing a hostile character in the game world, exposing getStats() which returns an EnemyResponse containing healthPoints (max HP).
- **EventBus**: The centralized event communication mechanism used across the game module.
- **COMBAT_RESOLVED**: An event emitted by CombatSystem after damage is applied to an enemy, containing attacker, target (Enemy), damage, and remainingHealth.
- **ENEMY_DEFEATED**: An event emitted by CombatSystem when an enemy's health reaches zero, containing the defeated enemy and the attacker.

## Requirements

### Requirement 1: Display Enemy Health Bar on Combat

**User Story:** As a player, I want to see an enemy's health bar appear on the HUD when I attack the enemy, so that I can track how much damage I am dealing.

#### Acceptance Criteria

1. WHEN a COMBAT_RESOLVED event is received, THE EnemyHealthBarHud SHALL display a health bar for the targeted enemy in the HUD layer.
2. THE EnemyHealthBarHud SHALL render below the existing player HUD row, forming a stacked layout as a second row.
3. THE EnemyHealthBarHud SHALL display the enemy's remaining health as a numeric fraction in the format "currentHP/maxHP" (e.g., "75/100").
4. THE EnemyHealthBarHud SHALL render as a simple rectangular bar representing the ratio of remaining health to maximum health.
5. WHEN a subsequent COMBAT_RESOLVED event is received for the same enemy, THE EnemyHealthBarHud SHALL update the existing health bar for that enemy with the new remainingHealth value.

### Requirement 2: Support Multiple Enemy Health Bars

**User Story:** As a player, I want to see health bars for all enemies I am currently fighting, so that I can track the status of each enemy simultaneously.

#### Acceptance Criteria

1. WHEN COMBAT_RESOLVED events are received for different enemies, THE EnemyHealthBarHud SHALL display a separate health bar for each unique enemy simultaneously.
2. THE EnemyHealthBarHud SHALL arrange multiple enemy health bars in a horizontal or stacked layout within the second HUD row.
3. THE EnemyHealthBarHud SHALL use the enemy entity reference to uniquely identify each tracked enemy.

### Requirement 3: Remove Enemy Health Bar on Defeat

**User Story:** As a player, I want defeated enemies' health bars to disappear immediately, so that the HUD only shows relevant combat information.

#### Acceptance Criteria

1. WHEN an ENEMY_DEFEATED event is received, THE EnemyHealthBarHud SHALL immediately remove the health bar corresponding to the defeated enemy.
2. WHEN all tracked enemies are defeated, THE EnemyHealthBarHud SHALL hide the second HUD row entirely.
3. THE EnemyHealthBarHud SHALL release all Phaser game objects associated with a removed enemy health bar to prevent memory leaks.

### Requirement 4: HUD Camera Integration

**User Story:** As a player, I want the enemy health bars to remain fixed on screen regardless of camera movement, so that combat information is always visible.

#### Acceptance Criteria

1. THE EnemyHealthBarHud SHALL render all health bar elements on the dedicated HUD camera used by HudManager.
2. THE EnemyHealthBarHud SHALL set all health bar elements to be ignored by the main game camera using the scene.cameras.main.ignore() pattern.
3. THE EnemyHealthBarHud SHALL render health bar elements at a depth of 1000 or higher, consistent with existing HUD depth conventions.
4. WHEN new enemy health bar elements are created, THE EnemyHealthBarHud SHALL ensure the HUD camera is aware of them and the main camera ignores them.

### Requirement 5: Lifecycle Management

**User Story:** As a developer, I want the enemy health bar HUD to properly initialize and clean up, so that scene transitions do not cause resource leaks or stale state.

#### Acceptance Criteria

1. THE EnemyHealthBarHud SHALL subscribe to COMBAT_RESOLVED and ENEMY_DEFEATED events on the EventBus during initialization.
2. WHEN the EnemyHealthBarHud is destroyed, THE EnemyHealthBarHud SHALL unsubscribe from all EventBus listeners.
3. WHEN the EnemyHealthBarHud is destroyed, THE EnemyHealthBarHud SHALL destroy all active health bar game objects and release associated resources.
