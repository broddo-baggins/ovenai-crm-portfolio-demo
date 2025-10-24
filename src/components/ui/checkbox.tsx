import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const checkboxVariants = cva(
  "peer shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
  {
    variants: {
      size: {
        sm: "h-3 w-3", // Small - 12px
        default: "h-4 w-4", // Default - 16px  
        table: "h-4 w-4", // Table optimized - 16px (better ratio for table contexts)
        lg: "h-5 w-5", // Large - 20px
        mobile: "h-6 w-6", // Mobile optimized - 24px for better touch targets
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface CheckboxProps
  extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    VariantProps<typeof checkboxVariants> {
  mobileOptimized?: boolean
}

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, size, mobileOptimized = false, ...props }, ref) => {
  // Use mobile size when mobile optimization is enabled
  const effectiveSize = mobileOptimized ? "mobile" : size

  // Icon size should match checkbox size
  const iconSize = effectiveSize === "mobile" ? "h-5 w-5" : 
                   effectiveSize === "lg" ? "h-4 w-4" :
                   effectiveSize === "table" ? "h-3.5 w-3.5" :
                   effectiveSize === "sm" ? "h-2.5 w-2.5" : "h-4 w-4"

  // Filter out conflicting size classes when mobileOptimized is true
  const filteredClassName = mobileOptimized && className 
    ? className.replace(/\bh-[0-9]+\b/g, '').replace(/\bw-[0-9]+\b/g, '').trim()
    : className

  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        checkboxVariants({ size: effectiveSize }),
        // Add touch-friendly classes for mobile
        mobileOptimized && [
          "touch-action-manipulation", // Prevents double-tap zoom
          "select-none", // Prevents text selection
        ],
        filteredClassName
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className={iconSize} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox, checkboxVariants }
