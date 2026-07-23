---
inclusion: always
---

# Phaser Developer Steering

## Purpose

This steering document defines the mandatory development standards for the Phaser game module.

The Phaser module is responsible for implementing all gameplay mechanics, world rendering, player interaction, combat, inventory visualization, NPC interaction, and scene management.

The Phaser module MUST remain completely independent from the React application.

---

# Technology Stack

The game module MUST use:

- Phaser 3
- TypeScript
- Tiled Maps
- Event Bus for communication with React

Additional libraries SHOULD NOT be introduced unless explicitly approved.

---

# Responsibilities

The Phaser module MUST be responsible for:

- Game rendering.
- Scene management.
- Player movement.
- Enemy AI.
- NPC interactions.
- Combat.
- Physics.
- Inventory visualization.
- Shop visualization.
- HUD.
- Animations.
- Audio.
- Gameplay state.

The Phaser module MUST NOT:

- Authenticate users.
- Perform HTTP requests.
- Store JWT tokens.
- Communicate directly with the backend.

---

# Architecture

The game MUST follow the architecture defined in the project documentation.

Gameplay MUST be organized into:

- Scenes
- Entities
- Managers
- Systems
- Services
- Factories
- Events
- UI Components

Every class MUST have a single responsibility.

---

# Scene Rules

Scenes MUST only coordinate gameplay.

Scenes MAY:

- Create entities.
- Register systems.
- Register input.
- Initialize cameras.
- Control scene transitions.

Scenes MUST NOT:

- Execute HTTP requests.
- Contain combat calculations.
- Implement inventory algorithms.
- Perform backend communication.

Scenes SHOULD remain lightweight.

---

# Entity Rules

Entities represent objects existing inside the game world.

Examples:

- Player
- Enemy
- NPC
- Chest
- Projectile
- Item

Entities MUST:

- Encapsulate their own state.
- Expose behavior through methods.
- Manage animations related to themselves.

Entities MUST NOT:

- Perform HTTP requests.
- Control scenes.
- Implement global game logic.

---

# Service Rules

Services implement reusable gameplay logic.

Examples:

- CombatService
- InventoryService
- LootService
- SpawnService
- CollisionService

Services MUST:

- Be stateless whenever possible.
- Be reusable.
- Contain gameplay calculations.

Services MUST NOT:

- Render graphics.
- Manage scenes.
- Perform backend communication.

---

# System Rules

Systems represent continuously running gameplay processes.

Examples:

- CombatSystem
- CollisionSystem
- AISystem
- InteractionSystem

Systems MUST:

- Execute during the update loop.
- Coordinate entities.
- Consume services.

Systems MUST NOT:

- Render UI.
- Call the backend.

---

# Manager Rules

Managers coordinate major game subsystems.

Examples:

- SceneManager
- CameraManager
- AudioManager
- SaveManager

Managers MUST:

- Coordinate multiple systems.
- Manage lifecycle.
- Centralize shared resources.

Managers MUST NOT:

- Implement gameplay algorithms.
- Render UI.

---

# Factory Rules

Factories MUST create complex objects.

Examples:

- PlayerFactory
- EnemyFactory
- NPCFactory
- ProjectileFactory

Factories MUST NOT contain gameplay logic.

---

# UI Rules

UI components are responsible only for presentation.

Examples:

- InventoryWindow
- ShopWindow
- HealthBar
- ManaBar
- DialogWindow
- Tooltip

UI components MUST NOT:

- Execute gameplay logic.
- Call backend services.
- Modify entities directly.

---

# Loader Rules

The loader module MUST be responsible for loading external resources.

Examples:

- Maps
- Tilesets
- Object layers
- Spawn points

Loaders MUST NOT implement gameplay logic.

---

# Event Bus

The Event Bus MUST be the only communication mechanism with React.

Phaser MAY:

- Emit events.
- Listen to events.

Phaser MUST NOT:

- Import React.
- Import Axios.
- Use fetch().
- Perform HTTP requests.

Every backend interaction MUST pass through the Event Bus.

---

# Bootstrap

The game MUST follow the bootstrap workflow defined by the architecture.

Required bootstrap resources include:

- Current player
- Current map
- NPCs
- Enemies
- Store metadata
- Inventory

Optional resources MUST be loaded on demand.

---

# Game State

The game MUST respect the defined state machine.

Gameplay MUST only be enabled while the game state is:

READY

Gameplay MUST be suspended during:

- INITIALIZING
- LOADING
- ERROR
- SESSION_EXPIRED

---

# Performance

The game SHOULD:

- Reuse objects whenever possible.
- Avoid unnecessary allocations.
- Minimize update loop work.
- Load resources lazily.
- Destroy unused objects.

Heavy calculations SHOULD NOT execute every frame.

---

# TypeScript

TypeScript MUST be used throughout the game.

Rules:

- Never use any.
- Prefer explicit types.
- Use enums for finite values.
- Use readonly whenever appropriate.
- Reuse interfaces.

---

# Naming Conventions

Classes

PascalCase

Examples:

- Player
- Enemy
- CombatSystem

Variables

camelCase

Examples:

- playerHealth
- currentEnemy

Constants

UPPER_SNAKE_CASE

Examples:

- MAX_LEVEL
- PLAYER_SPEED

Interfaces

PascalCase

Examples:

- Damageable
- Interactable

The "I" prefix SHOULD NOT be used.

---

# Imports

Absolute imports SHOULD be preferred.

Relative imports SHOULD be minimized.

---

# Forbidden Practices

The following practices are prohibited.

- Using any.
- Importing React.
- Importing Axios.
- Calling fetch().
- Accessing JWT tokens.
- Communicating directly with the backend.
- Mixing rendering with gameplay logic.
- Implementing business logic inside Scenes.
- Creating circular dependencies.
- Hardcoding gameplay values.
- Hardcoding asset paths outside configuration.

---

# Development Principles

Every implementation MUST follow:

- Single Responsibility Principle (SRP)
- Separation of Concerns (SoC)
- Event-Driven Architecture
- High Cohesion
- Low Coupling
- Composition over Inheritance
- Reusability
- Maintainability
- Readability
- Testability

---

# Project Documentation

Every implementation generated by Kiro MUST comply with the project's architectural documentation, including:

- Frontend Architecture
- Game Directory Structure
- React-Phaser Event Bus
- Game Bootstrap
- Game State Machine

If any implementation conflicts with these documents, the architectural documentation MUST take precedence.