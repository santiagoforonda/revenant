# Requirements Document

## Introduction

This document defines the functional requirements for the Store module of the Revenant backend using the EARS (Easy Approach to Requirements Syntax).

The Store module provides read-only operations that allow authenticated players to retrieve stores available on a map and the items sold by each store.

---

## Glossary

| Term | Definition |
|------|------------|
| Store | A shop available within a map. |
| Store Item | An item sold by a specific store. |
| Map | A playable area containing NPCs, enemies and stores. |
| Player | Authenticated game character associated with a user. |
| JWT | JSON Web Token used to authenticate requests. |

---

## Requirements

### Requirement 1: Get Stores by Map

**Description**

The system must return all stores available on a specific map.

#### Acceptance Criteria

- **WHEN** an authenticated player requests the stores of a map,
  **THE SYSTEM SHALL** identify the authenticated user from the JWT.

- **WHEN** the request is received,
  **THE SYSTEM SHALL** retrieve all stores associated with the requested map.

- **IF** the map has no stores,
  **THEN THE SYSTEM SHALL** return an empty collection.

---

### Requirement 2: Get Store Items

**Description**

The system must return all items available in a specific store.

#### Acceptance Criteria

- **WHEN** an authenticated player requests the items of a store,
  **THE SYSTEM SHALL** retrieve all items associated with the requested store.

- **WHEN** the items are retrieved,
  **THE SYSTEM SHALL** include the current stock and price of each item.

- **IF** the store has no items,
  **THEN THE SYSTEM SHALL** return an empty collection.