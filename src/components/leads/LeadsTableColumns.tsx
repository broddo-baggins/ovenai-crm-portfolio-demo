import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Phone, Mail, MessageSquare, User } from "lucide-react";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { LeadTemperatureDot } from "./LeadTemperatureBadge";
import { LeadTemperature } from "@/config/leadStates";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  status: number;
  temperature: LeadTemperature;
  lastMessage?: string;
  messageCount?: number;
  project_id?: string;
}

interface CreateLeadsColumnsProps {
  onStatusChange?: (leadId: string, newStatus: number) => void;
  onLeadClick?: (leadId: string) => void;
  onSendMessage?: (leadId: string) => void;
  onCall?: (leadId: string) => void;
}

export const createLeadsColumns = ({
  onStatusChange,
  onLeadClick,
  onSendMessage,
  onCall,
}: CreateLeadsColumnsProps = {}): ColumnDef<Lead>[] => [
  {
    accessorKey: "name",
    header: "Lead",
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {lead.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-slate-400">
              {lead.phone}
            </div>
          </div>
        </div>
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
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "temperature",
    header: "Temperature",
    cell: ({ row }) => {
      const temperature = row.getValue("temperature") as LeadTemperature;
      return (
        <div className="flex items-center space-x-2">
          <LeadTemperatureDot temperature={temperature} />
          <span className="text-sm font-medium capitalize">
            {temperature}
          </span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "messageCount",
    header: "Messages",
    cell: ({ row }) => {
      const count = row.original.messageCount;
      const lastMessage = row.original.lastMessage;
      
      if (!count && !lastMessage) {
        return <span className="text-gray-400 text-sm">No messages</span>;
      }
      
      return (
        <div className="space-y-1">
          {count !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {count} messages
            </Badge>
          )}
          {lastMessage && (
            <div className="text-xs text-gray-600 dark:text-slate-400 max-w-32 truncate">
              {lastMessage}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Contact",
    cell: ({ row }) => {
      const lead = row.original;
      return (
        <div className="flex items-center space-x-2">
          {lead.phone && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCall?.(lead.id);
              }}
              className="h-8 w-8 p-0"
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSendMessage?.(lead.id);
            }}
            className="h-8 w-8 p-0"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const lead = row.original;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(lead.id);
              }}
            >
              Copy lead ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onLeadClick?.(lead.id)}
            >
              View details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSendMessage?.(lead.id)}
            >
              Send message
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onCall?.(lead.id)}
            >
              Call lead
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
]; 