# Authentication - Design Document

## Overview

The Authentication module is responsible for identifying users, creating authenticated sessions, and initializing the game.

Authentication is implemented entirely by the React application. Phaser is not involved in the authentication process and never communicates directly with the backend.

After successful authentication, React creates the Phaser game instance and starts the game bootstrap process. Communication between React and Phaser is performed exclusively through the Event Bus.

This design follows the architectural principles defined in the project documentation.

---

## Architecture

## High-Level Architecture

The Authentication module consists of four primary components:

- React User Interface
- Authentication Service
- Event Bus
- Phaser Game

The following diagram illustrates the authentication workflow.

```text
+--------------------+
|     Login Page     |
+---------+----------+
          |
          | LoginRequest
          v
+--------------------+
| Authentication     |
| Service            |
+---------+----------+
          |
          | HTTP Request
          v
+--------------------+
|   Backend API      |
+---------+----------+
          |
          | LoginResponse
          v
+--------------------+
| React Application  |
+---------+----------+
          |
          | Store JWT
          | Create Phaser
          |
          v
+--------------------+
|    Event Bus       |
+---------+----------+
          |
          | GAME_INITIALIZED
          v
+--------------------+
|    Phaser Game     |
+--------------------+
```

The React application owns the authentication lifecycle.

Phaser remains inactive until React emits the `GAME_INITIALIZED` event.

---

## Module Responsibilities

### React

Responsibilities:

- Display authentication screens.
- Validate user input.
- Send authentication requests.
- Store the JWT.
- Handle authentication errors.
- Create the Phaser game instance.
- Start the bootstrap process.
- Communicate with Phaser through the Event Bus.

React MUST NOT implement gameplay mechanics.

---

### Authentication Service

Responsibilities:

- Execute authentication requests.
- Execute registration requests.
- Map backend responses.
- Handle HTTP errors.

The Authentication Service MUST be the only component responsible for backend communication related to authentication.

---

### Event Bus

Responsibilities:

- Notify Phaser when authentication has completed.
- Notify Phaser when a session expires.
- Notify React about gameplay events when necessary.

The Event Bus MUST be the only communication mechanism between React and Phaser.

---

### Phaser

Responsibilities:

- Wait for authentication completion.
- Initialize gameplay after the bootstrap process.
- Never communicate directly with the backend.

---

# Authentication Flow

The authentication process follows these steps.

1. The user opens the Login page.
2. The user submits valid credentials.
3. React calls the Authentication Service.
4. The Authentication Service authenticates the user through the backend.
5. The backend returns a LoginResponse.
6. React stores the JWT.
7. React navigates to the Game page.
8. React creates the Phaser game instance.
9. React emits `GAME_INITIALIZED`.
10. The bootstrap process starts.
11. React emits `GAME_READY`.
12. Phaser enables gameplay.

---

# Registration Flow

The registration process follows these steps.

1. The user opens the Registration page.
2. The user submits the registration form.
3. React calls the Authentication Service.
4. The backend validates the request.
5. The backend creates the new account.
6. React displays a success message.
7. React redirects the user to the Login page.

---

# Session Lifecycle

The authenticated session begins after a successful login.

The session ends when:

- The user logs out.
- The backend returns HTTP 401.
- The JWT becomes invalid.

When the session ends:

1. React removes the stored JWT.
2. React emits `SESSION_EXPIRED`.
3. Phaser destroys the current game instance.
4. React redirects the user to the Login page.

---

# Components and Interfaces

## React Components

- LoginPage
- RegisterPage
- GamePage

---

## Services

- AuthenticationService

---

## Event Bus Events

Authentication Events

- GAME_INITIALIZED
- GAME_READY
- SESSION_EXPIRED
- API_ERROR

---

# Data Models

## LoginRequest

Fields:

- username
- password

---

## LoginResponse

Fields are defined by the backend AuthenticationController.

The frontend MUST reuse the backend contract without modifications.

---

## RegisterRequest

Fields are defined by the backend AuthenticationController.

---

## RegisterResponse

Fields are defined by the backend AuthenticationController.

---

# Error Handling

The Authentication Service is responsible for handling backend errors.

Validation errors are displayed to the user.

Unexpected errors display a generic message.

Authentication failures never create a Phaser instance.

Bootstrap failures prevent gameplay from starting.

---

# Security Considerations

The JWT MUST only be managed by React.

Phaser MUST never access authentication data.

Sensitive information MUST NOT be persisted outside the authenticated session.

Authentication requests MUST use HTTPS in production environments.

---

# Future Extensions

The Authentication module is designed to support future enhancements without requiring architectural changes.

Possible future extensions include:

- Refresh Tokens.
- Password recovery.
- Email verification.
- Multi-factor authentication.
- Social authentication providers.

## Components and Interfaces

### LoginPage

**Responsibility**

Provides the user interface for user authentication.

**Collaborators**

- AuthenticationService
- React Router

---

### RegisterPage

**Responsibility**

Provides the user interface for user registration.

**Collaborators**

- AuthenticationService
- React Router

---

### GamePage

**Responsibility**

Creates and destroys the Phaser game instance.

Coordinates the bootstrap process after successful authentication.

**Collaborators**

- Event Bus
- Phaser.Game

---

### AuthenticationService

**Responsibility**

Executes all authentication-related backend requests.

**Operations**

- login()
- register()

---

### Event Bus

**Responsibility**

Coordinates communication between React and Phaser.

**Published Events**

- GAME_INITIALIZED
- GAME_READY
- SESSION_EXPIRED
- API_ERROR

---

### Backend API

Provides the following authentication endpoints.

- POST /api/auth/register
- POST /api/auth/login

The frontend MUST consume these endpoints without modifying their contracts.


## Data Models

### LoginRequest

| Field | Type |
|---------|------|
| username | string |
| password | string |

---

### LoginResponse

The response model is defined by the backend AuthenticationController.

Expected fields include:

| Field | Type |
|---------|------|
| token | string |
| tokenType | string |
| username | string |
| mapId | number |
| posX | number |
| posY | number |
| healthPoints | number |
| strongPoints | number |
| speedAttackPoints | number |
| gold | number |
| level | number |
| experience | number |
| typePlayer | string |
| inventory | InventoryItem[] |

---

### RegisterRequest

The request model is defined by the backend AuthenticationController.

---

### RegisterResponse

The response model is defined by the backend AuthenticationController.

## Correctness Properties

The Authentication module must satisfy the following properties.

### Authentication Integrity

Only authenticated users may access the game.

---

### Backend Isolation

Phaser must never communicate directly with the backend.

All backend communication must be performed by React.

---

### Session Consistency

The JWT stored by React must always represent the active authenticated session.

When the session expires, the JWT must be removed before redirecting the user.

---

### Bootstrap Consistency

Gameplay must remain disabled until the bootstrap process completes successfully.

The GAME_READY event must be emitted exactly once for every successful authentication.

---

### Event Bus Consistency

Communication between React and Phaser must occur exclusively through the Event Bus.

Direct references between both modules are prohibited.

## Error Handling

The Authentication module shall gracefully handle expected and unexpected failures.

### Validation Errors

Validation errors returned by the backend shall be displayed to the user.

---

### Authentication Errors

Invalid credentials shall produce an authentication error message.

The Phaser game instance shall not be created.

---

### Bootstrap Errors

If the bootstrap process fails, gameplay shall remain disabled.

The user shall be informed that initialization could not be completed.

---

### Session Expiration

When an authenticated request returns HTTP 401:

- Remove the stored JWT.
- Emit SESSION_EXPIRED.
- Destroy the Phaser instance.
- Redirect to the Login page.

---

### Unexpected Errors

Unexpected server errors shall display a generic error message without exposing implementation details.