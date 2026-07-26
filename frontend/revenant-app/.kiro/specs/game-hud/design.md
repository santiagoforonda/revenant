# Game HUD - Design Document

## Overview

This document describes the design of the Game HUD feature.

The Game HUD provides a persistent user interface displayed at the top of the game screen, allowing the player to monitor essential character information throughout gameplay.

The HUD is implemented as a React component rendered independently from the Phaser canvas. It consumes player information from the global application state established during authentication.

The Game HUD is responsible only for displaying information and initiating the logout process. It does not implement gameplay mechanics, combat, inventory management, or backend communication.

---

## Architecture

The Game HUD belongs to the React layer of the application and is rendered as an overlay above the Phaser game canvas.

Player information originates from the authenticated session stored in the application's global state.

Whenever player data changes, the HUD automatically reflects the updated values without interacting directly with the game engine.

### High-Level Architecture

```text
Authentication
        │
        ▼
 Authentication Store
        │
        ▼
    Game HUD
        │
        ├── Username
        ├── Player Class
        ├── Health Bar
        ├── Experience Bar
        ├── Level
        ├── Gold
        └── Logout Button
```

The Game HUD remains visible while the Game Page is active and is completely independent from the Phaser scene.

---

## Components and Interfaces

### GamePage

**Responsibilities**

- Render the Phaser game.
- Render the Game HUD.
- Coordinate the lifecycle of both components.

GamePage does not contain HUD rendering logic.

---

### GameHUD

**Responsibilities**

- Display player information.
- Render the health bar.
- Render the experience bar.
- Display player level.
- Display player gold.
- Display username.
- Display player class.
- Render the Logout button.
- Invoke the logout action.

The GameHUD is responsible only for presentation.

---

### Authentication Store

**Responsibilities**

- Store the authenticated player session.
- Expose the player's current information.
- Expose the logout operation.
- Notify React components when player information changes.

The Authentication Store remains the single source of truth for player information.

---

### Health Bar Component

**Responsibilities**

- Display the player's current health.
- Update automatically when health changes.

The Health Bar does not calculate health values.

---

### Experience Bar Component

**Responsibilities**

- Display the player's current experience progress.
- Update automatically when experience changes.

The Experience Bar does not calculate level progression.

---

### Logout Button

**Responsibilities**

- Allow the player to terminate the current session.
- Invoke the logout action provided by the Authentication Store.

The Logout Button contains no authentication logic.

---

## Data Models

The Game HUD consumes the authenticated player session.

```text
Player Session

- username
- typePlayer
- healthPoints
- experience
- level
- gold
```

The HUD never owns or modifies this data.

---

### Health Model

```text
healthPoints
```

Represents the player's current health value.

---

### Experience Model

```text
experience
```

Represents the player's accumulated experience.

---

### Player Information

```text
username

typePlayer

level

gold
```

These values are displayed exactly as stored in the authenticated session.

---

## Correctness Properties

The following invariants must always hold:

- The Game HUD must remain fixed at the top of the screen.
- The Game HUD must never move with the Phaser camera.
- The HUD must render only when an authenticated session exists.
- Username must always match the authenticated player.
- Player class must always match the authenticated player.
- Health Bar must always represent the current health value.
- Experience Bar must always represent the current experience value.
- Level must always represent the current player level.
- Gold must always represent the current player gold.
- Logout must always invoke the Authentication Store.
- The Game HUD must never communicate directly with the backend.
- The Game HUD must never contain gameplay logic.
- The Game HUD must remain independent from Phaser.

---

## Error Handling

The system shall gracefully handle the following situations:

- Missing authenticated session.
- Missing player information.
- Invalid health value.
- Invalid experience value.
- Logout failures.
- Unexpected rendering failures.

If the authenticated session is unavailable, the HUD shall not be rendered.

If individual player attributes are unavailable, the remaining HUD information shall continue to be displayed whenever possible.

Rendering failures must never terminate the game.

---

## Testing Strategy

### Unit Testing

Verify that:

- The Game HUD renders correctly.
- Username is displayed correctly.
- Player class is displayed correctly.
- Health Bar receives the correct value.
- Experience Bar receives the correct value.
- Gold is displayed correctly.
- Level is displayed correctly.
- Logout invokes the Authentication Store.

---

### Integration Testing

Verify that:

- The Game HUD initializes after successful authentication.
- Updates to the Authentication Store automatically update the HUD.
- Logout removes the authenticated session.
- Logout redirects the player to the login page.
- The HUD remains visible while the Game Page is active.

---

### End-to-End Testing

Verify that:

- The Game HUD remains fixed at the top of the screen during gameplay.
- Camera movement never affects the HUD position.
- Player information is displayed immediately after entering the game.
- Health and experience values update correctly.
- Gold and level remain synchronized with the authenticated session.
- Logout successfully terminates the session and returns the player to the login screen.
- The Game HUD remains independent from Phaser, combat, inventory, NPC interaction, backend communication, and gameplay mechanics.