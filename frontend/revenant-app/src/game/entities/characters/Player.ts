import Phaser from "phaser";

/**
 * Player entity — encapsulates all rendering, movement, and animation logic
 * for the player character.
 *
 * The Player owns independent render layers for each visual piece:
 * - Body (base layer, physics-enabled) — always rendered first
 * - Helmet (rendered above body) — regular sprite, synced each frame
 *
 * Each layer uses a Phaser.GameObjects.Sprite created from a spritesheet
 * (32x48 pixels per frame, 3 columns × 4 rows = 12 frames).
 *
 * Spritesheet layout (standard RPG format):
 * - Row 0 (frames 0,1,2): Facing Down
 * - Row 1 (frames 3,4,5): Facing Left
 * - Row 2 (frames 6,7,8): Facing Right
 * - Row 3 (frames 9,10,11): Facing Up
 *
 * Frame 1 of each row is the idle/standing pose.
 * Frames 0 and 2 are the walk cycle.
 *
 * Rendering order (bottom to top):
 * 1. Body
 * 2. Helmet
 * (future: armor, gloves, pants, weapon, shield)
 */

/** Constant movement speed in pixels per second */
const PLAYER_SPEED = 120;

/** Animation frame rate for walking */
const WALK_FRAME_RATE = 8;

/** Possible player states */
type PlayerState = "idle" | "walking";

/** Possible facing directions */
type PlayerDirection = "up" | "down" | "left" | "right";

/**
 * Frame ranges for each direction in the spritesheet.
 * Spritesheet: 576x256, frames 64x64 = 9 columns × 4 rows.
 * Row 0 (frames 0-8): Facing Up (back view)
 * Row 1 (frames 9-17): Walking Left
 * Row 2 (frames 18-26): Facing Down (front view) — idle default
 * Row 3 (frames 27-35): Walking Right
 *
 * Idle uses the first frame of each row.
 */
const DIRECTION_FRAMES: Record<PlayerDirection, { start: number; end: number; idle: number }> = {
  up:    { start: 0, end: 8, idle: 0 },
  left:  { start: 9, end: 17, idle: 9 },
  down:  { start: 18, end: 26, idle: 18 },
  right: { start: 27, end: 35, idle: 27 },
};

/**
 * Helmet spritesheet keys per direction.
 * Each is a 128x128 image with 64x64 frames (2x2 = 4 frames).
 */
const HELMET_KEYS: Record<PlayerDirection, string> = {
  up: "knight-helmet-n",
  down: "knight-helmet-s",
  left: "knight-helmet-w",
  right: "knight-helmet-e",
};

/**
 * Weapon frame ranges (384x256, 64x64 = 6 cols × 4 rows)
 */
const WEAPON_FRAMES: Record<PlayerDirection, { start: number; end: number; idle: number }> = {
  up:    { start: 0, end: 5, idle: 0 },
  left:  { start: 6, end: 11, idle: 6 },
  down:  { start: 12, end: 17, idle: 12 },
  right: { start: 18, end: 23, idle: 18 },
};

/**
 * Shield frame ranges (512x256, 64x64 = 8 cols × 4 rows)
 */
const SHIELD_FRAMES: Record<PlayerDirection, { start: number; end: number; idle: number }> = {
  up:    { start: 0, end: 7, idle: 0 },
  left:  { start: 8, end: 15, idle: 8 },
  down:  { start: 16, end: 23, idle: 16 },
  right: { start: 24, end: 31, idle: 24 },
};

export class Player {
  private readonly scene: Phaser.Scene;
  private readonly body: Phaser.Physics.Arcade.Sprite;
  private readonly feet: Phaser.GameObjects.Sprite;
  private readonly legs: Phaser.GameObjects.Sprite;
  private readonly torso: Phaser.GameObjects.Sprite;
  private readonly weapon: Phaser.GameObjects.Sprite;
  private readonly shield: Phaser.GameObjects.Sprite;
  private readonly helmet: Phaser.GameObjects.Sprite;
  private state: PlayerState = "idle";
  private direction: PlayerDirection = "down";
  private currentAnimKey: string = "body-idle-down";

  /**
   * Creates the Player entity with all its visual layers.
   *
   * @param scene - The Phaser scene this player belongs to.
   * @param x - Initial world X coordinate.
   * @param y - Initial world Y coordinate.
   */
  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Body layer — physics-enabled sprite (depth 0), facing down = frame 18
    this.body = this.scene.physics.add.sprite(x, y, "knight-body", 18);
    this.body.setDepth(0);

    // Feet layer — rendered above body (depth 1)
    this.feet = this.scene.add.sprite(x, y, "knight-feet", 18);
    this.feet.setDepth(1);

    // Legs layer — rendered above feet (depth 2)
    this.legs = this.scene.add.sprite(x, y, "knight-legs", 18);
    this.legs.setDepth(2);

    // Torso layer — rendered above legs (depth 3)
    this.torso = this.scene.add.sprite(x, y, "knight-torso", 18);
    this.torso.setDepth(3);

    // Weapon layer — right hand (depth 4)
    this.weapon = this.scene.add.sprite(x, y, "knight-weapon", 12);
    this.weapon.setDepth(4);

    // Shield layer — left hand (depth 4)
    this.shield = this.scene.add.sprite(x, y, "knight-shield", 16);
    this.shield.setDepth(4);

    // Helmet layer — uses directional images, starts facing down (depth 5)
    this.helmet = this.scene.add.sprite(x, y, "knight-helmet-s");
    this.helmet.setDepth(5);
    this.helmet.setScale(1); // 128px full size
  }

  /**
   * Registers all player body animations.
   * Must be called once during scene initialization.
   * Prevents duplicate registration if already created.
   *
   * Helmet uses separate directional spritesheets (128x128, 4 frames each)
   * and switches texture on direction change — no animation registration needed.
   */
  static registerAnimations(scene: Phaser.Scene): void {
    const anims = scene.anims;

    for (const [dir, frames] of Object.entries(DIRECTION_FRAMES)) {
      const direction = dir as PlayerDirection;

      // Body walking animation
      const bodyWalkKey = `body-walk-${direction}`;
      if (!anims.exists(bodyWalkKey)) {
        anims.create({
          key: bodyWalkKey,
          frames: anims.generateFrameNumbers("knight-body", {
            start: frames.start,
            end: frames.end,
          }),
          frameRate: WALK_FRAME_RATE,
          repeat: -1,
        });
      }

      // Body idle animation (single frame)
      const bodyIdleKey = `body-idle-${direction}`;
      if (!anims.exists(bodyIdleKey)) {
        anims.create({
          key: bodyIdleKey,
          frames: [{ key: "knight-body", frame: frames.idle }],
          frameRate: 1,
          repeat: 0,
        });
      }

      // Torso walking animation
      const torsoWalkKey = `torso-walk-${direction}`;
      if (!anims.exists(torsoWalkKey)) {
        anims.create({
          key: torsoWalkKey,
          frames: anims.generateFrameNumbers("knight-torso", {
            start: frames.start,
            end: frames.end,
          }),
          frameRate: WALK_FRAME_RATE,
          repeat: -1,
        });
      }

      // Torso idle animation (single frame)
      const torsoIdleKey = `torso-idle-${direction}`;
      if (!anims.exists(torsoIdleKey)) {
        anims.create({
          key: torsoIdleKey,
          frames: [{ key: "knight-torso", frame: frames.idle }],
          frameRate: 1,
          repeat: 0,
        });
      }

      // Legs walking animation
      const legsWalkKey = `legs-walk-${direction}`;
      if (!anims.exists(legsWalkKey)) {
        anims.create({
          key: legsWalkKey,
          frames: anims.generateFrameNumbers("knight-legs", {
            start: frames.start,
            end: frames.end,
          }),
          frameRate: WALK_FRAME_RATE,
          repeat: -1,
        });
      }

      // Legs idle animation (single frame)
      const legsIdleKey = `legs-idle-${direction}`;
      if (!anims.exists(legsIdleKey)) {
        anims.create({
          key: legsIdleKey,
          frames: [{ key: "knight-legs", frame: frames.idle }],
          frameRate: 1,
          repeat: 0,
        });
      }

      // Feet walking animation
      const feetWalkKey = `feet-walk-${direction}`;
      if (!anims.exists(feetWalkKey)) {
        anims.create({
          key: feetWalkKey,
          frames: anims.generateFrameNumbers("knight-feet", {
            start: frames.start,
            end: frames.end,
          }),
          frameRate: WALK_FRAME_RATE,
          repeat: -1,
        });
      }

      // Feet idle animation (single frame)
      const feetIdleKey = `feet-idle-${direction}`;
      if (!anims.exists(feetIdleKey)) {
        anims.create({
          key: feetIdleKey,
          frames: [{ key: "knight-feet", frame: frames.idle }],
          frameRate: 1,
          repeat: 0,
        });
      }

      // Weapon walking animation
      const weaponFrames = WEAPON_FRAMES[direction];
      const weaponWalkKey = `weapon-walk-${direction}`;
      if (!anims.exists(weaponWalkKey)) {
        anims.create({
          key: weaponWalkKey,
          frames: anims.generateFrameNumbers("knight-weapon", {
            start: weaponFrames.start,
            end: weaponFrames.end,
          }),
          frameRate: WALK_FRAME_RATE,
          repeat: -1,
        });
      }

      // Weapon idle animation
      const weaponIdleKey = `weapon-idle-${direction}`;
      if (!anims.exists(weaponIdleKey)) {
        anims.create({
          key: weaponIdleKey,
          frames: [{ key: "knight-weapon", frame: weaponFrames.idle }],
          frameRate: 1,
          repeat: 0,
        });
      }

      // Shield walking animation
      const shieldFrames = SHIELD_FRAMES[direction];
      const shieldWalkKey = `shield-walk-${direction}`;
      if (!anims.exists(shieldWalkKey)) {
        anims.create({
          key: shieldWalkKey,
          frames: anims.generateFrameNumbers("knight-shield", {
            start: shieldFrames.start,
            end: shieldFrames.end,
          }),
          frameRate: WALK_FRAME_RATE,
          repeat: -1,
        });
      }

      // Shield idle animation
      const shieldIdleKey = `shield-idle-${direction}`;
      if (!anims.exists(shieldIdleKey)) {
        anims.create({
          key: shieldIdleKey,
          frames: [{ key: "knight-shield", frame: shieldFrames.idle }],
          frameRate: 1,
          repeat: 0,
        });
      }
    }
  }

  /**
   * Applies movement velocity to the player.
   * Updates state to walking and determines facing direction.
   *
   * @param velocityX - Horizontal velocity in pixels/sec.
   * @param velocityY - Vertical velocity in pixels/sec.
   */
  move(velocityX: number, velocityY: number): void {
    this.body.setVelocity(velocityX, velocityY);
    this.state = "walking";

    // Determine facing direction based on velocity
    if (Math.abs(velocityX) >= Math.abs(velocityY)) {
      this.direction = velocityX > 0 ? "right" : "left";
    } else {
      this.direction = velocityY > 0 ? "down" : "up";
    }
  }

  /**
   * Stops all player movement immediately.
   * Sets velocity to zero and transitions to idle state.
   */
  stop(): void {
    this.body.setVelocity(0, 0);
    this.state = "idle";
  }

  /**
   * Called every frame. Synchronizes helmet position and updates animations.
   */
  update(): void {
    // Synchronize all equipment layers with physics body
    this.feet.setPosition(this.body.x, this.body.y);
    this.legs.setPosition(this.body.x, this.body.y);
    this.torso.setPosition(this.body.x, this.body.y);
    // Position weapon and shield based on direction
    if (this.direction === "down") {
      this.weapon.setPosition(this.body.x - 21, this.body.y);
      this.shield.setPosition(this.body.x + 8, this.body.y);
    } else if (this.direction === "up") {
      this.weapon.setPosition(this.body.x + 8, this.body.y);
      this.shield.setPosition(this.body.x, this.body.y);
    } else {
      this.weapon.setPosition(this.body.x, this.body.y);
      this.shield.setPosition(this.body.x, this.body.y);
    }
    this.helmet.setPosition(this.body.x - 5, this.body.y - 16);

    // Adjust weapon/shield depth based on direction
    // When facing south: shield in front (higher depth)
    // When facing north: weapon in front (higher depth)
    if (this.direction === "down") {
      this.weapon.setDepth(3);
      this.shield.setDepth(5);
    } else if (this.direction === "up") {
      this.weapon.setDepth(5);
      this.shield.setDepth(3);
    } else {
      this.weapon.setDepth(4);
      this.shield.setDepth(4);
    }

    // Update animations based on current state and direction
    this.updateAnimation();
  }

  /**
   * Selects and plays the correct animation based on current state and direction.
   * Prevents restarting an animation that is already playing.
   * Updates helmet texture to match the current direction.
   */
  private updateAnimation(): void {
    const prefix = this.state === "walking" ? "walk" : "idle";
    const bodyAnimKey = `body-${prefix}-${this.direction}`;

    if (this.currentAnimKey !== bodyAnimKey) {
      this.currentAnimKey = bodyAnimKey;
      this.body.play(bodyAnimKey);
      this.feet.play(`feet-${prefix}-${this.direction}`);
      this.legs.play(`legs-${prefix}-${this.direction}`);
      this.torso.play(`torso-${prefix}-${this.direction}`);
      this.weapon.play(`weapon-${prefix}-${this.direction}`);
      this.shield.play(`shield-${prefix}-${this.direction}`);

      const helmetKey = HELMET_KEYS[this.direction];
      this.helmet.setTexture(helmetKey);
    }
  }

  /**
   * Returns the physics-enabled body sprite.
   */
  getBody(): Phaser.Physics.Arcade.Sprite {
    return this.body;
  }

  /**
   * Returns the helmet layer Sprite.
   */
  getHelmet(): Phaser.GameObjects.Sprite {
    return this.helmet;
  }

  /**
   * Returns the underlying body sprite for external coordination (e.g. camera follow).
   */
  getSprite(): Phaser.Physics.Arcade.Sprite {
    return this.body;
  }

  /**
   * Returns the current world X position.
   */
  getX(): number {
    return this.body.x;
  }

  /**
   * Returns the current world Y position.
   */
  getY(): number {
    return this.body.y;
  }

  /**
   * Returns the current player state.
   */
  getState(): PlayerState {
    return this.state;
  }

  /**
   * Returns the current facing direction.
   */
  getDirection(): PlayerDirection {
    return this.direction;
  }

  /**
   * Sets the player's world position.
   * Moves all equipment layers together.
   *
   * @param x - New world X coordinate.
   * @param y - New world Y coordinate.
   */
  setPosition(x: number, y: number): void {
    this.body.setPosition(x, y);
    this.feet.setPosition(x, y);
    this.legs.setPosition(x, y);
    this.torso.setPosition(x, y);
    this.weapon.setPosition(x, y);
    this.shield.setPosition(x, y);
    this.helmet.setPosition(x - 5, y - 16);
  }
}
