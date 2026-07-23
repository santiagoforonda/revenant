---
inclusion: always
---

# React Developer Steering

## Purpose

This steering document defines the mandatory development standards for the React application.

React is responsible for the application layer, authentication, backend communication, and integration with the Phaser game engine.

Gameplay implementation belongs exclusively to Phaser.

---

# Technology Stack

The React application MUST use the following technologies.

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS

Additional libraries SHOULD NOT be introduced unless they provide significant value and have been explicitly approved.

---

# Responsibilities

The React application MUST be responsible for:

- User authentication.
- User registration.
- JWT management.
- Session validation.
- Backend communication.
- HTTP error handling.
- Creating the Phaser game instance.
- Destroying the Phaser game instance.
- Event Bus integration.

The React application MUST NOT implement gameplay mechanics.

---

# Architectural Rules

React MUST be treated as an independent application module.

React MUST:

- Own the application lifecycle.
- Own authentication.
- Own backend communication.
- Own routing.
- Coordinate communication with Phaser through the Event Bus.

React MUST NOT:

- Contain gameplay logic.
- Manage player movement.
- Implement combat mechanics.
- Control enemy behavior.
- Manipulate Phaser scenes directly.
- Access Phaser internals.

React and Phaser MUST remain loosely coupled.

---

# Routing

React Router MUST manage only application routes.

Current routes are:

- /
- /register
- /game

React MUST NOT manage gameplay navigation.

Scene transitions MUST be handled exclusively by Phaser.

---

# Components

Every component MUST have a single responsibility.

Components SHOULD remain small and reusable.

Components MUST focus only on presentation.

Business logic SHOULD be extracted into custom hooks or services.

Components MUST NOT contain HTTP implementation details.

Components MUST NOT contain gameplay logic.

---

# API Communication

React MUST be the only module allowed to communicate with the backend.

All HTTP requests MUST be centralized.

React MUST:

- Send authenticated requests.
- Handle HTTP responses.
- Handle API errors.
- Reuse backend DTOs whenever possible.

React MUST NOT:

- Duplicate backend models.
- Expose HTTP implementation details to Phaser.

---

# Event Bus

The Event Bus MUST be the only communication mechanism between React and Phaser.

React MAY:

- Emit events.
- Listen to events.
- Transform backend responses into gameplay events.

React MUST NOT:

- Call Phaser methods directly.
- Import Phaser classes except when creating the game instance.
- Share mutable state directly with Phaser.

---

# State Management

React MUST manage only application state.

Examples include:

- Authentication.
- JWT.
- Session.
- API loading states.
- API errors.

Gameplay state MUST belong exclusively to Phaser.

React MUST NOT manage:

- Player statistics.
- Combat state.
- Enemy state.
- NPC state.
- Inventory visualization.
- Physics.
- Animations.

---

# TypeScript

TypeScript MUST be used throughout the project.

The following rules apply.

- `any` MUST NOT be used.
- Types MUST be explicit whenever possible.
- Backend DTOs MUST be reused.
- Interfaces SHOULD represent contracts.
- Enums SHOULD be used for finite values.
- Optional properties SHOULD be minimized.

---

# Import Rules

Absolute imports SHOULD be preferred.

Example:

```typescript
import { LoginPage } from "@/pages/LoginPage";
```

Relative imports SHOULD be avoided when an absolute import is available.

---

# Naming Conventions

The following naming conventions MUST be respected.

## Components

PascalCase

Examples

- LoginPage
- RegisterPage
- GamePage

---

## Hooks

camelCase using the "use" prefix.

Examples

- useAuth
- useSession
- useEventBus

---

## Services

PascalCase ending with "Service".

Examples

- AuthenticationService
- ApiService

---

## Variables

camelCase

Examples

- currentUser
- playerName
- loginRequest

---

## Constants

UPPER_SNAKE_CASE

Examples

- API_URL
- TOKEN_KEY

---

## Types and Interfaces

PascalCase

Examples

- LoginRequest
- LoginResponse
- AuthUser

Interface names SHOULD NOT use the "I" prefix.

---

# Styling

Tailwind CSS MUST be the primary styling solution.

Global styles SHOULD be minimized.

Inline styles MUST NOT be used unless technically necessary.

The application MUST follow the official project design system.

Fonts, colors, spacing, and visual consistency MUST respect the project documentation.

---

# Error Handling

Every API error MUST be handled by React.

React MUST:

- Interpret backend responses.
- Emit the corresponding Event Bus event.
- Preserve backend error information whenever possible.

React MUST NOT manipulate Phaser UI directly.

---

# Performance

React SHOULD avoid unnecessary re-renders.

Components SHOULD be memoized only when justified.

Expensive calculations SHOULD be extracted from JSX.

React MUST avoid unnecessary state duplication.

---

# Forbidden Practices

The following practices are prohibited.

- Using `any`.
- Calling HTTP services from Phaser.
- Implementing gameplay logic.
- Importing Phaser into arbitrary React components.
- Manipulating Phaser scenes directly.
- Duplicating backend DTOs.
- Creating circular dependencies.
- Mixing presentation with business logic.
- Using inline styles without justification.
- Hardcoding API URLs.
- Hardcoding JWT values.

---

# Development Principles

Every React implementation MUST follow these principles.

- Single Responsibility Principle (SRP).
- Separation of Concerns (SoC).
- High Cohesion.
- Low Coupling.
- Composition over Inheritance.
- Strong Typing.
- Reusability.
- Maintainability.
- Readability.
- Testability.

Every implementation generated by Kiro MUST comply with this steering document.