import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  Search,
  Settings2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/hooks/useLang";
import { useTranslation } from "react-i18next";

interface ModernDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  onRowClick?: (row: TData) => void;
  isLoading?: boolean;
  className?: string;
  exportFileName?: string;
  enableColumnFilters?: boolean;
  enableGlobalFilter?: boolean;
  enableSorting?: boolean;
  enableColumnVisibility?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
}

function ModernDataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search...",
  onRowClick,
  isLoading = false,
  className,
  exportFileName = "table-data",
  enableColumnFilters = true,
  enableGlobalFilter = true,
  enableSorting = true,
  enableColumnVisibility = true,
  enablePagination = true,
  pageSize = 10,
}: ModernDataTableProps<TData, TValue>) {
  const { t } = useTranslation(['tables', 'common']);
  const { isRTL } = useLang();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState<string>("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableGlobalFilter || enableColumnFilters ? getFilteredRowModel() : undefined,
    onSortingChange: enableSorting ? setSorting : undefined,
    onColumnFiltersChange: enableColumnFilters ? setColumnFilters : undefined,
    onColumnVisibilityChange: enableColumnVisibility ? setColumnVisibility : undefined,
    onGlobalFilterChange: enableGlobalFilter ? setGlobalFilter : undefined,
    globalFilterFn: "includesString",
    state: {
      sorting: enableSorting ? sorting : undefined,
      columnFilters: enableColumnFilters ? columnFilters : undefined,
      columnVisibility: enableColumnVisibility ? columnVisibility : undefined,
      globalFilter: enableGlobalFilter ? globalFilter : undefined,
      pagination: enablePagination ? { pageIndex: 0, pageSize } : undefined,
    },
    initialState: {
      pagination: enablePagination ? { pageIndex: 0, pageSize } : undefined,
    },
  });

  const handleExport = () => {
    const headers = columns.map(col => (col as any).header || (col as any).accessorKey || "").join(",");
    const csvData = data.map(row => 
      columns.map(col => {
        const value = (row as any)[(col as any).accessorKey];
        return typeof value === 'string' ? `"${value}"` : value || "";
      }).join(",")
    );
    
    const csvContent = [headers, ...csvData].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${exportFileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getSortIcon = (sortDirection: false | "asc" | "desc") => {
    if (sortDirection === "asc") return <ArrowUp className="h-3 w-3" />;
    if (sortDirection === "desc") return <ArrowDown className="h-3 w-3" />;
    return <ArrowUpDown className="h-3 w-3 opacity-50" />;
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="flex space-x-2">
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="rounded-lg border bg-white dark:bg-slate-900">
          <div className="p-4">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div key={i} className="flex space-x-4 py-2">
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        {enableGlobalFilter && (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          {enableColumnFilters && (
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {t('tables:filters.filter', 'Filter')}
            </Button>
          )}
          
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-4 w-4 mr-2" />
                  {t('tables:controls.columns', 'Columns')}
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {(column.columnDef as any).header || column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t('tables:actions.export', 'Export')}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-white dark:bg-slate-900 shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-medium">
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          "flex items-center space-x-2",
                          header.column.getCanSort() && "cursor-pointer select-none hover:bg-muted/50 -mx-2 px-2 py-1 rounded"
                        )}
                        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                      >
                        <span className="flex-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                        {header.column.getCanSort() && (
                          <div className="flex flex-col">
                            {getSortIcon(header.column.getIsSorted())}
                          </div>
                        )}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "hover:bg-muted/50",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
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
                  {t('tables:pagination.noResults', 'No results found')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {enablePagination && (
        <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} {t('tables:pagination.of', 'of')} {table.getFilteredRowModel().rows.length} {t('tables:pagination.entries', 'row(s) total')}.
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">{t('tables:pagination.rowsPerPage', 'Rows per page')}</p>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-[100px] items-center justify-center text-sm font-medium">
              {t('tables:pagination.page', 'Page')} {table.getState().pagination.pageIndex + 1} {t('tables:pagination.of', 'of')} {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { ModernDataTable }; 