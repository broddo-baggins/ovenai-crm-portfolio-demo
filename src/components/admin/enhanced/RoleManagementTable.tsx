// @ts-nocheck
// TEMP: TypeScript compatibility issues - systematic fix needed

import React, { useState, useEffect } from 'react';
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
} from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, ChevronDown, UserCog, Shield, Users, Eye, Edit, Trash2, Mail, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/ClientAuthContext';

// Data types
interface UserRole {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'owner' | 'admin' | 'manager' | 'member';
  status: 'active' | 'inactive' | 'pending';
  last_login: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string;
  client_id?: string;
  phone?: string;
  avatar_url?: string;
}

interface RoleManagementTableProps {
  className?: string;
}

// Role badge component
const RoleBadge = ({ role }: { role: string }) => {
  const variants = {
    owner: { variant: 'destructive' as const, icon: Shield },
    admin: { variant: 'default' as const, icon: UserCog },
    manager: { variant: 'secondary' as const, icon: Users },
    member: { variant: 'outline' as const, icon: Eye },
  };

  const config = variants[role as keyof typeof variants] || variants.member;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const variants = {
    active: 'default',
    inactive: 'secondary',
    pending: 'outline',
  };

  return (
    <Badge variant={variants[status as keyof typeof variants] as any}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

// Column header component for sorting
interface DataTableColumnHeaderProps<TData, TValue> {
  column: any;
  title: string;
}

function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div>{title}</div>;
  }

  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <ArrowUpDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
            <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Hide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function RoleManagementTable({ className }: RoleManagementTableProps) {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRole | null>(null);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [newRole, setNewRole] = useState<string>('');

  // Define columns
  const columns: ColumnDef<UserRole>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          size="table"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          size="table"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "full_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
              <AvatarFallback>
                {user.first_name?.[0]}{user.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.full_name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => <RoleBadge role={row.getValue("role")} />,
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      accessorKey: "client_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Client" />
      ),
      cell: ({ row }) => {
        const clientName = row.getValue("client_name") as string;
        return clientName ? (
          <Badge variant="outline">{clientName}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      accessorKey: "last_login",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Login" />
      ),
      cell: ({ row }) => {
        const lastLogin = row.getValue("last_login") as string;
        if (!lastLogin) return <span className="text-muted-foreground">Never</span>;
        
        const date = new Date(lastLogin);
        const now = new Date();
        const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
        
        if (diffHours < 24) {
          return <span className="text-green-600">Today</span>;
        } else if (diffHours < 168) {
          return <span className="text-yellow-600">This week</span>;
        } else {
          return <span className="text-muted-foreground">{date.toLocaleDateString()}</span>;
        }
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return <span className="text-muted-foreground">{date.toLocaleDateString()}</span>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;
        const isCurrentUser = user.id === currentUser?.id;
        
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
              <DropdownMenuItem onClick={() => handleViewUser(user)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => handleEditUser(user)}
                disabled={isCurrentUser}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSendEmail(user)}>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              {user.phone && (
                <DropdownMenuItem onClick={() => handleCallUser(user)}>
                  <Phone className="mr-2 h-4 w-4" />
                  Call User
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteUser(user)}
                disabled={isCurrentUser}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Access
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Create table instance
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

  // Load data
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get users with client information
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          *,
          client_members!inner(
            role,
            client_id,
            clients!inner(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const users: UserRole[] = profiles?.map((profile: any) => ({
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        full_name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
        role: profile.client_members?.[0]?.role || 'member',
        status: profile.status || 'active',
        last_login: profile.last_login,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        client_name: profile.client_members?.[0]?.clients?.name,
        client_id: profile.client_members?.[0]?.client_id,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
      })) || [];

      setData(users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Action handlers
  const handleViewUser = (user: UserRole) => {
    // Open user details view
    toast.info(`Viewing details for ${user.full_name}`);
  };

  const handleEditUser = (user: UserRole) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setEditDialogOpen(true);
  };

  const handleDeleteUser = (user: UserRole) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleSendEmail = (user: UserRole) => {
    window.open(`mailto:${user.email}`, '_blank');
  };

  const handleCallUser = (user: UserRole) => {
    if (user.phone) {
      window.open(`tel:${user.phone}`, '_blank');
    }
  };

  const handleBulkAction = (action: string) => {
    setBulkAction(action);
    setBulkActionDialogOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('client_members')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('user_id', selectedUser.id)
        .eq('client_id', selectedUser.client_id);

      if (error) throw error;

      toast.success(`Role updated to ${newRole}`);
      setEditDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('client_members')
        .delete()
        .eq('user_id', selectedUser.id)
        .eq('client_id', selectedUser.client_id);

      if (error) throw error;

      toast.success(`Removed access for ${selectedUser.full_name}`);
      setDeleteDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error('Error removing user access:', error);
      toast.error('Failed to remove user access');
    }
  };

  const confirmBulkAction = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedUserIds = selectedRows.map(row => row.original.id);

    try {
      if (bulkAction === 'delete') {
        const { error } = await supabase
          .from('client_members')
          .delete()
          .in('user_id', selectedUserIds);

        if (error) throw error;
        toast.success(`Removed access for ${selectedUserIds.length} users`);
      } else if (bulkAction === 'role_change') {
        const { error } = await supabase
          .from('client_members')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .in('user_id', selectedUserIds);

        if (error) throw error;
        toast.success(`Updated role for ${selectedUserIds.length} users`);
      }

      setBulkActionDialogOpen(false);
      setRowSelection({});
      loadUsers();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const selectedRowCount = Object.keys(rowSelection).length;

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Role Management
          </CardTitle>
          <CardDescription>
            Manage user roles and permissions across your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Toolbar */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Filter users..."
                value={(table.getColumn("full_name")?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn("full_name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              
              {/* Role filter */}
              <Select
                value={(table.getColumn("role")?.getFilterValue() as string) ?? ""}
                onValueChange={(value) =>
                  table.getColumn("role")?.setFilterValue(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>

              {/* Status filter */}
              <Select
                value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
                onValueChange={(value) =>
                  table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              {/* Bulk actions */}
              {selectedRowCount > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedRowCount} selected
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('role_change')}
                  >
                    Change Role
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                    className="text-red-600"
                  >
                    Remove Access
                  </Button>
                </div>
              )}

              {/* Column visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
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

          {/* Table */}
          <div className="rounded-md border">
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
                      {loading ? 'Loading...' : 'No results.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {selectedRowCount > 0 && (
                <span>
                  {selectedRowCount} of{" "}
                  {table.getFilteredRowModel().rows.length} row(s) selected.
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for {selectedUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Role</label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRoleChange}>
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove access for {selectedUser?.full_name}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <Alert className="mt-4">
            <AlertDescription>
              This will remove the user's access to this client but will not delete their account.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser}>
              Remove Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Action</DialogTitle>
            <DialogDescription>
              Apply changes to {selectedRowCount} selected users
            </DialogDescription>
          </DialogHeader>
          
          {bulkAction === 'role_change' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">New Role</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {bulkAction === 'delete' && (
            <Alert>
              <AlertDescription>
                This will remove access for {selectedRowCount} users. This action cannot be undone.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant={bulkAction === 'delete' ? 'destructive' : 'default'}
              onClick={confirmBulkAction}
            >
              {bulkAction === 'delete' ? 'Remove Access' : 'Update Roles'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 