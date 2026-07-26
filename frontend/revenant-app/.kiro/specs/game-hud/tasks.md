# Game HUD - Tasks Document

## Overview

This document defines the implementation tasks for the Game HUD feature.

The objective is to implement a persistent user interface displayed at the top of the game screen that presents the authenticated player's information throughout gameplay.

The Game HUD is implemented entirely in React and consumes data from the Authentication Store. It remains independent from Phaser and gameplay mechanics.

# Implementation Plan

## Phase 1 - HUD Infrastructure

**Objectives**

- Create the Game HUD component.
- Integrate the HUD into the Game Page.
- Establish communication with the Authentication Store.

**Deliverables**

- GameHUD component.
- GamePage integration.
- Authentication Store connection.

---

## Phase 2 - Player Information

**Objectives**

- Display authenticated player information.
- Render player statistics.

**Deliverables**

- Username display.
- Player class display.
- Health bar.
- Experience bar.
- Level display.
- Gold display.

---

## Phase 3 - Logout Integration

**Objectives**

- Implement the logout functionality.
- Synchronize the HUD with the authentication lifecycle.

**Deliverables**

- Logout button.
- Logout flow.
- Session synchronization.

---

## Phase 4 - Validation

**Objectives**

- Validate HUD behavior.
- Verify architecture compliance.

**Deliverables**

- Stable Game HUD.
- Successful integration with the React application.

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

- [-] 1. Create the Game HUD component.

  - Create the GameHUD React component.
  - Position the HUD at the top of the screen.
  - Ensure the HUD remains fixed independently of the Phaser camera.
  - Prepare the layout for all HUD elements.

---

- [~] 2. Integrate the Game HUD into the Game Page.

  - Render the GameHUD component from the GamePage.
  - Display the HUD only while the Game Page is active.
  - Connect the HUD to the Authentication Store.
  - Keep GamePage responsible only for composition.

---

- [~] 3. Display player information.

  - Display the authenticated username.
  - Display the player's class.
  - Display the player's current level.
  - Display the player's current gold.
  - Synchronize all values with the Authentication Store.

---

- [~] 4. Implement the status bars.

  - Create the Health Bar component.
  - Create the Experience Bar component.
  - Update both bars automatically when player data changes.
  - Keep both components purely presentational.

---

- [~] 5. Implement the logout functionality.

  - Add the Logout button.
  - Invoke the Authentication Store logout action.
  - Clear the authenticated session.
  - Redirect the player to the login screen.

---

- [~] 6. Synchronize the HUD with the player session.

  - Initialize the HUD after successful authentication.
  - Update displayed values when the Authentication Store changes.
  - Remove the HUD after logout.
  - Handle missing session data safely.

---

- [~] 7. Validate HUD behavior.

  - Verify the HUD remains fixed during camera movement.
  - Verify username, class, level, and gold are displayed correctly.
  - Verify the Health Bar updates correctly.
  - Verify the Experience Bar updates correctly.
  - Verify logout successfully returns the player to the login screen.

---

- [~] 8. Validate architecture compliance.

  - Verify the Game HUD never communicates directly with the backend.
  - Verify the Game HUD contains no gameplay logic.
  - Verify the Game HUD remains independent from Phaser.
  - Verify the Authentication Store remains the single source of truth.
  - Verify the Game HUD remains reusable by future gameplay features.

---

## Notes

- This feature MUST comply with:
  - `react_developer.md`
  - `phaser_developer.md`

- This feature MUST comply with the architecture documentation located under:

  ```text
  docs/architecture/
  ```

- The Game HUD MUST be implemented as a React component.

- The Game HUD MUST remain fixed at the top of the screen.

- The Game HUD MUST consume all player information exclusively from the Authentication Store.

- The Authentication Store MUST remain the single source of truth for authenticated player data.

- The Game HUD MUST never communicate directly with backend services.

- The Game HUD MUST never contain gameplay logic.

- The Health Bar and Experience Bar MUST remain presentational components.

- The Logout button MUST invoke the existing authentication logout workflow.

- The Game HUD MUST remain reusable by future features including:
  - Enemy Health UI
  - Boss Health Bar
  - Skill Cooldown UI
  - Quest Tracker
  - Notifications

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
```