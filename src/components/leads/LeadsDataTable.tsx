import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LeadStatusBadge } from './LeadStatusBadge';
import { LeadTemperatureBadge } from './LeadTemperatureBadge';
import { 
  MoreHorizontal, 
  Phone, 
  Mail, 
  MessageSquare,
  Calendar,
  Edit,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LeadTemperature } from '@/config/leadStates';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: number;
  temperature: LeadTemperature;
  lastMessage?: string;
  messageCount?: number;
  project_id?: string;
  created_at?: string;
  last_contacted?: string;
}

interface LeadsDataTableProps {
  leads: Lead[];
  onStatusChange?: (leadId: string, newStatus: number) => void;
  onLeadClick?: (leadId: string) => void;
  onEditLead?: (leadId: string) => void;
  onDeleteLead?: (leadId: string) => void;
  onCallLead?: (leadId: string) => void;
  onEmailLead?: (leadId: string) => void;
  onMessageLead?: (leadId: string) => void;
  onScheduleMeeting?: (leadId: string) => void;
  className?: string;
}

export function LeadsDataTable({
  leads,
  onStatusChange,
  onLeadClick,
  onEditLead,
  onDeleteLead,
  onCallLead,
  onEmailLead,
  onMessageLead,
  onScheduleMeeting,
  className = "",
}: LeadsDataTableProps) {

  const columns: ColumnDef<Lead>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const lead = row.original;
        const initials = lead.name
          .split(' ')
          .map(name => name.charAt(0))
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span 
                className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600"
                onClick={() => onLeadClick?.(lead.id)}
              >
                {lead.name}
              </span>
              {lead.lastMessage && (
                <span className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-[200px]">
                  {lead.lastMessage}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.getValue("phone") as string;
        return (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-900 dark:text-white font-mono">
              {phone}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-green-100 hover:text-green-700"
              onClick={() => onCallLead?.(row.original.id)}
            >
              <Phone className="h-3 w-3" />
            </Button>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("email") as string | null;
        return email ? (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-slate-300">
              {email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-blue-100 hover:text-blue-700"
              onClick={() => onEmailLead?.(row.original.id)}
            >
              <Mail className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <span className="text-sm text-gray-400">No email</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as number;
        return <LeadStatusBadge status={status} />;
      },
    },
    {
      accessorKey: "temperature",
      header: "Temperature",
      cell: ({ row }) => {
        const temperature = row.getValue("temperature") as LeadTemperature;
        return <LeadTemperatureBadge temperature={temperature} />;
      },
    },
    {
      accessorKey: "messageCount",
      header: "Messages",
      cell: ({ row }) => {
        const count = row.getValue("messageCount") as number | undefined;
        return count ? (
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {count}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-purple-100 hover:text-purple-700"
              onClick={() => onMessageLead?.(row.original.id)}
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );
      },
    },
    {
      accessorKey: "last_contacted",
      header: "Last Contact",
      cell: ({ row }) => {
        const lastContacted = row.getValue("last_contacted") as string | undefined;
        return lastContacted ? (
          <span className="text-sm text-gray-600 dark:text-slate-300">
            {new Date(lastContacted).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-sm text-gray-400">Never</span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const lead = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(lead.id)}
              >
                Copy lead ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEditLead?.(lead.id)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit lead
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCallLead?.(lead.id)}>
                <Phone className="mr-2 h-4 w-4" />
                Call lead
              </DropdownMenuItem>
              {lead.email && (
                <DropdownMenuItem onClick={() => onEmailLead?.(lead.id)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send email
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onMessageLead?.(lead.id)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Send message
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onScheduleMeeting?.(lead.id)}>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule meeting
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDeleteLead?.(lead.id)}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete lead
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleExport = (data: Lead[]) => {
    // Convert to CSV
    const headers = ['Name', 'Phone', 'Email', 'Status', 'Temperature', 'Messages', 'Last Contact'];
    const csvData = data.map(lead => [
      lead.name,
      lead.phone,
      lead.email || '',
      lead.status.toString(),
      lead.temperature,
      lead.messageCount?.toString() || '0',
      lead.last_contacted || ''
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className={className}>
      <DataTable
        columns={columns}
        data={leads}
        searchPlaceholder="Search leads by name, email, or phone..."
        onExport={handleExport}
        defaultPageSize={20}
      />
    </div>
  );
}

export default LeadsDataTable; 