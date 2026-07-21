# Implementation Plan: Revenant Game

## Overview

This document describes the implementation tasks for the Store module.

All implementation tasks must follow the functional requirements defined in `requirements.md` and the architectural decisions defined in `design.md`.

---

## Tasks

### Phase 1: Persistence Layer

- [x] Implement the repository query to retrieve stores by map.
- [x] Implement the repository query to retrieve items by store.

---

### Phase 2: Business Logic

- [x] Implement StoreService.
- [x] Retrieve the authenticated user from the Security Context.
- [x] Retrieve stores by map.
- [x] Retrieve store items.

---

### Phase 3: REST API

- [x] Implement StoreController.
- [x] Create the endpoint to retrieve stores by map.
- [x] Create the endpoint to retrieve store items.
- [x] Implement request and response DTOs.
- [x] Document all endpoints using OpenAPI.

---

### Phase 4: Testing and Validation

- [x] Validate store retrieval by map.
- [x] Validate item retrieval by store.
- [x] Validate authenticated access.
- [x] Validate empty responses.

---

## Notes

- All operations are read-only.
- Controllers must not contain business logic.
- Business logic must be implemented exclusively in the service layer.
- JPA entities must never be exposed through the REST API.