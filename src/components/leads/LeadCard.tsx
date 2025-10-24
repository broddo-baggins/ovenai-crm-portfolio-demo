import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  LeadStatusBadge, 
  LeadStatusOptions 
} from '@/components/leads/LeadStatusBadge';
import { 
  LeadTemperatureDot 
} from '@/components/leads/LeadTemperatureBadge';
import { LeadTemperature } from '@/config/leadStates';

export interface LeadCardProps {
  id: string | number;
  name: string;
  phone: string;
  email?: string;
  status: number;
  temperature: LeadTemperature;
  lastMessage?: string;
  messageCount?: number;
  onStatusChange?: (leadId: string | number, newStatus: number) => void;
  onClick?: (leadId: string | number) => void;
}

/**
 * Card component for displaying lead information in a list or grid
 */
export function LeadCard({
  id,
  name,
  phone,
  email,
  status,
  temperature,
  lastMessage,
  messageCount,
  onStatusChange,
  onClick
}: LeadCardProps) {
  const handleStatusChange = (newStatus: number) => {
    if (onStatusChange) {
      onStatusChange(id, newStatus);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  return (
    <Card 
      className="hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h3 className="text-lg font-medium">{name}</h3>
            <p className="text-sm text-gray-500">{phone}</p>
            {email && <p className="text-sm text-gray-500">{email}</p>}
          </div>
          
          <div className="flex items-center space-x-2">
            <LeadTemperatureDot temperature={temperature} />
            <LeadStatusBadge status={status} />
          </div>
        </div>

        {lastMessage && (
          <div className="mt-3 border-t pt-2">
            <p className="text-sm">
              <span className="font-medium">Last message: </span>
              {lastMessage}
            </p>
            {messageCount !== undefined && (
              <p className="text-xs text-gray-500 mt-1">
                {messageCount} messages exchanged
              </p>
            )}
          </div>
        )}

        {onStatusChange && (
          <div className="mt-3 border-t pt-3">
            <p className="text-xs text-gray-500 mb-1">Change status:</p>
            <LeadStatusOptions 
              currentStatus={status} 
              onStatusChange={handleStatusChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LeadCard;
