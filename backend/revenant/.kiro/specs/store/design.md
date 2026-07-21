# Revenant Game - Design Document

## Overview

The Store module provides read-only operations for retrieving stores and the items available in each store.

All requests require an authenticated user. The authenticated user is obtained from the JWT validated by Spring Security.

---

## Architecture

```
React Client
      │
      ▼
Spring Security
      │
      ▼
StoreController
      │
      ▼
StoreService
      │
 ┌───────────────┬─────────────────┐
 ▼               ▼
StoreRepository  StoreItemRepository
      │
      ▼
 PostgreSQL
```

---

## Components and Interfaces

### StoreController

**Responsibilities**

- Receive store requests.
- Delegate processing to the service layer.

**Endpoints**

- GET /api/maps/{mapId}/stores
- GET /api/stores/{storeId}/items

---

### StoreService

**Responsibilities**

- Retrieve stores by map.
- Retrieve items by store.

---

### StoreRepository

**Responsibilities**

- Retrieve stores associated with a map.

---

### StoreItemRepository

**Responsibilities**

- Retrieve items associated with a store.

---

## Data Models

### StoreResponse

| Field | Type |
|------|------|
| storeId | Long |
| storeName | String |

---

### StoreItemResponse

| Field | Type |
|------|------|
| itemId | Long |
| itemName | String |
| price | Integer |
| stock | Integer |

---

### Business Rules

- The authenticated player is obtained from the JWT.
- The player identifier is never received in the request.
- Store operations are read-only.
- The current stock of every item must be returned.