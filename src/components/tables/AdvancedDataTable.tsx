import React, { useState, useMemo, useCallback } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  VisibilityState,
  ColumnFiltersState,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { 
  Columns,
  Download,
  FileText,
  RefreshCw,
  Trash2,
  Archive,
  Tag,
  UserPlus,
  ChevronDown,
  Search,
  X,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { useTranslation } from 'react-i18next';

interface AdvancedDataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  enableRowSelection?: boolean;
  enableColumnHiding?: boolean;
  enableExport?: boolean;
  enableBulkActions?: boolean;
  isLoading?: boolean;
  className?: string;
  onRefresh?: () => void;
  onExport?: (data: TData[], format: 'csv' | 'pdf' | 'excel') => void;
  onBulkDelete?: (selectedIds: string[]) => void;
  onBulkArchive?: (selectedIds: string[]) => void;
  renderCustomRow?: (row: any) => React.ReactNode;
}

export function AdvancedDataTable<TData>({
  data,
  columns: initialColumns,
  title,
  description,
  searchPlaceholder = "Search...",
  enableRowSelection = true,
  enableColumnHiding = true,
  enableExport = true,
  enableBulkActions = true,
  isLoading = false,
  className,
  onRefresh,
  onExport,
  onBulkDelete,
  onBulkArchive,
  renderCustomRow,
}: AdvancedDataTableProps<TData>) {
  const { t } = useTranslation(['tables', 'common']);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  // Enhanced columns with selection checkbox
  const columns = useMemo(() => {
    const baseColumns = [...initialColumns];
    
    if (enableRowSelection) {
      baseColumns.unshift({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            size="table"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() ? "indeterminate" : false)
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label={t('tables:bulk.selectAll', 'Select all rows')}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            size="table"
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={t('tables:bulk.selectRow', 'Select row')}
          />
        ),
        enableSorting: false,
        enableHiding: false,
        size: 40,
      });
    }
    
    return baseColumns;
  }, [initialColumns, enableRowSelection, t]);

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
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length;
  const totalRowCount = table.getFilteredRowModel().rows.length;

  // Export functionality
  const handleExport = useCallback((format: 'csv' | 'pdf' | 'excel') => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const dataToExport = selectedRows.length > 0 
      ? selectedRows.map(row => row.original)
      : table.getFilteredRowModel().rows.map(row => row.original);
    
    if (onExport) {
      onExport(dataToExport, format);
    } else {
      // Default CSV export
      const headers = table.getVisibleFlatColumns()
        .filter(col => col.id !== 'select')
        .map(col => (col.columnDef as any).header || col.id);
      
      const csvData = dataToExport.map(row => 
        table.getVisibleFlatColumns()
          .filter(col => col.id !== 'select')
          .map(col => {
            const value = (row as any)[col.id];
            return typeof value === 'string' ? `"${value}"` : value || '';
          })
      );
      
      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [table, onExport]);

  // Bulk actions
  const getSelectedIds = () => {
    return table.getFilteredSelectedRowModel().rows.map(row => (row.original as any).id);
  };

  const handleBulkAction = (action: string) => {
    const selectedIds = getSelectedIds();
    if (selectedIds.length === 0) {
      toast.error(t('tables:bulk.noSelection', 'Please select at least one row'));
      return;
    }

    switch (action) {
      case 'delete':
        onBulkDelete?.(selectedIds);
        break;
      case 'archive':
        onBulkArchive?.(selectedIds);
        break;
      default:
        break;
    }
    
    setRowSelection({});
  };

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && (
            <CardTitle className="flex items-center justify-between">
              <span>{title}</span>
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRefresh}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
              )}
            </CardTitle>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
      )}
      
      <CardContent>
        <div className="space-y-4">
          {/* Top Controls */}
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2 flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={globalFilter ?? ""}
                  onChange={(event) => setGlobalFilter(String(event.target.value))}
                  className="pl-8"
                />
              </div>
              {globalFilter && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setGlobalFilter('')}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {enableExport && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      {t('tables:actions.export', 'Export')}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>{t('tables:export.format', 'Export Format')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <FileText className="mr-2 h-4 w-4" />
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('pdf')}>
                      <FileText className="mr-2 h-4 w-4" />
                      PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('excel')}>
                      <FileText className="mr-2 h-4 w-4" />
                      Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {enableColumnHiding && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Columns className="mr-2 h-4 w-4" />
                      {t('tables:controls.columns', 'Columns')}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{t('tables:controls.toggleColumns', 'Toggle Columns')}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
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
              )}
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {enableBulkActions && selectedRowCount > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {selectedRowCount} {t('tables:pagination.of', 'of')} {totalRowCount} {t('tables:bulk.selected', 'row(s) selected')}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRowSelection({})}
                >
                  {t('tables:bulk.clearSelection', 'Clear Selection')}
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('archive')}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  {t('tables:actions.archive', 'Archive')}
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('tables:actions.delete', 'Delete')}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <span>
                {t('tables:pagination.showing', 'Showing')} {table.getRowModel().rows.length} {t('tables:pagination.of', 'of')} {table.getFilteredRowModel().rows.length} {t('tables:pagination.entries', 'results')}
              </span>
              {globalFilter && (
                <Badge variant="outline">
                  {t('tables:filters.filteredBy', 'Filtered by')}: {globalFilter}
                </Badge>
              )}
            </div>
            
            {isLoading && (
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{t('tables:pagination.loading', 'Loading...')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border mt-4">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="h-12">
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
                  renderCustomRow ? 
                    renderCustomRow(row) :
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-muted/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>{t('tables:pagination.loading', 'Loading data...')}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        <span>{t('tables:pagination.noResults', 'No results found')}</span>
                        {globalFilter && (
                          <Button variant="ghost" size="sm" onClick={() => setGlobalFilter('')}>
                            {t('tables:filters.clearSearch', 'Clear search')}
                          </Button>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              {t('tables:pagination.page', 'Page')} {table.getState().pagination.pageIndex + 1} {t('tables:pagination.of', 'of')} {table.getPageCount()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              {t('tables:pagination.previous', 'Previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {t('tables:pagination.next', 'Next')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdvancedDataTable; 