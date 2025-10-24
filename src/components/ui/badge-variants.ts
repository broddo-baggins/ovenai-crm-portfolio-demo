
import { cva } from "class-variance-authority";
import { LeadTemperature } from "@/config/leadStates";

/**
 * Badge variants using class-variance-authority
 * Used for consistent styling of badges across the application
 */
export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        
        // Lead status variants
        "status-new": "border-gray-200 bg-gray-100 text-gray-800",
        "status-pre-qualified": "border-gray-200 bg-gray-100 text-gray-800",
        "status-hook": "border-blue-200 bg-blue-100 text-blue-800",
        "status-value-proposition": "border-blue-200 bg-blue-100 text-blue-800",
        "status-questions-asked": "border-blue-200 bg-blue-100 text-blue-800",
        "status-engaged": "border-orange-200 bg-orange-100 text-orange-800",
        "status-qualified": "border-orange-200 bg-orange-100 text-orange-800",
        "status-clarifying": "border-orange-200 bg-orange-100 text-orange-800",
        "status-on-hold": "border-gray-200 bg-gray-100 text-gray-800",
        "status-follow-up": "border-blue-200 bg-blue-100 text-blue-800",
        "status-booked": "border-purple-200 bg-purple-100 text-purple-800",
        "status-dead": "border-red-200 bg-red-100 text-red-800",
        
        // Lead temperature variants
        "temperature-cold": "border-gray-200 bg-gray-100 text-gray-800",
        "temperature-cool": "border-blue-200 bg-blue-100 text-blue-800",
        "temperature-warm": "border-orange-200 bg-orange-100 text-orange-800",
        "temperature-hot": "border-red-200 bg-red-100 text-red-800",
        "temperature-scheduled": "border-purple-200 bg-purple-100 text-purple-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * Status Badge variants
 * Used specifically for lead status badges with consistent colors
 */
export const statusBadgeVariants = cva(
  "inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
  {
    variants: {
      status: {
        // Map to status values in leadStates.ts
        0: "rounded-full border-gray-200 bg-gray-100 text-gray-800", // New
        1: "rounded-full border-gray-200 bg-gray-100 text-gray-800", // Pre-qualified
        2: "rounded-full border-blue-200 bg-blue-100 text-blue-800", // Hook
        3: "rounded-full border-blue-200 bg-blue-100 text-blue-800", // Value Prop
        4: "rounded-full border-blue-200 bg-blue-100 text-blue-800", // Questions Asked
        5: "rounded-full border-orange-200 bg-orange-100 text-orange-800", // Engaged
        6: "rounded-full border-orange-200 bg-orange-100 text-orange-800", // Qualified
        7: "rounded-full border-orange-200 bg-orange-100 text-orange-800", // Clarifying
        8: "rounded-full border-gray-200 bg-gray-100 text-gray-800", // On Hold
        9: "rounded-full border-blue-200 bg-blue-100 text-blue-800", // Follow Up
        10: "rounded-full border-purple-200 bg-purple-100 text-purple-800", // Booked
        11: "rounded-full border-red-200 bg-red-100 text-red-800", // Dead
      },
    },
    defaultVariants: {
      status: 0,
    },
  }
);

/**
 * Temperature Badge variants
 * Used specifically for lead temperature indicators
 */
export const temperatureBadgeVariants = cva(
  "inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
  {
    variants: {
      temperature: {
        "Cold": "rounded-full border-gray-200 bg-gray-100 text-gray-800",
        "Cool": "rounded-full border-blue-200 bg-blue-100 text-blue-800",
        "Warm": "rounded-full border-orange-200 bg-orange-100 text-orange-800",
        "Hot": "rounded-full border-red-200 bg-red-100 text-red-800",
        "Scheduled": "rounded-full border-purple-200 bg-purple-100 text-purple-800",
      },
    },
    defaultVariants: {
      temperature: "Cold" as LeadTemperature,
    },
  }
);
