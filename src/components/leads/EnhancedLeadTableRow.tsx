import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '@/hooks/useLang';
import { flexRender, Row } from '@tanstack/react-table';
import { TableCell, TableRow } from '@/components/ui/table';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger
} from '@/components/ui/context-menu';
import { 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar,
  Copy,
  Eye,
  MessageSquare,
  FileText,
  Archive,
  UserPlus,
  Tag,
  Star,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  source: string;
  value: number;
  created_at: string;
  last_contact?: string;
}

interface EnhancedLeadTableRowProps {
  row: Row<Lead>;
  onEditLead?: (leadId: string) => void;
  onDeleteLead?: (leadId: string) => void;
  onViewLead?: (leadId: string) => void;
  onCallLead?: (leadId: string) => void;
  onEmailLead?: (leadId: string) => void;
  onMessageLead?: (leadId: string) => void;
  onScheduleMeeting?: (leadId: string) => void;
  onArchiveLead?: (leadId: string) => void;
  onAssignLead?: (leadId: string) => void;
  onTagLead?: (leadId: string) => void;
  onStarLead?: (leadId: string) => void;
  onExportLead?: (leadId: string) => void;
  onChangeStatus?: (leadId: string, status: string) => void;
  className?: string;
}

export function EnhancedLeadTableRow({
  row,
  onEditLead,
  onDeleteLead,
  onViewLead,
  onCallLead,
  onEmailLead,
  onMessageLead,
  onScheduleMeeting,
  onArchiveLead,
  onAssignLead,
  onTagLead,
  onStarLead,
  onExportLead,
  onChangeStatus,
  className
}: EnhancedLeadTableRowProps) {
  const { t } = useTranslation(['leads', 'common']);
  const { isRTL } = useLang();
  const lead = row.original;

  const handleContextAction = (action: string, leadId: string) => {
    switch (action) {
      case 'view':
        onViewLead?.(leadId);
        toast.success(`Viewing lead: ${lead.name}`);
        break;
      case 'edit':
        onEditLead?.(leadId);
        toast.success(`Editing lead: ${lead.name}`);
        break;
      case 'delete':
        onDeleteLead?.(leadId);
        break;
      case 'call':
        onCallLead?.(leadId);
        toast.success(`Initiating call to ${lead.name}`);
        break;
      case 'email':
        onEmailLead?.(leadId);
        toast.success(`Opening email to ${lead.email}`);
        break;
      case 'message':
        onMessageLead?.(leadId);
        toast.success(`Opening message to ${lead.name}`);
        break;
      case 'schedule':
        onScheduleMeeting?.(leadId);
        toast.success(`Scheduling meeting with ${lead.name}`);
        break;
      case 'archive':
        onArchiveLead?.(leadId);
        toast.success(`Archived lead: ${lead.name}`);
        break;
      case 'assign':
        onAssignLead?.(leadId);
        toast.success(`Assigning lead: ${lead.name}`);
        break;
      case 'tag':
        onTagLead?.(leadId);
        break;
      case 'star':
        onStarLead?.(leadId);
        toast.success(`Starred lead: ${lead.name}`);
        break;
      case 'export':
        onExportLead?.(leadId);
        toast.success(`Exporting lead: ${lead.name}`);
        break;
      case 'copy-id':
        navigator.clipboard.writeText(leadId);
        toast.success('Lead ID copied to clipboard');
        break;
      case 'copy-email':
        if (lead.email) {
          navigator.clipboard.writeText(lead.email);
          toast.success('Email copied to clipboard');
        }
        break;
      case 'copy-phone':
        if (lead.phone) {
          navigator.clipboard.writeText(lead.phone);
          toast.success('Phone number copied to clipboard');
        }
        break;
      default:
        break;
    }
  };

  const handleStatusChange = (newStatus: string) => {
    onChangeStatus?.(lead.id, newStatus);
    toast.success(`Status changed to ${newStatus} for ${lead.name}`);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TableRow
          key={row.id}
          data-state={row.getIsSelected() && "selected"}
          className={cn(
            "hover:bg-muted/50 cursor-context-menu transition-colors",
            "group relative",
            className
          )}
          onClick={() => onViewLead?.(lead.id)}
          title="Right-click for more options"
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      </ContextMenuTrigger>
      
      <ContextMenuContent className="w-56">
        <ContextMenuLabel className="font-semibold">
          {lead.name}
          <div className="text-xs font-normal text-muted-foreground">
            {lead.email}
          </div>
        </ContextMenuLabel>
        
        <ContextMenuSeparator />
        
        {/* Primary Actions */}
        <ContextMenuItem onClick={() => handleContextAction('view', lead.id)}>
          <Eye className="mr-2 h-4 w-4" />
          {t('leads:actions.viewDetails', 'View Details')}
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => handleContextAction('edit', lead.id)}>
          <Edit className="mr-2 h-4 w-4" />
          {t('leads:actions.editLead', 'Edit Lead')}
          <ContextMenuShortcut>⌘E</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {/* Communication Actions */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <MessageSquare className="mr-2 h-4 w-4" />
            {t('leads:actions.contact', 'Contact')}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            {lead.phone && (
              <ContextMenuItem onClick={() => handleContextAction('call', lead.id)}>
                <Phone className="mr-2 h-4 w-4" />
                {t('leads:actions.call', 'Call')} {lead.phone}
              </ContextMenuItem>
            )}
            {lead.email && (
              <ContextMenuItem onClick={() => handleContextAction('email', lead.id)}>
                <Mail className="mr-2 h-4 w-4" />
                {t('leads:actions.sendEmail', 'Send Email')}
              </ContextMenuItem>
            )}
            <ContextMenuItem onClick={() => handleContextAction('message', lead.id)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              {t('leads:actions.sendMessage', 'Send Message')}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleContextAction('schedule', lead.id)}>
              <Calendar className="mr-2 h-4 w-4" />
              {t('leads:actions.scheduleMeeting', 'Schedule Meeting')}
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        {/* Status Changes */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Tag className="mr-2 h-4 w-4" />
            {t('leads:actions.changeStatus', 'Change Status')}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => handleStatusChange('new')}>
              <Badge variant="outline" className="mr-2 bg-blue-50 text-blue-700">
                {t('leads:status.new', 'New')}
              </Badge>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleStatusChange('contacted')}>
              <Badge variant="outline" className="mr-2 bg-yellow-50 text-yellow-700">
                {t('leads:status.contacted', 'Contacted')}
              </Badge>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleStatusChange('qualified')}>
              <Badge variant="outline" className="mr-2 bg-orange-50 text-orange-700">
                {t('leads:status.qualified', 'Qualified')}
              </Badge>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleStatusChange('proposal')}>
              <Badge variant="outline" className="mr-2 bg-purple-50 text-purple-700">
                {t('leads:status.proposal', 'Proposal')}
              </Badge>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleStatusChange('won')}>
              <Badge variant="outline" className="mr-2 bg-green-50 text-green-700">
                {t('leads:status.won', 'Won')}
              </Badge>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleStatusChange('lost')}>
              <Badge variant="outline" className="mr-2 bg-red-50 text-red-700">
                {t('leads:status.lost', 'Lost')}
              </Badge>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuSeparator />
        
        {/* Organization Actions */}
        <ContextMenuItem onClick={() => handleContextAction('star', lead.id)}>
          <Star className="mr-2 h-4 w-4" />
          {t('leads:actions.addToFavorites', 'Add to Favorites')}
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => handleContextAction('assign', lead.id)}>
          <UserPlus className="mr-2 h-4 w-4" />
          {t('leads:actions.assignToUser', 'Assign to User')}
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => handleContextAction('tag', lead.id)}>
          <Tag className="mr-2 h-4 w-4" />
          {t('leads:actions.addTags', 'Add Tags')}
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {/* Copy Actions */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Copy className="mr-2 h-4 w-4" />
            {t('common:actions.copy', 'Copy')}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => handleContextAction('copy-id', lead.id)}>
              <Copy className="mr-2 h-4 w-4" />
              {t('leads:actions.copyLeadId', 'Copy Lead ID')}
            </ContextMenuItem>
            {lead.email && (
              <ContextMenuItem onClick={() => handleContextAction('copy-email', lead.id)}>
                <Mail className="mr-2 h-4 w-4" />
                {t('leads:actions.copyEmail', 'Copy Email')}
              </ContextMenuItem>
            )}
            {lead.phone && (
              <ContextMenuItem onClick={() => handleContextAction('copy-phone', lead.id)}>
                <Phone className="mr-2 h-4 w-4" />
                {t('leads:actions.copyPhone', 'Copy Phone')}
              </ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        {/* Export & Archive */}
        <ContextMenuItem onClick={() => handleContextAction('export', lead.id)}>
          <Download className="mr-2 h-4 w-4" />
          {t('leads:actions.exportLeadData', 'Export Lead Data')}
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => handleContextAction('archive', lead.id)}>
          <Archive className="mr-2 h-4 w-4" />
          {t('leads:actions.archiveLead', 'Archive Lead')}
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        {/* Destructive Actions */}
        <ContextMenuItem 
          onClick={() => handleContextAction('delete', lead.id)}
          className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {t('leads:actions.deleteLead', 'Delete Lead')}
          <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default EnhancedLeadTableRow; 