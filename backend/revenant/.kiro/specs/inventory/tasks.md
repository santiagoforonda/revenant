# Implementation Plan: Revenant Game

## Overview

This document describes the implementation tasks for the Inventory module.

All implementation tasks must follow the functional requirements defined in `requirements.md` and the architectural decisions defined in `design.md`.

---

## Tasks

### Phase 1: Persistence Layer

- [x] Implement InventoryRepository.
- [x] Implement repository queries.
- [x] Retrieve inventory by player.
- [x] Retrieve inventory item by player and item.

---

### Phase 2: Business Logic

- [x] Implement InventoryService.
- [x] Retrieve the authenticated user from the Security Context.
- [x] Retrieve the associated player.
- [x] Add an item to the inventory.
- [x] Increase the quantity of an existing item.
- [x] Update the quantity of an inventory item.
- [x] Remove an inventory item.
- [x] Retrieve the player's inventory.

---

### Phase 3: REST API

- [x] Implement InventoryController.
- [x] Create the add item endpoint.
- [x] Create the update quantity endpoint.
- [x] Create the remove item endpoint.
- [x] Create the get inventory endpoint.
- [x] Implement request and response DTOs.

---

### Phase 4: Testing and Validation

- [x] Validate item insertion.
- [x] Validate quantity updates.
- [x] Validate item removal.
- [x] Validate inventory retrieval.
- [x] Validate authentication for all endpoints.

---

## Notes

- Inventory operations must be executed only for authenticated users.
- Business logic must be implemented exclusively in the service layer.
- Controllers must not contain business logic.
- A player cannot have duplicate inventory records for the same item.