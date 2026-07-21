# Requirements Document

## Introduction

This document defines the functional requirements for the Save Game module of the Revenant backend using the EARS (Easy Approach to Requirements Syntax).

The Save Game module is responsible for persisting the current progress of an authenticated player. The authenticated user is obtained from the JWT validated by Spring Security. The module updates the player's current map, position, and last saved timestamp.

---

## Glossary

| Term | Definition |
|------|------------|
| Player | Authenticated game character associated with a user account. |
| Save Game | Process of persisting the current state of a player's progress. |
| Current Map | Map where the player is currently located. |
| Player Position | Coordinates representing the player's location within the current map. |
| JWT | JSON Web Token used to authenticate requests. |

---

## Requirements

### Requirement 1: Save Game Progress

**Description**

The system must allow an authenticated player to save the current game progress.

#### Acceptance Criteria

- **WHEN** an authenticated player submits a save game request,
  **THE SYSTEM SHALL** identify the authenticated user from the JWT.

- **WHEN** the authenticated user is identified,
  **THE SYSTEM SHALL** retrieve the associated player.

- **WHEN** the save request is processed,
  **THE SYSTEM SHALL** update the player's current map.

- **WHEN** the save request is processed,
  **THE SYSTEM SHALL** update the player's current position.

- **WHEN** the save request is processed,
  **THE SYSTEM SHALL** update the last saved timestamp.

- **WHEN** all updates are completed,
  **THE SYSTEM SHALL** persist the player's updated state.

---

### Requirement 2: Save Consistency

**Description**

The system must guarantee that the save operation is executed atomically.

#### Acceptance Criteria

- **WHEN** the save operation is executed,
  **THE SYSTEM SHALL** execute the entire operation within a single transaction.

- **IF** any persistence operation fails,
  **THEN THE SYSTEM SHALL** rollback all changes performed during the save process.