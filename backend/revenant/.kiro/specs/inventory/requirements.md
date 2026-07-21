# Requirements Document

## Introduction

This document defines the functional requirements for the Inventory module of the Revenant backend using the EARS (Easy Approach to Requirements Syntax).

The Inventory module is responsible for managing the items owned by an authenticated player.

---

## Glossary

| Term | Definition |
|------|------------|
| Inventory | Collection of items owned by a player. |
| Inventory Item | Association between a player and an item. |
| Item | Game object that can be stored in the player's inventory. |
| Quantity | Number of units of the same item owned by the player. |
| JWT | JSON Web Token used to authenticate requests. |

---

## Requirements

### Requirement 1: Add Item to Inventory

**Description**

The system must allow adding an item to the authenticated player's inventory.

#### Acceptance Criteria

- **WHEN** an authenticated player submits a request to add an item,
  **THE SYSTEM SHALL** identify the authenticated user from the JWT.

- **WHEN** the authenticated user is identified,
  **THE SYSTEM SHALL** retrieve the associated player.

- **IF** the player does not already own the item,
  **THEN THE SYSTEM SHALL** create a new inventory record.

- **IF** the player already owns the item,
  **THEN THE SYSTEM SHALL** increase the item's quantity.

---

### Requirement 2: Update Item Quantity

**Description**

The system must update the quantity of an existing inventory item.

#### Acceptance Criteria

- **WHEN** an authenticated player updates an inventory item,
  **THE SYSTEM SHALL** modify the stored quantity.

- **IF** the provided quantity is less than zero,
  **THEN THE SYSTEM SHALL** reject the request.

---

### Requirement 3: Remove Item from Inventory

**Description**

The system must remove an item from the authenticated player's inventory.

#### Acceptance Criteria

- **WHEN** an authenticated player requests to remove an item,
  **THE SYSTEM SHALL** delete the corresponding inventory record.

---

### Requirement 4: Get Player Inventory

**Description**

The system must return the inventory belonging to the authenticated player.

#### Acceptance Criteria

- **WHEN** an authenticated player requests their inventory,
  **THE SYSTEM SHALL** retrieve all inventory items associated with the player.

- **IF** the player has no items,
  **THEN THE SYSTEM SHALL** return an empty collection.