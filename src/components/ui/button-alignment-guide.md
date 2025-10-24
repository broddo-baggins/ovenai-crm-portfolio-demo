# Button Icon & Text Alignment Guide

## ✅ Standards & Best Practices

This guide ensures consistent button alignment across all components in the application.

### 🎯 Core Principles

1. **Clarity and Recognition**: Icons should be easily understood and instantly recognizable
2. **Accessibility**: All buttons must have proper touch targets and accessible labels
3. **Consistency**: Maintain uniform spacing, sizing, and alignment patterns
4. **Mobile First**: Optimize for mobile usability with enhanced touch targets
5. **RTL Support**: Ensure proper layout for right-to-left languages

### 📐 Alignment Standards

#### Icon Sizes
- **Small buttons**: `h-3 w-3` (12px)
- **Default buttons**: `h-4 w-4` (16px) 
- **Large buttons**: `h-5 w-5` (20px)
- **Navigation icons**: `h-5 w-5` (20px)
- **Mobile nav icons**: `h-6 w-6` (24px)

#### Spacing Standards
- **Icon-text gap**: `gap-2` (8px) - Use Button component's built-in spacing
- **Button groups**: `gap-1` (4px) for compact, `gap-2` (8px) for normal
- **Never use**: `mr-1`, `mr-2`, `ml-1`, `ml-2` - Use Button component props instead

#### Touch Targets
- **Minimum size**: `44px × 44px` (WCAG AA standard)
- **Small buttons**: `36px × 36px` minimum
- **Icon-only buttons**: `44px × 44px` minimum
- **Mobile optimization**: Use `mobileOptimized={true}` prop

### 🔧 Implementation Examples

#### ✅ Correct Implementation

```tsx
// Using Button component with proper props
<Button 
  variant="outline" 
  size="sm"
  leftIcon={<Phone className="h-4 w-4" />}
  mobileOptimized={true}
  onClick={handleCall}
>
  Call Lead
</Button>

// Icon-only button
<Button 
  variant="ghost" 
  size="icon"
  iconOnly={true}
  mobileOptimized={true}
  aria-label="Delete item"
  onClick={handleDelete}
>
  <Trash2 className="h-4 w-4" />
</Button>

// Button group with consistent spacing
<ButtonGroup spacing="sm" mobileStack={true}>
  <Button leftIcon={<Save className="h-4 w-4" />}>Save</Button>
  <Button variant="outline" leftIcon={<X className="h-4 w-4" />}>Cancel</Button>
</ButtonGroup>
```

#### ❌ Incorrect Implementation

```tsx
// DON'T: Manual spacing and alignment
<Button className="flex items-center gap-2">
  <Phone className="h-4 w-4 mr-2" />
  Call Lead
</Button>

// DON'T: Inconsistent icon sizes
<Button>
  <Mail className="h-3 w-3 mr-1" />
  Email
</Button>

// DON'T: Manual flex classes
<div className="flex items-center gap-1">
  <Button><Save className="mr-2" />Save</Button>
</div>
```

### 📱 Mobile Specific Guidelines

#### Touch Target Requirements
```tsx
// Always use mobileOptimized for mobile-friendly buttons
<Button 
  size="sm"
  mobileOptimized={true}  // Adds touch-action-manipulation, etc.
  leftIcon={<Plus className="h-4 w-4" />}
>
  Add Item
</Button>
```

#### Mobile Navigation
```tsx
// Mobile nav items need larger touch targets
<button className="min-h-[60px] min-w-[60px] flex flex-col items-center justify-center gap-1">
  <Icon className="h-6 w-6" />
  <span className="text-[10px]">Label</span>
</button>
```

#### Compact Components
```tsx
// Use compact prop for mobile versions
<BasicProjectSelector compact={true} className="h-8" />
```

### 🌐 RTL Support

#### Automatic Reversal
```tsx
// Button component handles RTL automatically
<Button leftIcon={<Arrow className="h-4 w-4" />}>
  Continue
</Button>

// For custom layouts, use RTL utilities
<div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</div>
```

### ♿ Accessibility Requirements

#### Labels and ARIA
```tsx
// Icon-only buttons MUST have accessible labels
<Button 
  size="icon"
  iconOnly={true}
  aria-label="Delete lead"
  onClick={handleDelete}
>
  <Trash2 className="h-4 w-4" />
</Button>

// Or use title attribute
<Button 
  size="icon"
  title="Refresh data"
  onClick={handleRefresh}
>
  <RefreshCw className="h-4 w-4" />
</Button>
```

#### Focus States
```tsx
// Button component includes proper focus styles
// No additional work needed for focus-visible:ring-2
```

### 🧪 Testing Requirements

#### Visual Tests
- [ ] All buttons have consistent icon sizes within same context
- [ ] Proper vertical and horizontal alignment
- [ ] Adequate touch targets on mobile
- [ ] Consistent spacing between icons and text

#### Functional Tests
- [ ] All buttons are keyboard accessible
- [ ] Screen readers can identify button purpose
- [ ] Touch targets work properly on mobile devices
- [ ] RTL layouts render correctly

#### Automated Tests
```typescript
// Example test for button alignment
test('buttons should have consistent icon alignment', async ({ page }) => {
  const buttons = page.locator('button:has(svg)');
  
  for (let i = 0; i < await buttons.count(); i++) {
    const button = buttons.nth(i);
    const icon = button.locator('svg').first();
    
    // Check icon size consistency
    await expect(icon).toHaveClass(/h-[3-6]/);
    await expect(icon).toHaveClass(/w-[3-6]/);
    
    // Check touch target size
    const boundingBox = await button.boundingBox();
    expect(boundingBox?.height).toBeGreaterThanOrEqual(36);
  }
});
```

### 📋 Checklist for New Buttons

Before adding any new button component:

- [ ] Uses Button component with proper props (`leftIcon`, `rightIcon`, etc.)
- [ ] Has appropriate size for icon (`h-4 w-4` for most cases)
- [ ] Includes `mobileOptimized={true}` for mobile contexts
- [ ] Has accessible label for icon-only buttons
- [ ] Meets minimum touch target requirements
- [ ] Works properly in RTL layouts
- [ ] Has been tested on mobile devices
- [ ] Follows consistent spacing patterns
- [ ] Includes proper ARIA attributes
- [ ] Has focus states for keyboard navigation

### 🔄 Migration Guide

To update existing buttons to use the new standards:

1. Replace manual icon spacing:
   ```tsx
   // Before
   <Button><Icon className="mr-2" />Text</Button>
   
   // After  
   <Button leftIcon={<Icon className="h-4 w-4" />}>Text</Button>
   ```

2. Add mobile optimization:
   ```tsx
   // Add to all buttons used on mobile
   <Button mobileOptimized={true}>Action</Button>
   ```

3. Standardize icon sizes:
   ```tsx
   // Use consistent sizes
   <Button leftIcon={<Icon className="h-4 w-4" />}>Action</Button>
   ```

4. Use ButtonGroup for related actions:
   ```tsx
   <ButtonGroup spacing="sm">
     <Button>Save</Button>
     <Button variant="outline">Cancel</Button>
   </ButtonGroup>
   ```

### 🎨 Design Tokens

The following design tokens are used for button alignment:

```css
/* Icon sizes */
--icon-xs: 12px;  /* h-3 w-3 */
--icon-sm: 16px;  /* h-4 w-4 */
--icon-md: 20px;  /* h-5 w-5 */
--icon-lg: 24px;  /* h-6 w-6 */

/* Touch targets */
--touch-target-min: 44px;
--touch-target-sm: 36px;

/* Spacing */
--button-gap: 8px;    /* gap-2 */
--button-gap-sm: 4px; /* gap-1 */
```

---

**Remember**: Consistency is key. Always use the Button component's built-in props rather than manual styling for the best results across all devices and languages. 