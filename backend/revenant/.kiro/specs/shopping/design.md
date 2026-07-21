# Revenant Game - Design Document

## Overview

The Shopping module processes purchases performed by authenticated players.

The authenticated user is obtained from the JWT validated by Spring Security. The module validates the purchase request, updates the player's gold, decreases the store stock, adds the purchased item to the player's inventory, and guarantees transactional consistency.

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
ShoppingController
      │
      ▼
ShoppingService
      │
 ┌──────────────┬──────────────┬─────────────────┐
 ▼              ▼              ▼                 ▼
PlayerRepository StoreItemRepository InventoryRepository ItemRepository
      │
      ▼
 PostgreSQL
```

---

## Components and Interfaces

### ShoppingController

**Responsibilities**

- Receive purchase requests.
- Delegate purchase processing to the service layer.

**Endpoints**

- POST /api/shop/purchase

---

### ShoppingService

**Responsibilities**

- Retrieve the authenticated user.
- Retrieve the associated player.
- Retrieve the requested store item.
- Validate stock availability.
- Validate player gold.
- Update player gold.
- Update store stock.
- Add the purchased item to the player's inventory.
- Execute the purchase within a transaction.

---

### PlayerRepository

**Responsibilities**

- Retrieve player information.
- Persist updated player data.

---

### StoreItemRepository

**Responsibilities**

- Retrieve store items.
- Persist updated stock.

---

### InventoryRepository

**Responsibilities**

- Retrieve player inventory.
- Insert new inventory items.
- Update inventory quantities.

---

## Data Models

### PurchaseItemRequest

| Field | Type |
|------|------|
| storeItemId | Long |

---

### PurchaseItemResponse

| Field | Type |
|------|------|
| itemId | Long |
| itemName | String |
| quantity | Integer |
| remainingGold | Integer |

---

### Business Rules

- The authenticated player is obtained from the JWT.
- The player identifier is never received in the request.
- A purchase is allowed only when stock is greater than zero.
- A purchase is allowed only when the player has sufficient gold.
- Every purchase decreases the stock by one.
- Every purchase updates the player's inventory.
- The purchase process must execute within a single transaction.