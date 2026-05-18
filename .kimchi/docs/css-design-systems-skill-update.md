# css-design-systems SKILL.md Update

## Proposed Addition: UI Component Patterns Section

This document contains proposed additions to the `css-design-systems` skill at:
`/Users/vytautas.mizgiris/.config/kimchi/harness/skills/css-design-systems/SKILL.md`

---

## UI Component Patterns

### Button Variants

Standardize button variants for consistency across the application:

| Variant | Background | Border | Hover State | Shadow |
|---------|-----------|--------|-------------|--------|
| **primary** | Brand color (e.g., orange) | None | Darker brand shade | `shadow-sm` → `shadow-md` |
| **default** | White/grey (subtle) | Subtle border | Slightly darker bg | `shadow-sm` |
| **danger** | Transparent | Error color | Error-tinted bg | `shadow-sm` |
| **ghost** | Transparent | None | Subtle bg tint | None |

Implementation with Tailwind:
```css
/* Primary button */
.btn-primary {
  @apply bg-accent text-white shadow-sm hover:bg-accent-hover hover:shadow-md;
}

/* Default button */
.btn-default {
  @apply bg-surface-1 border border-border hover:bg-surface-2 shadow-sm;
}

/* Danger button */
.btn-danger {
  @apply bg-transparent border border-status-red text-status-red hover:bg-status-red/10 shadow-sm;
}

/* Ghost button */
.btn-ghost {
  @apply bg-transparent hover:bg-surface-2;
}
```

### Elevation & Shadow System

Shadows provide depth cues. Use different intensities for different elevation levels:

**Light Mode:**
```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

**Dark Mode** (stronger shadows for visibility):
```css
.dark {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.6);
}
```

### Card & Elevated Surface Patterns

Use **lighter borders + deeper shadows** for elevated surfaces:

| Element | Border | Shadow | Example |
|---------|--------|--------|---------|
| Card | `border-subtle` | `shadow-sm` | Content cards |
| Dialog/Modal | `border-subtle` | `shadow-2xl` | Overlays, modals |
| Dropdown | `border-bright` | `shadow-lg` | Popover menus |
| Tooltip | None | `shadow-md` | Floating hints |

Example dialog implementation:
```css
.dialog {
  @apply bg-surface-1 border border-border-subtle shadow-2xl;
  @apply rounded-lg; /* Consistent border radius */
}
```

**Key principle:** Elevated surfaces should feel "lifted" — subtle borders prevent harsh edges while shadows create depth.

### Surface Hierarchy Checklist

When reviewing UI consistency:
- [ ] Primary buttons use brand color with hover shadow elevation
- [ ] Danger actions use error color with transparent/ghost default state
- [ ] Cards use `shadow-sm` with subtle borders
- [ ] Modals/dialogs use `shadow-2xl` for maximum elevation
- [ ] Shadow intensities match theme (darker = stronger shadows)
- [ ] All interactive states (hover, active, disabled) are defined
