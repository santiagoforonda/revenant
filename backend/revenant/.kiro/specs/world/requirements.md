# Requirements Document

## Introduction

This document defines the functional requirements for the World module of the Revenant backend using the EARS (Easy Approach to Requirements Syntax).

The World module provides read-only operations that allow authenticated players to retrieve information about the game world. This specification covers the retrieval of all available maps.

---

## Glossary

| Term | Definition |
|------|------------|
| Map | A playable area in the game world where the player can explore, fight enemies and interact with NPCs. |
| Player | Authenticated game character associated with a user account. |
| World | Collection of all playable maps in the game. |
| JWT | JSON Web Token used to authenticate requests. |

---

## Requirements

### Requirement 1: Get Maps

**Description**

The system must return all available maps in the game world.

#### Acceptance Criteria

- **WHEN** an authenticated player requests the list of maps,
  **THE SYSTEM SHALL** identify the authenticated user from the JWT.

- **WHEN** the authenticated user is identified,
  **THE SYSTEM SHALL** retrieve every map available in the system.

- **WHEN** the maps are retrieved,
  **THE SYSTEM SHALL** return them ordered by their identifier.

- **IF** no maps exist,
  **THEN THE SYSTEM SHALL** return an empty collection.