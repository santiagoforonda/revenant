# Game Directory Structure

## 1. Overview

This document defines the purpose and responsibilities of every directory inside the `game` module.

The objective is to provide a consistent project organization that separates rendering, gameplay logic, entities, systems, events, services, and assets.

Every new class created by Kiro must belong to exactly one directory according to the responsibilities defined below.

---

# 2. Root Structure

```
game/

├── actions/
├── config/
├── entities/
│   ├── characters/
│   └── objects/
├── events/
├── factories/
├── interfaces/
├── loader/
│   ├── mapLoader/
│   ├── objectLayerLoader/
│   ├── spawnLoader/
│   └── tileSetLoader/
├── managers/
├── maps/
│   ├── castle/
│   ├── desert/
│   └── forest/
├── scenes/
├── services/
├── systems/
└── ui/
```

---

# 3. Directory Responsibilities

## actions

### Responsibility

Represents executable game actions initiated by the player or by the game.

Examples:

- AttackAction
- MoveAction
- BuyItemAction
- UseItemAction
- InteractAction

Must contain:

- Action classes
- Action definitions

Must never contain:

- Rendering
- HTTP communication
- Scene transitions

---

## config

### Responsibility

Stores game configuration.

Examples:

- Phaser configuration
- Camera configuration
- Physics configuration
- Global constants

Must contain:

- Configuration files
- Constants

Must never contain:

- Gameplay logic
- Business rules

---

## entities

### Responsibility

Represents every object that exists inside the game world.

Entities are the main domain objects of the game.

### characters

Examples:

- Player
- Enemy
- NPC
- Boss

### objects

Examples:

- Chest
- Coin
- Potion
- Weapon
- Portal

Must contain:

- Entity properties
- Entity behavior
- Animations related to the entity

Must never contain:

- HTTP requests
- Scene management
- Global game coordination

---

## events

### Responsibility

Contains the Event Bus implementation and every event exchanged inside the game.

Examples:

- GameInitializedEvent
- InventoryOpenedEvent
- EnemyDefeatedEvent
- SaveGameRequestedEvent
- ApiErrorEvent

Must contain:

- Event definitions
- Event dispatcher
- Event listeners

Must never contain:

- Business logic
- Rendering

---

## factories

### Responsibility

Creates complex game objects.

Examples:

- PlayerFactory
- EnemyFactory
- NPCFactory
- ProjectileFactory

Must contain:

- Object creation logic

Must never contain:

- Gameplay rules
- Rendering logic

---

## interfaces

### Responsibility

Defines contracts used across the game.

Examples:

- Damageable
- Interactable
- Collectable
- Purchasable

Must contain:

- TypeScript interfaces
- Shared contracts

Must never contain:

- Implementations

---

## loader

### Responsibility

Loads external resources into the game.

### mapLoader

Responsible for loading Tiled maps.

### objectLayerLoader

Responsible for loading object layers.

### spawnLoader

Responsible for creating spawn points.

### tileSetLoader

Responsible for loading tilesets.

Must contain:

- Asset loading
- Map loading
- Tileset loading

Must never contain:

- Gameplay logic
- Combat logic

---

## managers

### Responsibility

Coordinates major game subsystems.

Managers orchestrate multiple services and systems but do not implement gameplay logic.

Examples:

- SceneManager
- AudioManager
- CameraManager
- SaveManager

Must contain:

- High-level coordination
- Lifecycle management

Must never contain:

- Combat calculations
- Inventory rules
- Enemy AI

---

## maps

### Responsibility

Contains all map-specific resources.

Each map owns its own assets and configuration.

Examples:

castle/

desert/

forest/

May contain:

- Tiled maps
- Tilesets
- Backgrounds
- Map configuration

Must never contain:

- Scene logic
- Gameplay logic

---

## scenes

### Responsibility

Represents every Phaser Scene.

Scenes are responsible for rendering and player interaction.

Examples:

- BootScene
- PreloadScene
- MapScene
- PauseScene
- InventoryScene
- ShopScene

Must contain:

- Rendering
- Camera initialization
- Input handling
- Scene transitions

Must never contain:

- HTTP communication
- Backend integration
- Complex business logic

---

## services

### Responsibility

Implements reusable gameplay logic.

Services contain algorithms and calculations shared across multiple scenes.

Examples:

- CombatService
- LootService
- InventoryService
- SpawnService
- CollisionService

Must contain:

- Reusable game logic

Must never contain:

- Rendering
- Scene transitions
- HTTP communication

---

## systems

### Responsibility

Implements continuously running game systems.

Systems execute automatically during the game loop.

Examples:

- CombatSystem
- AISystem
- CollisionSystem
- InteractionSystem

Must contain:

- Update logic
- Continuous processing

Must never contain:

- Rendering
- Backend communication

---

## ui

### Responsibility

Contains every visual component rendered inside Phaser.

Examples:

- HealthBar
- ManaBar
- InventoryWindow
- ShopWindow
- Tooltip
- DialogWindow
- FloatingDamageText

Must contain:

- UI components
- HUD
- Menus
- Overlays

Must never contain:

- Gameplay logic
- HTTP communication

---

# 4. Dependency Rules

The following dependencies are allowed.

```
Scene
    ↓
Manager
    ↓
Service
    ↓
Entity
```

Systems may use Services and Entities.

Factories may create Entities.

UI components may consume Managers and Services but must never implement gameplay logic.

---

# 5. Forbidden Dependencies

The following practices are prohibited.

- Importing React inside the game module.
- Importing Axios inside Phaser.
- Importing React Router.
- Implementing REST communication.
- Mixing rendering with gameplay calculations.
- Placing business logic inside UI components.
- Creating circular dependencies between directories.

---

# 6. Design Principles

The game architecture follows these principles.

- Single Responsibility Principle.
- Separation of Concerns.
- Event-Driven Communication.
- Modular Design.
- High Cohesion.
- Low Coupling.
- Reusable Gameplay Logic.
- Clear Ownership of Responsibilities.

Every class generated by Kiro must respect these principles.