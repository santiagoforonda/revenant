# Requirements Document

## Introduction

This document defines the functional requirements for the Shopping module of the Revenant backend using the EARS (Easy Approach to Requirements Syntax).

The Shopping module is responsible for processing item purchases performed by authenticated players, validating business rules, updating the player's gold, updating the store stock, and adding purchased items to the player's inventory.

---

## Glossary

| Term | Definition |
|------|------------|
| Store | A shop that sells items. |
| Store Item | An item available for purchase in a specific store. |
| Stock | Available quantity of an item in a store. |
| Player | Authenticated game character that performs purchases. |
| Gold | Player's in-game currency. |
| Inventory | Collection of items owned by a player. |
| JWT | JSON Web Token used to authenticate requests. |

---

## Requirements

### Requirement 1: Purchase Item

**Description**

The system must allow an authenticated player to purchase an item from a store.

#### Acceptance Criteria

- **WHEN** an authenticated player submits a purchase request,
  **THE SYSTEM SHALL** identify the authenticated user from the JWT.

- **WHEN** the authenticated user is identified,
  **THE SYSTEM SHALL** retrieve the associated player.

- **WHEN** the purchase request is received,
  **THE SYSTEM SHALL** retrieve the requested store item.

- **IF** the store item does not exist,
  **THEN THE SYSTEM SHALL** reject the request.

- **IF** the store item stock is equal to zero,
  **THEN THE SYSTEM SHALL** reject the purchase.

- **IF** the player's gold is less than the item's price,
  **THEN THE SYSTEM SHALL** reject the purchase.

- **WHEN** all validations succeed,
  **THE SYSTEM SHALL** subtract the item's price from the player's gold.

- **WHEN** the purchase is completed,
  **THE SYSTEM SHALL** decrease the store item's stock by one.

- **WHEN** the purchase is completed,
  **THE SYSTEM SHALL** add the purchased item to the player's inventory.

---

### Requirement 2: Maintain Purchase Consistency

**Description**

The system must guarantee data consistency during the purchase process.

#### Acceptance Criteria

- **WHEN** a purchase is processed,
  **THE SYSTEM SHALL** execute the entire operation within a single transaction.

- **IF** any operation fails,
  **THEN THE SYSTEM SHALL** rollback all changes performed during the purchase.