# Requirements Document

## Introduction

The NPC Interaction feature enables the player to interact with NPCs present in the game world.

When the player is close enough to an NPC, an interaction indicator is displayed. Pressing the interaction key causes the NPC to speak one of its configured phrases.

Each NPC maintains its own dialogue progress. Every interaction displays the next phrase in the sequence until the last phrase is reached, after which the sequence starts again from the beginning.

This feature is limited to interaction detection and dialogue triggering.

The following functionality is out of scope:

- Quests
- Stores
- NPC AI
- NPC movement
- Branching dialogues
- Dialogue choices
- Cutscenes

---

## Glossary

| Term | Description |
|------|-------------|
| NPC | Non-playable character controlled by the game. |
| Interaction Radius | Maximum distance (15 pixels) between the player and an NPC that allows interaction. |
| Interaction Key | Keyboard key (**E**) used to interact with NPCs. |
| Dialogue Phrase | A text line configured for an NPC. |
| Dialogue Index | Position of the next phrase to display. |

---

## Requirements

## Requirement 1 - Detect Nearby NPCs

**User Story:** As a player, I want the game to detect when I am close to an NPC so I know I can interact with it.

### Acceptance Criteria

1. WHEN the player is within 15 pixels of an NPC THEN the system SHALL consider that NPC interactable.
2. WHEN multiple NPCs are inside the interaction radius THEN the system SHALL select the nearest NPC.
3. WHEN no NPC is within the interaction radius THEN the system SHALL not allow interaction.
4. WHILE the player remains inside the interaction radius THEN the selected NPC SHALL remain interactable.

---

## Requirement 2 - Display Interaction Indicator

**User Story:** As a player, I want to know when I can interact with an NPC.

### Acceptance Criteria

1. WHEN an NPC becomes interactable THEN the system SHALL display an interaction indicator above the NPC.
2. WHEN the player leaves the interaction radius THEN the interaction indicator SHALL disappear.
3. IF another NPC becomes the closest interactable NPC THEN the indicator SHALL move to that NPC.
4. THE interaction indicator SHALL only be visible for one NPC at a time.

---

## Requirement 3 - Trigger NPC Interaction

**User Story:** As a player, I want to press the interaction key to talk with an NPC.

### Acceptance Criteria

1. WHEN the player presses the **E** key while an NPC is interactable THEN the system SHALL trigger the interaction.
2. IF no NPC is interactable THEN pressing **E** SHALL have no effect.
3. WHEN an interaction is triggered THEN the system SHALL request the next dialogue phrase from the selected NPC.
4. THE interaction SHALL only affect the currently selected NPC.

---

## Requirement 4 - Sequential Dialogue

**User Story:** As a player, I want each interaction to display the next dialogue phrase so conversations feel natural.

### Acceptance Criteria

1. WHEN an NPC is interacted with for the first time THEN the system SHALL display the first dialogue phrase.
2. WHEN the player interacts with the same NPC again THEN the system SHALL display the next dialogue phrase.
3. WHEN the final dialogue phrase has been displayed THEN the next interaction SHALL restart the dialogue from the first phrase.
4. EACH NPC SHALL maintain its own dialogue index independently.

---

## Requirement 5 - NPC Dialogue State

**User Story:** As a developer, I want every NPC to manage its own dialogue progress independently.

### Acceptance Criteria

1. EACH NPC SHALL maintain its own dialogue index.
2. WHEN one NPC advances its dialogue THEN the dialogue state of every other NPC SHALL remain unchanged.
3. WHEN the player changes to another NPC THEN that NPC SHALL continue from its own dialogue index.
4. THE dialogue index SHALL only change after a successful interaction.

---

## Requirement 6 - Dialogue Validation

**User Story:** As a player, I want interactions to behave correctly even when dialogue data is incomplete.

### Acceptance Criteria

1. IF an NPC has no dialogue phrases THEN the interaction SHALL complete without displaying dialogue.
2. IF the dialogue collection contains a single phrase THEN every interaction SHALL display the same phrase.
3. WHEN dialogue data is invalid THEN the system SHALL log the error and continue running.
4. NPC interaction SHALL never interrupt gameplay due to missing dialogue data.

---

## Requirement 7 - Responsibility Separation

**User Story:** As a developer, I want the interaction system to remain independent from future gameplay systems.

### Acceptance Criteria

1. The NPC Interaction feature SHALL only detect interactions and trigger dialogue.
2. The feature SHALL not implement quests.
3. The feature SHALL not implement stores.
4. The feature SHALL not modify NPC spawning.
5. The feature SHALL not modify enemy behavior.
6. The feature SHALL not perform HTTP requests.
```