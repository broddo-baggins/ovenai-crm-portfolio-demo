import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { AuthService } from "@/services/auth";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { cn } from "@/lib/utils";

interface TestResult {
  name: string;
  status: "pending" | "success" | "error";
  message: string;
  duration?: number;
}

const ConnectionTest = () => {
  const { user } = useSupabaseAuth();
  const { t } = useTranslation("pages");
  const { isRTL } = useLang();
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);

  const runConnectionTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const tests = [
      {
        name: "Database Connection",
        test: async () => {
          const start = Date.now();
          try {
            await AuthService.getCurrentUser();
            const duration = Date.now() - start;
            return {
              status: "success" as const,
              message: `Connected successfully (${duration}ms)`,
              duration,
            };
          } catch (error) {
            return {
              status: "error" as const,
              message:
                error instanceof Error ? error.message : "Connection failed",
            };
          }
        },
      },
      {
        name: "Authentication Status",
        test: async () => {
          const start = Date.now();
          try {
            const isAuth = await AuthService.isAuthenticated();
            const duration = Date.now() - start;
            return {
              status: "success" as const,
              message: `Authentication check completed. Status: ${isAuth ? "Authenticated" : "Not authenticated"} (${duration}ms)`,
              duration,
            };
          } catch (error) {
            return {
              status: "error" as const,
              message:
                error instanceof Error
                  ? error.message
                  : "Authentication check failed",
            };
          }
        },
      },
      {
        name: "Session Status",
        test: async () => {
          const start = Date.now();
          try {
            const session = await AuthService.getSession();
            const duration = Date.now() - start;
            return {
              status: "success" as const,
              message: `Session check completed. ${session.data ? "Active session" : "No active session"} (${duration}ms)`,
              duration,
            };
          } catch (error) {
            return {
              status: "error" as const,
              message:
                error instanceof Error ? error.message : "Session check failed",
            };
          }
        },
      },
    ];

    const results: TestResult[] = [];

    for (const test of tests) {
      // Add pending test
      const pendingResult: TestResult = {
        name: test.name,
        status: "pending",
        message: "Running...",
      };
      results.push(pendingResult);
      setTestResults([...results]);

      // Run test
      const result = await test.test();

      // Update result
      results[results.length - 1] = {
        name: test.name,
        ...result,
      };
      setTestResults([...results]);
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Running</Badge>;
      case "success":
        return (
          <Badge variant="default" className="bg-green-500">
            Success
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Unknown</Badge>;
    }
  };

  return (
    <div
      className={cn("container mx-auto p-6 max-w-4xl", isRTL && "rtl")}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {t("connectionTest.title", "Connection Test")}
        </h1>
        <p className="text-muted-foreground">
          {t(
            "connectionTest.description",
            "Test database connectivity and authentication status",
          )}
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              System Status
              <Button
                onClick={runConnectionTests}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                {isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
                {isRunning ? "Running Tests..." : "Run Tests"}
              </Button>
            </CardTitle>
            <CardDescription>
              Current user: {user?.email || "Not authenticated"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-muted-foreground">
                Click "Run Tests" to start testing connections
              </p>
            ) : (
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h3 className="font-medium">{result.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {result.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.duration && (
                        <span className="text-xs text-muted-foreground">
                          {result.duration}ms
                        </span>
                      )}
                      {getStatusBadge(result.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
            <CardDescription>Current environment configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Environment</h4>
                <p className="text-sm text-muted-foreground">
                  {import.meta.env.MODE || "development"}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Supabase URL</h4>
                <p className="text-sm text-muted-foreground">
                  {import.meta.env.VITE_SUPABASE_URL
                    ? "Configured"
                    : "Not configured"}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Authentication</h4>
                <p className="text-sm text-muted-foreground">
                  {user ? "Authenticated" : "Not authenticated"}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">User ID</h4>
                <p className="text-sm text-muted-foreground">
                  {user?.id || "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ConnectionTest;
