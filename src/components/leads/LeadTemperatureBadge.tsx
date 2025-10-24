
import React from 'react';
import { TemperatureBadge } from '@/components/ui/badge';
import { LeadTemperature } from '@/config/leadStates';

interface LeadTemperatureBadgeProps {
  temperature: LeadTemperature;
  showLabel?: boolean;
  className?: string;
}

/**
 * Specialized component for displaying lead temperature
 */
export function LeadTemperatureBadge({ 
  temperature, 
  showLabel = true,
  className 
}: LeadTemperatureBadgeProps) {
  return (
    <TemperatureBadge temperature={temperature} className={className}>
      {showLabel && temperature}
    </TemperatureBadge>
  );
}

/**
 * Component for displaying temperature as a colored dot
 */
export function LeadTemperatureDot({ 
  temperature 
}: {
  temperature: LeadTemperature;
}) {
  const colorMap = {
    'Cold': 'bg-gray-400',
    'Cool': 'bg-blue-400',
    'Warm': 'bg-orange-400',
    'Hot': 'bg-red-500',
    'Scheduled': 'bg-purple-500',
  };
  
  return (
    <div 
      className={`h-3 w-3 rounded-full ${colorMap[temperature]}`} 
      title={temperature}
    />
  );
}

export default LeadTemperatureBadge;
