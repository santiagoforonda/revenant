# Requirements Document

## Introduction

This feature improves the user interface and user experience of the Login and Register pages in the Revenant application. The primary goals are to enhance the medieval fantasy atmosphere, replace the plain character class dropdown with an interactive carousel component that displays character images, and improve overall visual polish, layout, and feedback across both authentication pages.

## Glossary

- **Login_Page**: The React page component at route `/` responsible for user authentication via username and password.
- **Register_Page**: The React page component at route `/register` responsible for new user account creation including character class selection.
- **Character_Class_Carousel**: A horizontal carousel component that displays character class options as visual cards with character images, allowing navigation between options.
- **Character_Class**: One of the selectable player types available during registration (Caballero, Mago, Arquero, Gladiador, Espadachin).
- **Design_System**: The official visual design system defined in `docs/design-system.md` specifying colors, typography, and component guidelines for the Revenant project.
- **Carousel_Card**: An individual slide within the Character_Class_Carousel representing a single character class with its image and name.

## Requirements

### Requirement 1: Login Page Visual Enhancement

**User Story:** As a returning player, I want the login page to feel immersive and thematic, so that I feel engaged before entering the game world.

#### Acceptance Criteria

1. THE Login_Page SHALL use the Design_System color tokens (primary, secondary, accent, highlight) for all visual elements.
2. THE Login_Page SHALL display a background element using a texture or pattern that is visible behind the form content to reinforce the medieval fantasy atmosphere.
3. THE Login_Page SHALL display the application title "Revenant" using the Montserrat font at weight 700.
4. WHEN a form input receives focus, THE Login_Page SHALL display a focus ring of at least 2px width using the highlight color (#E1DCC9).
5. WHEN the user hovers over the submit button, THE Login_Page SHALL transition the button background to the highlight color with a CSS transition duration between 150ms and 300ms.
6. THE Login_Page SHALL maintain a minimum touch target size of 44x44 pixels for all interactive elements.
7. THE Login_Page SHALL render all primary readable text using the highlight color (#E1DCC9) to ensure sufficient contrast against the primary (#000000) and secondary (#1F150C) backgrounds.

### Requirement 2: Register Page Visual Enhancement

**User Story:** As a new player, I want the registration page to feel welcoming and visually consistent with the login page, so that the onboarding experience feels cohesive.

#### Acceptance Criteria

1. THE Register_Page SHALL center its content vertically and horizontally on the viewport using a full-height layout with the Primary color (#000000) as the page background.
2. THE Register_Page SHALL wrap all form content within a card container using the Secondary color (#1F150C) as background, with rounded corners (border-radius of 16px), horizontal padding of 32px, vertical padding of 32px, a maximum width of 448px, and a drop shadow consistent with the Login_Page card.
3. THE Register_Page SHALL display form fields for username, email, password, and confirm password, each styled with the Primary color (#000000) as input background, a 1px border using the Accent color (#412D15), rounded corners (border-radius of 8px), horizontal padding of 16px, vertical padding of 8px, text in the Highlight color (#E1DCC9), and placeholder text in Highlight color at 40% opacity.
4. THE Register_Page SHALL present the character class selection using the Character_Class_Carousel instead of a dropdown select element.
5. THE Register_Page SHALL use the Montserrat font family for all text, with font-weight 700 for headings and font-weight 400 for labels and body text, matching the Login_Page typography tokens.
6. THE Register_Page SHALL display a submit button spanning the full width of the form container, styled with the Accent color (#412D15) as background, Highlight color (#E1DCC9) as text, rounded corners (border-radius of 8px), and font-weight 600.
7. WHEN a form input receives focus, THE Register_Page SHALL display a visible focus ring of 2px width using the Highlight color (#E1DCC9) and remove the default browser outline.

### Requirement 3: Character Class Carousel Component

**User Story:** As a new player, I want to browse character classes visually with images, so that I can make an informed and engaging choice about my character.

#### Acceptance Criteria

1. THE Character_Class_Carousel SHALL display one Carousel_Card at a time in the center of the carousel viewport.
2. THE Character_Class_Carousel SHALL display a character image for each Character_Class using the assets from `src/assets/characters/` (knight.png, mago.png, arquero.png, gladiador.png, espadachin.png).
3. THE Character_Class_Carousel SHALL display the character class name below each character image.
4. WHEN the user clicks a next navigation arrow, THE Character_Class_Carousel SHALL animate a sliding transition to display the next Carousel_Card within 300 milliseconds.
5. WHEN the user clicks a previous navigation arrow, THE Character_Class_Carousel SHALL animate a sliding transition to display the previous Carousel_Card within 300 milliseconds.
6. THE Character_Class_Carousel SHALL wrap navigation so that advancing past the last card returns to the first card and navigating before the first card returns to the last card.
7. WHEN a Carousel_Card is displayed in the center position, THE Character_Class_Carousel SHALL mark that class as the selected value for form submission.
8. THE Character_Class_Carousel SHALL display dot indicators representing the total number of available classes and highlighting the currently selected class.
9. WHEN the Character_Class_Carousel is first rendered, THE Character_Class_Carousel SHALL display the first Character_Class card (knight) as the initially selected card.
10. IF a character image asset fails to load, THEN THE Character_Class_Carousel SHALL display a placeholder element in place of the broken image and keep the card navigable.

### Requirement 4: Carousel Keyboard and Accessibility Support

**User Story:** As a player using keyboard navigation, I want to browse character classes without a mouse, so that the carousel remains fully accessible.

#### Acceptance Criteria

1. THE Character_Class_Carousel container SHALL be focusable via keyboard Tab navigation.
2. WHEN the Character_Class_Carousel has focus and the user presses the right arrow key, THE Character_Class_Carousel SHALL navigate to the next Carousel_Card, wrapping from the last card to the first.
3. WHEN the Character_Class_Carousel has focus and the user presses the left arrow key, THE Character_Class_Carousel SHALL navigate to the previous Carousel_Card, wrapping from the first card to the last.
4. WHEN the Character_Class_Carousel receives keyboard focus, THE Character_Class_Carousel SHALL display a visible focus indicator using the highlight color.
5. THE Character_Class_Carousel SHALL use ARIA role "group" with an aria-label that includes the text "character class selection".
6. THE Character_Class_Carousel navigation arrows SHALL include aria-label attributes that identify the navigation direction (e.g., indicating previous or next).
7. THE Character_Class_Carousel dot indicators SHALL convey the current position and total count to screen readers using aria-current or equivalent ARIA attributes (e.g., "3 of 5").
8. WHEN the displayed Carousel_Card changes via keyboard navigation, THE Character_Class_Carousel SHALL announce the newly displayed character class name to screen readers using an ARIA live region or equivalent mechanism.

### Requirement 5: Carousel Animation and Transitions

**User Story:** As a player, I want smooth transitions between character classes, so that the selection experience feels polished and game-like.

#### Acceptance Criteria

1. WHEN the user navigates to the next Carousel_Card, THE Character_Class_Carousel SHALL slide the current card out to the left and the incoming card in from the right, with a duration between 200ms and 400ms using an ease-in-out timing function.
2. WHEN the user navigates to the previous Carousel_Card, THE Character_Class_Carousel SHALL slide the current card out to the right and the incoming card in from the left, with a duration between 200ms and 400ms using an ease-in-out timing function.
3. THE Character_Class_Carousel SHALL use CSS transitions or CSS animations for all movement effects.
4. WHILE an animation is in progress, THE Character_Class_Carousel SHALL prevent additional navigation inputs until the current animation completes.
5. IF the user's system has the prefers-reduced-motion media query set to reduce, THEN THE Character_Class_Carousel SHALL apply transitions with 0ms duration so that card changes appear instantaneous.

### Requirement 6: Form Validation Feedback

**User Story:** As a player filling out the registration form, I want clear and immediate feedback on validation errors, so that I can correct mistakes without frustration.

#### Acceptance Criteria

1. WHEN the user submits the form and a field fails validation, THE Register_Page SHALL display an error message directly below the invalid field.
2. WHEN a form field fails validation, THE Register_Page SHALL apply a visual error indicator by changing the field border color to a red-toned error color.
3. IF no Character_Class is selected when the form is submitted, THEN THE Register_Page SHALL display an error message below the Character_Class_Carousel indicating that a class selection is required.
4. WHEN the user modifies a previously invalid field and the field passes validation, THE Register_Page SHALL remove the error message and error styling for that field within the same input event cycle.

### Requirement 7: Responsive Layout

**User Story:** As a player using different screen sizes, I want the login and register pages to adapt gracefully, so that the experience remains usable on various desktop resolutions.

#### Acceptance Criteria

1. THE Login_Page SHALL center its content vertically and horizontally on the viewport.
2. THE Register_Page SHALL center its content vertically and horizontally on the viewport.
3. WHILE the viewport width is below 640px, THE Register_Page SHALL scale the Character_Class_Carousel card dimensions relative to the available viewport width, maintaining a minimum card width of 80px, and SHALL NOT produce a horizontal scrollbar.
4. THE Login_Page and Register_Page SHALL render all text at a minimum computed font size of 14px at all supported viewport widths from 320px to 2560px.
5. WHILE the viewport width is between 320px and 2560px, THE Login_Page and Register_Page SHALL display all content without horizontal overflow.

### Requirement 8: Loading and Submission States

**User Story:** As a player submitting a form, I want clear feedback that my action is being processed, so that I do not accidentally submit the form multiple times.

#### Acceptance Criteria

1. WHILE the login form is being submitted, THE Login_Page SHALL replace the submit button text with a processing label (e.g., "Entering..."), apply a reduced opacity style to the button, and set the button to the disabled state.
2. WHILE the registration form is being submitted, THE Register_Page SHALL replace the submit button text with a processing label (e.g., "Creating..."), apply a reduced opacity style to the button, and set the button to the disabled state.
3. WHILE a form is being submitted, THE Login_Page and Register_Page SHALL ignore any additional submit button clicks by keeping the button in the disabled state until the submission resolves.
4. WHEN a form submission completes with either success or failure, THE Login_Page and Register_Page SHALL restore the submit button to its enabled state and display the original button text within 1 second of receiving the server response.
