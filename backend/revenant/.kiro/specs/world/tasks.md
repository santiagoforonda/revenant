# Implementation Plan: Revenant Game

## Overview

This document describes the implementation tasks for the World module.

All implementation tasks must follow the functional requirements defined in `requirements.md` and the architectural decisions defined in `design.md`.

---

## Tasks

### Phase 1: Persistence Layer

- [x] Implement the repository query to retrieve all maps ordered by identifier.

---

### Phase 2: Business Logic

- [x] Implement WorldService.
- [x] Retrieve the authenticated user from the Security Context.
- [x] Retrieve all maps ordered by identifier.

---

### Phase 3: REST API

- [x] Implement WorldController.
- [x] Create the endpoint to retrieve all maps.
- [x] Implement response DTOs.
- [x] Document the endpoint using OpenAPI.

---

### Phase 4: Testing and Validation

- [x] Validate successful retrieval of maps.
- [x] Validate authenticated access.
- [x] Validate empty responses.

---

## Notes

- All operations are read-only.
- Controllers must not contain business logic.
- Business logic must be implemented exclusively in the service layer.
- JPA entities must never be exposed through the REST API.
- Repository queries should return maps ordered by identifier.