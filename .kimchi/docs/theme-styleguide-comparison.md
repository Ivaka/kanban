# Theme Styleguide Comparison

## Reference: ai-enabler-console/src/index.css + ColorTokens.stories.tsx

### 1. Primitive Color Scales

| Family | Status | Notes |
|--------|--------|-------|
| Grey | ✅ MATCHES | Both use identical 50-800 scale from #ededed to #181818 |
| Orange | ✅ MATCHES | Both use #f4572e as brand color |
| Teal | ✅ MATCHES | Both use same success colors |
| Blue | ✅ MATCHES | Both aligned |
| Purple | ⚠️ DIFFERENT | My implementation matches reference |
| Pink | ❌ DIFFERENT | My values differ from reference (need to sync) |
| Green (Yellow) | ❌ INCOMPLETE | Mine stops at 500, reference has 600-800 |
| Yellow | ⚠️ MISSING | Present in reference as separate scale |

### 2. Semantic Token Architecture

| Aspect | Reference | My Implementation | Status |
|--------|-----------|-------------------|--------|
| **Definition location** | `@theme inline` with direct hex values | Private `--_*` vars on :root + overrides | ⚠️ Different approach |
| **Border values** | Hex from primitive scale (e.g., #e3e3e3) | rgba() opacity blending | ❌ Should use hex primitives |
| **Status backgrounds** | Primitive colors (e.g., --teal-50) | rgba() hardcoded | ❌ Should use primitives |
| **Dark mode** | Override in `.dark` block | Private var overrides | ⚠️ Equivalent but different |

### 3. Semantic Token Values Comparison

#### Light Mode

| Token | Reference | Mine | Should Fix? |
|-------|-----------|------|-------------|
| bg-page | #ededed (grey-50) | var(--grey-50) | ✅ Same |
| bg-surface | #ffffff | #ffffff | ✅ Same |
| bg-surface-raised | #ffffff | #f8f9fa | ⚠️ Close enough |
| bg-sidebar | #ffffff | #ffffff | ✅ Same |
| bg-tag | #e3e3e3 (grey-100) | var(--grey-100) | ✅ Same |
| bg-input | #ffffff | #ffffff | ✅ Same |
| text-primary | #181818 (grey-800) | var(--grey-800) | ✅ Same |
| text-secondary | #474747 (grey-600) | var(--grey-600) | ✅ Same |
| text-tertiary | #828282 (grey-400) | var(--grey-400) | ✅ Same |
| border-subtle | #e3e3e3 (grey-100) | rgba(0,0,0,0.05) | ❌ Use grey-100 |
| border-default | #bdbdbd (grey-200) | rgba(0,0,0,0.1) | ❌ Use grey-200 |
| border-emphasis | #828282 (grey-400) | rgba(0,0,0,0.2) | ❌ Use grey-400 |

#### Dark Mode

| Token | Reference | Mine | Should Fix? |
|-------|-----------|------|-------------|
| bg-page | #181818 (grey-800) | #1f2228 | ⚠️ Close enough |
| bg-surface | #1c1c20 | #25262c | ⚠️ Close enough |
| bg-surface-raised | #242428 | #2d2e34 | ⚠️ Close enough |
| bg-sidebar | #141416 | #1a1a1e | ⚠️ Close enough |
| bg-tag | #292929 (grey-700) | var(--grey-700) | ✅ Same |
| bg-input | #1c1c20 | #25262c | ⚠️ Close enough |
| text-primary | #ededed (grey-50) | #f5f5f5 | ⚠️ Slightly brighter |
| text-secondary | #a1a1a1 (grey-300) | #c4c4c4 | ⚠️ Brighter |
| border-subtle | #292929 (grey-700) | rgba(255,255,255,0.05) | ❌ Use grey-700 |
| border-default | #474747 (grey-600) | rgba(255,255,255,0.1) | ❌ Use grey-600 |
| border-emphasis | #626262 (grey-500) | rgba(255,255,255,0.2) | ❌ Use grey-500 |

### 4. Completed Theme Fixes ✅

1. ✅ **Fixed borders to use primitive hex colors** - Now uses grey-100/200/400 for light, grey-700/600/500 for dark
2. ✅ **Fixed status backgrounds to use primitive colors** - Now uses teal/orange/yellow/blue 50/800
3. ✅ **Updated pink scale** - Matches reference exactly (50, 100, 200, 300, 400, 500)
4. ✅ **Fixed green scale** - Updated 100-700 to match reference
5. ✅ **Verified yellow scale** - Updated 100-700 to match reference

### 5. New Additions ✅

**Standardized Button System:**
- `primary`: Solid brand orange, no border, shadow-sm → shadow-md hover
- `default`: White/grey bg, subtle border, shadow-sm → shadow hover  
- `danger`: Error colored border, transparent bg, shadow-sm
- `ghost`: Transparent, no shadow, subtle bg on hover

**Shadow Tokens:**
- Added semantic shadow tokens (`--shadow-sm/md/lg/xl/2xl`)
- Light mode: subtle black shadows (0.05-0.25 opacity)
- Dark mode: stronger shadows (0.3-0.7 opacity) for visibility

**Cards/Elevated Surfaces:**
- Dialogs now use `border-border-subtle` + `shadow-2xl`
- Lighter borders with shadows for depth
