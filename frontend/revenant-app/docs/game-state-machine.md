# Game State Machine

## 1. Overview

This document defines the lifecycle of the game through a finite state machine.

The purpose of the state machine is to ensure that gameplay, rendering, API communication, and player interactions occur only when the game is in a valid state.

Every game session must always be in exactly one state.

---

# 2. Design Principles

The game state machine follows these principles.

- Only one active state at a time.
- Every state has a single responsibility.
- State transitions are triggered by events.
- Invalid transitions are not allowed.
- Gameplay is enabled only in the READY state.

---

# 3. States

## INITIALIZING

Description

The game has been created but no resources have been loaded.

Allowed actions

- Create Phaser.Game
- Register Event Bus
- Start BootScene

Player Input

Disabled.

---

## LOADING

Description

React is loading the initial resources required to start the game.

Examples

- Player
- Current map
- Enemies
- NPCs
- Inventory
- Store metadata

Player Input

Disabled.

---

## READY

Description

The bootstrap process has finished successfully.

Gameplay is fully enabled.

Allowed actions

- Player movement
- Combat
- NPC interaction
- Inventory
- Shop
- Pause
- Save Game

Player Input

Enabled.

---

## PAUSED

Description

Gameplay is temporarily suspended.

Allowed actions

- Resume game
- Open settings
- Exit to login

Player movement

Disabled.

Enemy AI

Disabled.

Physics

Paused.

---

## SAVING

Description

The current game progress is being persisted.

Gameplay continues unless explicitly paused.

Player Input

Enabled.

Saving indicator

Visible.

---

## ERROR

Description

A critical error occurred during gameplay.

Gameplay is blocked until the error is resolved.

Player Input

Disabled.

---

## SESSION_EXPIRED

Description

Authentication is no longer valid.

React destroys the Phaser instance.

The player is redirected to Login.

Player Input

Disabled.

---

# 4. State Transitions

INITIALIZING

↓

LOADING

↓

READY

READY

↓

PAUSED

↓

READY

READY

↓

SAVING

↓

READY

READY

↓

ERROR

ERROR

↓

INITIALIZING

READY

↓

SESSION_EXPIRED

↓

Login

---

# 5. Transition Events

| Event | From | To |
|--------|------|----|
| GAME_INITIALIZED | INITIALIZING | LOADING |
| GAME_READY | LOADING | READY |
| GAME_PAUSED | READY | PAUSED |
| GAME_RESUMED | PAUSED | READY |
| SAVE_GAME | READY | SAVING |
| SAVE_COMPLETED | SAVING | READY |
| API_ERROR | READY | ERROR |
| SESSION_EXPIRED | READY | SESSION_EXPIRED |

---

# 6. Gameplay Restrictions

Movement

Allowed only in READY.

Combat

Allowed only in READY.

NPC Interaction

Allowed only in READY.

Inventory

Allowed only in READY.

Shop

Allowed only in READY.

Saving

Allowed only in READY.

---

# 7. Error Recovery

If an API request fails during gameplay:

Backend

↓

React

↓

API_ERROR

↓

Game enters ERROR state

↓

Player acknowledges the error

↓

React retries or redirects

---

# 8. Session Expiration

If the backend returns HTTP 401:

Backend

↓

React

↓

SESSION_EXPIRED

↓

Destroy Phaser.Game

↓

Navigate to Login

No gameplay is allowed after session expiration.

---

# 9. Future States

Future versions may introduce additional states.

Examples:

- CUTSCENE
- DIALOGUE
- LOADING_MAP
- GAME_OVER
- VICTORY
- BOSS_INTRO

New states must respect the same transition rules defined in this document.