import React, { useState, useMemo } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Calendar, Clock, Phone, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { DateRange } from "react-day-picker";
import { format, addDays } from "date-fns";
import { useTranslation } from "react-i18next";

// Lead type from existing system
export type QueueLead = {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  queue_status: 'not_queued' | 'queued' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date?: string;
  created_at: string;
  updated_at: string;
  last_contacted?: string;
  attempts: number;
  heat_score?: number;
  bant_status?: string;
};

interface QueueDataTableProps {
  data: QueueLead[];
  onBulkQueue: (leadIds: string[], scheduledDate?: Date) => Promise<void>;
  onBulkRemove: (leadIds: string[]) => Promise<void>;
  onUpdateLead: (leadId: string, updates: Partial<QueueLead>) => Promise<void>;
  loading?: boolean;
}

// Column preset filters
const COLUMN_PRESETS = {
  'all': { label: 'All Leads', filter: {} },
  'new': { label: 'New Leads', filter: { status: 'new' } },
  'queued': { label: 'Queued', filter: { queue_status: 'queued' } },
  'no_phone': { label: 'No Phone', filter: { phone: null } },
  'high_priority': { label: 'High Priority', filter: { priority: ['high', 'urgent'] } },
  'never_contacted': { label: 'Never Contacted', filter: { last_contacted: null } }
};

export function QueueDataTable({ data, onBulkQueue, onBulkRemove, onUpdateLead, loading }: QueueDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [activePreset, setActivePreset] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7)
  });

  const { t } = useTranslation(['tables', 'common']);

  // Status badge colors
  const statusColors = {
    not_queued: 'bg-gray-100 text-gray-800',
    queued: 'bg-blue-100 text-blue-800', 
    processing: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800'
  };

  const getQueueStatusBadge = (status: string) => {
    const variants = {
      'not_queued': { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 border-gray-200' },
      'queued': { variant: 'default' as const, className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'processing': { variant: 'default' as const, className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'completed': { variant: 'default' as const, className: 'bg-green-100 text-green-800 border-green-200' },
      'failed': { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 border-red-200' }
    };
    return variants[status as keyof typeof variants] || { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 border-gray-200' };
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      'low': 'bg-gray-100 text-gray-800',
      'medium': 'bg-blue-100 text-blue-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return variants[priority as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const columns: ColumnDef<QueueLead>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          size="table"
          checked={
            table.getIsAllPageRowsSelected() 
              ? true 
              : table.getIsSomePageRowsSelected() 
              ? "indeterminate" 
              : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          data-testid="select-all-leads"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          size="table"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          data-testid={`select-lead-${row.original.id}`}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "full_name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="space-y-1">
            <div className="font-medium">{lead.full_name}</div>
            {lead.company && (
              <div className="text-sm text-muted-foreground">{lead.company}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Contact",
      cell: ({ row }) => {
        const lead = row.original;
        return (
          <div className="space-y-1">
            {lead.email && (
              <div className="flex items-center text-sm">
                <Mail className="mr-1 h-3 w-3" />
                {lead.email}
              </div>
            )}
            {lead.phone && (
              <div className="flex items-center text-sm">
                <Phone className="mr-1 h-3 w-3" />
                {lead.phone}
              </div>
            )}
            {!lead.email && !lead.phone && (
              <Badge variant="secondary" className="text-xs">No Contact</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Lead Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "queue_status",
      header: "Queue Status",
      cell: ({ row }) => {
        const status = row.getValue("queue_status") as string;
        const badgeConfig = getQueueStatusBadge(status);
        return (
          <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as string;
        return (
          <Badge className={getPriorityBadge(priority)}>
            {priority.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "heat_score",
      header: "Heat Score",
      cell: ({ row }) => {
        const score = row.getValue("heat_score") as number;
        if (!score) return <span className="text-muted-foreground">-</span>;
        
        const getHeatColor = (score: number) => {
          if (score >= 8) return "bg-red-100 text-red-800";
          if (score >= 6) return "bg-orange-100 text-orange-800";
          if (score >= 4) return "bg-yellow-100 text-yellow-800";
          return "bg-blue-100 text-blue-800";
        };
        
        return (
          <Badge className={getHeatColor(score)}>
            {score}/10
          </Badge>
        );
      },
    },
    {
      accessorKey: "attempts",
      header: "Attempts",
      cell: ({ row }) => {
        const attempts = row.getValue("attempts") as number;
        return (
          <div className="flex items-center">
            <MessageSquare className="mr-1 h-3 w-3" />
            {attempts || 0}
          </div>
        );
      },
    },
    {
      accessorKey: "scheduled_date",
      header: "Scheduled",
      cell: ({ row }) => {
        const date = row.getValue("scheduled_date") as string;
        if (!date) return <span className="text-muted-foreground">Not scheduled</span>;
        
        return (
          <div className="flex items-center text-sm">
            <Calendar className="mr-1 h-3 w-3" />
            {format(new Date(date), "MMM dd, yyyy")}
          </div>
        );
      },
    },
    {
      accessorKey: "last_contacted",
      header: "Last Contact",
      cell: ({ row }) => {
        const date = row.getValue("last_contacted") as string;
        if (!date) return <span className="text-muted-foreground">Never</span>;
        
        return (
          <div className="flex items-center text-sm">
            <Clock className="mr-1 h-3 w-3" />
            {format(new Date(date), "MMM dd")}
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
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
              <DropdownMenuItem
                onClick={() => onBulkQueue([lead.id], dateRange?.from)}
                disabled={lead.queue_status === 'queued'}
              >
                Add to Queue
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onBulkRemove([lead.id])}
                disabled={lead.queue_status === 'not_queued'}
              >
                Remove from Queue
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit Lead</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedLeadIds = selectedRows.map(row => row.original.id);

  const handleBulkQueue = async () => {
    if (selectedLeadIds.length === 0) {
      toast.error(t('tables:general.Please select leads to queue'));
      return;
    }
    
    try {
      await onBulkQueue(selectedLeadIds, dateRange?.from);
      toast.success(t(`tables:general.Successfully queued ${selectedLeadIds.length} leads`));
      setRowSelection({});
    } catch (error) {
      toast.error(t('tables:general.Failed to queue leads'));
    }
  };

  const handleBulkRemove = async () => {
    if (selectedLeadIds.length === 0) {
      toast.error(t('tables:general.Please select leads to remove'));
      return;
    }
    
    try {
      await onBulkRemove(selectedLeadIds);
      toast.success(t(`tables:general.Successfully removed ${selectedLeadIds.length} leads from queue`));
      setRowSelection({});
    } catch (error) {
      toast.error(t('tables:general.Failed to remove leads from queue'));
    }
  };

  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    const preset = COLUMN_PRESETS[presetKey as keyof typeof COLUMN_PRESETS];
    
    // Clear existing filters
    setColumnFilters([]);
    
    // Apply preset filters
    if (preset.filter) {
      const filters: ColumnFiltersState = [];
      Object.entries(preset.filter).forEach(([key, value]) => {
        if (value !== null) {
          filters.push({ id: key, value });
        }
      });
      setColumnFilters(filters);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header with bulk actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder={t("Filter leads...")}
            value={(table.getColumn("full_name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("full_name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
            data-testid="queue-search-input"
          />
          
          {/* Column presets */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                {COLUMN_PRESETS[activePreset as keyof typeof COLUMN_PRESETS]?.label}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("Filter Presets")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(COLUMN_PRESETS).map(([key, preset]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={activePreset === key}
                  onCheckedChange={() => applyPreset(key)}
                >
                  {preset.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center space-x-2">
          {/* Bulk actions */}
          {selectedLeadIds.length > 0 && (
            <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-md border">
              <span className="text-sm font-medium">
                {selectedLeadIds.length} {t("selected")}
              </span>
              <Button size="sm" onClick={handleBulkQueue}>
                {t("Queue Selected")}
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkRemove}>
                {t("Remove from Queue")}
              </Button>
            </div>
          )}

          {/* Date range picker */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">{t("Schedule Date")}:</label>
            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
            />
          </div>

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                {t("Columns")} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Data table */}
      <div className="rounded-md border" data-testid="queue-data-table">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  data-testid={`queue-table-row-${row.original.id}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {loading ? t("Loading leads...") : t("No leads found.")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} {t("of")}{" "}
          {table.getFilteredRowModel().rows.length} {t("row(s) selected.")}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t("Previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t("Next")}
          </Button>
        </div>
      </div>
    </div>
  );
} 