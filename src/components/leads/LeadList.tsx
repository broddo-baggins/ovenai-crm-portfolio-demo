import React from 'react';
import { LeadCard, LeadCardProps } from './LeadCard';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { leadStates } from '@/config/leadStates';

export interface LeadListProps {
  leads: Omit<LeadCardProps, 'onStatusChange' | 'onClick'>[];
  onStatusChange?: (leadId: string | number, newStatus: number) => void;
  onLeadClick?: (leadId: string | number) => void;
  className?: string;
}

/**
 * Component to list and filter leads
 */
export function LeadList({
  leads,
  onStatusChange,
  onLeadClick,
  className
}: LeadListProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [temperatureFilter, setTemperatureFilter] = React.useState<string>('all');

  // Filter the leads based on search term and filters
  const filteredLeads = leads.filter(lead => {
    // Search term filter
    const searchMatch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm) ||
      (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter
    const statusMatch = 
      statusFilter === 'all' || 
      lead.status.toString() === statusFilter;
    
    // Temperature filter
    const temperatureMatch = 
      temperatureFilter === 'all' || 
      lead.temperature === temperatureFilter;
    
    return searchMatch && statusMatch && temperatureMatch;
  });

  return (
    <div className={className}>
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search leads by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        
        <Select onValueChange={setStatusFilter} defaultValue="all">
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Status</SelectLabel>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.values(leadStates).map((state) => (
                <SelectItem key={state.value} value={state.value.toString()}>
                  {state.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        
        <Select onValueChange={setTemperatureFilter} defaultValue="all">
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Temperature" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Temperature</SelectLabel>
              <SelectItem value="all">All Temperatures</SelectItem>
              <SelectItem value="Cold">Cold</SelectItem>
              <SelectItem value="Cool">Cool</SelectItem>
              <SelectItem value="Warm">Warm</SelectItem>
              <SelectItem value="Hot">Hot</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      {filteredLeads.length === 0 ? (
        <div className="p-6 bg-gray-50 border rounded text-center">
          <p className="text-gray-500 mb-2">No leads found</p>
          <p className="text-sm text-gray-400">
            {searchTerm || statusFilter !== 'all' || temperatureFilter !== 'all' 
              ? "Try adjusting your search filters"
              : "Add new leads or import from CSV to get started"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map(lead => (
            <LeadCard
              key={lead.id}
              {...lead}
              onStatusChange={onStatusChange}
              onClick={onLeadClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default LeadList;
