# Game HUD - Tasks Document

## Overview

This document defines the implementation tasks for the Game HUD feature.

The objective is to implement a persistent HUD using Phaser that displays the authenticated player's information throughout gameplay.

The HUD is rendered entirely by Phaser and remains fixed at the top of the screen independently of camera movement.

The only interaction between the HUD and React is the Logout action, which shall be communicated through the application's Event Bus.

# Implementation Plan

## Phase 1 - HUD Infrastructure

**Objectives**

- Create the Phaser HUD system.
- Integrate it into the MainScene.
- Connect it to the player session data.

**Deliverables**

- HUD Manager.
- MainScene integration.
- Player session synchronization.

---

## Phase 2 - Player Information

**Objectives**

- Display authenticated player information.
- Render player statistics.

**Deliverables**

- Username.
- Player class.
- Health bar.
- Experience bar.
- Level.
- Gold.

---

## Phase 3 - Logout Integration

**Objectives**

- Implement logout through the Event Bus.
- Keep Phaser independent from React.

**Deliverables**

- Logout button.
- Event emission.
- React integration.

---

## Phase 4 - Validation

**Objectives**

- Validate HUD behavior.
- Verify architectural compliance.

**Deliverables**

- Stable Phaser HUD.
- Successful Event Bus integration.

---

## Task Dependency Graph

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
        "task-5",
        "task-6"
      ]
    },
    {
      "wave": 4,
      "tasks": [
        "task-7",
        "task-8"
      ]
    }
  ]
}
```

---

## Tasks

- [x] 1. Implement the HUD Manager.

  - Create a dedicated HUD Manager responsible for rendering all HUD elements.
  - Attach the HUD to the MainScene.
  - Keep the HUD fixed to the camera.
  - Centralize all HUD rendering logic inside the HUD Manager.

---

- [x] 2. Integrate the HUD into the MainScene.

  - Create one HUD Manager instance.
  - Initialize the HUD after the player has been created.
  - Update the HUD every frame if required.
  - Keep MainScene responsible only for coordinating the HUD lifecycle.

---

- [x] 3. Display player information.

  - Display the authenticated username.
  - Display the player's class.
  - Display the player's current level.
  - Display the player's current gold.
  - Synchronize displayed values with the authenticated player state.

---

- [x] 4. Implement the status bars.

  - Create the Health Bar.
  - Create the Experience Bar.
  - Update both bars whenever player values change.
  - Keep the rendering independent from gameplay logic.

---

- [x] 5. Implement the Logout button.

  - Render the Logout button using Phaser UI objects.
  - Detect pointer interactions.
  - Emit a LogoutRequested event through the Event Bus.
  - Do not invoke React or authentication services directly.

---

- [x] 6. Integrate the Event Bus.

  - Subscribe React to the LogoutRequested event.
  - Invoke the existing authentication logout workflow.
  - Redirect the player to the login screen.
  - Preserve the architectural separation between Phaser and React.

---

- [x] 7. Validate HUD behavior.

  - Verify the HUD remains fixed during camera movement.
  - Verify username, class, level, and gold are displayed correctly.
  - Verify the Health Bar updates correctly.
  - Verify the Experience Bar updates correctly.
  - Verify the Logout button emits the expected event.

---

- [x] 8. Validate architecture compliance.

  - Verify the HUD never communicates directly with React.
  - Verify the HUD never communicates directly with backend services.
  - Verify the Event Bus is the only communication channel between Phaser and React.
  - Verify MainScene contains no HUD rendering logic.
  - Verify the HUD remains reusable by future gameplay features.

---

## Notes

- This feature MUST comply with:
  - `phaser_developer.md`
  - `react_developer.md`

- This feature MUST comply with the architecture documentation located under:

  ```text
  docs/architecture/
  ```

- The HUD MUST be implemented entirely in Phaser.

- All HUD elements MUST remain fixed to the camera.

- The HUD MUST obtain player information from the authenticated player state.

- The Logout button MUST emit a `LogoutRequested` event through the Event Bus.

- React MUST subscribe to the Event Bus and execute the existing logout workflow.

- Phaser MUST NEVER import React components or authentication services.

- React MUST NEVER manipulate Phaser objects directly.

- The Event Bus MUST remain the only communication mechanism between Phaser and React.

- Future HUD modules (Boss Health Bar, Enemy Health UI, Skill Cooldowns, Quest Tracker, etc.) SHOULD reuse the HUD Manager.

- Out of scope:
  - Inventory.
  - Combat.
  - NPC interaction.
  - Shop.
  - Quest system.
  - Minimap.
  - Skill bar.
  - Backend communication.
  - Player progression calculations.