# Requirements Document

## Introduction

This document defines the functional requirements for the Combat module of the Revenant backend using the EARS (Easy Approach to Requirements Syntax).

The Combat module is responsible for processing the rewards obtained after defeating an enemy, updating the player's progression, and recording boss defeats.

---

## Glossary

| Term | Definition |
|------|------------|
| User | Authenticated account that owns a player. |
| Player | Game character associated with a user account. |
| Enemy | A hostile character that grants gold and experience when defeated. |
| Boss | A special type of enemy whose defeat is permanently recorded for each player. |
| Reward | Gold and experience granted after defeating an enemy. |
| JWT | JSON Web Token used to authenticate requests. |

---

## Requirements

### Requirement 1: Process Combat Rewards

**Description**

The system must process the rewards obtained after an authenticated player defeats an enemy.

#### Acceptance Criteria

- **WHEN** an authenticated player submits a defeated enemy identifier,
  **THE SYSTEM SHALL** identify the authenticated user from the JWT.

- **WHEN** the authenticated user is identified,
  **THE SYSTEM SHALL** retrieve the player associated with that user.

- **WHEN** the player and the defeated enemy are identified,
  **THE SYSTEM SHALL** retrieve the enemy's gold reward and experience reward.

- **WHEN** the rewards are retrieved,
  **THE SYSTEM SHALL** add the obtained gold to the player's current gold.

- **WHEN** the rewards are retrieved,
  **THE SYSTEM SHALL** add the obtained experience to the player's accumulated experience.

---

### Requirement 2: Update Player Level

**Description**

The system must automatically update the player's level according to the accumulated experience.

#### Acceptance Criteria

- **WHEN** the player's accumulated experience is updated,
  **THE SYSTEM SHALL** calculate the required experience using the following formula:

  ```
  requiredExperience = currentLevel × 100
  ```

- **IF** the player's accumulated experience is greater than or equal to the required experience,
  **THEN THE SYSTEM SHALL** increase the player's level.

- **WHEN** the player gains a level,
  **THE SYSTEM SHALL** continue validating the accumulated experience until no additional level can be obtained.

---

### Requirement 3: Register Boss Defeat

**Description**

The system must record the defeat of a boss for the authenticated player.

#### Acceptance Criteria

- **IF** the defeated enemy is a boss,
  **THEN THE SYSTEM SHALL** update the corresponding record in `player_bosses` by setting `is_defeat` to `true`.


### Requirement 4: Authorize Combat Reward Processing

**Description**

The system must only process combat rewards for authenticated users.

#### Acceptance Criteria

- **IF** the request does not contain a valid JWT,
  **THEN THE SYSTEM SHALL** reject the request with an authentication error.

- **IF** the authenticated user is not associated with a player,
  **THEN THE SYSTEM SHALL** reject the request indicating that no player profile exists.