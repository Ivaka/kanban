# Kimchi Studio Web-UI Styling Migration Plan

## Goal
Apply the ai-enabler-console design system to Kimchi Studio, achieving:
1. **Unified color tokens** with primitive scales + semantic mappings
2. **Consistent light/dark mode** support with `.dark` class selector
3. **Aligned spacing, borders, and typography**
4. **Multiple theme support** (evolve current data-theme system)

---

## Current State Analysis

### Kimchi Studio (Current)
**File:** `web-ui/src/styles/globals.css`

```css
@theme {
  /* Surface hierarchy - 5 levels */
  --color-surface-0: #1F2428;  /* app bg */
  --color-surface-1: #24292E;  /* navbar / panels */
  --color-surface-2: #2D3339;  /* cards/inputs */
  --color-surface-3: #353C43;  /* hover */
  --color-surface-4: #3E464E;  /* pressed */
  
  /* Borders */
  --color-border: #30363D;
  --color-border-bright: #444C56;
  --color-border-focus: #0084FF;
  
  /* Text */
  --color-text-primary: #E6EDF3;
  --color-text-secondary: #8B949E;
  --color-text-tertiary: #6E7681;
  
  /* Accent */
  --color-accent: #0084FF;
  --color-accent-hover: #339DFF;
  
  /* Status */
  --color-status-blue: #4C9AFF;
  --color-status-green: #3FB950;
  --color-status-orange: #D29922;
  --color-status-red: #F85149;
}
```

**Characteristics:**
- Multi-theme via `[data-theme="..."]` attributes
- 8 themes: default, graphite, midnight, pitch, solarized-dark, light, overcast, solarized-light, latte, high-contrast
- Flat surface hierarchy (0-4)
- `#rrggbb` hex colors, no opacity blending
- `Geist` font already in use ✓

### Reference (ai-enabler-console)
**File:** `/Users/vytautas.mizgiris/projects/ai-enabler-console/src/index.css`

```css
/* Primitive scales - 8 color families, 9 stops each */
:root {
  --primitive-grey-50: #ededed;
  --primitive-grey-100: #e3e3e3;
  ...
  --primitive-grey-800: #181818;
  
  --primitive-orange-50: #ffece5;
  --primitive-orange-400: #f4572e;  /* brand */
  ...
}

@theme inline {
  /* Semantic mapping layer */
  --color-bg-page: var(--color-grey-50);
  --color-bg-surface: #ffffff;
  --color-bg-surface-raised: #ffffff;
  --color-bg-sidebar: #ffffff;
  
  /* Action semantic layer */
  --color-action-brand: var(--color-orange-400);
  --color-action-brand-hover: var(--color-orange-500);
  --color-action-primary: var(--color-grey-800);
 
  /* Text semantic layer */
  --color-text-primary: var(--color-grey-800);
  --color-text-secondary: var(--color-grey-600);
  --color-text-tertiary: var(--color-grey-400);
  
  /* Border semantic layer */
  --color-border-subtle: var(--color-grey-100);
  --color-border-default: var(--color-grey-200);
  --color-border-emphasis: var(--color-grey-400);
  
  /* Status uses teal/orange convention */
  --color-status-success: var(--color-teal-400);
  --color-status-error: var(--color-orange-400);
}

/* Dark mode */
.dark,
:root:has(.dark) {
  --color-bg-page: var(--color-grey-800);
  --color-bg-surface: #1c1c20;
  --color-text-primary: var(--color-grey-50);
  ...
}
```

**Characteristics:**
- Two-layer system:
  1. Primitives (`--primitive-*`): 8 families × 9 stops
  2. Semantics (`--color-*`): mapped to primitives
- Light/dark via `.dark` class selector
- `rgba()` for borders (opacity blending)
- Geist font for display, JetBrains Mono for code
- Border radius calc from base radius variable

---

## Migration Plan

### Phase 1: Token Architecture (Foundation)

#### 1.1 Add Primitive Color Scales
Add to `globals.css` above `@theme`:

```css
/* Primitive Color Scales (from reference) */
:root {
  /* Grey */
  --primitive-grey-50: #ededed;
  --primitive-grey-100: #e3e3e3;
  --primitive-grey-200: #bdbdbd;
  --primitive-grey-300: #a1a1a1;
  --primitive-grey-400: #828282;
  --primitive-grey-500: #626262;
  --primitive-grey-600: #474747;
  --primitive-grey-700: #292929;
  --primitive-grey-800: #181818;

  /* Orange (Brand) */
  --primitive-orange-50: #ffece5;
  --primitive-orange-100: #ffd2c6;
  --primitive-orange-200: #ffa289;
  --primitive-orange-300: #ff8463;
  --primitive-orange-400: #f4572e;
  --primitive-orange-500: #ac4225;
  --primitive-orange-600: #7c2d18;
  --primitive-orange-700: #4b190b;
  --primitive-orange-800: #2e0c04;

  /* Teal (Success) */
  --primitive-teal-50: #dbf5f5;
  --primitive-teal-100: #aaf0f0;
  --primitive-teal-200: #85dede;
  --primitive-teal-300: #36c3c4;
  --primitive-teal-400: #009293;
  --primitive-teal-500: #006f6f;
  --primitive-teal-600: #005151;
  --primitive-teal-700: #002f30;
  --primitive-teal-800: #001c1c;

  /* Pink, Blue, Green, Purple, Yellow - include for completeness */
  /* ... */
}
```

#### 1.2 Add Dark Mode Support
Add after primitives:

```css
/* Dark mode primitive overrides (mapped to semantic equivalents) */
@custom-variant dark (&:where(.dark, .dark *));
```

#### 1.3 Refactor @theme Block
Replace current surface-based tokens with semantic mapping:

**Current (remove):**
```css
--color-surface-0: #1F2428;
--color-surface-1: #24292E;
--color-surface-2: #2D3339;
...
--color-border: #30363D;
--color-text-primary: #E6EDF3;
```

**New (semantic system):**
```css
@theme inline {
  /* Typography */
  --font-display: "Geist", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  
  /* Border Radius */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  
  /* Background (mapped to theme's primitives) */
  --color-bg-page: var(--color-grey-50);
  --color-bg-surface: #ffffff;
  --color-bg-surface-raised: #ffffff;
  --color-bg-sidebar: #ffffff;
  --color-bg-tag: var(--color-grey-100);
  --color-bg-input: #ffffff;
  
  /* Action (brand = orange) */
  --color-action-brand: var(--color-orange-400);
  --color-action-brand-hover: var(--color-orange-500);
  --color-action-brand-text: #ffffff;
  --color-action-primary: var(--color-grey-800);
  --color-action-primary-hover: var(--color-grey-700);
  --color-action-primary-text: #ffffff;
  --color-action-secondary: #ffffff;
  --color-action-secondary-border: var(--color-grey-200);
  
  /* Text */
  --color-text-primary: var(--color-grey-800);
  --color-text-secondary: var(--color-grey-600);
  --color-text-tertiary: var(--color-grey-400);
  --color-text-disabled: var(--color-grey-300);
  --color-text-inverse: #ffffff;
  --color-text-accent: var(--color-orange-400);
  --color-text-link: var(--color-orange-500);
  
  /* Border */
  --color-border-subtle: var(--color-grey-100);
  --color-border-default: var(--color-grey-200);
  --color-border-emphasis: var(--color-grey-400);
  --color-border-accent: var(--color-orange-400);
  
  /* Status (teal for success, orange for errors) */
  --color-status-success: var(--color-teal-400);
  --color-status-success-bg: var(--color-teal-50);
  --color-status-error: var(--color-orange-400);
  --color-status-error-bg: var(--color-orange-50);
  --color-status-warning: var(--color-yellow-400);
  --color-status-warning-bg: var(--color-yellow-50);
  --color-status-info: var(--color-blue-400);
  --color-status-info-bg: var(--color-blue-50);
  
  /* Chart palette (categorical) */
  --color-chart-series-01: #ff6433;
  --color-chart-series-02: #c7ea0c;
  --color-chart-series-03: #18cfff;
  --color-chart-series-04: #7b59fb;
  --color-chart-series-05: #d382f3;
  --color-chart-series-06: #00ffb3;
  --color-chart-series-07: #20c997;
  --color-chart-series-08: #ec3f7d;
  --color-chart-series-09: #f5d83d;
  --color-chart-series-10: #00b1c9;
  --color-chart-series-11: #bac3c8;
  --color-chart-series-12: #79b026;
  --color-chart-series-13: #d9ef92;
  --color-chart-series-14: #009293;
  --color-chart-series-15: #c9b3ff;
}
```

#### 1.4 Add Dark Mode Overrides
Add after `@theme inline`:

```css
.dark,
:root:has(.dark) {
  /* Backgrounds */
  --color-bg-page: var(--color-grey-800);
  --color-bg-surface: #1c1c20;
  --color-bg-surface-raised: #242428;
  --color-bg-sidebar: #141416;
  --color-bg-tag: var(--color-grey-700);
  --color-bg-input: #1c1c20;
  
  /* Action */
  --color-action-brand: var(--color-orange-400);
  --color-action-brand-hover: var(--color-orange-300);
  --color-action-primary: var(--color-grey-50);
  --color-action-primary-hover: var(--color-grey-100);
  --color-action-primary-text: var(--color-grey-800);
  --color-action-secondary: #242428;
  --color-action-secondary-border: var(--color-grey-600);
  
  /* Text */
  --color-text-primary: var(--color-grey-50);
  --color-text-secondary: var(--color-grey-300);
  --color-text-tertiary: var(--color-grey-500);
  --color-text-disabled: var(--color-grey-600);
  --color-text-inverse: var(--color-grey-800);
  --color-text-accent: var(--color-orange-300);
  --color-text-link: var(--color-orange-200);
  
  /* Border */
  --color-border-subtle: var(--color-grey-700);
  --color-border-default: var(--color-grey-600);
  --color-border-emphasis: var(--color-grey-500);
  --color-border-accent: var(--color-orange-400);
  
  /* Status backgrounds for dark */
  --color-status-success-bg: var(--color-teal-800);
  --color-status-error-bg: var(--color-orange-800);
  --color-status-warning-bg: var(--color-yellow-800);
  --color-status-info-bg: var(--color-blue-800);
}
```

#### 1.5 Add Base Radius Variable
```css
:root {
  --radius: 0.875rem; /* 14px */
}
```

---

### Phase 2: Theme Migration Strategy

The current system uses `[data-theme]` attributes with 8+ themes. Options:

**Option A: Keep data-themes, map to primitives**
- Each `[data-theme]` maps its colors to primitive scales
- Good for theme variety
- More maintenance

**Option B: Primitives + Two Modes (Light/Dark)**
- Simplifies to just `.light`/`.dark`
- Maintains semantic token richness
- Easier maintenance

**Recommendation: Option B Transition**
1. Start with light/dark foundation
2. Map existing themes to closest primitive-equivalent
3. Provide theme presets that adjust primitive mappings

---

### Phase 3: Component Refactoring

#### 3.1 Button Component Changes
**File:** `web-ui/src/components/ui/button.tsx`

**Current:**
```tsx
const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-surface-2 border border-border-bright text-text-primary...",
  primary: "bg-accent text-accent-fg...",
};
```

**New:**
```tsx
const variantStyles: Record<ButtonVariant, string> = {
  default: "bg-bg-surface border border-border-default text-text-primary...",
  primary: "bg-action-brand text-action-brand-text...",
  secondary: "bg-action-secondary border border-action-secondary-border...",
  ghost: "bg-transparent text-text-secondary...",
};
```

#### 3.2 Dialog/Modal Styling
Update backgrounds to use `bg-bg-surface` instead of direct surface tokens.

#### 3.3 Card Components
Use `bg-bg-surface` for cards, `bg-bg-surface-raised` for elevated cards.

#### 3.4 Sidebar Navigation
Use `bg-bg-sidebar` for sidebar background.

#### 3.5 Input Fields
Use `bg-bg-input` with `border-border-default`.

---

### Phase 4: Tailwind Class Migration

Create mapping for common class replacements:

| Current Class | New Semantic Class |
|--------------|-------------------|
| `bg-surface-0` | `bg-bg-page` |
| `bg-surface-1` | `bg-bg-surface` |
| `bg-surface-2` | `bg-surface-raised` / `bg-bg-tag` |
| `text-text-primary` | `text-text-primary` (same naming) |
| `text-text-secondary` | `text-text-secondary` (same naming) |
| `border-border` | `border-border-default` |
| `border-border-bright` | `border-border-emphasis` |
| `bg-accent` | `bg-action-brand` |
| `text-accent-fg` | `text-action-brand-text` |
| `bg-status-red` | `bg-status-error` |
| `bg-status-green` | `bg-status-success` |

---

### Phase 5: Dark Mode Implementation

#### 5.1 Global Theme Provider
Add React Context or use data attribute:

```tsx
// Option: class-based
<html class="dark">

// Option: data-attribute based  
<html data-theme="dark">
```

#### 5.2 Theme Toggle
Create theme toggle component that toggles `.dark` class on `<html>`.

#### 5.3 System Preference Detection
```tsx
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

---

### Phase 6: Typography Updates

#### 6.1 Font Loading
Ensure Geist and JetBrains Mono are loaded:

```css
@font-face {
  font-family: 'Geist';
  src: url('/fonts/GeistVariableVF.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/JetBrainsMonoVariable.woff2') format('woff2');
  font-weight: 100 800;
  font-display: swap;
}
```

#### 6.2 Apply Fonts
Already in theme tokens, ensure CSS applies them:

```css
body {
  font-family: var(--font-display);
}

code, kbd, pre {
  font-family: var(--font-mono);
}
```

---

### Phase 7: Animation Additions (from reference)

Add useful animations to globals.css:

```css
@keyframes typing {
  0%, 50% { opacity: 0.2; transform: translateY(0); }
  25% { opacity: 1; transform: translateY(-2px); }
}

@keyframes loading-dots {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

@keyframes shimmer {
  0% { background-position: 100% center; }
  100% { background-position: -100% center; }
}

@keyframes progress-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes pulse-gentle {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.05); }
}
```

---

### Phase 8: Testing & Verification

1. **Visual Regression Testing**
   - Compare key screens before/after
   - Verify all components render correctly
   - Check dark mode toggle

2. **Theme Testing**
   - Verify all 8 themes work (if preserving)
   - Check primitive mappings for each theme

3. **Accessibility Testing**
   - Verify color contrast ratios
   - Test keyboard navigation
   - Screen reader compatibility

---

## Files to Modify

| File | Changes |
|------|---------|
| `web-ui/src/styles/globals.css` | Major refactor - add primitives, semantic tokens, dark mode, animations |
| `web-ui/src/components/ui/button.tsx` | Update variant styles to use semantic tokens |
| `web-ui/src/components/ui/dialog.tsx` | Update background/border tokens |
| `web-ui/src/components/`... | All components using surface-X or direct colors |
| `web-ui/index.html` | Add dark mode class support |
| `web-ui/src/main.tsx` | Add theme provider/context |

---

## Migration Priority

1. **P0: Foundation**
   - Add primitive scales
   - Add semantic tokens
   - Add dark mode CSS

2. **P1: Core UI**
   - Button component
   - Dialog component
   - Input component

3. **P2: Page Components**
   - Board components
   - Sidebar navigation
   - Cards

4. **P3: Polish**
   - Animations
   - Typography refinements
   - Chart colors

---

## Risks & Considerations

1. **Breaking Changes**: Current `[data-theme]` system will need careful migration
2. **Testing Overhead**: 8 existing themes need verification
3. **Component Library**: Custom CSS classes (`kb-*`) need auditing
4. **Third-party Libs**: Some Radix UI components may need shim styles

---

## Success Criteria

- [ ] All colors use semantic token naming
- [ ] Dark mode toggles instantly without page reload
- [ ] Visual parity with reference design achieved
- [ ] All existing functionality preserved
- [ ] Accessibility contrast ratios pass (WCAG 2.1 AA)
