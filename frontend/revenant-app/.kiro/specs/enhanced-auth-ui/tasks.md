# Implementation Plan: Enhanced Auth UI

## Overview

This plan implements the visual redesign of the Login and Register pages for Revenant with a Dark Souls-inspired medieval fantasy RPG aesthetic. The implementation adds a canvas-based particle background, interactive button effects, shadcn/ui themed components, an enhanced character carousel, a two-column register layout, dark atmospheric styling, and removes all DaisyUI dependencies from auth pages.

The approach is incremental: first establish the shared hooks and themed components, then integrate them into the existing pages, and finally wire everything together with layout and atmosphere refinements.

## Tasks

- [x] 1. Set up foundational hooks and CSS tokens
  - [x] 1.1 Create the `useReducedMotion` hook
    - Create `src/auth/hooks/useReducedMotion.ts`
    - Implement a custom hook that listens to `window.matchMedia('(prefers-reduced-motion: reduce)')` and returns a reactive boolean
    - Handle SSR/missing matchMedia gracefully (return `false`)
    - Listen for `change` events to update dynamically
    - _Requirements: 1.7, 2.5, 4.6_

  - [x] 1.2 Add Revenant CSS custom properties to `src/index.css`
    - Add `--revenant-primary: #000000`, `--revenant-secondary: #1F150C`, `--revenant-accent: #412D15`, `--revenant-highlight: #E1DCC9` to the `:root` scope
    - These tokens will be consumed by all new themed components
    - _Requirements: 3.1, 3.2, 3.3, 6.1_

  - [x]* 1.3 Write unit tests for `useReducedMotion` hook
    - Mock `window.matchMedia` to test `true` and `false` states
    - Verify the hook updates reactively when the media query changes
    - _Requirements: 1.7, 2.5, 4.6_

- [x] 2. Install shadcn/ui base components and create themed wrappers
  - [x] 2.1 Install shadcn/ui Card, Input, and Label components
    - Run `npx shadcn@latest add card input label` to scaffold base components into `src/components/ui/`
    - Verify Button is already installed (confirmed in `src/components/ui/button.tsx`)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.2 Create the `AuthCard` themed component
    - Create `src/auth/components/AuthCard.tsx`
    - Wrap shadcn/ui `Card` with Revenant theming: Secondary (#1F150C) background, Accent (#412D15) border, inset box-shadow with Primary at 0.5 opacity (min blur 8px)
    - Accept `maxWidth` prop ('sm' | 'md' | 'lg' | 'xl') mapping to Tailwind `max-w-*` classes
    - Accept `children` and `className` props
    - _Requirements: 3.1, 6.4_

  - [x] 2.3 Create the `AuthInput` themed component
    - Create `src/auth/components/AuthInput.tsx`
    - Wrap shadcn/ui `Input` with Revenant theming: Primary (#000000) background, Accent (#412D15) border, Highlight (#E1DCC9) text, focus ring in Highlight color
    - Forward all standard Input props (including `aria-invalid`, `aria-describedby`)
    - _Requirements: 3.2, 3.5, 3.6_

  - [x] 2.4 Create the `AuthLabel` themed component
    - Create `src/auth/components/AuthLabel.tsx`
    - Wrap shadcn/ui `Label` with Revenant theming: Highlight (#E1DCC9) text, font-weight 500 (Montserrat)
    - Forward all standard Label props
    - _Requirements: 3.3_

  - [x]* 2.5 Write unit tests for AuthCard, AuthInput, AuthLabel
    - Verify each component renders the correct themed classes
    - Verify AuthInput preserves `aria-invalid` and `aria-describedby` attributes
    - Verify AuthCard applies the correct max-width class for each `maxWidth` prop value
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 3. Implement the ParticleBackground component
  - [x] 3.1 Create the `useParticleEngine` hook
    - Create `src/auth/hooks/useParticleEngine.ts`
    - Implement particle initialization: random positions, sizes (1-4px), colors from `['#412D15', '#E1DCC9']`, opacity (0.3-0.6), speed (10-30 px/sec), oscillation offset
    - Implement `requestAnimationFrame` loop with delta-time accumulation for frame-rate-independent upward movement
    - Particles that exit the top respawn at bottom with new random x-position
    - Accept `canvasRef`, `particleCount`, `colors`, `opacityRange`, `speedRange`, `oscillationMax` parameters
    - When `reducedMotion` is true, render particles once in static positions without starting the animation loop
    - Implement dynamic particle count reduction (by 20%) if frame rate drops below 30fps
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.7_

  - [x] 3.2 Create the `ParticleBackground` component
    - Create `src/auth/components/ParticleBackground.tsx`
    - Render a `<canvas>` element with `position: fixed`, `inset: 0`, `z-index: 0`, `pointer-events: none`
    - Use `useParticleEngine` hook for all canvas rendering logic
    - Use `useReducedMotion` to control animation behavior
    - Handle canvas resize on window resize events
    - Default `particleCount` to 60 (range 40-80)
    - Fall back gracefully (no particles) if canvas 2D context is unavailable
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x]* 3.3 Write unit tests for ParticleBackground
    - Mock canvas context and verify `getContext('2d')` is called
    - Verify particle count stays within 40-80 range
    - Verify that when `prefers-reduced-motion` is active, no `requestAnimationFrame` loop is started
    - Verify `pointer-events: none` is applied to the canvas
    - _Requirements: 1.1, 1.4, 1.7_

- [x] 4. Implement the InteractiveButton component
  - [x] 4.1 Create the `useRippleEffect` hook
    - Create `src/auth/hooks/useRippleEffect.ts`
    - Track ripple state: array of `{ x, y, id, startTime }` objects
    - On trigger, calculate press coordinates relative to the button element
    - Auto-remove ripple entries after the configured duration (default 400ms)
    - _Requirements: 2.3_

  - [x] 4.2 Create the `InteractiveButton` component
    - Create `src/auth/components/InteractiveButton.tsx`
    - Wrap shadcn/ui `Button` with Accent (#412D15) background and Highlight (#E1DCC9) text
    - Implement hover glow: box-shadow with Highlight color at 40% opacity, 6px spread (configurable via props)
    - Implement press scale: 0.96 transform with 100ms transition on mousedown/touchstart
    - Implement ripple: render expanding radial `<span>` elements at press coordinates on mouseup/touchend
    - Use `useReducedMotion` — when active, only apply subtle background color change (Highlight at 10% opacity) on hover, no glow/scale/ripple
    - Forward all shadcn/ui Button props
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x]* 4.3 Write unit tests for InteractiveButton
    - Verify glow box-shadow is applied on hover
    - Verify ripple span element is created on click with correct coordinates
    - Verify no ripple/scale effects render when reduced motion is active
    - _Requirements: 2.1, 2.3, 2.5_

- [x] 5. Checkpoint - Verify shared components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Enhance the CharacterClassCarousel
  - [x] 6.1 Update the `CharacterClassCarousel` for larger images and ambient glow
    - Modify `src/auth/components/CharacterClassCarousel.tsx`
    - Change image container to 256x256px on desktop (>768px) and 128x128px on mobile (≤768px) using responsive Tailwind classes
    - Add radial gradient ambient glow behind active image using Highlight at 20% opacity
    - Update class name display to use `font-title` (Montserrat Alternates) at min 20px
    - Ensure slide+fade transition stays within 250-400ms (current 300ms is fine)
    - Use `useReducedMotion` to switch classes instantly (<50ms) without animation when reduced motion is active
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x]* 6.2 Write unit tests for enhanced CharacterClassCarousel
    - Verify image container uses correct responsive sizing classes
    - Verify ambient glow element is present behind active image
    - Verify class name uses `font-title` class
    - _Requirements: 4.1, 4.3, 4.5_

- [x] 7. Refactor the LoginPage with new components
  - [x] 7.1 Refactor `LoginPage` to use themed shadcn/ui components
    - Modify `src/auth/pages/login/LoginPage.tsx`
    - Replace the outer `<div>` card wrapper with `AuthCard` (maxWidth='md')
    - Replace all `<input>` elements with `AuthInput`
    - Replace all `<label>` elements with `AuthLabel`
    - Replace the submit `<button>` with `InteractiveButton`
    - Add `ParticleBackground` component as the first child of the page wrapper
    - Preserve all existing react-hook-form integration, zod validation, and aria attributes
    - Remove all DaisyUI class references if any exist
    - Apply vignette radial gradient to the page background
    - Ensure the title "Revenant" uses `font-title` with torchlight flicker animation (opacity 0.85-1.0, period 3-5s)
    - Ensure subtitle uses `font-hand`
    - _Requirements: 1.1, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3_

  - [x]* 7.2 Write unit tests for refactored LoginPage
    - Verify `ParticleBackground` is rendered
    - Verify `AuthCard`, `AuthInput`, `AuthLabel`, `InteractiveButton` components are present
    - Verify form submission still works with react-hook-form
    - Verify no DaisyUI class names are present in the rendered output
    - Verify accessibility attributes (aria-invalid, role="alert") are preserved
    - _Requirements: 3.5, 3.6, 7.1, 7.4_

- [x] 8. Refactor the RegisterPage with new components and two-column layout
  - [x] 8.1 Refactor `RegisterPage` with themed components and two-column layout
    - Modify `src/auth/pages/register/RegisterPage.tsx`
    - Replace the outer card wrapper with `AuthCard` (maxWidth='xl')
    - Replace all `<input>` elements with `AuthInput`
    - Replace all `<label>` elements with `AuthLabel`
    - Replace the submit `<button>` with `InteractiveButton`
    - Add `ParticleBackground` component
    - Implement two-column layout: flex-row on ≥768px with gap-8 (32px), left column ~45% (form), right column ~55% (carousel), vertically centered
    - Stack to single column (flex-col) on <768px
    - Constrain max container width to 960px, center horizontally
    - Apply vignette radial gradient, torchlight title animation, hand font subtitle
    - Preserve all react-hook-form + Controller integration, zod validation, and aria attributes
    - Remove all DaisyUI class references if any exist
    - _Requirements: 1.1, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3_

  - [x]* 8.2 Write unit tests for refactored RegisterPage
    - Verify two-column layout applies `flex-row` classes on desktop
    - Verify single-column stack on mobile
    - Verify max container width is 960px
    - Verify carousel column is vertically centered
    - Verify form submission still works
    - Verify no DaisyUI class names are present
    - Verify accessibility attributes are preserved
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.4_

- [x] 9. Final DaisyUI audit and cleanup
  - [x] 9.1 Audit and remove all DaisyUI references from auth pages
    - Search Login and Register page source files for any remaining DaisyUI class prefixes (btn-, card-, input-, form-control, alert-, modal-, badge-, drawer-, hero-, navbar, dropdown, menu, swap, tab-, toast-, tooltip, collapse, stat-)
    - Replace any found DaisyUI classes with Tailwind utility equivalents
    - Verify no import statements resolve to the DaisyUI package in auth page files
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- No property-based tests are included because the design explicitly states PBT is not applicable for this UI/styling feature
- Unit tests validate specific examples and edge cases
- The existing react-hook-form + zod validation logic remains unchanged throughout — only presentation components are replaced
- shadcn/ui Button is already installed; Card, Input, and Label need to be added via CLI

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1", "4.1"] },
    { "id": 3, "tasks": ["2.5", "3.2", "4.2"] },
    { "id": 4, "tasks": ["3.3", "4.3", "6.1"] },
    { "id": 5, "tasks": ["6.2", "7.1"] },
    { "id": 6, "tasks": ["7.2", "8.1"] },
    { "id": 7, "tasks": ["8.2", "9.1"] }
  ]
}
```
