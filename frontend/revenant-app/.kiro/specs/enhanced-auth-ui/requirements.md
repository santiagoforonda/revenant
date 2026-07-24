# Requirements Document

## Introduction

This feature redesigns the Login and Register pages for Revenant to deliver a visually striking, immersive medieval fantasy RPG experience. The redesign replaces the current minimal styling with an animated Dark Souls-inspired aesthetic featuring particle effects, interactive button animations, and shadcn/ui (Nova preset) components themed to the Revenant design system. Existing functionality (form validation, authentication flow, character class selection) remains unchanged — this is purely a visual/UX enhancement.

## Glossary

- **Auth_Pages**: The Login page and Register page of the Revenant application, accessible at routes `/` and `/register`
- **Particle_Background**: A full-screen animated layer rendered behind form content displaying floating ash and ember particles on a black background
- **Interactive_Button**: A shadcn/ui Button component enhanced with hover glow, press scale, and ripple effects
- **Character_Carousel**: The existing character class selection carousel used during registration, displaying the five playable classes
- **Design_System**: The official Revenant design system defining colors (#000000, #1F150C, #412D15, #E1DCC9), fonts (Montserrat, Montserrat Alternates, Edu VIC WA NT Hand), and visual style
- **Shadcn_Components**: The shadcn/ui component library (Nova preset) providing Card, Input, Button, and Label base components
- **Reduced_Motion**: The user's operating system preference indicated by the `prefers-reduced-motion: reduce` media query

## Requirements

### Requirement 1: Animated Particle Background

**User Story:** As a player, I want to see floating ash and ember particles on the authentication pages, so that the login experience feels immersive and evokes the Dark Souls medieval fantasy atmosphere.

#### Acceptance Criteria

1. WHEN the Login page or Register page loads, THE Particle_Background SHALL render between 40 and 80 visible ash and ember particles in an animated layer behind all form content
2. THE Particle_Background SHALL use a black (#000000) base with particles colored using the Design_System palette colors #412D15 and #E1DCC9 at an opacity between 30% and 60%
3. THE Particle_Background SHALL animate particles moving upward at a speed between 10 and 30 pixels per second with a horizontal oscillation of no more than 5 pixels to simulate rising ash
4. THE Particle_Background SHALL cover the full viewport, remain fixed during scroll, and not intercept pointer events so that all underlying form elements remain interactive
5. THE Particle_Background SHALL render using either an HTML Canvas element or CSS-based animation
6. THE Particle_Background SHALL maintain a frame rate of at least 30 frames per second on a device with a 4-core CPU and integrated graphics released within the last 5 years
7. WHILE Reduced_Motion is active, THE Particle_Background SHALL display particles in their initial positions without any animation or movement

### Requirement 2: Interactive Button Effects

**User Story:** As a player, I want buttons to respond with engaging visual effects when I interact with them, so that every action feels impactful and connected to the medieval theme.

#### Acceptance Criteria

1. WHEN a user hovers over an Interactive_Button, THE Interactive_Button SHALL display a glow effect using the Highlight color (#E1DCC9) at 30% to 50% opacity with a spread of 4 to 8 pixels around its border
2. WHEN a user presses an Interactive_Button, THE Interactive_Button SHALL scale to 0.96 of its original size with a transition duration between 80 and 150 milliseconds
3. WHEN a user releases an Interactive_Button after pressing, THE Interactive_Button SHALL emit a radial ripple effect in the Highlight color (#E1DCC9) at 40% opacity, originating from the press point, expanding outward, and completing within 300 to 500 milliseconds
4. THE Interactive_Button SHALL use the shadcn/ui Button component as its base, styled with Accent (#412D15) background and Highlight (#E1DCC9) text
5. WHILE Reduced_Motion is active, THE Interactive_Button SHALL change its background to the Highlight color (#E1DCC9) at 10% opacity on hover without rendering glow, scale, or ripple animations

### Requirement 3: Shadcn/UI Component Integration

**User Story:** As a developer, I want the authentication forms to use shadcn/ui components as the foundation, so that the UI is consistent, accessible, and maintainable while themed to the Revenant aesthetic.

#### Acceptance Criteria

1. THE Auth_Pages SHALL use the shadcn/ui Card component as the main form container, themed with Secondary (#1F150C) background and Accent (#412D15) border
2. THE Auth_Pages SHALL use the shadcn/ui Input component for all text fields, themed with Primary (#000000) background and Accent (#412D15) border
3. THE Auth_Pages SHALL use the shadcn/ui Label component for all form field labels, styled with Highlight (#E1DCC9) text color
4. THE Auth_Pages SHALL use the shadcn/ui Button component for all submit actions, replacing existing custom button elements
5. THE Shadcn_Components SHALL preserve all existing accessibility attributes including aria-invalid, aria-describedby, and role="alert" for error messages
6. THE Shadcn_Components SHALL integrate with the existing react-hook-form and zod validation without changes to form logic

### Requirement 4: Enhanced Character Class Carousel

**User Story:** As a player, I want the character class selection to feel larger and more dramatic during registration, so that choosing my class is an exciting moment.

#### Acceptance Criteria

1. THE Character_Carousel SHALL display character images at a minimum size of 256x256 pixels on desktop viewports wider than 768 pixels
2. THE Character_Carousel SHALL display character images at a minimum size of 128x128 pixels on viewports of 768 pixels or narrower
3. THE Character_Carousel SHALL include an ambient glow behind the active character image using the Highlight color at an opacity between 15% and 30%
4. WHEN a user activates a next or previous navigation control, THE Character_Carousel SHALL animate the transition to the adjacent character class with a slide and fade effect lasting between 250 and 400 milliseconds
5. THE Character_Carousel SHALL display the character class name in the title font (Montserrat Alternates) at a size of at least 20 pixels
6. WHILE Reduced_Motion is active, THE Character_Carousel SHALL switch character classes within 50 milliseconds without slide or fade animation

### Requirement 5: Two-Column Register Layout

**User Story:** As a player, I want to see the registration form and character carousel side by side on desktop, so that I can fill in my details while viewing my chosen character prominently.

#### Acceptance Criteria

1. WHILE the viewport width is 768 pixels or greater, THE Register_Page SHALL display form inputs in a left column and the Character_Class_Carousel in a right column arranged horizontally with a gap of 32 pixels between columns
2. WHILE the viewport width is less than 768 pixels, THE Register_Page SHALL stack the form inputs above the Character_Class_Carousel in a single column
3. WHILE the viewport width is 768 pixels or greater, THE left column SHALL occupy between 43 percent and 47 percent of the two-column container width and the right column SHALL occupy between 53 percent and 57 percent of the two-column container width
4. WHILE the viewport width is 768 pixels or greater, THE Character_Class_Carousel column SHALL vertically center its content relative to the adjacent form column height
5. WHILE the viewport width is 768 pixels or greater, THE two-column container SHALL constrain its maximum width to 960 pixels and center horizontally within the viewport

### Requirement 6: Dark Medieval Atmosphere

**User Story:** As a player, I want the overall visual atmosphere of the authentication pages to feel like a Dark Souls-inspired medieval RPG login screen, so that I am immersed in the game world from the first interaction.

#### Acceptance Criteria

1. THE Auth_Pages SHALL apply a radial gradient vignette centered on the viewport, using the Secondary color (#1F150C) at an opacity between 0.15 and 0.25, fading to transparent, over the Primary (#000000) background, with the gradient covering at least 50% of the viewport width
2. THE Auth_Pages SHALL display the game title "Revenant" using the title font (Montserrat Alternates) with a torchlight flicker animation that cycles the text opacity between 0.85 and 1.0 over a period of 3 to 5 seconds, looping continuously
3. THE Auth_Pages SHALL use the hand font (Edu VIC WA NT Hand) for subtitle text beneath the title
4. THE Auth_Pages SHALL apply an inset box-shadow to the Card component with a minimum blur radius of 8px using the Primary color at an opacity between 0.4 and 0.6
5. THE Auth_Pages SHALL apply the Highlight color (#E1DCC9) exclusively to interactive elements (buttons, links, and focusable inputs) and SHALL NOT apply it to non-interactive text, backgrounds, or decorative elements
6. THE Auth_Pages SHALL maintain a minimum contrast ratio of 4.5:1 between text and background colors for all readable content

### Requirement 7: DaisyUI Phase-Out

**User Story:** As a developer, I want the enhanced authentication pages to rely exclusively on shadcn/ui and Tailwind CSS utilities, so that DaisyUI dependency is not extended and can eventually be removed.

#### Acceptance Criteria

1. THE Auth_Pages SHALL contain zero CSS class names from the DaisyUI library (including but not limited to prefixes such as btn-, card-, input-, form-control, alert-, modal-, badge-, drawer-, hero-, navbar, dropdown, menu, swap, tab-, toast-, tooltip, collapse, and stat-) in the Login page and Register page source files
2. THE Auth_Pages SHALL rely exclusively on shadcn/ui components, Tailwind CSS utility classes, and custom CSS defined within the project for all styling, with no runtime dependency on DaisyUI's generated styles
3. IF DaisyUI classes exist in the current Auth_Pages implementation, THEN THE refactored pages SHALL replace each DaisyUI class with a functionally equivalent Tailwind CSS utility or shadcn/ui component that produces the same visual and interactive behavior
4. WHEN a code review is performed on the Login page or Register page, THE Auth_Pages SHALL pass a static analysis check confirming that no import statements, class names, or component references resolve to the DaisyUI package
