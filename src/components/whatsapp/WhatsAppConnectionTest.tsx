import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Phone,
  MessageSquare,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { env } from "@/config/env";
import { WhatsAppService } from "@/services/whatsapp-api";

interface ConnectionStatus {
  configured: boolean;
  connected: boolean;
  businessProfile?: any;
  phoneNumber?: string;
  businessName?: string;
  healthStatus?: string;
  error?: string;
}

interface TestResult {
  test: string;
  status: "success" | "error" | "warning";
  message: string;
  details?: string;
}

const WhatsAppConnectionTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    configured: false,
    connected: false,
  });
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [showTokens, setShowTokens] = useState(false);
  const [whatsappService, setWhatsappService] =
    useState<WhatsAppService | null>(null);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = () => {
    const results: TestResult[] = [];

    // Check environment configuration
    if (env.WHATSAPP_ACCESS_TOKEN) {
      results.push({
        test: "Access Token",
        status: "success",
        message: "Access token is configured",
        details: `Token length: ${env.WHATSAPP_ACCESS_TOKEN.length} characters`,
      });
    } else {
      results.push({
        test: "Access Token",
        status: "error",
        message: "Access token is missing",
        details: "Set VITE_WHATSAPP_ACCESS_TOKEN in your .env.local file",
      });
    }

    if (env.WHATSAPP_PHONE_NUMBER_ID) {
      results.push({
        test: "Phone Number ID",
        status: "success",
        message: "Phone Number ID is configured",
        details: env.WHATSAPP_PHONE_NUMBER_ID,
      });
    } else {
      results.push({
        test: "Phone Number ID",
        status: "warning",
        message: "Phone Number ID is missing",
        details:
          "Get this from Meta Business Manager > WhatsApp > Phone Numbers",
      });
    }

    if (env.WHATSAPP_APP_SECRET) {
      results.push({
        test: "App Secret",
        status: "success",
        message: "App Secret is configured",
        details: "Required for webhook signature verification",
      });
    } else {
      results.push({
        test: "App Secret",
        status: "warning",
        message: "App Secret is missing",
        details: "Get this from Meta Developers > App > Settings > Basic",
      });
    }

    // Try to initialize WhatsApp service
    try {
      const service = new WhatsAppService();
      setWhatsappService(service);
      results.push({
        test: "Service Initialization",
        status: "success",
        message: "WhatsApp service initialized successfully",
        details: "Ready to make API calls",
      });
    } catch (error) {
      results.push({
        test: "Service Initialization",
        status: "error",
        message: "Failed to initialize WhatsApp service",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }

    setTestResults(results);
    setConnectionStatus({
      configured: env.isWhatsAppConfigured,
      connected: false,
    });
  };

  const testConnection = async () => {
    if (!whatsappService) {
      toast.error("WhatsApp service not initialized");
      return;
    }

    setLoading(true);
    console.log("TEST Testing WhatsApp API connection...");

    try {
      // Test business profile retrieval
      const businessProfile = await whatsappService.getBusinessProfile();
      const connectionData = await whatsappService.getConnectionStatus();

      if (businessProfile || connectionData.connected) {
        setConnectionStatus({
          configured: true,
          connected: true,
          businessProfile,
          phoneNumber: connectionData.phoneNumber,
          businessName: connectionData.businessName,
          healthStatus: connectionData.healthStatus,
        });

        const newResults: TestResult[] = [...testResults];
        newResults.push({
          test: "API Connection",
          status: "success",
          message: "Successfully connected to WhatsApp Business API",
          details: `Business: ${connectionData.businessName || "Unknown"}`,
        });

        if (businessProfile) {
          newResults.push({
            test: "Business Profile",
            status: "success",
            message: "Business profile retrieved successfully",
            details: `Profile: ${businessProfile.about || "No description"}`,
          });
        }

        setTestResults(newResults);
        toast.success("WhatsApp API connection successful!");
      } else {
        throw new Error("Failed to retrieve business information");
      }
    } catch (error) {
      console.error("ERROR Connection test failed:", error);

      const newResults: TestResult[] = [...testResults];
      newResults.push({
        test: "API Connection",
        status: "error",
        message: "Failed to connect to WhatsApp Business API",
        details: error instanceof Error ? error.message : "Unknown error",
      });

      setTestResults(newResults);
      setConnectionStatus((prev) => ({
        ...prev,
        connected: false,
        error: error instanceof Error ? error.message : "Connection failed",
      }));

      toast.error("WhatsApp API connection failed");
    } finally {
      setLoading(false);
    }
  };

  const testSendMessage = async () => {
    if (!whatsappService || !testPhoneNumber.trim()) {
      toast.error("Please enter a phone number to test");
      return;
    }

    setLoading(true);

    try {
      const testMessage =
        "Hello! This is a test message from Oven AI WhatsApp integration. INIT";
      const result = await whatsappService.sendMessage(
        testPhoneNumber,
        testMessage,
      );

      if (result) {
        const newResults: TestResult[] = [...testResults];
        newResults.push({
          test: "Send Message",
          status: "success",
          message: `Test message sent successfully to ${testPhoneNumber}`,
          details: `Message ID: ${result.messages[0]?.id || "Unknown"}`,
        });
        setTestResults(newResults);
        toast.success("Test message sent successfully!");
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("ERROR Message test failed:", error);

      const newResults: TestResult[] = [...testResults];
      newResults.push({
        test: "Send Message",
        status: "error",
        message: "Failed to send test message",
        details: error instanceof Error ? error.message : "Unknown error",
      });
      setTestResults(newResults);
      toast.error("Failed to send test message");
    } finally {
      setLoading(false);
    }
  };

  const copyConfiguration = () => {
    const config = `# WhatsApp Business API Configuration
VITE_WHATSAPP_ACCESS_TOKEN=${env.WHATSAPP_ACCESS_TOKEN || "YOUR_ACCESS_TOKEN"}
VITE_WHATSAPP_PHONE_NUMBER_ID=${env.WHATSAPP_PHONE_NUMBER_ID || "YOUR_PHONE_NUMBER_ID"}
VITE_WHATSAPP_APP_SECRET=${env.WHATSAPP_APP_SECRET || "YOUR_APP_SECRET"}
VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN=oven-ai-webhook-2024`;

    navigator.clipboard.writeText(config);
    toast.success("Configuration copied to clipboard");
  };

  const getStatusIcon = (status: "success" | "error" | "warning") => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: "success" | "error" | "warning") => {
    switch (status) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">WhatsApp API Connection Test</h2>
          <p className="text-gray-600">
            Test your live WhatsApp Business API integration
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={checkConfiguration} variant="outline">
            Recheck Config
          </Button>
          <Button onClick={copyConfiguration} variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Copy Config
          </Button>
        </div>
      </div>

      {/* Connection Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${connectionStatus.configured ? "bg-green-500" : "bg-red-500"}`}
              ></div>
              <div>
                <p className="font-medium">Configuration</p>
                <p className="text-sm text-gray-600">
                  {connectionStatus.configured ? "Complete" : "Incomplete"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${connectionStatus.connected ? "bg-green-500" : "bg-gray-400"}`}
              ></div>
              <div>
                <p className="font-medium">API Connection</p>
                <p className="text-sm text-gray-600">
                  {connectionStatus.connected ? "Connected" : "Not tested"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Message Testing</p>
                <p className="text-sm text-gray-600">Ready to test</p>
              </div>
            </div>
          </div>

          {connectionStatus.businessName && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm">
                <strong>Business:</strong> {connectionStatus.businessName}
              </p>
              {connectionStatus.phoneNumber && (
                <p className="text-sm">
                  <strong>Phone:</strong> {connectionStatus.phoneNumber}
                </p>
              )}
            </div>
          )}

          {connectionStatus.error && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {connectionStatus.error}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Configuration Details</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTokens(!showTokens)}
            >
              {showTokens ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {showTokens ? "Hide" : "Show"} Tokens
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Access Token</label>
                <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                  {showTokens
                    ? env.WHATSAPP_ACCESS_TOKEN || "Not set"
                    : env.WHATSAPP_ACCESS_TOKEN
                      ? `${env.WHATSAPP_ACCESS_TOKEN.substring(0, 20)}...`
                      : "Not set"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Phone Number ID</label>
                <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                  {env.WHATSAPP_PHONE_NUMBER_ID || "Not set"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{result.test}</span>
                    <Badge
                      variant={
                        result.status === "success"
                          ? "default"
                          : result.status === "error"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {result.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={testConnection}
          disabled={loading || !connectionStatus.configured}
          className="flex items-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Phone className="h-4 w-4" />
          )}
          Test Connection
        </Button>

        <div className="flex gap-2 flex-1">
          <Input
            placeholder="Enter phone number (+1234567890)"
            value={testPhoneNumber}
            onChange={(e) => setTestPhoneNumber(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={testSendMessage}
            disabled={
              loading || !connectionStatus.connected || !testPhoneNumber.trim()
            }
            variant="outline"
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="h-4 w-4" />
            )}
            Send Test
          </Button>
        </div>
      </div>

      {/* Quick Setup Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Setup Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://business.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <div>
                <p className="font-medium">Meta Business Manager</p>
                <p className="text-sm text-gray-600">Get Phone Number ID</p>
              </div>
            </a>
            <a
              href="https://developers.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <div>
                <p className="font-medium">Meta Developers</p>
                <p className="text-sm text-gray-600">Get App Secret</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppConnectionTest;
