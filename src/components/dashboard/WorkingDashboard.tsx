import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Users,
  TrendingUp,
  Clock,
  ChevronRight,
  BarChart3,
  Calendar,
  Target,
} from "lucide-react";

// Service imports
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

const WorkingDashboard = () => {
  const { user, logout } = useSupabaseAuth();
  const [dashboardData, setDashboardData] = useState({
    totalLeads: 0,
    activeChats: 0,
    conversionRate: 0,
    responseTime: 0,
  });

  useEffect(() => {
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        // Placeholder for actual data fetching
        setDashboardData({
          totalLeads: 142,
          activeChats: 23,
          conversionRate: 18.5,
          responseTime: 2.3,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">Live</Badge>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.totalLeads}
              </div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Chats
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.activeChats}
              </div>
              <p className="text-xs text-muted-foreground">+5 from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Conversion Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.conversionRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dashboardData.responseTime}min
              </div>
              <p className="text-xs text-muted-foreground">
                -0.5min from last week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="ghost" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                View Active Conversations
                <ChevronRight className="ml-auto h-4 w-4" />
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Leads
                <ChevronRight className="ml-auto h-4 w-4" />
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Reports
                <ChevronRight className="ml-auto h-4 w-4" />
              </Button>
              <Button variant="ghost" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Meeting
                <ChevronRight className="ml-auto h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest updates and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">New lead from website form</p>
                    <p className="text-xs text-muted-foreground">
                      2 minutes ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">Meeting scheduled with John Doe</p>
                    <p className="text-xs text-muted-foreground">
                      15 minutes ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">Follow-up reminder for Sarah</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance Overview
            </CardTitle>
            <CardDescription>
              Key metrics and performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  89%
                </div>
                <p className="text-sm text-muted-foreground">
                  Lead Quality Score
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">4.8</div>
                <p className="text-sm text-muted-foreground">
                  Customer Satisfaction
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  92%
                </div>
                <p className="text-sm text-muted-foreground">
                  Goal Achievement
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Information Card - Development Only */}
        {import.meta.env.MODE === "development" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Debug Information</CardTitle>
                <CardDescription>
                  Development mode dashboard data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Leads:</span>
                    <span className="font-mono">
                      {dashboardData.totalLeads}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Active Conversations:
                    </span>
                    <span className="font-mono">
                      {dashboardData.activeChats}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Conversion Rate:
                    </span>
                    <span className="font-mono">
                      {dashboardData.conversionRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Response Time:
                    </span>
                    <span className="font-mono">
                      {dashboardData.responseTime}min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-mono text-xs">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkingDashboard;
