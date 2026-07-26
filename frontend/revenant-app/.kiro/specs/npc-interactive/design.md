# NPC Interaction - Design Document

## Overview

The NPC Interaction feature enables the player to interact with NPCs located in the game world.

An NPC becomes interactable when the player enters its interaction radius (15 pixels). While the player remains inside this radius, an interaction indicator is displayed above the NPC.

Pressing the **E** key triggers the interaction, causing the NPC to display its next dialogue phrase.

Each NPC manages its own dialogue state independently. Every successful interaction advances the dialogue index until the final phrase is reached, after which the dialogue sequence starts again from the beginning.

This feature is limited to interaction detection and dialogue triggering.

The following functionality is explicitly out of scope:

- Quest system
- Store system
- Branching dialogues
- Dialogue choices
- NPC AI
- NPC movement
- Cutscenes

This specification complies with the project architecture defined under `docs/architecture/`.

---

## Architecture

The interaction system follows the existing game architecture.

NPC spawning remains completely independent from NPC interaction.

The interaction feature consumes already spawned NPCs and monitors the player's proximity during the game loop.

### High-Level Architecture

```text
Player Movement
        │
        ▼
NpcInteractionSystem
        │
        ▼
Find nearest NPC
        │
        ▼
Distance <= 15 pixels?
        │
    ┌───┴────┐
    │        │
   Yes       No
    │        │
    ▼        ▼
Show       Hide
Indicator  Indicator
    │
    ▼
Player presses E
    │
    ▼
Npc.interact()
    │
    ▼
Npc.getNextPhrase()
    │
    ▼
DialogWindow.show(phrase)
```

---

## Components and Interfaces

### NpcInteractionSystem

#### Responsibility

Detects nearby NPCs and manages interaction availability.

#### Responsibilities

- Execute every update cycle.
- Find the nearest NPC.
- Calculate the distance between the player and nearby NPCs.
- Determine whether an NPC is interactable.
- Display or hide the interaction indicator.
- Trigger NPC interaction when the player presses **E**.

#### Dependencies

- Player
- NPC collection
- InteractionIndicator
- DialogWindow

---

### Npc

#### Responsibility

Represents an NPC capable of interacting with the player.

#### Responsibilities

- Store dialogue phrases.
- Maintain the dialogue index.
- Return the next dialogue phrase.
- Advance the dialogue sequence.

#### Public Methods

```text
interact()

getNextPhrase()
```

---

### DialogWindow

#### Responsibility

Displays dialogue text.

#### Responsibilities

- Show dialogue.
- Hide dialogue.
- Update displayed text.

The dialog window is not responsible for dialogue progression.

---

### InteractionIndicator

#### Responsibility

Provides visual feedback that an NPC can be interacted with.

#### Responsibilities

- Display above the nearest interactable NPC.
- Hide automatically when interaction is no longer possible.

Example:

```text
     [E]
    Talk
```

---

### Player

#### Responsibility

Acts as the interaction initiator.

#### Responsibilities

- Move through the world.
- Trigger interaction requests.

The player does not determine dialogue progression.

---

## Data Models

### NPC

```text
Npc

id
name
description
phrases[]
currentPhraseIndex
sprite
position
```

---

### Dialogue Phrase

```text
DialoguePhrase

text
```

---

### Interaction State

```text
InteractionState

nearestNpc
distance
canInteract
```

---

## Correctness Properties

### Interaction Radius

- An NPC SHALL only become interactable when the player is within 15 pixels.
- Only one NPC SHALL be interactable at a time.
- The nearest NPC SHALL always be selected.

---

### Dialogue Sequence

- Every NPC SHALL maintain its own dialogue index.
- Dialogue progression SHALL be independent for each NPC.
- The dialogue index SHALL advance after every successful interaction.
- The dialogue index SHALL restart from the beginning after reaching the final phrase.

---

### Separation of Responsibilities

- The interaction system SHALL not spawn NPCs.
- The interaction system SHALL not modify NPC AI.
- The interaction system SHALL not communicate with the backend.
- The interaction system SHALL not implement quests.
- The interaction system SHALL not implement stores.

---

### Gameplay Consistency

- Interaction SHALL only occur while the player is inside the interaction radius.
- Pressing **E** outside the interaction radius SHALL have no effect.
- The interaction indicator SHALL never be displayed for more than one NPC simultaneously.

---

## Error Handling

### No NPC Nearby

If no NPC is within the interaction radius:

- The interaction indicator is hidden.
- Pressing **E** has no effect.

---

### NPC Without Dialogue

If an NPC has no dialogue phrases:

- No dialogue is displayed.
- The interaction completes successfully.
- The error is logged for debugging purposes.

---

### Invalid Dialogue Index

If the dialogue index becomes invalid:

- The dialogue index is reset to zero.
- Dialogue continues normally.

---

### Dialogue Window Failure

If the dialogue window cannot be displayed:

- Gameplay continues.
- The error is logged.
- NPC interaction state remains unchanged.

---

## Testing Strategy

### Unit Testing

Verify:

- Distance calculations.
- Nearest NPC selection.
- Dialogue progression.
- Dialogue reset after the last phrase.
- Interaction indicator visibility.

---

### Integration Testing

Verify:

- Player movement correctly enables interaction.
- Pressing **E** triggers NPC interaction.
- Dialogue window displays the expected phrase.
- Multiple NPCs maintain independent dialogue indices.

---

### End-to-End Testing

Verify the following gameplay flow:

```text
Player approaches an NPC

↓

Player enters the 15-pixel interaction radius

↓

Interaction indicator appears

↓

Player presses E

↓

NPC returns the next dialogue phrase

↓

Dialogue window displays the phrase

↓

Dialogue index advances

↓

Player presses E again

↓

Next dialogue phrase is displayed

↓

After the last phrase

↓

Dialogue restarts from the first phrase
```

The feature is considered complete when players can interact with any NPC within the interaction radius, dialogues progress sequentially for each NPC independently, and interaction remains isolated from spawning, AI, quests, and store systems.