# Revenant Game - Design Document

## Overview

The World module provides read-only operations that expose information about the game world.

This specification implements the functionality to retrieve all available maps. Every request requires an authenticated user. The authenticated user is obtained from the JWT validated by Spring Security.

---

## Architecture

```
React Client
      │
      ▼
Spring Security
      │
      ▼
WorldController
      │
      ▼
WorldService
      │
      ▼
MapWorldRepository
      │
      ▼
PostgreSQL
```

---

## Components and Interfaces

### WorldController

**Responsibilities**

- Receive requests to retrieve maps.
- Delegate processing to the service layer.

**Endpoints**

- GET /api/world/maps

---

### WorldService

**Responsibilities**

- Retrieve all available maps.
- Order maps by identifier.

---

### MapRepository

**Responsibilities**

- Retrieve all persisted maps.

---

## Data Models

### MapResponse

| Field | Type |
|------|------|
| id | Long |
| name | String |
| description | String |

---

### Business Rules

- The authenticated player is obtained from the JWT.
- The player identifier is never received in the request.
- World operations are read-only.
- Maps must be returned ordered by identifier.