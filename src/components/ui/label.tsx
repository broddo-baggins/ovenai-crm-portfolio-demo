import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { HelpCircle, Asterisk } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "text-foreground",
        destructive: "text-destructive",
        muted: "text-muted-foreground",
        success: "text-green-600 dark:text-green-400",
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  required?: boolean
  helpText?: string
  error?: string
  description?: string
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, variant, size, required, helpText, error, description, children, ...props }, ref) => {
  const labelId = React.useId()
  const descriptionId = React.useId()
  
  // Determine variant based on error state
  const effectiveVariant = error ? "destructive" : variant

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <LabelPrimitive.Root
          ref={ref}
          className={cn(labelVariants({ variant: effectiveVariant, size }), className)}
          id={labelId}
          {...props}
        >
          {children}
          {required && (
            <Asterisk 
              className="inline-block h-3 w-3 text-destructive ml-1" 
              aria-label="Required field"
            />
          )}
        </LabelPrimitive.Root>
        
        {helpText && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Help information"
                >
                  <HelpCircle className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <span className="max-w-xs text-sm">{helpText}</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {description && !error && (
        <p 
          id={descriptionId}
          className="text-xs text-muted-foreground"
          aria-describedby={labelId}
        >
          {description}
        </p>
      )}
      
      {error && (
        <p 
          id={descriptionId}
          className="text-xs text-destructive"
          aria-describedby={labelId}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
})
Label.displayName = "Label"

export { Label, labelVariants }
