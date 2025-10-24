import React from 'react';
import { Flame, Thermometer, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HeatLevel = 'hot' | 'warm' | 'cold' | 'burning';

interface HeatIndicatorProps {
  level: HeatLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showScore?: boolean;
  className?: string;
}

const heatConfig = {
  hot: {
    color: 'text-red-500',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    gradientFrom: 'from-red-400',
    gradientTo: 'to-red-600',
    icon: Flame,
    emoji: 'HOT',
    label: 'Hot',
    labelHe: 'חם'
  },
  burning: {
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-red-800',
    icon: Flame,
    emoji: 'HOTHOT',
    label: 'Burning',
    labelHe: 'בוער'
  },
  warm: {
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    gradientFrom: 'from-orange-400',
    gradientTo: 'to-yellow-500',
    icon: Thermometer,
    emoji: '🌡️',
    label: 'Warm',
    labelHe: 'חמים'
  },
  cold: {
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    gradientFrom: 'from-blue-400',
    gradientTo: 'to-blue-600',
    icon: Snowflake,
    emoji: '❄️',
    label: 'Cold',
    labelHe: 'קר'
  }
};

const sizeConfig = {
  sm: {
    container: 'h-6 w-6',
    icon: 'h-3 w-3',
    text: 'text-xs',
    score: 'text-xs'
  },
  md: {
    container: 'h-8 w-8',
    icon: 'h-4 w-4',
    text: 'text-sm',
    score: 'text-sm'
  },
  lg: {
    container: 'h-10 w-10',
    icon: 'h-5 w-5',
    text: 'text-base',
    score: 'text-base'
  }
};

export function HeatIndicator({ 
  level, 
  score, 
  size = 'md', 
  showLabel = false, 
  showScore = false,
  className 
}: HeatIndicatorProps) {
  const config = heatConfig[level];
  const sizes = sizeConfig[size];
  const IconComponent = config.icon;

  // Calculate heat intensity for visual effects
  const intensity = score ? Math.min(score / 100, 1) : 0.7;
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Heat Icon */}
      <div className={cn(
        "rounded-full flex items-center justify-center shadow-sm border transition-all duration-200",
        sizes.container,
        config.bgColor,
        config.borderColor,
        "hover:scale-105"
      )}>
        <div className={cn(
          "rounded-full flex items-center justify-center bg-gradient-to-br",
          config.gradientFrom,
          config.gradientTo,
          sizes.container
        )} style={{ opacity: intensity }}>
          <IconComponent className={cn(sizes.icon, "text-white")} />
        </div>
      </div>

      {/* Label and Score */}
      {(showLabel || showScore) && (
        <div className="flex flex-col">
          {showLabel && (
            <span className={cn("font-medium", sizes.text, config.color)}>
              {config.label}
            </span>
          )}
          {showScore && score !== undefined && (
            <span className={cn("font-bold", sizes.score, config.color)}>
              {score}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Convenience components for common use cases
export function HotIndicator(props: Omit<HeatIndicatorProps, 'level'>) {
  return <HeatIndicator {...props} level="hot" />;
}

export function WarmIndicator(props: Omit<HeatIndicatorProps, 'level'>) {
  return <HeatIndicator {...props} level="warm" />;
}

export function ColdIndicator(props: Omit<HeatIndicatorProps, 'level'>) {
  return <HeatIndicator {...props} level="cold" />;
}

export function BurningIndicator(props: Omit<HeatIndicatorProps, 'level'>) {
  return <HeatIndicator {...props} level="burning" />;
}

// Heat level utility functions
export function getHeatLevel(score: number): HeatLevel {
  if (score >= 90) return 'burning';
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

export function getHeatScore(level: HeatLevel): number {
  switch (level) {
    case 'burning': return 95;
    case 'hot': return 80;
    case 'warm': return 55;
    case 'cold': return 25;
    default: return 50;
  }
}

// Compound component for displaying multiple heat indicators
interface HeatIndicatorGroupProps {
  levels: Array<{ level: HeatLevel; count: number; label?: string }>;
  size?: 'sm' | 'md' | 'lg';
  showCounts?: boolean;
  className?: string;
}

export function HeatIndicatorGroup({ 
  levels, 
  size = 'md', 
  showCounts = true,
  className 
}: HeatIndicatorGroupProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {levels.map((item, index) => (
        <div key={index} className="flex items-center gap-1">
          <HeatIndicator 
            level={item.level} 
            size={size}
            score={getHeatScore(item.level)}
          />
          {showCounts && (
            <span className="text-sm font-medium text-gray-600">
              {item.count}
            </span>
          )}
          {item.label && (
            <span className="text-xs text-gray-500">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
} 