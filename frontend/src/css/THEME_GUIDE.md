# Theme Configuration Guide

## Overview
The Volunteer Connect application uses a centralized theme system based on CSS variables. This allows you to change the entire color scheme by updating values in a single file.

## How to Change Colors

### Step 1: Open the Theme File
Navigate to: `frontend/src/css/theme.css`

### Step 2: Update Color Values
All colors are defined as CSS variables in the `:root` selector. Simply change the hex color codes to your desired colors.

### Example: Changing Primary Color
To change the main brand color from blue to green:

**Before:**
```css
--color-primary: #2563eb;
--color-primary-dark: #1e40af;
```

**After:**
```css
--color-primary: #10b981;
--color-primary-dark: #059669;
```

### Step 3: Save and Refresh
After saving `theme.css`, refresh your browser. All components using these colors will automatically update!

## Color Variables Reference

### Primary Colors
- `--color-primary`: Main brand color
- `--color-primary-dark`: Darker shade for hover states
- `--color-primary-darker`: Darkest shade
- `--color-primary-light`: Lighter shade

### Gradient Colors
- `--gradient-start`: Start color for gradients
- `--gradient-middle`: Middle color for gradients
- `--gradient-end`: End color for gradients
- `--gradient-container-start`: Background gradient start
- `--gradient-container-end`: Background gradient end

### Text Colors
- `--color-text-primary`: Main text color (dark)
- `--color-text-secondary`: Secondary text (gray)
- `--color-text-tertiary`: Tertiary text (light gray)
- `--color-text-light`: Light text color

### Background Colors
- `--color-bg-white`: White background
- `--color-bg-gray-light`: Light gray background
- `--color-bg-gray`: Medium gray background

### Interactive Colors
- `--color-link`: Link color
- `--color-link-hover`: Link hover color
- `--color-focus`: Focus border color
- `--color-focus-shadow`: Focus shadow color

### Button Colors
- `--color-button-primary-bg`: Primary button gradient
- `--color-button-primary-shadow`: Primary button shadow
- `--color-button-secondary-*`: Secondary button colors

### Form Colors
- `--color-input-*`: Input field colors
- `--color-checkbox-accent`: Checkbox accent color

### Status Colors
- `--color-success-*`: Success message colors
- `--color-error-*`: Error message colors

## Quick Color Scheme Examples

### Green Theme
```css
--color-primary: #10b981;
--color-primary-dark: #059669;
--gradient-start: #10b981;
--gradient-middle: #059669;
--gradient-end: #047857;
```

### Purple Theme
```css
--color-primary: #8b5cf6;
--color-primary-dark: #7c3aed;
--gradient-start: #8b5cf6;
--gradient-middle: #7c3aed;
--gradient-end: #6d28d9;
```

### Orange Theme
```css
--color-primary: #f59e0b;
--color-primary-dark: #d97706;
--gradient-start: #f59e0b;
--gradient-middle: #d97706;
--gradient-end: #b45309;
```

## Best Practices

1. **Maintain Contrast**: Ensure text remains readable on backgrounds
2. **Test All States**: Check hover, focus, and disabled states
3. **Keep Consistency**: Use the same color family for related elements
4. **Accessibility**: Ensure color combinations meet WCAG contrast guidelines

## Files Using Theme Variables

- `frontend/src/css/Auth.css` - Login and Register pages
- Future components can import and use these variables

## Need Help?

If you need to add new color variables:
1. Add them to `theme.css` in the `:root` selector
2. Use them in your CSS files with `var(--variable-name)`
3. Document them in this guide

