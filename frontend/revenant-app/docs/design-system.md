# Design System

## Overview

This document defines the official visual design system for the Revenant project.

The objective is to provide a consistent visual identity across the entire application, including the React application and the Phaser game.

All user interfaces MUST follow this design system.

---

# Design Principles

The visual identity of Revenant is inspired by medieval fantasy RPGs.

The interface MUST feel immersive while remaining clean, readable, and consistent.

The design system follows these principles:

- Consistency
- Simplicity
- Readability
- Accessibility
- Reusability

Modern minimalist interfaces SHOULD be avoided when they conflict with the medieval atmosphere.

---

# Color Palette

| Color | Hex | RGB | Usage |
|--------|---------|-----------------|---------------------------|
| Primary | #000000 | rgb(0, 0, 0) | Main background, navigation bars, modal backgrounds |
| Secondary | #1F150C | rgb(31, 21, 12) | Cards, panels, forms, secondary containers |
| Accent | #412D15 | rgb(65, 45, 21) | Primary buttons, active elements, selected items |
| Highlight | #E1DCC9 | rgb(225, 220, 201) | Hover states, text, rewards, important actions |
---

# Color Usage

## Primary

Hex

```text
#000000
```

RGB

```text
rgb(0, 0, 0)
```

Purpose

- Main background
- Navigation bars
- Modal backgrounds
- Main panels
- Dark overlays

---

## Secondary

Hex

```text
#1F150C
```

RGB

```text
rgb(31, 21, 12)
```

Purpose

- Cards
- Secondary panels
- Form backgrounds
- Containers

---

## Accent

Hex

```text
#412D15
```

RGB

```text
rgb(65, 45, 21)
```

Purpose

- Primary buttons
- Interactive elements
- Active controls
- Selected items

---

## Highlight

Hex

```text
#E1DCC9
```

RGB

```text
rgb(225, 220, 201)
```

Purpose

- Hover states
- Text color (primary readable text)
- Rewards
- Important actions
- Rare items
- Experience indicators

---

# Typography

The official project font is:

## Primary Font

Montserrat

Montserrat MUST be used throughout the application.

It provides excellent readability while maintaining a clean visual appearance.

---

## Font Weights

Recommended weights:

| Weight | Usage |
|---------|------|
| 300 | Secondary text |
| 400 | Body text |
| 500 | Labels |
| 700 | Titles |

---

# Typography Rules

The interface MUST prioritize readability.

Avoid decorative fonts for gameplay information.

The selected font MUST be used consistently in:

- Login page
- Register page
- Menus
- HUD
- Inventory
- Shop
- Dialogs
- Tooltips

---

# Visual Style

The visual identity SHOULD evoke a medieval fantasy atmosphere.

Interfaces SHOULD resemble handcrafted game interfaces rather than modern web dashboards.

Recommended visual characteristics include:

- Rounded corners
- Warm colors
- Soft shadows
- Natural textures
- Wooden or parchment-inspired panels

Flat corporate UI styles SHOULD be avoided.

---

# Components

All UI components MUST follow the official color palette.

Examples include:

- Buttons
- Forms
- Inputs
- Cards
- Dialogs
- Tooltips
- HUD panels
- Inventory windows
- Shop windows

---

# Icons

Icons SHOULD follow a fantasy RPG style.

Outlined or modern corporate icons SHOULD be avoided whenever themed alternatives exist.

---

# Accessibility

The interface MUST maintain sufficient contrast.

Text MUST remain readable over every background.

Interactive elements MUST provide clear visual feedback.

Color MUST NOT be the only indicator of state.

---

# Responsive Design

The React application MUST adapt correctly to different desktop resolutions.

Gameplay interfaces SHOULD maintain their proportions without hiding essential information.

---

# Tailwind CSS

Tailwind CSS MUST implement the official design tokens.

The project SHOULD define reusable theme colors instead of hardcoding hexadecimal values.

Example design tokens:

- primary
- secondary
- accent
- highlight

Components MUST reference the design tokens instead of hexadecimal colors whenever possible.

---

# Phaser

The Phaser UI MUST use the same design system defined for React.

Game menus, HUD elements, inventory, dialogs, and shops MUST respect the same visual identity.

---

# Future Extensions

Future versions of the design system may define:

- Spacing scale
- Border radius
- Shadows
- Animation guidelines
- Iconography standards
- UI component library

These additions MUST remain compatible with the visual identity established in this document.

## Design Consistency

The React application and the Phaser game SHALL use the same color palette and typography defined in this document.

No additional colors or fonts should be introduced without updating the Design System documentation.