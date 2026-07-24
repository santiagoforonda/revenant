# Implementation Plan: Login & Register UI Improvement

## Overview

This plan implements the visual enhancement of the Login and Register pages for the Revenant application. It adds CSS custom animations, a vignette background, an interactive Character Class Carousel component with a supporting `useCarousel` hook, and integrates the carousel into the registration form — replacing the existing `<select>` dropdown. Property-based tests validate the carousel's algorithmic correctness, while component tests verify rendering and accessibility.

## Tasks

- [x] 1. Add CSS custom animations, visual foundations, and install react-icons
  - [x] 1.1 Add torchlight and glow-pulse keyframes plus prefers-reduced-motion override to `src/index.css`
    - Add `@keyframes torchlight` (opacity oscillation: 1 → 0.92 → 0.97 → 1)
    - Add `@keyframes glow-pulse` (opacity + scale oscillation for carousel glow)
    - Add `@media (prefers-reduced-motion: reduce)` rule setting `animation-duration: 0ms !important` and `transition-duration: 0ms !important` on all elements
    - _Requirements: 5.3, 5.5_

  - [x] 1.2 Install `react-icons` as a production dependency
    - Run `npm install react-icons`
    - Verify package installs correctly and is added to `package.json` dependencies
    - _Requirements: design decision — medieval iconography via Game Icons collection_

- [x] 2. Implement the useCarousel hook
  - [x] 2.1 Create `src/auth/hooks/useCarousel.ts` with circular navigation logic
    - Implement `useCarousel(totalItems: number, initialIndex?: number): UseCarouselReturn`
    - Manage `currentIndex` with modular arithmetic for circular wrap
    - Track `direction` ("left" | "right" | null) for CSS transition class selection
    - Implement `isAnimating` lock that prevents concurrent transitions
    - Implement `goNext`, `goPrev`, `goTo` methods that respect the animation lock
    - Respect `prefers-reduced-motion`: when active, release animation lock immediately (0ms fallback)
    - Export a `releaseAnimation` callback for `transitionend` event binding
    - _Requirements: 3.6, 5.4_

  - [ ]* 2.2 Write property test: Carousel navigation wraps circularly
    - **Property 1: Carousel navigation wraps circularly**
    - **Validates: Requirements 3.6, 4.2, 4.3**
    - Install `fast-check` as dev dependency
    - Create `src/auth/hooks/__tests__/useCarousel.property.test.ts`
    - Use `fc.array(fc.oneof(fc.constant('next'), fc.constant('prev')))` to generate random navigation sequences
    - Assert that `currentIndex` always equals expected circular index computed via modular arithmetic
    - Minimum 100 iterations

  - [ ]* 2.3 Write property test: Carousel selection equals displayed card
    - **Property 2: Carousel selection equals displayed card**
    - **Validates: Requirements 3.7, 3.9**
    - Assert that after any navigation action, the index maps correctly to the character class array
    - Verify `goTo(index)` always produces `currentIndex === index % totalItems`

  - [ ]* 2.4 Write property test: Animation lock prevents concurrent transitions
    - **Property 3: Animation lock prevents concurrent transitions**
    - **Validates: Requirements 5.4**
    - Generate rapid sequences of navigation calls while `isAnimating` is true
    - Assert that only one transition is accepted per animation cycle
    - Verify the final index matches only the single accepted navigation input

- [x] 3. Implement the CharacterClassCarousel component
  - [x] 3.1 Create `src/auth/components/CharacterClassCarousel.tsx` with carousel rendering and navigation
    - Define `CHARACTER_CLASSES` array with id, label, and statically imported image assets
    - Implement `CarouselProps` interface (`value`, `onChange`, `error?`)
    - Render carousel viewport with `overflow: hidden`, positioned relative
    - Render active card with character image, class name below, and radial glow `::before` pseudo-element
    - Implement shield-arrow navigation buttons using `react-icons/gi` Game Icons (e.g., `GiPointySword` rotated for direction) with 44×44px touch targets
    - Implement diamond-shaped rune dot indicators (rotated squares) reflecting current position
    - Add "Choose your destiny" label in `font-hand` above the carousel
    - Bind `goNext`/`goPrev` to arrow button clicks
    - Bind `transitionend` to release animation lock
    - Call `onChange` with the current class id on every navigation
    - Handle image load errors with a silhouette placeholder in accent color
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [x] 3.2 Add keyboard navigation and ARIA accessibility to CharacterClassCarousel
    - Make carousel container focusable (`tabIndex={0}`)
    - Handle `ArrowRight` key → `goNext`, `ArrowLeft` key → `goPrev`
    - Add `role="group"` with `aria-label="character class selection"`
    - Add `aria-label` on navigation arrows (e.g., "Previous character class", "Next character class")
    - Add `aria-current` or positional text on dot indicators (e.g., "3 of 5")
    - Add ARIA live region (`aria-live="polite"`) that announces character class name on change
    - Display visible focus indicator using highlight color on keyboard focus
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x] 3.3 Add slide transition animations to CharacterClassCarousel
    - Apply CSS transition classes based on `direction` from `useCarousel`
    - Slide current card out (left or right) and incoming card in from opposite side
    - Duration 300ms with ease-in-out timing function
    - Combine with scale (0.95 → 1.0) and opacity (0 → 1) for incoming card
    - Glow pulse animation on card entrance (single `glow-pulse` cycle, ~600ms)
    - Respect `prefers-reduced-motion` by applying 0ms duration
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. Checkpoint - Verify carousel in isolation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update LoginPage with enhanced visuals
  - [x] 5.1 Apply vignette background, torchlight title animation, font-hand subtitle, and enchanted card styling to `src/auth/pages/login/LoginPage.tsx`
    - Replace flat `bg-[#000000]` with vignette radial gradient background (`radial-gradient(ellipse at center, rgba(31,21,12,0.15) 0%, transparent 70%)`)
    - Switch subtitle "Enter the realm" to `font-hand` class
    - Apply `animate-[torchlight_3.5s_ease-in-out_infinite]` to "Revenant" title
    - Add a small `GiCrossedSwords` icon (from `react-icons/gi`) between title and subtitle as decorative separator (highlight color at 40% opacity, ~20px)
    - Add enchanted card styling: `box-shadow: inset 0 0 30px rgba(225,220,201,0.03), 0 25px 50px rgba(0,0,0,0.5)` and 1px border with `accent` at 40% opacity
    - Verify focus rings (2px, highlight color) and hover transition (150-300ms) on submit button
    - Ensure minimum 44×44px touch targets on all interactive elements
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 6. Update RegisterPage with carousel integration and enhanced visuals
  - [x] 6.1 Replace playerType `<select>` with `CharacterClassCarousel` in `src/auth/pages/register/RegisterPage.tsx`
    - Import `CharacterClassCarousel` component
    - Use `react-hook-form`'s `Controller` component to integrate carousel as a controlled field
    - Wire `value` and `onChange` from Controller's render props to carousel props
    - Pass validation error message from `errors.playerType` to carousel's `error` prop
    - Remove the old `<select>` element and its associated label
    - _Requirements: 2.4, 6.3_

  - [x] 6.2 Apply vignette background, torchlight title, font-hand subtitle, and card styling to RegisterPage
    - Apply same vignette radial gradient as LoginPage
    - Switch subtitle "Create your legend" to "Choose your destiny" using `font-hand`
    - Apply torchlight animation to "Revenant" title
    - Add `GiCrossedSwords` icon between title and subtitle (matching LoginPage)
    - Apply enchanted card styling (inner glow box-shadow, accent border)
    - Ensure focus rings (2px, highlight) and hover transitions match LoginPage
    - Verify consistent typography: `font-title` for heading, `font-sans` for labels/body
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7_

- [x] 7. Checkpoint - Verify full integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Write component and accessibility tests
  - [ ]* 8.1 Write component tests for CharacterClassCarousel
    - Create `src/auth/components/__tests__/CharacterClassCarousel.test.tsx`
    - Test: renders first class (knight/Caballero) by default
    - Test: next arrow advances to next class
    - Test: previous arrow wraps from first to last
    - Test: keyboard ArrowRight/ArrowLeft navigates correctly
    - Test: diamond indicators reflect current position
    - Test: navigation arrows have correct `aria-label`
    - Test: ARIA live region announces class changes
    - Test: image fallback renders on load error
    - Test: carousel error message displayed when `error` prop is set
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.10, 4.2, 4.3, 4.6, 4.8, 6.3_

  - [ ]* 8.2 Write component tests for LoginPage visual enhancements
    - Create or update `src/auth/pages/login/__tests__/LoginPage.test.tsx`
    - Test: title has torchlight animation class applied
    - Test: subtitle uses `font-hand` class
    - Test: submit button shows "Entering..." and disabled state during submission
    - Test: submit button restores after response
    - _Requirements: 1.2, 1.3, 8.1, 8.4_

  - [ ]* 8.3 Write component tests for RegisterPage carousel integration
    - Create or update `src/auth/pages/register/__tests__/RegisterPage.test.tsx`
    - Test: carousel renders instead of select dropdown
    - Test: form submits with carousel-selected playerType value
    - Test: validation error appears below carousel when no class selected
    - Test: submit button shows "Creating..." and disabled state during submission
    - _Requirements: 2.4, 6.1, 6.3, 8.2, 8.4_

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties of the useCarousel hook
- Unit/component tests validate specific examples, accessibility, and edge cases
- `fast-check` must be installed as a dev dependency before running property tests
- `react-icons` must be installed as a production dependency (tree-shakeable, only imported icons are bundled)
- All CSS animations respect `prefers-reduced-motion` per requirement 5.5
- The carousel integrates with `react-hook-form` via Controller — no custom form logic needed

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "2.4", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3"] },
    { "id": 3, "tasks": ["5.1", "6.1"] },
    { "id": 4, "tasks": ["6.2"] },
    { "id": 5, "tasks": ["8.1", "8.2", "8.3"] }
  ]
}
```
