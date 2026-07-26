# Design Document: Auth Page Animations

## Overview

This feature introduces an anime.js-powered animation layer for the authentication pages (Login and Register) of the Revenant application. It provides entrance animations on page mount, coordinated exit-before-navigate transitions between auth routes, and a cinematic post-login sequence that leads the user through a themed loader into the game world.

## Architecture

The architecture is built around three core abstractions:

1. **useAnimeTransition** — A custom React hook that encapsulates anime.js animation lifecycle (create, play, cancel, cleanup) and integrates with the `useReducedMotion` hook.
2. **AnimatedRoute** — A wrapper component that coordinates entrance/exit animations around route transitions using the hook above.
3. **LoaderScreen** — A standalone component that handles the post-login cinematic-to-game handoff, listening for `GAME_READY` on the Event Bus.

The MainScene in Phaser emits `GAME_READY` after its `create()` method completes, signaling the React layer that the game world is ready.

---

## Components and Interfaces

### 1. `useAnimeTransition` Hook

**Location:** `src/auth/hooks/useAnimeTransition.ts`

**Purpose:** Provides a declarative API for entrance and exit animations on a referenced DOM element. Handles reduced motion, cleanup, and interruption.

```typescript
import { useRef, useCallback, useEffect } from "react";
import { animate, type Animation } from "animejs";
import { useReducedMotion } from "./useReducedMotion";

interface TransitionConfig {
  /** Duration in milliseconds */
  duration: number;
  /** Easing function name (anime.js easing string) */
  easing: string;
  /** Initial opacity (0-1) */
  fromOpacity: number;
  /** Final opacity (0-1) */
  toOpacity: number;
  /** Initial scale factor */
  fromScale: number;
  /** Final scale factor */
  toScale: number;
}

interface UseAnimeTransitionReturn {
  /** Ref to attach to the animated container element */
  ref: React.RefObject<HTMLDivElement | null>;
  /** Whether an animation is currently in progress */
  isAnimating: boolean;
  /** Plays the entrance animation; resolves when complete */
  animateIn: () => Promise<void>;
  /** Plays the exit animation; resolves when complete */
  animateOut: (config?: Partial<TransitionConfig>) => Promise<void>;
  /** Cancels any in-progress animation immediately */
  cancel: () => void;
}

const ENTRANCE_DEFAULTS: TransitionConfig = {
  duration: 600,
  easing: "easeOutCubic",
  fromOpacity: 0,
  toOpacity: 1,
  fromScale: 0.85,
  toScale: 1,
};

const EXIT_DEFAULTS: TransitionConfig = {
  duration: 400,
  easing: "easeInCubic",
  fromOpacity: 1,
  toOpacity: 0,
  fromScale: 1,
  toScale: 0.9,
};

export function useAnimeTransition(): UseAnimeTransitionReturn {
  const ref = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const isAnimatingRef = useRef(false);
  const reducedMotion = useReducedMotion();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
        animationRef.current = null;
      }
    };
  }, []);

  const cancel = useCallback(() => {
    if (animationRef.current) {
      animationRef.current.cancel();
      animationRef.current = null;
    }
    isAnimatingRef.current = false;
  }, []);

  const animateIn = useCallback(async (): Promise<void> => {
    const el = ref.current;
    if (!el) return;

    if (reducedMotion) {
      el.style.opacity = "1";
      el.style.transform = "scale(1)";
      return;
    }

    cancel();
    isAnimatingRef.current = true;

    el.style.opacity = String(ENTRANCE_DEFAULTS.fromOpacity);
    el.style.transform = `scale(${ENTRANCE_DEFAULTS.fromScale})`;
    el.style.pointerEvents = "none";

    const anim = animate(el, {
      opacity: [ENTRANCE_DEFAULTS.fromOpacity, ENTRANCE_DEFAULTS.toOpacity],
      scale: [ENTRANCE_DEFAULTS.fromScale, ENTRANCE_DEFAULTS.toScale],
      duration: ENTRANCE_DEFAULTS.duration,
      easing: ENTRANCE_DEFAULTS.easing,
    });

    animationRef.current = anim;
    await anim;

    el.style.pointerEvents = "";
    isAnimatingRef.current = false;
    animationRef.current = null;
  }, [reducedMotion, cancel]);

  const animateOut = useCallback(
    async (config?: Partial<TransitionConfig>): Promise<void> => {
      const el = ref.current;
      if (!el) return;

      if (reducedMotion) {
        el.style.opacity = "0";
        el.style.transform = `scale(${EXIT_DEFAULTS.toScale})`;
        return;
      }

      cancel();
      isAnimatingRef.current = true;

      const merged = { ...EXIT_DEFAULTS, ...config };

      const anim = animate(el, {
        opacity: [merged.fromOpacity, merged.toOpacity],
        scale: [merged.fromScale, merged.toScale],
        duration: merged.duration,
        easing: merged.easing,
      });

      animationRef.current = anim;
      await anim;

      isAnimatingRef.current = false;
      animationRef.current = null;
    },
    [reducedMotion, cancel]
  );

  return {
    ref,
    isAnimating: isAnimatingRef.current,
    animateIn,
    animateOut,
    cancel,
  };
}
```

**Key Decisions:**
- Uses `animejs` v4.x `animate()` function (not the legacy `anime()` call).
- Only animates `opacity` and `scale` (transform) for GPU-accelerated rendering.
- Pointer events are disabled during entrance animation and re-enabled on completion.
- Reduced motion bypasses all animations and applies final styles instantly.
- Each new animation cancels any in-progress one to handle rapid navigation.

---

### 2. `AnimatedRoute` Wrapper Component

**Location:** `src/auth/components/AnimatedRoute.tsx`

**Purpose:** Wraps auth page content and orchestrates entrance animation on mount. Provides a `navigateWithExit` function for child pages to trigger exit-before-navigate flows.

```typescript
import { useEffect, createContext, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAnimeTransition } from "../hooks/useAnimeTransition";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface AnimatedRouteContextValue {
  navigateWithExit: (to: string) => Promise<void>;
  animateOut: () => Promise<void>;
}

const AnimatedRouteContext = createContext<AnimatedRouteContextValue | null>(null);

export function useAnimatedRoute(): AnimatedRouteContextValue {
  const ctx = useContext(AnimatedRouteContext);
  if (!ctx) {
    throw new Error("useAnimatedRoute must be used within an AnimatedRoute");
  }
  return ctx;
}

interface AnimatedRouteProps {
  children: React.ReactNode;
}

export function AnimatedRoute({ children }: AnimatedRouteProps) {
  const { ref, animateIn, animateOut, cancel } = useAnimeTransition();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    animateIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateWithExit = useCallback(
    async (to: string): Promise<void> => {
      if (reducedMotion) {
        navigate(to);
        return;
      }

      cancel();
      await animateOut();
      navigate(to);
    },
    [navigate, animateOut, cancel, reducedMotion]
  );

  const contextValue: AnimatedRouteContextValue = {
    navigateWithExit,
    animateOut,
  };

  return (
    <AnimatedRouteContext.Provider value={contextValue}>
      <div ref={ref} className="w-full">
        {children}
      </div>
    </AnimatedRouteContext.Provider>
  );
}
```

**Integration in Pages:**

Login and Register pages wrap their content in `<AnimatedRoute>` and use `useAnimatedRoute().navigateWithExit("/register")` instead of direct `navigate()` for link transitions.

---

### 3. `LoaderScreen` Component

**Location:** `src/auth/components/LoaderScreen.tsx`

**Purpose:** Displays a themed loading screen after the cinematic transition. Listens for `GAME_READY` on the Event Bus and navigates to `/game` once received. Shows a timeout message after 15 seconds.

```typescript
import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { animate, type Animation } from "animejs";
import { eventBus } from "@/game/events";
import { useReducedMotion } from "../hooks/useReducedMotion";

const TIMEOUT_MS = 15_000;
const FADE_IN_MS = 400;
const FADE_OUT_MS = 300;

export function LoaderScreen() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<Animation | null>(null);
  const reducedMotion = useReducedMotion();
  const [showTimeout, setShowTimeout] = useState(false);

  const fadeOutAndNavigate = useCallback(async () => {
    const el = containerRef.current;
    if (!el) {
      navigate("/game");
      return;
    }

    if (reducedMotion) {
      navigate("/game");
      return;
    }

    const anim = animate(el, {
      opacity: [1, 0],
      duration: FADE_OUT_MS,
      easing: "easeInCubic",
    });
    animRef.current = anim;
    await anim;
    navigate("/game");
  }, [navigate, reducedMotion]);

  // Listen for GAME_READY
  useEffect(() => {
    const handleReady = () => {
      fadeOutAndNavigate();
    };

    eventBus.on("GAME_READY", handleReady);
    return () => {
      eventBus.off("GAME_READY", handleReady);
    };
  }, [fadeOutAndNavigate]);

  // Timeout after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, []);

  // Fade-in on mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el || reducedMotion) return;

    el.style.opacity = "0";
    const anim = animate(el, {
      opacity: [0, 1],
      duration: FADE_IN_MS,
      easing: "easeOutCubic",
    });
    animRef.current = anim;

    return () => {
      if (animRef.current) {
        animRef.current.cancel();
        animRef.current = null;
      }
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#000000]"
      aria-live="polite"
      aria-label="Loading game"
    >
      {/* Pulsing loading indicator */}
      <div className="w-8 h-8 rounded-full border-2 border-[#E1DCC9] border-t-transparent animate-spin" />
      <p className="mt-4 text-sm text-[#E1DCC9]/70 font-medium">
        Entrando al mundo...
      </p>

      {showTimeout && (
        <p className="mt-4 text-xs text-[#E1DCC9]/50" role="alert">
          Esto está tomando más tiempo de lo esperado. Por favor espera...
        </p>
      )}
    </div>
  );
}
```

---

### 4. Cinematic Transition Orchestration

**Location:** Integrated within `LoginPage.tsx` post-login flow.

**Sequence:**
1. Auth succeeds → call `animateOut()` on the Auth_Card (400ms, scale to 0.9)
2. Overlay element fades to black (800ms cinematic darkness)
3. Navigate to a `/loading` intermediary route that renders `<LoaderScreen>`
4. `LoaderScreen` fades in (400ms) and waits for `GAME_READY`
5. On `GAME_READY` → fade out loader (300ms) → navigate to `/game`

```typescript
// Inside LoginPage onSubmit, after successful login:
const handlePostLoginTransition = async () => {
  const { animateOut } = animatedRoute; // from useAnimatedRoute()

  if (reducedMotion) {
    navigate("/loading");
    return;
  }

  // Phase 1: Card exit
  await animateOut();

  // Phase 2: Cinematic darkness (handled by overlay element)
  const overlay = document.getElementById("cinematic-overlay");
  if (overlay) {
    await animate(overlay, {
      opacity: [0, 1],
      duration: 800,
      easing: "easeInOutQuad",
    });
  }

  // Phase 3: Navigate to loader
  navigate("/loading");
};
```

**Router Update:** A new `/loading` route renders the `LoaderScreen` component.

---

### 5. GAME_READY Emission in MainScene

**Location:** `src/game/scenes/MainScene.ts`

The `MainScene.create()` method already triggers resource loading and enemy spawning. `GAME_READY` is already emitted by `BootstrapService` after `initialize()` completes. No additional emission is needed from MainScene itself since the BootstrapService handles this lifecycle event.

If the scene's `create()` method needs to additionally signal readiness (for cases where Phaser asset loading takes longer than the bootstrap API calls), the scene can emit a separate scene-level event that the BootstrapService awaits before emitting `GAME_READY`.

---

### 6. Route Changes

**Updated Router (`src/router/index.tsx`):**

```typescript
import { createBrowserRouter } from "react-router-dom";
import { LoginPage } from "../auth/pages/login/LoginPage";
import { RegisterPage } from "../auth/pages/register/RegisterPage";
import { LoaderScreen } from "../auth/components/LoaderScreen";
import { GamePage } from "../game/pages/GamePage";

export const router = createBrowserRouter([
  { path: "/", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/loading", element: <LoaderScreen /> },
  { path: "/game", element: <GamePage /> },
]);
```

---

## Data Flow

```
┌─────────────┐     exit anim      ┌──────────────┐    GAME_READY     ┌──────────┐
│  Login Page │ ─────────────────► │ LoaderScreen │ ──────────────────► │ GamePage │
│  (AuthCard) │  cinematic overlay │  (waiting)   │    fade out        │ (Phaser) │
└─────────────┘                    └──────────────┘                    └──────────┘
       │                                  ▲
       │  anime.js exit (400ms)           │ eventBus.on("GAME_READY")
       │  overlay fade (800ms)            │
       │  navigate("/loading")            │ BootstrapService.initialize()
       ▼                                  │     └── eventBus.emit("GAME_READY")
┌─────────────────┐                       │
│ Cinematic        │───────────────────────┘
│ Overlay (#000)   │
└─────────────────┘
```

---

## Data Models

The animation system is stateless and does not introduce persistent data models. Configuration is expressed through the `TransitionConfig` interface:

```typescript
/** Configuration for a single transition animation */
interface TransitionConfig {
  duration: number;
  easing: string;
  fromOpacity: number;
  toOpacity: number;
  fromScale: number;
  toScale: number;
}
```

Default configurations are provided as constants:

| Config | Duration | Easing | From (opacity/scale) | To (opacity/scale) |
|--------|----------|--------|---------------------|-------------------|
| Entrance | 600ms | easeOutCubic | 0 / 0.85 | 1 / 1.0 |
| Exit (page) | 400ms | easeInCubic | 1 / 1.0 | 0 / 0.9 |
| Exit (cinematic) | 400ms | easeInCubic | 1 / 1.0 | 0 / 0.9 |
| Cinematic overlay | 800ms | easeInOutQuad | 0 → 1 opacity | — |
| Loader fade-in | 400ms | easeOutCubic | 0 → 1 opacity | — |
| Loader fade-out | 300ms | easeInCubic | 1 → 0 opacity | — |

---

## Interfaces

```typescript
/** Configuration for a single transition animation */
interface TransitionConfig {
  duration: number;
  easing: string;
  fromOpacity: number;
  toOpacity: number;
  fromScale: number;
  toScale: number;
}

/** Return type of the useAnimeTransition hook */
interface UseAnimeTransitionReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  isAnimating: boolean;
  animateIn: () => Promise<void>;
  animateOut: (config?: Partial<TransitionConfig>) => Promise<void>;
  cancel: () => void;
}

/** Context value provided by AnimatedRoute to child pages */
interface AnimatedRouteContextValue {
  navigateWithExit: (to: string) => Promise<void>;
  animateOut: () => Promise<void>;
}
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Animation element ref is null | Animation functions resolve immediately (no-op) |
| GAME_READY not received within 15s | LoaderScreen shows timeout message |
| Animation interrupted by navigation | In-progress animation is cancelled, new navigation proceeds |
| Component unmounts during animation | Animation instance is cancelled in cleanup effect |
| `matchMedia` unavailable (SSR) | `useReducedMotion` returns `false`, animations play normally |

---

## Performance Considerations

- Only `opacity` and `transform: scale()` are animated — both are compositor-thread properties that trigger no layout or paint.
- anime.js instances are stored in refs and cancelled on unmount to prevent memory leaks.
- No `will-change` CSS is added since the animations are short-lived and infrequent.
- The `LoaderScreen` uses CSS `animate-spin` for the spinner (no JS overhead for the idle indicator).

---

## Testing Strategy

**Unit Tests (Example-Based):**
- Verify entrance animation config values (600ms, easeOutCubic) are correct
- Verify exit animation config values (400ms, easeInCubic) are correct
- Verify LoaderScreen renders with design system colors (#E1DCC9 on #000000)
- Verify cinematic exit uses scale 0.9 target
- Verify timeout message appears after 15 seconds (using fake timers)

**Property Tests:**
- Reduced motion behavior across all animation types
- Exit-before-navigate sequencing guarantee
- Cleanup on unmount correctness
- Interruption cancellation behavior

**Integration Tests:**
- Full cinematic flow from login success through to game navigation
- GAME_READY event reception triggers loader dismissal

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Entrance animation produces correct initial and final state

*For any* auth page mount (login or register), when the entrance animation is triggered, the animated element SHALL transition from opacity 0 / scale 0.85 to opacity 1 / scale 1, and the final computed style of the element SHALL reflect opacity 1 and scale 1.

**Validates: Requirements 1.1, 1.2**

### Property 2: Exit animation completes before navigation callback

*For any* page transition triggered via `navigateWithExit`, the navigation callback SHALL NOT be invoked until the exit animation promise has resolved, guaranteeing the exit animation is visible to the user before the route changes.

**Validates: Requirements 2.1, 2.2, 2.4**

### Property 3: Cinematic transition follows correct phase ordering

*For any* post-login cinematic transition, the three phases (card exit → cinematic darkness → loader mount) SHALL execute in strict sequential order, with each phase completing before the next begins.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: Loader visibility governed by GAME_READY event

*For any* state where the LoaderScreen is mounted and `GAME_READY` has not been emitted, the loader SHALL remain visible. Once `GAME_READY` is emitted, the loader SHALL initiate its exit sequence and navigate to the game route.

**Validates: Requirements 3.5, 3.6**

### Property 5: Timeout triggers after 15 seconds without GAME_READY

*For any* LoaderScreen instance where the elapsed time since mount exceeds 15,000 milliseconds and `GAME_READY` has not been received, the component SHALL display a timeout notification message.

**Validates: Requirements 3.7**

### Property 6: Reduced motion skips all animations

*For any* animation request (entrance, exit, cinematic, or loader transition) where `useReducedMotion` returns `true`, the animation system SHALL apply final styles immediately without any intermediate frames or delays, and navigation SHALL proceed without waiting for animation duration.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 7: Pointer events disabled during animation

*For any* entrance animation in progress, the animated element SHALL have `pointer-events: none` applied. Once the animation completes, `pointer-events` SHALL be restored to its default value.

**Validates: Requirements 1.5**

### Property 8: Only transform and opacity properties are animated

*For any* animation executed by the system, the animated CSS properties SHALL be limited to `opacity` and `transform` (scale). No layout-triggering properties (width, height, top, left, margin, padding) SHALL be animated.

**Validates: Requirements 5.1**

### Property 9: Animation cleanup on component unmount

*For any* component using `useAnimeTransition` that unmounts while an animation is in progress, the animation instance SHALL be cancelled and the reference cleared, leaving no active animation subscriptions.

**Validates: Requirements 5.4**

### Property 10: Interruption cancels in-progress animation

*For any* in-progress animation, if a new animation or navigation event is triggered on the same element, the previous animation SHALL be immediately cancelled and the new operation SHALL proceed without delay.

**Validates: Requirements 5.5**
