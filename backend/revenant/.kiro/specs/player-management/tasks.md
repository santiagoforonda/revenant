# Implementation Plan: Revenant Game

## Overview

This document describes the implementation tasks for the Save Game module.

All implementation tasks must follow the functional requirements defined in `requirements.md` and the architectural decisions defined in `design.md`.

---

## Tasks

### Phase 1: Persistence Layer

- [ ] Implement the repository query to retrieve the authenticated player.
- [ ] Persist the player's updated progress.

---

### Phase 2: Business Logic

- [ ] Implement SaveGameService.
- [ ] Retrieve the authenticated user from the Security Context.
- [ ] Retrieve the associated player.
- [ ] Update the player's current map.
- [ ] Update the player's current position.
- [ ] Update the last saved timestamp.
- [ ] Execute the save operation within a transactional method.

---

### Phase 3: REST API

- [ ] Implement SaveGameController.
- [ ] Create the save game endpoint.
- [ ] Implement request and response DTOs.
- [ ] Document the endpoint using OpenAPI.

---

### Phase 4: Testing and Validation

- [ ] Validate successful game saves.
- [ ] Validate authenticated access.
- [ ] Validate persistence of the current map.
- [ ] Validate persistence of the player position.
- [ ] Validate transaction rollback on failure.

---

## Notes

- All save operations require authentication.
- Controllers must not contain business logic.
- Business logic must be implemented exclusively in the service layer.
- JPA entities must never be exposed through the REST API.
- The save operation must be atomic and transactional.