# Implementation Plan: Revenant Game

## Overview

This document describes the implementation tasks for the Shopping module.

All implementation tasks must follow the functional requirements defined in `requirements.md` and the architectural decisions defined in `design.md`.

---

## Tasks

### Phase 1: Persistence Layer

- [x] Implement the repository queries required to retrieve store items.
- [x] Implement the repository queries required to retrieve player information.
- [x] Implement the repository queries required to retrieve inventory records.

---

### Phase 2: Business Logic

- [x] Implement ShoppingService.
- [x] Retrieve the authenticated user from the Security Context.
- [x] Retrieve the associated player.
- [x] Retrieve the requested store item.
- [x] Validate stock availability.
- [x] Validate the player's available gold.
- [x] Subtract the item's price from the player's gold.
- [x] Decrease the store item's stock.
- [x] Add the purchased item to the player's inventory.
- [x] Execute the purchase within a transactional method.

---

### Phase 3: REST API

- [x] Implement ShoppingController.
- [x] Create the purchase endpoint.
- [x] Implement request and response DTOs.
- [x] Document the endpoint using OpenAPI.

---

### Phase 4: Testing and Validation

- [x] Validate successful purchases.
- [x] Validate purchases with insufficient stock.
- [x] Validate purchases with insufficient gold.
- [x] Validate inventory updates.
- [x] Validate player gold updates.
- [x] Validate store stock updates.
- [x] Validate transaction rollback on failure.

---

## Notes

- All purchase operations must be executed for authenticated users only.
- Business logic must be implemented exclusively in the service layer.
- Controllers must not contain business logic.
- The purchase operation must be atomic and transactional.
- Inventory management must reuse the existing Inventory module logic whenever possible.