# Design Document: Enemy Health Bar HUD

## Architecture Overview

The EnemyHealthBarHud is a Phaser UI component placed in `src/game/ui/hud/`. It listens to combat events on the EventBus and renders enemy health bars in the HUD layer, positioned in a second row below the existing player HUD managed by HudManager.

The component follows the same camera isolation pattern used by HudManager: a dedicated HUD camera (no zoom, no scroll), depth ≥ 1000, and `scene.cameras.main.ignore()` on all HUD elements.

---

## Components

### EnemyHealthBarHud

**File:** `src/game/ui/hud/EnemyHealthBarHud.ts`

**Responsibility:** Manages the lifecycle of enemy health bar entries in the HUD layer. Subscribes to `COMBAT_RESOLVED` and `ENEMY_DEFEATED` events, creates/updates/removes individual bar entries, and handles camera integration.

### EnemyBarEntry (internal data structure)

**Responsibility:** Groups the Phaser game objects (background rectangle, fill rectangle, label text) that comprise a single enemy's health bar. Stored in a Map keyed by the Enemy entity reference.

---

## Interfaces

```typescript
/**
 * Internal structure holding the Phaser objects for one enemy's health bar.
 */
interface EnemyBarEntry {
  /** The Enemy entity this bar represents. */
  readonly enemy: Enemy;
  /** Maximum health (from enemy.getStats().healthPoints). */
  readonly maxHealth: number;
  /** Current remaining health. */
  currentHealth: number;
  /** Dark background rectangle for the bar. */
  readonly barBg: Phaser.GameObjects.Rectangle;
  /** Colored fill rectangle representing remaining HP ratio. */
  readonly barFill: Phaser.GameObjects.Rectangle;
  /** Text showing "name currentHP/maxHP". */
  readonly label: Phaser.GameObjects.Text;
}
```

---

## Data Model

```typescript
class EnemyHealthBarHud {
  private readonly scene: Phaser.Scene;
  private readonly hudCamera: Phaser.Cameras.Scene2D.Camera;
  private readonly entries: Map<Enemy, EnemyBarEntry>;
  private readonly hudElements: Phaser.GameObjects.GameObject[];
  private rowBackground: Phaser.GameObjects.Rectangle | null;
}
```

- **entries**: Map using Enemy object references as keys (identity-based uniqueness).
- **hudElements**: Flat list of all created game objects for camera management.
- **rowBackground**: Semi-transparent background for the enemy bar row; hidden when no bars are active.

---

## Layout Constants

```typescript
private static readonly ROW_Y = 24;           // Starts below HudManager's ROW_HEIGHT
private static readonly ENTRY_HEIGHT = 20;     // Height per enemy bar entry
private static readonly PADDING_X = 10;        // Left padding
private static readonly PADDING_Y = 2;         // Vertical padding within entry
private static readonly BAR_WIDTH = 80;        // Fill bar width (matches HudManager)
private static readonly BAR_HEIGHT = 10;       // Fill bar height (matches HudManager)
private static readonly LABEL_OFFSET_X = 4;    // Gap between bar and label text
private static readonly HUD_DEPTH = 1000;      // Minimum depth for HUD elements
private static readonly FONT_SIZE = "10px";
private static readonly FONT_FAMILY = "monospace";
private static readonly COLOR_BAR_BG = 0x333333;
private static readonly COLOR_BAR_FILL = 0xcc3333; // Red for enemy HP
```

---

## Component Interaction Flow

```
CombatSystem
    │
    ├── emit("COMBAT_RESOLVED", { attacker, target, damage, remainingHealth })
    │       │
    │       ▼
    │   EnemyHealthBarHud.onCombatResolved()
    │       ├── entry exists? → update currentHealth, refresh bar
    │       └── new enemy? → create EnemyBarEntry, add to map, reflow layout
    │
    └── emit("ENEMY_DEFEATED", { enemy, attacker })
            │
            ▼
        EnemyHealthBarHud.onEnemyDefeated()
            ├── destroy EnemyBarEntry game objects
            ├── remove from map
            ├── reflow remaining bars
            └── if map empty → hide row background
```

---

## Detailed Behavior

### Initialization

1. Receive the Phaser `Scene` and `hudCamera` reference (obtained from HudManager or passed in during scene setup).
2. Subscribe to `COMBAT_RESOLVED` and `ENEMY_DEFEATED` on the EventBus.
3. Create a hidden row background rectangle spanning the screen width at `ROW_Y`.
4. Initialize an empty `entries` Map.

### onCombatResolved(event: CombatResolvedEvent)

1. Extract `target` (Enemy) and `remainingHealth` from the event.
2. If `entries.has(target)`:
   - Update `entry.currentHealth = remainingHealth`.
   - Refresh the bar fill width and label text.
3. Else (new enemy):
   - Read `maxHealth = target.getStats().healthPoints`.
   - Read `name = target.getName()`.
   - Create `barBg`, `barFill`, `label` game objects.
   - Set depth to `HUD_DEPTH`.
   - Call `scene.cameras.main.ignore()` on each new object.
   - Add new objects to `hudElements` list.
   - Store new `EnemyBarEntry` in `entries` map.
   - Show row background if it was hidden.
   - Reflow all entries vertically.

### onEnemyDefeated(event: EnemyDefeatedEvent)

1. Extract `enemy` from the event.
2. If `entries.has(enemy)`:
   - Retrieve the `EnemyBarEntry`.
   - Call `destroy()` on `barBg`, `barFill`, `label`.
   - Remove them from `hudElements` list.
   - Delete entry from `entries` map.
   - Reflow remaining entries.
   - If `entries.size === 0`, hide row background.

### reflowLayout()

Iterates entries in insertion order and positions each bar vertically:

```typescript
private reflowLayout(): void {
  let index = 0;
  for (const entry of this.entries.values()) {
    const y = EnemyHealthBarHud.ROW_Y + index * EnemyHealthBarHud.ENTRY_HEIGHT
              + EnemyHealthBarHud.ENTRY_HEIGHT / 2;
    entry.barBg.setPosition(
      EnemyHealthBarHud.PADDING_X + EnemyHealthBarHud.BAR_WIDTH / 2, y
    );
    const ratio = entry.maxHealth > 0
      ? Math.max(0, Math.min(1, entry.currentHealth / entry.maxHealth))
      : 0;
    const fillWidth = EnemyHealthBarHud.BAR_WIDTH * ratio;
    const bgLeftX = entry.barBg.x - EnemyHealthBarHud.BAR_WIDTH / 2;
    entry.barFill.setPosition(bgLeftX + fillWidth / 2, y);
    entry.barFill.setSize(fillWidth, EnemyHealthBarHud.BAR_HEIGHT);
    entry.label.setPosition(
      EnemyHealthBarHud.PADDING_X + EnemyHealthBarHud.BAR_WIDTH
        + EnemyHealthBarHud.LABEL_OFFSET_X,
      y - EnemyHealthBarHud.ENTRY_HEIGHT / 2 + EnemyHealthBarHud.PADDING_Y
    );
    index++;
  }
  // Resize row background to fit all entries
  if (this.rowBackground) {
    const totalHeight = this.entries.size * EnemyHealthBarHud.ENTRY_HEIGHT;
    this.rowBackground.setSize(this.scene.scale.width, totalHeight);
    this.rowBackground.setPosition(
      this.scene.scale.width / 2,
      EnemyHealthBarHud.ROW_Y + totalHeight / 2
    );
  }
}
```

### refreshBar(entry: EnemyBarEntry)

Updates fill width and label text for an existing entry:

```typescript
private refreshBar(entry: EnemyBarEntry): void {
  const ratio = entry.maxHealth > 0
    ? Math.max(0, Math.min(1, entry.currentHealth / entry.maxHealth))
    : 0;
  const fillWidth = EnemyHealthBarHud.BAR_WIDTH * ratio;
  const bgLeftX = entry.barBg.x - EnemyHealthBarHud.BAR_WIDTH / 2;
  entry.barFill.setPosition(bgLeftX + fillWidth / 2, entry.barBg.y);
  entry.barFill.setSize(fillWidth, EnemyHealthBarHud.BAR_HEIGHT);
  entry.label.setText(`${entry.enemy.getName()} ${entry.currentHealth}/${entry.maxHealth}`);
}
```

### destroy()

1. Unsubscribe from `COMBAT_RESOLVED` and `ENEMY_DEFEATED` on EventBus.
2. Iterate all entries and destroy each `barBg`, `barFill`, `label`.
3. Destroy `rowBackground`.
4. Clear `entries` map and `hudElements` array.

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| COMBAT_RESOLVED for already-defeated enemy | Entry won't exist (was removed on defeat); skip silently. |
| ENEMY_DEFEATED for enemy not in map | No entry to remove; skip silently. |
| Enemy with 0 maxHealth | Ratio clamps to 0; bar shows empty fill. |
| Scene destroyed before all enemies defeated | `destroy()` cleans up all remaining entries. |

---

## Integration with HudManager

The `EnemyHealthBarHud` is instantiated in the same scene as `HudManager`. It receives the HUD camera reference from `HudManager` or directly from the scene's camera setup. The existing HudManager `addedtoscene` listener already ignores non-HUD objects on the HUD camera. The `EnemyHealthBarHud` similarly calls `scene.cameras.main.ignore()` on its own elements to maintain camera isolation.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Combat event creates or updates exactly one entry per enemy

*For any* sequence of COMBAT_RESOLVED events, the number of entries in the tracked map SHALL equal the number of unique Enemy references that have received at least one event and have not been defeated.

**Validates: Requirements 1.1, 1.5, 2.1, 2.3**

### Property 2: Health text format consistency

*For any* enemy bar entry with `currentHealth` and `maxHealth` values, the displayed label text SHALL contain the substring `"{currentHealth}/{maxHealth}"`.

**Validates: Requirements 1.3**

### Property 3: Bar fill width proportionality

*For any* enemy bar entry where `maxHealth > 0`, the fill rectangle width SHALL equal `BAR_WIDTH * clamp(currentHealth / maxHealth, 0, 1)`.

**Validates: Requirements 1.4**

### Property 4: Vertical stacking order

*For any* N active enemy bar entries (indexed 0..N-1), bar at index `i` SHALL be positioned at Y = `ROW_Y + i * ENTRY_HEIGHT + ENTRY_HEIGHT / 2`.

**Validates: Requirements 2.2**

### Property 5: Defeat removes entry and reflows

*For any* enemy with an active bar entry, after processing an ENEMY_DEFEATED event for that enemy, the entries map SHALL no longer contain that enemy, and all remaining entries SHALL be reflowed to consecutive positions starting from index 0.

**Validates: Requirements 3.1, 3.2**

### Property 6: Destroy cleans up all resources

*For any* N active bar entries at the time `destroy()` is called, all N × 3 game objects (barBg, barFill, label) plus the row background SHALL have their `destroy()` method invoked, and the entries map SHALL be empty afterward.

**Validates: Requirements 5.2, 5.3**
