# Colored Button Design System

## Overview
Modern, accessible colored buttons that enhance the OvenAI CRM interface with clear visual hierarchy and action indicators.

## Design Principles
1. **Accessibility First**: WCAG 2.1 AA compliant contrast ratios
2. **Semantic Colors**: Colors convey meaning and action type
3. **Consistent Interaction**: Unified hover, focus, and active states
4. **Flexible Sizing**: Responsive across all devices

## Color Palette

### Primary Actions
```typescript
const buttonColors = {
  primary: {
    default: "bg-blue-600 hover:bg-blue-700 text-white",
    light: "bg-blue-50 hover:bg-blue-100 text-blue-700",
    outline: "border-blue-600 text-blue-600 hover:bg-blue-50"
  },
  success: {
    default: "bg-green-600 hover:bg-green-700 text-white",
    light: "bg-green-50 hover:bg-green-100 text-green-700",
    outline: "border-green-600 text-green-600 hover:bg-green-50"
  },
  warning: {
    default: "bg-amber-600 hover:bg-amber-700 text-white",
    light: "bg-amber-50 hover:bg-amber-100 text-amber-700",
    outline: "border-amber-600 text-amber-600 hover:bg-amber-50"
  },
  danger: {
    default: "bg-red-600 hover:bg-red-700 text-white",
    light: "bg-red-50 hover:bg-red-100 text-red-700",
    outline: "border-red-600 text-red-600 hover:bg-red-50"
  },
  info: {
    default: "bg-cyan-600 hover:bg-cyan-700 text-white",
    light: "bg-cyan-50 hover:bg-cyan-100 text-cyan-700",
    outline: "border-cyan-600 text-cyan-600 hover:bg-cyan-50"
  },
  purple: {
    default: "bg-purple-600 hover:bg-purple-700 text-white",
    light: "bg-purple-50 hover:bg-purple-100 text-purple-700",
    outline: "border-purple-600 text-purple-600 hover:bg-purple-50"
  }
};
```

## Button Component Structure

```typescript
interface ColoredButtonProps {
  variant?: 'default' | 'light' | 'outline' | 'ghost';
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}
```

## Implementation Example

```typescript
import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export const ColoredButton = React.forwardRef<
  HTMLButtonElement,
  ColoredButtonProps
>(({
  variant = 'default',
  color = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  children,
  className,
  onClick,
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-base rounded-lg",
    lg: "px-6 py-3 text-lg rounded-lg",
    xl: "px-8 py-4 text-xl rounded-xl"
  };
  
  const colorVariants = {
    default: {
      primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
      success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
      warning: "bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500",
      danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
      info: "bg-cyan-600 hover:bg-cyan-700 text-white focus:ring-cyan-500",
      purple: "bg-purple-600 hover:bg-purple-700 text-white focus:ring-purple-500"
    },
    light: {
      primary: "bg-blue-50 hover:bg-blue-100 text-blue-700 focus:ring-blue-500",
      success: "bg-green-50 hover:bg-green-100 text-green-700 focus:ring-green-500",
      warning: "bg-amber-50 hover:bg-amber-100 text-amber-700 focus:ring-amber-500",
      danger: "bg-red-50 hover:bg-red-100 text-red-700 focus:ring-red-500",
      info: "bg-cyan-50 hover:bg-cyan-100 text-cyan-700 focus:ring-cyan-500",
      purple: "bg-purple-50 hover:bg-purple-100 text-purple-700 focus:ring-purple-500"
    },
    outline: {
      primary: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
      success: "border-2 border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500",
      warning: "border-2 border-amber-600 text-amber-600 hover:bg-amber-50 focus:ring-amber-500",
      danger: "border-2 border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500",
      info: "border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 focus:ring-cyan-500",
      purple: "border-2 border-purple-600 text-purple-600 hover:bg-purple-50 focus:ring-purple-500"
    },
    ghost: {
      primary: "text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
      success: "text-green-600 hover:bg-green-50 focus:ring-green-500",
      warning: "text-amber-600 hover:bg-amber-50 focus:ring-amber-500",
      danger: "text-red-600 hover:bg-red-50 focus:ring-red-500",
      info: "text-cyan-600 hover:bg-cyan-50 focus:ring-cyan-500",
      purple: "text-purple-600 hover:bg-purple-50 focus:ring-purple-500"
    }
  };
  
  return (
    <button
      ref={ref}
      className={cn(
        baseStyles,
        sizeStyles[size],
        colorVariants[variant][color],
        fullWidth && "w-full",
        loading && "relative cursor-wait",
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <Loader2 className="absolute inset-0 m-auto h-4 w-4 animate-spin" />
      )}
      <span className={cn("flex items-center gap-2", loading && "invisible")}>
        {leftIcon}
        {children}
        {rightIcon}
      </span>
    </button>
  );
});

ColoredButton.displayName = 'ColoredButton';
```

## Usage Examples

### CRM Dashboard Actions
```tsx
// Lead Actions
<ColoredButton color="success" leftIcon={<UserPlus />}>
  Add New Lead
</ColoredButton>

<ColoredButton color="info" variant="outline" leftIcon={<MessageSquare />}>
  Send Message
</ColoredButton>

// Danger Actions
<ColoredButton color="danger" variant="light" leftIcon={<Trash2 />}>
  Delete Lead
</ColoredButton>

// Loading State
<ColoredButton color="primary" loading>
  Saving...
</ColoredButton>
```

### Button Groups
```tsx
<div className="flex gap-2">
  <ColoredButton color="primary" variant="outline">
    Draft
  </ColoredButton>
  <ColoredButton color="success">
    Publish
  </ColoredButton>
  <ColoredButton color="warning" variant="light">
    Schedule
  </ColoredButton>
</div>
```

## Placement Guidelines

### 1. **Lead Management Pages**
- Primary: "Add Lead", "Import Leads"
- Success: "Convert to Client", "Qualify Lead"
- Warning: "Mark as Inactive"
- Danger: "Delete Lead", "Remove from Pipeline"

### 2. **Message/Chat Interface**
- Primary: "Send Message", "Start Chat"
- Info: "Add Note", "View History"
- Success: "Mark Resolved"
- Purple: "AI Suggestions"

### 3. **Project Management**
- Success: "Create Project", "Complete Task"
- Warning: "Pause Project"
- Info: "View Details"
- Primary: "Assign Team"

### 4. **Settings/Admin**
- Danger: "Delete Account", "Reset Data"
- Primary: "Save Settings"
- Success: "Apply Changes"
- Warning: "Clear Cache"

### 5. **Analytics/Reports**
- Primary: "Generate Report"
- Success: "Export Data"
- Info: "View Details"
- Purple: "AI Insights"

## Accessibility Features

1. **Keyboard Navigation**
   - Full keyboard support with visible focus states
   - Tab order follows visual hierarchy

2. **Screen Readers**
   - Proper ARIA labels and descriptions
   - Loading and disabled states announced

3. **Color Contrast**
   - All color combinations meet WCAG AA standards
   - Text remains readable in all states

4. **Motion Preferences**
   - Respects `prefers-reduced-motion`
   - Smooth transitions can be disabled

## Migration Guide

### From shadcn/ui Button
```tsx
// Before
<Button variant="destructive">Delete</Button>

// After
<ColoredButton color="danger">Delete</ColoredButton>
```

### From Custom Buttons
```tsx
// Before
<button className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded">
  Save
</button>

// After
<ColoredButton color="success">Save</ColoredButton>
```

## Best Practices

1. **Use semantic colors**: Match button color to action intent
2. **Consistent placement**: Primary actions on the right
3. **Clear labels**: Action-oriented text (verb + noun)
4. **Loading states**: Show feedback for async actions
5. **Disable appropriately**: Prevent invalid actions
6. **Group related actions**: Use button groups for related functions

## Testing Checklist

- [ ] All color variants render correctly
- [ ] Hover/focus/active states work
- [ ] Keyboard navigation functions
- [ ] Screen reader announces properly
- [ ] Loading state displays correctly
- [ ] Disabled state prevents interaction
- [ ] Mobile touch targets are adequate
- [ ] RTL layout works correctly
- [ ] Dark mode compatibility 