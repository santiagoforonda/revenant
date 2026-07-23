# React - Phaser Event Bus

## 1. Overview

This document defines the communication contract between React and Phaser.

React and Phaser communicate exclusively through an Event Bus.

Neither module may directly invoke methods from the other.

All communication is performed using strongly typed events.

Whenever possible, event payloads must reuse the existing backend DTOs to avoid duplicated models.

---

# 2. Communication Principles

The Event Bus follows these principles.

- React and Phaser never import each other.
- Communication is event-driven.
- Every event has a single responsibility.
- Events must be strongly typed.
- Existing backend DTOs must be reused whenever possible.
- React owns backend communication.
- Phaser owns gameplay.

---

# 3. Event Structure

Every event must define:

- Event Name
- Emitter
- Listener
- Payload
- Response
- Description

---

# 4. React → Phaser Events

## GAME_INITIALIZED

### Emitter

React

### Listener

Phaser

### Payload

LoginResponse

### Response

None

### Description

Sent immediately after a successful authentication.

Contains all data required to initialize the game.

---

## API_ERROR

### Emitter

React

### Listener

Phaser

### Payload

ApiErrorResponse

### Response

None

### Description

Indicates that an API request failed.

Phaser should display an appropriate message to the player.

---

## SESSION_EXPIRED

### Emitter

React

### Listener

Phaser

### Payload

None

### Response

None

### Description

Indicates that the current session is no longer valid.

Phaser must stop gameplay and prepare for application shutdown.

---

# 5. Phaser → React Events

## OPEN_INVENTORY

### Emitter

Phaser

### Listener

React

### Payload

None

### Response

InventoryResponse

### Description

Requests the player's inventory.

---

## DELETE_INVENTORY_ITEM

### Emitter

Phaser

### Listener

React

### Payload

DeleteInventoryItemRequest

### Response

InventoryResponse

### Description

Removes an item from the player's inventory.

---

## OPEN_STORE

### Emitter

Phaser

### Listener

React

### Payload

StoreRequest

### Response

StoreItemsResponse

### Description

Requests the list of items available in a store.

---

## BUY_ITEM

### Emitter

Phaser

### Listener

React

### Payload

PurchaseItemRequest

### Response

PurchaseItemResponse

### Description

Purchases an item from a store.

---

## ENEMY_DEFEATED

### Emitter

Phaser

### Listener

React

### Payload

EnemyDefeatedRequest

### Response

CombatRewardResponse

### Description

Requests the reward obtained after defeating an enemy.

---

## SAVE_GAME

### Emitter

Phaser

### Listener

React

### Payload

SaveGameRequest

### Response

SaveGameResponse

### Description

Persists the current player progress.

---

# 6. DTO Reuse Principle

Whenever possible, every event payload and response must reuse the backend DTOs.

No duplicated frontend models should be created unless there is a technical reason.

This guarantees:

- Single source of truth.
- Easier maintenance.
- Reduced mapping code.
- Consistent validation.
- Backend and frontend synchronization.

---

# 7. Error Handling

Whenever an API request fails:

Backend

↓

React

↓

API_ERROR

↓

Phaser

↓

Display Error Message

Phaser never processes HTTP errors directly.

---

# 8. Session Expiration

Backend

↓

401 Unauthorized

↓

React

↓

SESSION_EXPIRED

↓

Phaser

↓

Destroy Game

↓

Navigate to Login

---

# 9. Forbidden Practices

The following practices are prohibited.

- Calling Axios from Phaser.
- Calling fetch() from Phaser.
- Accessing JWT inside Phaser.
- Importing React into Phaser.
- Importing Phaser into React.
- Sharing mutable state directly.

All communication must pass through the Event Bus.

---

# 10. Future Events

Future gameplay features must extend the Event Bus instead of introducing direct dependencies.

Examples:

- QuestAccepted
- QuestCompleted
- DialogueStarted
- DialogueFinished
- BossDefeated
- PlayerDied
- LevelUp
- AchievementUnlocked

The Event Bus is the only communication mechanism between React and Phaser.