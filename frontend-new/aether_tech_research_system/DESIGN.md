---
name: Aether-Tech Research System
colors:
  surface: '#071421'
  surface-dim: '#071421'
  surface-bright: '#2e3a49'
  surface-container-lowest: '#030f1c'
  surface-container-low: '#101c2a'
  surface-container: '#14202e'
  surface-container-high: '#1f2b39'
  surface-container-highest: '#2a3644'
  on-surface: '#d7e3f7'
  on-surface-variant: '#bbc9cf'
  inverse-surface: '#d7e3f7'
  inverse-on-surface: '#253140'
  outline: '#859398'
  outline-variant: '#3c494e'
  surface-tint: '#3cd7ff'
  primary: '#a8e8ff'
  on-primary: '#003642'
  primary-container: '#00d4ff'
  on-primary-container: '#00586b'
  inverse-primary: '#00677e'
  secondary: '#d1bcff'
  on-secondary: '#3d0090'
  secondary-container: '#6800ec'
  on-secondary-container: '#d4c0ff'
  tertiary: '#00ff94'
  on-tertiary: '#00391d'
  tertiary-container: '#00df81'
  on-tertiary-container: '#005d32'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b4ebff'
  primary-fixed-dim: '#3cd7ff'
  on-primary-fixed: '#001f27'
  on-primary-fixed-variant: '#004e5f'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d1bcff'
  on-secondary-fixed: '#24005b'
  on-secondary-fixed-variant: '#5700c8'
  tertiary-fixed: '#5bffa1'
  tertiary-fixed-dim: '#00e383'
  on-tertiary-fixed: '#00210e'
  on-tertiary-fixed-variant: '#00522c'
  background: '#071421'
  on-background: '#d7e3f7'
  surface-variant: '#2a3644'
typography:
  display-xl:
    fontFamily: Space Grotesk
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.02em
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The visual identity of this design system is anchored in the concept of "Deep Space Intelligence." It evokes the feeling of a high-end research vessel or an advanced orbital station's interface—intelligent, powerful, and cutting-edge. The design style is a sophisticated blend of **Futuristic Minimalism** and **Glassmorphism**, moving away from "gamer" aesthetics toward a more professional, scientific data-visualization tool.

The atmosphere is intentionally quiet but high-energy. It utilizes high-contrast accents against a deep, multi-layered dark background to create a sense of immense digital depth. Visual interest is driven by precision, mathematical alignment, and subtle "energy glows" rather than heavy textures or skeumorphism. 

The signature element is a slow-rotating 3D glowing orb or constellation particle animation, which should be used sparingly as a focal point (e.g., on a search landing page or as a loading state) to represent the "living" data engine.

## Colors

The palette is strictly dark-mode, designed to reduce eye strain during long research sessions while highlighting critical data points with luminous accents.

- **Foundational Neutrals:** The background layers use a trio of deep space blues (`#010B18` to `#0A1628`) to create a hierarchy of depth. Surface colors should never feel "flat black"; they must retain the slight blue-tinted depth of the void.
- **Luminous Accents:** Neon Cyan (`#00D4FF`) is the primary action color, used for high-priority interactive elements. Purple (`#7B2FFF`) is the secondary color, used for data categorization, progress indicators, or branding flourishes.
- **Functional Colors:** Success states utilize a vibrant Green (`#00FF94`), and Warning/Error states use a sharp Red (`#FF3B5C`). These should be used with high-saturation against the dark background for maximum visibility.
- **Typography:** Contrast is maintained through pure White for headings and high-readability Slate-Blue tones (`#8A9BB5`) for body text.

## Typography

The typography system balances futuristic flair with extreme legibility.

- **Headlines (Space Grotesk):** Used for large displays, section headers, and scores. It provides a geometric, technical feel that replaces the "Orbitron" requirement with a more modern, professional equivalent that retains sci-fi characteristics.
- **Body (Inter):** The primary workhorse for research reports, long-form content, and descriptions. It is highly neutral and functional.
- **Data (JetBrains Mono):** This monospaced font is used for all technical data, percentages, coordinates, and labels. It reinforces the "research engine" aspect, suggesting precision and raw data processing.
- **Scaling:** Display styles should reduce by approximately 25-30% on mobile devices to maintain layout integrity.

## Layout & Spacing

The design system utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. The layout philosophy is "Precision Alignment," emphasizing mathematical consistency and breathable margins.

- **Rhythm:** An 8px base grid is used for all spacing. Gutters are fixed at 24px on desktop to provide a distinct separation between data modules.
- **Containers:** Content is housed in modular cards or panels. For research-heavy views, use a "Dashboard" approach with sidebar navigation to maximize the horizontal scanning area for data.
- **Safe Areas:** On mobile, side margins must be at least 16px. On ultra-wide displays, content should be capped at a max-width of 1440px to ensure line-length readability for research text.

## Elevation & Depth

Hierarchy is established through **Tonal Layering** and **Luminous Depth** rather than traditional drop shadows.

- **Z-Axis Hierarchy:**
  - **Level 0 (Background):** Deepest blue (`#010B18`).
  - **Level 1 (Panels):** Card surfaces (`#0A1628`) with a subtle 1px border (`#0E2040`).
  - **Level 2 (Modals/Overlays):** Semi-transparent surfaces using backdrop-blur (12px to 20px) and a light cyan tint.
- **Glow Effects:** High-priority elements (like active primary buttons or the signature orb) should feature a soft, 20px - 40px outer bloom using the primary cyan (`#00D4FF`) at low opacity (15-20%). This mimics the appearance of a light-emitting interface in a dark environment.

## Shapes

The shape language is "Precision Engineered." 

- **Corner Radii:** A base radius of **8px (Soft)** is applied to cards and large containers. This provides a modern, refined feel that is less aggressive than 0px sharp edges but more professional than fully rounded "pill" styles.
- **Buttons & Chips:** Use the same 8px radius. Avoid fully rounded pill shapes for buttons to maintain the technical, geometric aesthetic.
- **Borders:** All containers must have a subtle 1px border in `#0E2040`. Active states or "hot" zones may transition this border to the primary Cyan.

## Components

- **Buttons:** 
  - *Primary:* Solid Cyan (`#00D4FF`) with black text. On hover, add a subtle Cyan outer glow. 
  - *Secondary:* Ghost style with `#0E2040` border and White text. Border turns Purple (`#7B2FFF`) on hover.
- **Research Cards:** Use `#0A1628` background with a 1px border. The top-right corner can feature a small "Data-Tag" in JetBrains Mono.
- **Input Fields:** Dark background (`#050F20`), 1px border. Upon focus, the border glows Cyan and the label shifts slightly with a technical "scanning" animation.
- **Chips/Tags:** Monospace font, uppercase, with a background color at 10% opacity of the tag's intent color (e.g., Green for "Verified," Purple for "Experimental").
- **Lists:** Clean, border-bottom separation only (`#0E2040`). Use chevron-right icons for interactive list items, colored in Cyan.
- **Data Visualizations:** Use primary Cyan and Purple for charts. Grid lines should be very faint (`#3D5068`) and use dashed patterns to reinforce the technical blueprint look.