# Implementation Plan: Auth Page Animations

## Overview

Implement anime.js-powered animations for the authentication pages: entrance animations on mount, coordinated exit-before-navigate transitions between auth routes, and a cinematic post-login sequence that transitions the user through a themed loader into the game world. All animations respect the reduced motion preference and only animate GPU-accelerated properties (opacity, transform).

## Tasks

- [x] 1. Install anime.js and create the useAnimeTransition hook
  - [x] 1.1 Install anime.js v4.x as a project dependency
    - Run `npm install animejs@4` to add anime.js to the project
    - Verify the package is added to `package.json`
    - _Requirements: 5.3_

  - [x] 1.2 Implement the `useAnimeTransition` hook at `src/auth/hooks/useAnimeTransition.ts`
    - Create the `TransitionConfig` interface with duration, easing, fromOpacity, toOpacity, fromScale, toScale
    - Define `ENTRANCE_DEFAULTS` (600ms, easeOutCubic, opacity 0→1, scale 0.85→1)
    - Define `EXIT_DEFAULTS` (400ms, easeInCubic, opacity 1→0, scale 1→0.9)
    - Implement `animateIn()` that sets initial styles, disables pointer-events, runs anime.js `animate()`, and re-enables pointer-events on completion
    - Implement `animateOut()` with optional config override
    - Implement `cancel()` that immediately stops any in-progress animation
    - Integrate `useReducedMotion` — when true, apply final styles instantly without animation
    - Add cleanup effect on unmount to cancel any active animation instance
    - Store animation instance in a ref for cancellation support
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 4.1, 4.5, 5.1, 5.4, 5.5_

  - [ ]* 1.3 Write unit tests for `useAnimeTransition` hook
    - Test that `animateIn` sets correct initial styles (opacity 0, scale 0.85)
    - Test that `animateOut` resolves after animation duration
    - Test that `cancel()` stops in-progress animation
    - Test that reduced motion skips animation and applies final styles immediately
    - Test that pointer-events are disabled during entrance and restored after
    - Test cleanup on unmount cancels active animation
    - **Property 1: Entrance animation produces correct initial and final state**
    - **Property 6: Reduced motion skips all animations**
    - **Property 7: Pointer events disabled during animation**
    - **Property 9: Animation cleanup on component unmount**
    - **Property 10: Interruption cancels in-progress animation**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 4.1, 5.4, 5.5**

- [x] 2. Create the AnimatedRoute wrapper component
  - [x] 2.1 Implement `AnimatedRoute` at `src/auth/components/AnimatedRoute.tsx`
    - Create `AnimatedRouteContext` with `navigateWithExit` and `animateOut` methods
    - Export `useAnimatedRoute()` consumer hook that throws if used outside context
    - Implement `AnimatedRoute` component that wraps children in a div with the transition ref
    - Call `animateIn()` on mount via useEffect
    - Implement `navigateWithExit(to)` — cancel current animation, play exit, then call `navigate(to)`
    - When reduced motion is active, `navigateWithExit` calls navigate immediately without animation
    - _Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 4.2_

  - [ ]* 2.2 Write unit tests for `AnimatedRoute`
    - Test that entrance animation triggers on mount
    - Test that `navigateWithExit` plays exit before calling navigate
    - Test that reduced motion mode navigates immediately
    - **Property 2: Exit animation completes before navigation callback**
    - **Validates: Requirements 2.1, 2.2, 2.4, 4.2**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create the LoaderScreen component and /loading route
  - [x] 4.1 Implement `LoaderScreen` at `src/auth/components/LoaderScreen.tsx`
    - Create a full-screen component with `bg-[#000000]` background and centered content
    - Add a spinning loading indicator using `border-[#E1DCC9]` with CSS `animate-spin`
    - Add "Entrando al mundo..." text in `text-[#E1DCC9]/70`
    - Implement fade-in animation on mount (400ms, easeOutCubic) via anime.js
    - Listen for `GAME_READY` event on `eventBus` from `@/game/events`
    - On `GAME_READY`: fade out the loader (300ms, easeInCubic) then navigate to `/game`
    - Implement 15-second timeout that shows a delay message if GAME_READY is not received
    - When reduced motion is active, skip fade-in/fade-out and navigate immediately on GAME_READY
    - Add `aria-live="polite"` and `aria-label="Loading game"` for accessibility
    - Add `role="alert"` on the timeout message
    - Clean up event listener and animation on unmount
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 4.3, 4.4, 5.1, 5.4_

  - [x] 4.2 Add `/loading` route to the router at `src/router/index.tsx`
    - Import `LoaderScreen` from `@/auth/components/LoaderScreen`
    - Add `{ path: "/loading", element: <LoaderScreen /> }` between `/register` and `/game` routes
    - _Requirements: 3.3_

  - [ ]* 4.3 Write unit tests for `LoaderScreen`
    - Test that the component renders with design system colors (#E1DCC9 on #000000)
    - Test that timeout message appears after 15 seconds (using fake timers)
    - Test that GAME_READY event triggers fade-out and navigation to /game
    - Test that reduced motion navigates immediately without fade effects
    - Test that event listener is cleaned up on unmount
    - **Property 4: Loader visibility governed by GAME_READY event**
    - **Property 5: Timeout triggers after 15 seconds without GAME_READY**
    - **Validates: Requirements 3.4, 3.5, 3.6, 3.7, 4.3, 4.4**

- [x] 5. Integrate animations into LoginPage with cinematic transition
  - [x] 5.1 Update `LoginPage` to use `AnimatedRoute` and implement cinematic post-login flow
    - Wrap the page content in `<AnimatedRoute>` component
    - Replace the `<Link to="/register">` with a button/link that calls `navigateWithExit("/register")`
    - Add a cinematic overlay div (`id="cinematic-overlay"`) to the page, initially hidden (opacity 0, pointer-events none)
    - After successful login: call `animateOut()` on the card (400ms exit), then animate the overlay to opacity 1 (800ms, easeInOutQuad darkness effect), then navigate to `/loading`
    - When reduced motion is active, skip cinematic and navigate directly to `/loading`
    - Remove the current direct `navigate("/game")` call on login success
    - _Requirements: 1.1, 2.1, 3.1, 3.2, 3.3, 4.2, 4.3, 5.5_

  - [ ]* 5.2 Write unit tests for LoginPage cinematic transition
    - Test that successful login triggers card exit → overlay → navigate to /loading sequence
    - Test that reduced motion skips directly to /loading
    - Test that navigation interruption cancels in-progress cinematic
    - **Property 3: Cinematic transition follows correct phase ordering**
    - **Property 6: Reduced motion skips all animations**
    - **Validates: Requirements 3.1, 3.2, 3.3, 4.2, 4.3**

- [x] 6. Integrate animations into RegisterPage
  - [x] 6.1 Update `RegisterPage` to use `AnimatedRoute` for entrance and exit transitions
    - Wrap the page content in `<AnimatedRoute>` component
    - Replace the `<Link to="/">` with a button/link that calls `navigateWithExit("/")`
    - The entrance animation will play automatically via AnimatedRoute on mount
    - _Requirements: 1.2, 2.2, 2.5_

  - [ ]* 6.2 Write unit tests for RegisterPage animation integration
    - Test that AnimatedRoute wraps the page content
    - Test that link to login uses navigateWithExit
    - **Validates: Requirements 1.2, 2.2**

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- The design uses TypeScript with anime.js v4.x `animate()` API (not the legacy `anime()` function)
- The existing `useReducedMotion` hook at `src/auth/hooks/useReducedMotion.ts` is reused
- The `GAME_READY` event is already emitted by `BootstrapService` — no changes needed there
- The `eventBus` is imported from `@/game/events`
- Only `opacity` and `transform` (scale) are animated for GPU-accelerated rendering

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["1.3", "2.1"] },
    { "id": 3, "tasks": ["2.2", "4.1", "4.2"] },
    { "id": 4, "tasks": ["4.3", "5.1", "6.1"] },
    { "id": 5, "tasks": ["5.2", "6.2"] }
  ]
}
```
