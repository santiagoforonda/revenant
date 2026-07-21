# Revenant Game - Design Document

## Overview

The Combat module is responsible for processing the rewards granted after defeating an enemy.

All combat operations require an authenticated user. The authenticated user is obtained from the JWT validated by Spring Security, and the associated player is used to update the game progression.

The module updates the player's gold, experience, level progression, and boss completion status.

---

## Architecture

The module follows the project's layered architecture.

```
                +---------------------+
                |      React Client   |
                +----------+----------+
                           |
                           | JWT
                           |
                           ▼
              Spring Security Filter Chain
                           |
                    JWT Authentication Filter
                           |
                           ▼
                 Security Context (User)
                           |
                           ▼
                  CombatController
                           |
                           ▼
                    CombatService
                           |
      +--------------------+--------------------+
      |                    |                    |
      ▼                    ▼                    ▼
PlayerRepository     EnemyRepository    PlayerBossRepository
                           |
                           ▼
                      PostgreSQL
```

The authenticated user is obtained from the Security Context after JWT validation. The Combat module never receives the player identifier from the client.

---

## Components and Interfaces

### CombatController

**Responsibilities**

- Receive combat completion requests.
- Delegate combat processing to the service layer.

**Endpoints**

- POST /api/combat/reward

---

### CombatService

**Responsibilities**

- Obtain the authenticated user from the Security Context.
- Retrieve the player associated with the authenticated user.
- Retrieve enemy rewards.
- Update player gold.
- Update player experience.
- Calculate level progression.
- Register boss defeats.
- Persist player progression.

---

### PlayerRepository

**Responsibilities**

- Retrieve a player associated with a user.
- Persist player progression.

---

### EnemyRepository

**Responsibilities**

- Retrieve enemies by identifier.

---

### PlayerBossRepository

**Responsibilities**

- Retrieve player boss progression.
- Update boss completion status.

---

## Data Models

### CombatRewardRequest

| Field | Type |
|------|------|
| enemyId | Long |

---

### CombatRewardResponse

| Field | Type |
|------|------|
| goldObtained | Integer |
| experienceObtained | Integer |
| currentGold | Integer |
| currentExperience | Integer |
| currentLevel | Integer |
| bossDefeated | Boolean |

---

### Business Rules

- The authenticated player is obtained from the JWT.
- The player identifier is never received in the request body.
- Required experience is calculated as:

```
requiredExperience = currentLevel × 100
```

- The player may gain multiple levels if the accumulated experience is sufficient.
- If the defeated enemy is a boss, the corresponding record in `player_bosses` must be updated.