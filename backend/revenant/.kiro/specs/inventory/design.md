# Revenant Game - Design Document

## Overview

The Inventory module manages the items owned by authenticated players.

All inventory operations require a valid JWT. The authenticated user is obtained from the Security Context established by Spring Security.

---

## Architecture

The module follows the project's layered architecture.

```
React Client
      │
      ▼
Spring Security
      │
      ▼
InventoryController
      │
      ▼
InventoryService
      │
 ┌────┴──────────────┐
 ▼                   ▼
PlayerRepository   InventoryRepository
                   ItemRepository
      │
      ▼
 PostgreSQL
```

---

## Components and Interfaces

### InventoryController

**Responsibilities**

- Receive inventory requests.
- Delegate processing to the service layer.

Endpoints

- POST /api/inventory
- PUT /api/inventory
- DELETE /api/inventory/{itemId}
- GET /api/inventory

---

### InventoryService

**Responsibilities**

- Obtain the authenticated user.
- Retrieve the associated player.
- Add items.
- Update quantities.
- Remove items.
- Retrieve player inventory.

---

### InventoryRepository

**Responsibilities**

- Persist inventory records.
- Retrieve inventory by player.
- Delete inventory records.

---

### ItemRepository

**Responsibilities**

- Retrieve items.

---

## Data Models

### AddInventoryItemRequest

| Field | Type |
|------|------|
| itemId | Long |
| quantity | Integer |

---

### UpdateInventoryRequest

| Field | Type |
|------|------|
| itemId | Long |
| quantity | Integer |

---

### InventoryResponse

| Field | Type |
|------|------|
| itemId | Long |
| itemName | String |
| quantity | Integer |

---

### Business Rules

- The authenticated player is obtained from the JWT.
- The player identifier is never received in the request.
- An item may appear only once in the player's inventory.
- Quantity cannot be negative.