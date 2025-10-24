import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      // Ensure proper mobile sizing and prevent inheritance issues
      "w-full max-w-full", // Full width but prevent overflow
      "box-border", // Include padding/border in width calculation
      "flex-shrink-0", // Prevent shrinking in flex containers
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5", 
      // Mobile-responsive padding: smaller on mobile, larger on desktop
      "p-3 sm:p-4 md:p-6",
      // Ensure proper sizing
      "w-full",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      // Mobile-responsive font size
      "text-sm sm:text-base md:text-lg font-semibold leading-none tracking-tight",
      // Ensure proper text handling
      "break-words", // Break long words if needed
      "w-full",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-muted-foreground",
      // Ensure proper text handling
      "break-words", // Break long words if needed
      "w-full",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div 
    ref={ref} 
    className={cn(
      "pt-0",
      // Mobile-responsive padding: smaller on mobile, larger on desktop
      "p-3 sm:p-4 md:p-6",
      // Ensure proper sizing
      "w-full",
      className
    )} 
    {...props} 
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-3 sm:p-4 md:p-6 pt-0",
      // Ensure proper sizing
      "w-full",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
