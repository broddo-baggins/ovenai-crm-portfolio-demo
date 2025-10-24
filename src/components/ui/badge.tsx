import * as React from "react"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { 
  badgeVariants, 
  statusBadgeVariants, 
  temperatureBadgeVariants 
} from "./badge-variants"

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

// Status badge specifically for lead status display
export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof statusBadgeVariants>, 'status'> {
  status: number;
}

function StatusBadge({ className, status, ...props }: StatusBadgeProps) {
  return (
    <div 
      className={cn(statusBadgeVariants({ status: status as Parameters<typeof statusBadgeVariants>[0]['status'] }), className)} 
      {...props} 
    />
  )
}

// Temperature badge specifically for lead temperature display
export interface TemperatureBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof temperatureBadgeVariants>, 'temperature'> {
  temperature: "Cold" | "Cool" | "Warm" | "Hot" | "Scheduled";
}

function TemperatureBadge({ className, temperature, ...props }: TemperatureBadgeProps) {
  return (
    <div 
      className={cn(temperatureBadgeVariants({ temperature }), className)} 
      {...props} 
    />
  )
}

export { Badge, StatusBadge, TemperatureBadge }

// Utility function for status badges with proper fallback for unknown values
export function createStatusBadge(status?: string | number, options?: {
  variant?: "outline" | "default" | "secondary" | "destructive";
  className?: string;
}) {
  const { variant = "outline", className = "" } = options || {};
  
  // Handle unknown/null/undefined status
  if (!status || status === "unknown" || status === "Unknown") {
    return {
      variant: variant as any,
      className: `bg-gray-100 text-gray-800 border-gray-300 ${className}`,
      text: "Unknown"
    };
  }
  
  return {
    variant: variant as any,
    className,
    text: String(status)
  };
}
