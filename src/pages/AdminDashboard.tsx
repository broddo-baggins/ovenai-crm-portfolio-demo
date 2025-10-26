import { useState, useEffect } from "react";
import { Check, X, Clock, Users, Shield, Bell, Building2, Target, TrendingUp, Flame, Database, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authService } from "@/integrations/supabase/client";
import { useAuth } from "@/context/ClientAuthContext";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";
import { getAdminStats, getRecentAdminActivity, AdminStats, AdminActivity } from "@/services/mockAdminService";
import { SystemStatusCard } from "@/components/admin/SystemStatusCard";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "user" | "admin" | "super_admin";
  status: "pending_approval" | "approved" | "rejected" | "suspended";
  provider: string;
  approved_at?: string;
  created_at: string;
}

interface AdminNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const { isRTL } = useLang();
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration - replace with real API calls later
      const mockPendingUsers: UserProfile[] = [
        {
          id: "user-1",
          email: "john.doe@example.com",
          first_name: "John",
          last_name: "Doe",
          role: "user",
          status: "pending_approval",
          provider: "google",
          created_at: new Date().toISOString(),
        },
      ];

      const mockAllUsers: UserProfile[] = [
        ...mockPendingUsers,
        {
          id: user.id,
          email: user.email || "admin@test.com",
          first_name: "Admin",
          last_name: "User",
          role: "super_admin",
          status: "approved",
          provider: "email",
          approved_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ];

      setPendingUsers(mockPendingUsers);
      setAllUsers(mockAllUsers);
      setNotifications([]); // Empty notifications for now
      
      // Load admin stats and activity
      setAdminStats(getAdminStats());
      setRecentActivity(getRecentAdminActivity());
    } catch (err) {
      console.error("Error loading admin data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load admin data",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!user) return;

    try {
      // TODO: Implement user approval with authService
      console.log("Approving user:", userId);

      // Update local state
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                status: "approved" as const,
                approved_at: new Date().toISOString(),
              }
            : u,
        ),
      );

      alert("User approved successfully!");
    } catch (err) {
      console.error("Error approving user:", err);
      alert(
        "Failed to approve user: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    }
  };

  const handleRejectUser = async (userId: string) => {
    if (!user) return;

    const reason = prompt("Enter rejection reason (optional):");

    try {
      // TODO: Implement user rejection with authService
      console.log("Rejecting user:", userId, "reason:", reason);

      // Update local state
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      setAllUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: "rejected" as const } : u,
        ),
      );

      alert("User rejected successfully!");
    } catch (err) {
      console.error("Error rejecting user:", err);
      alert(
        "Failed to reject user: " +
          (err instanceof Error ? err.message : "Unknown error"),
      );
    }
  };

  const handleMarkNotificationRead = async (notificationId: string) => {
    if (!user) return;

    try {
      // TODO: Implement notification marking with authService
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending_approval":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
          >
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
          >
            <Check className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge
            variant="secondary"
            className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
          >
            <X className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      case "suspended":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200"
          >
            <Shield className="w-3 h-3 mr-1" />
            Suspended
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge variant="destructive">Super Admin</Badge>;
      case "admin":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
          >
            Admin
          </Badge>
        );
      case "user":
        return <Badge variant="outline">User</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="max-w-md mx-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <div
      className={cn("container mx-auto p-6 space-y-6", isRTL && "rtl")}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage user access and system settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadNotifications > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadNotifications}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Pending Users
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {adminStats?.pendingUsers || pendingUsers.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">
                  {adminStats?.totalUsers || allUsers.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Projects</p>
                <p className="text-2xl font-bold text-purple-600">
                  {adminStats?.totalProjects || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-cyan-600" />
              <div>
                <p className="text-sm text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold text-cyan-600">
                  {adminStats?.totalClients || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Leads</p>
                <p className="text-2xl font-bold text-green-600">
                  {adminStats?.totalLeads || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Flame className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Hot Leads</p>
                <p className="text-2xl font-bold text-orange-600">
                  {adminStats?.hotLeads || 0} + {adminStats?.burningLeads || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Approval ({pendingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="all">All Users ({allUsers.length})</TabsTrigger>
          <TabsTrigger value="system">
            System Status
          </TabsTrigger>
          <TabsTrigger value="activity">
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="notifications">
            Notifications ({unreadNotifications})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Users Pending Approval</CardTitle>
              <CardDescription>
                Review and approve new user registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-muted" />
                  <p>No users pending approval</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium">
                              {user.first_name} {user.last_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            {getStatusBadge(user.status)}
                            <Badge variant="outline">{user.provider}</Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Registered:{" "}
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveUser(user.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectUser(user.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Complete list of all users in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <h4 className="font-medium">
                            {user.first_name} {user.last_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          {getStatusBadge(user.status)}
                          {getRoleBadge(user.role)}
                          <Badge variant="outline">{user.provider}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Registered:{" "}
                        {new Date(user.created_at).toLocaleDateString()}
                        {user.approved_at && (
                          <span>
                            {" "}
                            • Approved:{" "}
                            {new Date(user.approved_at).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Notifications</CardTitle>
              <CardDescription>
                System notifications and user registration alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-muted" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border border-border rounded-lg ${notification.read ? "bg-muted/50" : "bg-primary/5"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleMarkNotificationRead(notification.id)
                            }
                          >
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <SystemStatusCard />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle>Recent Admin Activity</CardTitle>
              </div>
              <CardDescription>
                Recent administrative actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-muted" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="font-medium">
                              {activity.action}
                            </Badge>
                            <span className="text-sm text-muted-foreground">→</span>
                            <span className="text-sm font-medium">{activity.target}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {activity.details}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>By: {activity.user}</span>
                            <span>•</span>
                            <span>{new Date(activity.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
