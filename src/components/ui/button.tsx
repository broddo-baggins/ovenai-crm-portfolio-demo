import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { designTokens } from "@/config/design-system"

const buttonVariants = cva(
  // Base styles for all buttons with enhanced icon/text alignment
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:flex-shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus:ring-primary-500",
        destructive: "bg-error-500 text-white hover:bg-error-600 active:bg-error-700 focus:ring-error-500",
        success: "bg-success-500 text-white hover:bg-success-600 active:bg-success-700 focus:ring-success-500",
        warning: "bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700 focus:ring-warning-500",
        outline: "border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-50 active:bg-gray-100 focus:ring-gray-500 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 focus:ring-gray-500 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        ghost: "text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-gray-500 dark:text-slate-300 dark:hover:bg-slate-800",
        link: "text-primary-500 underline-offset-4 hover:underline focus:ring-primary-500",
      },
      size: {
        default: "h-10 px-4 py-2 min-h-[44px]", // Enhanced minimum touch target
        sm: "h-9 rounded-md px-3 text-xs min-h-[36px]",
        lg: "h-11 rounded-md px-8 min-h-[44px]",
        xl: "h-12 rounded-md px-10 text-base min-h-[48px]",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]", // Enhanced touch targets
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  iconOnly?: boolean
  mobileOptimized?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { 
      className, 
      variant, 
      size, 
      asChild = false, 
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      iconOnly = false,
      mobileOptimized = false,
      children,
      disabled,
      ...props 
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    
    const isDisabled = disabled || loading
    
    // Enhanced mobile optimization classes
    const mobileClasses = mobileOptimized ? [
      "touch-action-manipulation", // Prevents double-tap zoom
      "select-none", // Prevents text selection
      "tap-highlight-transparent", // Removes tap highlights
      "min-h-[44px]", // Ensures minimum touch target
      "min-w-[44px]", // Ensures minimum touch target for icon buttons
    ].join(" ") : ""
    
    // When using asChild, we need to ensure only one child is passed to Slot
    if (asChild) {
      return (
        <Slot
          className={cn(
            buttonVariants({ variant, size, className }),
            fullWidth && "w-full",
            loading && "cursor-wait",
            mobileClasses
          )}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }
    
    return (
      <button
        className={cn(
          buttonVariants({ variant, size, className }),
          fullWidth && "w-full",
          loading && "cursor-wait",
          mobileClasses,
          // Enhanced icon alignment for different scenarios
          iconOnly && size === "icon" && "p-0 flex items-center justify-center",
          !iconOnly && (leftIcon || rightIcon) && "gap-2"
        )}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {!loading && leftIcon && (
          <span className="inline-flex items-center justify-center flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        {!iconOnly && (
          <span className={cn(
            "flex items-center justify-center",
            loading && "opacity-70",
            // Ensure text doesn't break on mobile
            "whitespace-nowrap overflow-hidden text-ellipsis"
          )}>
            {children}
          </span>
        )}
        
        {iconOnly && !loading && !leftIcon && !rightIcon && (
          <span className="flex items-center justify-center" aria-hidden="true">
            {children}
          </span>
        )}
        
        {!loading && rightIcon && (
          <span className="inline-flex items-center justify-center flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

// Button Group Component for related actions with enhanced mobile support
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  size?: VariantProps<typeof buttonVariants>['size'];
  variant?: VariantProps<typeof buttonVariants>['variant'];
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  mobileStack?: boolean; // Stack buttons on mobile
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ 
    children, 
    orientation = 'horizontal', 
    size, 
    variant, 
    spacing = 'sm',
    mobileStack = true,
    className,
    ...props 
  }, ref) => {
    const spacingClasses = {
      none: '',
      sm: orientation === 'horizontal' ? 'gap-1' : 'gap-1',
      md: orientation === 'horizontal' ? 'gap-2' : 'gap-2',
      lg: orientation === 'horizontal' ? 'gap-4' : 'gap-4',
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex",
          orientation === 'horizontal' ? "flex-row" : "flex-col",
          spacingClasses[spacing],
          // Mobile responsive stacking
          mobileStack && "sm:flex-row flex-col",
          className
        )}
        role="group"
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<ButtonProps>(child) && child.type === Button) {
            return React.cloneElement(child, {
              ...child.props,
              size: child.props.size || size,
              variant: child.props.variant || variant,
              mobileOptimized: true,
            } as ButtonProps);
          }
          return child;
        })}
      </div>
    );
  }
);

ButtonGroup.displayName = "ButtonGroup";

export { ButtonGroup };
