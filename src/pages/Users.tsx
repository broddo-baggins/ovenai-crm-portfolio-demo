import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/ClientAuthContext";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  RefreshCw,
  UserPlus,
  LockKeyhole,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: string;
  clientId: string;
  clientName: string | null;
  projectCount: number;
}

const fetchUsers = async (): Promise<User[]> => {
  try {
    // Get the current session for authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      throw new Error('User not authenticated');
    }

    // Use Supabase Edge Function for user management
    const response = await fetch('/functions/v1/user-management', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch users`);
    }

    const result = await response.json();
    if (result.success) {
      return result.users || [];
    } else {
      throw new Error(result.error || 'Failed to fetch users');
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw new Error('Failed to fetch users');
  }
};

const Users = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const { t } = useTranslation("pages");
  const { isRTL } = useLang();
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const {
    data: users,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  // Form states
  const [newUser, setNewUser] = useState({
    email: "",
    name: "",
    password: "",
    role: "STAFF",
    clientId: "",
  });
  const [resetPassword, setResetPassword] = useState("");

  if (!hasPermission("SUPER_ADMIN") && !hasPermission("ADMIN")) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>You don't have permission to access this page.</p>
      </div>
    );
  }

  const filteredUsers = users?.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name &&
        user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.clientName &&
        user.clientName.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create user");
      }

      toast.success("User created successfully");
      setCreateDialogOpen(false);
      setNewUser({
        email: "",
        name: "",
        password: "",
        role: "STAFF",
        clientId: "",
      });
      refetch();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create user",
      );
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await fetch(
        `/api/users/${selectedUser.id}/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: resetPassword }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reset password");
      }

      toast.success("Password reset successfully");
      setResetDialogOpen(false);
      setResetPassword("");
      setSelectedUser(null);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password",
      );
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: string,
  ) => {
    try {
      const response = await fetch(`/api/users/${userId}/toggle-status`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user status");
      }

      const newStatus = currentStatus === "ACTIVE" ? "disabled" : "activated";
      toast.success(`User ${newStatus} successfully`);
      refetch();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update user status",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        Error loading users
      </div>
    );
  }

  return (
    <div
      className={cn("container mx-auto py-6", isRTL && "rtl")}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          {t("users.title", "User Directory")}
        </h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Add User</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system. They will receive a welcome
                  email with login instructions.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-email">Email</Label>
                    <Input
                      id="new-email"
                      type="email"
                      required
                      value={newUser.email}
                      onChange={(e) =>
                        setNewUser({ ...newUser, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-name">Name (optional)</Label>
                    <Input
                      id="new-name"
                      value={newUser.name}
                      onChange={(e) =>
                        setNewUser({ ...newUser, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      required
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-role">Role</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STAFF">Staff</SelectItem>
                        {currentUser?.role === "SUPER_ADMIN" && (
                          <>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="SUPER_ADMIN">
                              Super Admin
                            </SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">{t("users.createUser")}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="px-6 pt-6 pb-4">
          <CardTitle className="text-xl">Users</CardTitle>
          <div className="mt-2">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent className="px-6">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.name || "-"}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            user.role === "SUPER_ADMIN"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                              : user.role === "ADMIN"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-muted text-muted-foreground",
                          )}
                        >
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>{user.clientName || "-"}</TableCell>
                      <TableCell>{user.projectCount}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            user.status === "ACTIVE"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
                          )}
                        >
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setResetDialogOpen(true);
                              }}
                            >
                              <LockKeyhole className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleUserStatus(user.id, user.status)
                              }
                              disabled={user.role === "SUPER_ADMIN"}
                            >
                              {user.status === "ACTIVE" ? (
                                <>
                                  <ToggleLeft className="mr-2 h-4 w-4" />
                                  Disable User
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="mr-2 h-4 w-4" />
                                  Enable User
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("users.resetUserPassword")}</DialogTitle>
            <DialogDescription>
              {t("users.setNewPassword", { email: selectedUser?.email })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reset-password">{t("users.newPassword")}</Label>
                <Input
                  id="reset-password"
                  type="password"
                  required
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{t("users.resetPassword")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
