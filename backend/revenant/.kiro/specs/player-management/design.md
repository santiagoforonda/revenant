# Revenant Game - Design Document

## Overview

The Save Game module persists the current state of an authenticated player's game progress.

The authenticated user is obtained from the JWT validated by Spring Security. The module updates the player's current map, position, and last saved timestamp within a single transactional operation.

---

## Architecture

```text
React Client
      │
      ▼
Spring Security
      │
      ▼
SaveGameController
      │
      ▼
SaveGameService
      │
      ▼
PlayerRepository
      │
      ▼
PostgreSQL
```

---

## Components and Interfaces

### SaveGameController

**Responsibilities**

- Receive save game requests.
- Delegate processing to the service layer.

**Endpoints**

- POST /api/player/save

---

### SaveGameService

**Responsibilities**

- Retrieve the authenticated user.
- Retrieve the associated player.
- Update the player's current map.
- Update the player's current position.
- Update the last saved timestamp.
- Persist the updated player.
- Execute the save operation within a transaction.

---

### PlayerRepository

**Responsibilities**

- Retrieve the authenticated player.
- Persist player progress.

---

## Data Models

### SaveGameRequest

| Field | Type |
|------|------|
| mapId | Long |
| positionX | Double |
| positionY | Double |

---

### SaveGameResponse

| Field | Type |
|------|------|
| message | String |

---

### Business Rules

- The authenticated player is obtained from the JWT.
- The player identifier is never received in the request.
- Only authenticated players can save their progress.
- The save operation updates only the player's progress information.
- The save operation must execute within a single transaction.