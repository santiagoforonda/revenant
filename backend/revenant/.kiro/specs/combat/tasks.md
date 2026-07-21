# Implementation Plan: Revenant Game

## Overview

This document describes the implementation tasks for the Combat module.

---

## Tasks

### Phase 1: Persistence Layer

- [x] 1. Implement the repositories required by the Combat module.
- [x] 2. Implement the queries to retrieve enemies and player boss progress.

---

### Phase 2: Business Logic

- [x] 3. Implement CombatService.
- [x] 4. Retrieve enemy rewards.
- [x] 5. Update player gold.
- [x] 6. Update player experience.
- [x] 7. Calculate the experience required for leveling up.
- [x] 8. Support multiple level-ups in a single reward calculation.
- [x] 9. Register boss defeats.
- [x] 10. Persist player progression.

---

### Phase 3: REST API

- [x] 11. Implement CombatController.
- [x] 12. Create the combat reward endpoint.
- [x] 13. Implement request and response DTOs.

---

### Phase 4: Testing and Validation

- [x] 14. Validate reward calculation.
- [x] 15. Validate player gold update.
- [x] 16. Validate player experience update.
- [x] 17. Validate level progression.
- [x] 18. Validate multiple level-ups.
- [x] 19. Validate boss defeat registration.

---

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": [1] },
    { "wave": 2, "tasks": [2] },
    { "wave": 3, "tasks": [3] },
    { "wave": 4, "tasks": [4, 9, 10] },
    { "wave": 5, "tasks": [5] },
    { "wave": 6, "tasks": [6] },
    { "wave": 7, "tasks": [7] },
    { "wave": 8, "tasks": [8, 11] },
    { "wave": 9, "tasks": [12] },
    { "wave": 10, "tasks": [13] },
    { "wave": 11, "tasks": [14] },
    { "wave": 12, "tasks": [15, 16] },
    { "wave": 13, "tasks": [17, 18] },
    { "wave": 14, "tasks": [19] }
  ]
}
```

---

## Notes

- Combat business rules must be implemented exclusively in the service layer.
- Controllers must not contain business logic.
- The combat process must be executed within a single transaction to guarantee data consistency.
