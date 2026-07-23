# Game Bootstrap

## 1. Overview

This document defines the game initialization workflow after a successful authentication.

The objective is to initialize the game with the minimum information required for the player to start playing while keeping loading times low and avoiding unnecessary API requests.

Only essential resources are loaded during startup.

Additional information is requested on demand through the Event Bus.

---

# 2. Bootstrap Principles

The initialization process follows these principles.

- Load only the data required to start playing.
- Execute independent requests in parallel whenever possible.
- Delay optional information until the player requests it.
- React coordinates every backend request.
- Phaser never communicates directly with the backend.
- The player gains control only after the bootstrap process finishes successfully.

---

# 3. Bootstrap Flow

The complete initialization workflow is:

Login

↓

Authentication API

↓

LoginResponse

↓

React stores JWT

↓

React navigates to GamePage

↓

GamePage creates Phaser.Game

↓

GAME_INITIALIZED

↓

React loads the initial game state

↓

GAME_READY

↓

Phaser enables player input

---

# 4. Initial Data Loading

The following resources must be loaded during bootstrap.

## Player

Purpose

Initialize the current player.

Information includes:

- Player statistics
- Gold
- Experience
- Current health
- Current mana
- Position
- Current map

---

## Current Map

Purpose

Load the active Tiled map.

Includes:

- Tileset
- Collision layer
- Object layers
- Spawn points

---

## Enemies

Purpose

Spawn every enemy that belongs to the current map.

Includes:

- Enemy type
- Spawn position
- Initial state

---

## NPCs

Purpose

Spawn all NPCs belonging to the current map.

Includes:

- NPC identifier
- Position
- Interaction type

---

## Stores

Purpose

Load only store metadata.

Includes:

- Store identifier
- NPC owner
- Store name

Store items are NOT loaded during bootstrap.

---

## Inventory

Purpose

Load the player's current inventory.

Includes:

- Equipped items
- Backpack items
- Quantities

---

# 5. Parallel Loading

Whenever possible, React should execute independent requests in parallel.

Example:

GAME_INITIALIZED

↓

Load Player

Load Current Map

Load Enemies

Load NPCs

Load Stores

Load Inventory

↓

GAME_READY

This minimizes the loading time perceived by the player.

---

# 6. Deferred Loading

The following information must never be loaded during bootstrap.

- Store items
- Dialogues
- Quests
- Rewards
- Future maps
- Achievements
- Statistics not required immediately

These resources are requested only when required by gameplay.

---

# 7. On-Demand Loading

Example:

Player interacts with a merchant.

↓

OPEN_STORE

↓

React requests store items

↓

StoreItemsResponse

↓

Phaser opens ShopScene

The same principle applies to every optional gameplay feature.

---

# 8. Bootstrap Completion

The bootstrap process finishes only after every required resource has been loaded successfully.

Only then may React emit:

GAME_READY

After receiving GAME_READY, Phaser must:

- Enable player movement.
- Enable enemy AI.
- Enable collisions.
- Enable player interactions.
- Start the gameplay loop.

---

# 9. Error Handling

If any required resource fails to load:

Backend

↓

React

↓

API_ERROR

↓

Phaser

↓

Display Error Screen

The player must never enter the game with incomplete bootstrap data.

---

# 10. Future Extensions

Additional resources may be incorporated into the bootstrap process if they become mandatory for gameplay.

Optional systems should continue following the on-demand loading strategy to preserve performance and maintainability.