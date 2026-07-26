# Requirements Document

## Introduction

This feature adds animations powered by anime.js to the authentication pages (Login and Register) of the Revenant application. It covers three animation scenarios: the entrance animation when an auth card first appears on screen, page transitions between the login and register routes, and a cinematic post-login transition that leads the user from the auth card into a themed loader screen before the game becomes ready.

## Glossary

- **Animation_System**: The anime.js-based animation layer responsible for orchestrating entrance, exit, and transition effects on the authentication pages.
- **Auth_Card**: The primary container component (`AuthCard`) that wraps login or register form content on authentication pages.
- **Entrance_Animation**: A combined fade-in and scale-up effect that brings the Auth_Card into view from an initial invisible and scaled-down state.
- **Exit_Animation**: A combined fade-out and scale-down (or slide-out) effect that removes the Auth_Card from view before navigation occurs.
- **Page_Transition**: The coordinated sequence of exit animation on the current page followed by entrance animation on the destination page when navigating between login and register routes.
- **Cinematic_Transition**: A multi-phase animation sequence triggered after successful login that plays an Auth_Card exit, followed by a full-screen wipe or zoom-into-darkness effect, leading to a themed loader screen.
- **Loader_Screen**: A themed loading screen displayed after the cinematic transition that persists until the GAME_READY event is received from the game bootstrap process.
- **GAME_READY_Event**: An event emitted by the BootstrapService on the Event Bus signaling that all required game resources have been loaded and gameplay can begin.
- **Reduced_Motion_Preference**: The operating system preference `prefers-reduced-motion: reduce` detected by the `useReducedMotion` hook, indicating the user prefers minimal or no animation.

## Requirements

### Requirement 1: Auth Card Entrance Animation

**User Story:** As a player, I want the auth card to appear with a smooth entrance animation when I arrive on the login or register page, so that the interface feels polished and immersive.

#### Acceptance Criteria

1. WHEN the Login page mounts, THE Animation_System SHALL animate the Auth_Card from opacity 0 and scale 0.85 to opacity 1 and scale 1.
2. WHEN the Register page mounts, THE Animation_System SHALL animate the Auth_Card from opacity 0 and scale 0.85 to opacity 1 and scale 1.
3. THE Animation_System SHALL complete the entrance animation within 600 milliseconds using an easeOutCubic easing function.
4. THE Animation_System SHALL animate the Auth_Card as a single unit including all child form elements.
5. WHILE the entrance animation is playing, THE Animation_System SHALL keep the Auth_Card non-interactive by disabling pointer events until the animation completes.

### Requirement 2: Page Transition Between Login and Register

**User Story:** As a player, I want a smooth animated transition when navigating between the login and register pages, so that the route change feels intentional rather than abrupt.

#### Acceptance Criteria

1. WHEN the user initiates navigation from the Login page to the Register page, THE Animation_System SHALL play an exit animation on the current Auth_Card before the route change occurs.
2. WHEN the user initiates navigation from the Register page to the Login page, THE Animation_System SHALL play an exit animation on the current Auth_Card before the route change occurs.
3. THE Animation_System SHALL complete the exit animation within 400 milliseconds using an easeInCubic easing function.
4. WHEN the exit animation completes, THE Animation_System SHALL trigger the React Router navigation to the destination route.
5. WHEN the destination page mounts after a page transition, THE Animation_System SHALL play the entrance animation as defined in Requirement 1.

### Requirement 3: Post-Login Cinematic Transition

**User Story:** As a player, I want an immersive cinematic transition after logging in that leads me into the game world, so that the experience feels like entering a medieval fantasy adventure.

#### Acceptance Criteria

1. WHEN authentication succeeds on the Login page, THE Animation_System SHALL play an exit animation on the Auth_Card consisting of fade-out and scale-down to 0.9 within 400 milliseconds.
2. WHEN the Auth_Card exit animation completes, THE Animation_System SHALL play a full-screen cinematic effect that transitions the viewport to complete darkness using a zoom or wipe effect within 800 milliseconds.
3. WHEN the cinematic darkness effect completes, THE Animation_System SHALL display the Loader_Screen with a themed fade-in entrance within 400 milliseconds.
4. THE Loader_Screen SHALL display a loading indicator consistent with the design system color palette using Highlight color #E1DCC9 on Primary background #000000.
5. WHILE the Loader_Screen is displayed, THE Animation_System SHALL keep the Loader_Screen visible until the GAME_READY_Event is received on the Event Bus.
6. WHEN the GAME_READY_Event is received, THE Animation_System SHALL fade out the Loader_Screen within 300 milliseconds and navigate to the game route.
7. IF the GAME_READY_Event is not received within 15 seconds after the Loader_Screen appears, THEN THE Animation_System SHALL display a timeout message on the Loader_Screen informing the player of the delay.

### Requirement 4: Reduced Motion Accessibility

**User Story:** As a player with motion sensitivity, I want animations to be suppressed when my operating system preference indicates reduced motion, so that the interface remains usable without causing discomfort.

#### Acceptance Criteria

1. WHILE the Reduced_Motion_Preference is active, THE Animation_System SHALL skip all entrance animations and display the Auth_Card at full opacity and scale immediately.
2. WHILE the Reduced_Motion_Preference is active, THE Animation_System SHALL skip page transition animations and navigate to the destination route immediately.
3. WHILE the Reduced_Motion_Preference is active, THE Animation_System SHALL skip the cinematic transition and navigate directly to the Loader_Screen without visual effects.
4. WHILE the Reduced_Motion_Preference is active, THE Loader_Screen SHALL appear immediately without fade-in and disappear immediately upon receiving the GAME_READY_Event.
5. THE Animation_System SHALL read the motion preference using the existing useReducedMotion hook before initiating any animation sequence.

### Requirement 5: Animation Performance and Consistency

**User Story:** As a player, I want animations to run smoothly without jank or layout shifts, so that the visual experience matches the quality of the game world.

#### Acceptance Criteria

1. THE Animation_System SHALL animate only transform and opacity properties to ensure GPU-accelerated rendering.
2. THE Animation_System SHALL not cause cumulative layout shift during any animation sequence.
3. THE Animation_System SHALL use anime.js version 4.x API for all animation orchestration.
4. THE Animation_System SHALL clean up all animation instances when the hosting component unmounts to prevent memory leaks.
5. IF an animation is interrupted by a new navigation event, THEN THE Animation_System SHALL cancel the in-progress animation and proceed with the new navigation immediately.
