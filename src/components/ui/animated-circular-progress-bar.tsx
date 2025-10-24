"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface AnimatedCircularProgressBarProps {
  /**
   * @description The maximum value of the progress bar.
   * @default 100
   */
  max?: number;
  /**
   * @description The minimum value of the progress bar.
   * @default 0
   */
  min?: number;
  /**
   * @description The current value of the progress bar.
   * @default 0
   */
  value?: number;
  /**
   * @description The size of the progress bar.
   * @default 120
   */
  size?: number;
  /**
   * @description The stroke width of the progress bar.
   * @default 10
   */
  strokeWidth?: number;
  /**
   * @description The class name for the progress bar.
   */
  className?: string;
  /**
   * @description The color of the progress bar.
   * @default "hsl(var(--primary))"
   */
  gaugePrimaryColor?: string;
  /**
   * @description The color of the secondary progress bar.
   * @default "hsl(var(--muted))"
   */
  gaugeSecondaryColor?: string;
  /**
   * @description Enable animations or not.
   * @default true
   */
  enableAnimations?: boolean;
}

export function AnimatedCircularProgressBar({
  max = 100,
  min = 0,
  value = 0,
  size = 120,
  strokeWidth = 10,
  className,
  gaugePrimaryColor = "hsl(var(--primary))",
  gaugeSecondaryColor = "hsl(var(--muted))",
  enableAnimations = true,
}: AnimatedCircularProgressBarProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - ((value - min) / (max - min)) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        style={{ filter: "drop-shadow(0px 1px 3px rgba(0, 0, 0, 0.1))" }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gaugeSecondaryColor}
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-30"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gaugePrimaryColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={cn(
            enableAnimations ? "transition-all duration-1000 ease-in-out" : ""
          )}
          style={{
            filter: "drop-shadow(0px 1px 6px rgba(59, 130, 246, 0.3))"
          }}
        />
      </svg>
      
      {/* Value display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {Math.round(((value - min) / (max - min)) * 100)}%
        </span>
        <span className="text-xs text-gray-500 dark:text-slate-400">
          {value} / {max}
        </span>
      </div>
    </div>
  );
} 