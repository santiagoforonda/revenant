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

Example:

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": [
        "task-1"
      ]
    },
    {
      "wave": 2,
      "tasks": [
        "task-2"
      ]
    }
  ]
}
```

The exact JSON schema must follow the Kiro specification format.

---

## Tasks

Tasks SHOULD be organized as checklists.

Example:

```markdown
- [ ] Create AuthenticationService

- [ ] Implement LoginPage

- [ ] Implement RegisterPage
```

Tasks SHOULD represent independent implementation units.

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