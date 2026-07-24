# Kiro Specification Format

## Overview

This document defines the standard structure that every Kiro specification must follow in the Revenant project.

All new specifications MUST comply with this document.

Each feature specification consists of three documents:

- requirements.md
- design.md
- tasks.md

---

# Directory Structure

Every feature specification MUST use the following directory structure.

```text
.kiro/
└── specs/
    └── feature-name/
        ├── requirements.md
        ├── design.md
        └── tasks.md
```

Each feature MUST have its own directory.

---

# Requirements Document

Every `requirements.md` MUST follow this structure.

```markdown
# Requirements Document

## Introduction

## Glossary

## Requirements

### Requirement 1

#### Acceptance Criteria
```

---

## Introduction

Describes the purpose and scope of the feature.

---

## Glossary

Defines feature-specific terminology.

---

## Requirements

Each requirement MUST include:

- Requirement title
- User Story
- Acceptance Criteria

Acceptance Criteria SHOULD use the EARS format.

Example:

```text
WHEN the user submits valid credentials

THEN the system SHALL authenticate the user.
```

Supported EARS keywords include:

- WHEN
- IF
- WHILE
- WHERE

---

# Design Document

Every `design.md` MUST follow this structure.

```markdown
# Feature - Design Document

## Overview

## Architecture

### High-Level Architecture

## Components and Interfaces

## Data Models

## Correctness Properties

## Error Handling

## Testing Strategy
```

---

## Overview

Describes the purpose of the feature.

---

## Architecture

Explains the overall architecture.

---

## High-Level Architecture

Provides the high-level workflow.

Sequence diagrams may be included.

---

## Components and Interfaces

Defines all participating components.

Examples:

- Pages
- Services
- Controllers
- Event Bus
- Managers

---

## Data Models

Defines the request and response models.

Whenever possible, backend DTOs MUST be reused.

---

## Correctness Properties

Defines invariants that must always hold.

Examples:

- JWT must only be managed by React.
- Phaser never performs HTTP requests.

---

## Error Handling

Defines how failures are handled.

Examples:

- Validation errors
- Authentication errors
- API failures
- Session expiration

---

## Testing Strategy

Defines how the feature should be validated.

Recommended sections:

- Unit Testing
- Integration Testing
- End-to-End Testing

---

# Tasks Document

Every `tasks.md` MUST follow this structure.

```markdown
# Feature - Tasks Document

## Overview

## Implementation Plan

## Task Dependency Graph

## Tasks

## Notes
```

---

## Overview

Provides a brief description of the implementation.

---

## Implementation Plan

Defines the implementation phases.

Recommended format:

- Phase 1
- Phase 2
- Phase 3
- ...

Each phase SHOULD describe:

- Objectives
- Deliverables

---

## Task Dependency Graph

This section MUST contain a JSON code block.

The JSON MUST include a non-empty `waves` array.

Task IDs MUST use the format `"task-N"` where N matches the task number in the Tasks section.

Example:

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": [
        "task-1",
        "task-2"
      ]
    },
    {
      "wave": 2,
      "tasks": [
        "task-3",
        "task-4"
      ]
    },
    {
      "wave": 3,
      "tasks": [
        "task-5"
      ]
    }
  ]
}
```

Tasks within the same wave MAY be executed in parallel.

Tasks in wave N depend on the completion of all tasks in wave N-1.

The exact JSON schema must follow the Kiro specification format.

---

## Tasks

Tasks MUST be numbered and follow the exact format below.

**Required format:**

```text
- [ ] N. Task title
```

Or for completed tasks:

```text
- [x] N. Task title
```

Where `N` is a sequential number starting at 1.

**CRITICAL:** Tasks that do NOT follow this format will fail validation. The following formats are INVALID:

```text
- [ ] Task without number          ← INVALID (missing number)
- [ ] Create something             ← INVALID (missing number)
- [x] Do something                 ← INVALID (missing number)
```

**Sub-tasks:**

Each task MAY include indented sub-tasks describing implementation steps.

Sub-tasks are indented with 2 spaces and prefixed with a dash.

**Complete example:**

```markdown
- [ ] 1. Register the WASD keyboard controls in the MainScene.

  - Create cursor key bindings for W, A, S, D.

---

- [ ] 2. Process keyboard input during every update cycle.

  - Read active keys each frame.
  - Determine movement direction vector.

---

- [ ] 3. Implement player movement using Phaser Arcade Physics.

  - Enable physics on the player body.
  - Apply velocity based on input direction.
  - Normalize diagonal movement.
```

**Rules:**

- Each task MUST be separated by a `---` horizontal rule.
- Tasks MUST be numbered sequentially (1, 2, 3...).
- Task IDs in the dependency graph MUST use the format `"task-N"` (e.g., `"task-1"`, `"task-2"`).
- Sub-tasks are optional but recommended for complex tasks.
- Tasks SHOULD represent independent implementation units.

---

## Implementation Plan Heading

The Implementation Plan section MUST use a level-1 heading:

```markdown
# Implementation Plan
```

Using `## Implementation Plan` will fail validation.

---

## Notes

Provides implementation notes.

Typical contents include:

- Related steering documents
- Related architectural documents
- Out-of-scope functionality
- Additional implementation guidance

---

# Naming Convention

Feature directories SHOULD use lowercase kebab-case.

Examples:

```text
authentication

inventory

shop

combat

save-game
```

---

# Language

All specification documents MUST be written in English.

---

# Requirement Style

Requirements MUST follow the EARS methodology.

---

# Steering Compliance

Every specification MUST comply with:

- java_developer.md
- react_developer.md
- phaser_developer.md

---

# Architecture Compliance

Every specification MUST comply with the architectural documentation stored under:

```text
docs/architecture/
```

Specifications MUST NOT duplicate architectural decisions already documented there.

Instead, they SHOULD reference the corresponding architecture documents.

---

# General Principles

All specifications SHOULD be:

- Consistent
- Atomic
- Traceable
- Testable
- Unambiguous
- Maintainable

Feature specifications SHOULD describe a single functional capability.