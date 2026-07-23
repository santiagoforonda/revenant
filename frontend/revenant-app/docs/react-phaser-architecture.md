# React - Phaser Integration Architecture

## 1. Overview

This document defines the architectural integration between React and Phaser for the Revenant frontend.

The objective of this architecture is to establish a clear separation of responsibilities between the web application and the game engine, preventing coupling between the user interface, game logic, and backend communication.

React is responsible for the application layer, while Phaser is responsible for the game layer.

This architecture allows both technologies to evolve independently without affecting each other.

---

# 2. Architectural Principles

The frontend architecture follows these principles:

- React and Phaser are independent modules.
- React manages the application lifecycle.
- Phaser manages the game lifecycle.
- React is the only component allowed to communicate with the backend.
- Phaser never performs HTTP requests.
- Phaser never manages authentication.
- React never implements game logic.
- Game state belongs to Phaser.
- Authentication state belongs to React.

---

# 3. Responsibilities

## 3.1 React Responsibilities

React is responsible for:

- User authentication.
- Login page.
- Registration page.
- JWT storage.
- Session validation.
- HTTP communication with the backend.
- Error handling.
- Initializing Phaser.
- Destroying Phaser on logout.

React must never:

- Render game maps.
- Execute combat logic.
- Manage enemies.
- Handle collisions.
- Control player movement.
- Implement game mechanics.

---

## 3.2 Phaser Responsibilities

Phaser is responsible for:

- Rendering the game.
- Scene management.
- Player movement.
- Enemy AI.
- Combat.
- NPC interactions.
- Inventory interface.
- Shop interface.
- Pause menu.
- HUD.
- Animations.
- Collisions.

Phaser must never:

- Execute HTTP requests.
- Use Axios.
- Use React Query.
- Access JWT tokens.
- Implement authentication logic.
- Manipulate React Router.

---

# 4. Application Navigation

React manages the application routes.

Current routes are:

| Route | Component |
|---------|----------------|
| / | LoginPage |
| /register | RegisterPage |
| /game | GamePage |

GamePage acts only as the container of the Phaser game.

React never navigates inside the game.

---

# 5. Phaser Scene Architecture

All gameplay is managed through Phaser scenes.

Initial scene flow:

BootScene

↓

PreloadScene

↓

MapScene

Overlay scenes:

- PauseScene
- InventoryScene
- ShopScene

Overlay scenes never replace the current map.

Instead, they are displayed on top of the active map and closed when the interaction finishes.

The current map always remains active in memory.

---

# 6. Application Lifecycle

The frontend lifecycle is:

Application starts

↓

LoginPage

↓

User authenticates

↓

React receives JWT

↓

React navigates to GamePage

↓

GamePage creates Phaser.Game

↓

BootScene

↓

PreloadScene

↓

Current Map Scene

Logout flow:

Player logs out

↓

React destroys Phaser.Game

↓

JWT is removed

↓

Navigate to LoginPage

---

# 7. Authentication Flow

Authentication belongs exclusively to React.

Workflow:

Login

↓

Authentication API

↓

JWT

↓

React stores JWT

↓

React creates Phaser

↓

Phaser starts the game

Phaser never authenticates users.

Phaser never refreshes tokens.

If the backend returns Unauthorized (401), React destroys the game instance and redirects the user to the login page.

---

# 8. Communication Between React and Phaser

React acts as the communication layer between Phaser and the backend.

Communication flow:

Player interaction

↓

Phaser requests data

↓

React performs HTTP request

↓

Backend returns data

↓

React delivers data to Phaser

↓

Phaser updates the game

Phaser never knows how the data was retrieved.

It only consumes the information received from React.

---

# 9. Data Synchronization

React is responsible for obtaining game information from the backend.

Examples include:

- Player information
- Maps
- Inventory
- Stores
- NPCs
- Enemy rewards
- Save game operations

React transfers this information to Phaser.

Phaser never accesses REST endpoints directly.

---

# 10. Scene Management

Scene transitions belong exclusively to Phaser.

Examples:

MapScene

↓

PauseScene

↓

MapScene

InventoryScene

↓

MapScene

ShopScene

↓

MapScene

React never changes game scenes.

---

# 11. State Management

Application state is divided into two independent domains.

## React State

- Authentication
- JWT
- API communication
- HTTP errors

## Phaser State

- Player position
- Current map
- Active enemies
- Combat
- Inventory visualization
- NPC interactions
- Shop interactions
- HUD

Each module owns its own state.

Shared information is exchanged only through the integration layer.

---

# 12. Restrictions

The following practices are prohibited:

- Executing HTTP requests from Phaser.
- Importing Axios inside Phaser scenes.
- Importing React Router inside Phaser.
- Managing authentication inside Phaser.
- Implementing game logic inside React.
- Manipulating the DOM directly from Phaser.
- Sharing mutable state between React and Phaser.

All communication must respect the architectural boundaries defined in this document.

---

# 13. Future Scalability

This architecture allows the project to evolve without modifying the application layer.

Future additions may include:

- Additional maps.
- New scenes.
- Multiplayer.
- New NPC interactions.
- New inventory systems.
- Additional game mechanics.

These features should be implemented inside Phaser while preserving React as the application layer and backend communication gateway.

This separation guarantees maintainability, modularity, and scalability throughout the project's lifecycle.