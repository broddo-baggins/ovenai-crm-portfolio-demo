/**
 * Integrations Settings Component
 * Secure UI for users to manage their third-party integration credentials
 */

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  AlertTriangle,
  Settings,
  Eye,
  EyeOff,
  Save,
  TestTube,
  ExternalLink,
  Shield,
  Calendar,
  MessageSquare,
  Zap,
  Trash2,
  XCircle,
  RefreshCw,
  Loader2,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { userIntegrationsService } from "@/services/userIntegrationsService";
import { encryptionUtils } from "@/lib/encryption";
import type {
  IntegrationType,
  IntegrationStatus,
  UserIntegration,
  IntegrationCredentials,
} from "@/types/integrations";
import { INTEGRATION_CONFIGS } from "@/types/integrations";
import { userSettingsService } from "@/services/userSettingsService";
import { calendlyService } from "@/services/calendlyService";
// @ts-ignore - Temporary fix for production build
import { SafariOAuthHelper } from "./SafariOAuthHelper";

interface IntegrationsSettingsProps {
  className?: string;
}

interface FormData {
  integration_name: string;
  client_id: string;
  client_secret: string;
  webhook_secret: string;
  redirect_uri: string;
  scopes: string;
}

interface CalendlyConnectionStatus {
  isConnected: boolean;
  connectionDate?: string;
  error?: string;
  isLoading: boolean;
}

export function IntegrationsSettings({ className }: IntegrationsSettingsProps) {
  const { t } = useTranslation("pages");
  const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<IntegrationType | null>(null);
  const [testing, setTesting] = useState<IntegrationType | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>(
    {},
  );

  // Calendly-specific state
  const [calendlyStatus, setCalendlyStatus] =
    useState<CalendlyConnectionStatus>({
      isConnected: false,
      isLoading: false,
    });
  
  // PAT connection state
  const [patInput, setPatInput] = useState("");
  const [patLoading, setPatLoading] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<'oauth' | 'pat'>('oauth');

  // Form states for each integration type
  const [formData, setFormData] = useState<Record<IntegrationType, FormData>>({
    calendly: {
      integration_name: "My Calendly",
      client_id: "", // Will be loaded from user's stored credentials
      client_secret: "", // Will be loaded from user's stored credentials
      webhook_secret: "", // Will be loaded from user's stored credentials
      redirect_uri: window.location.origin + "/auth/calendly/callback",
      scopes: "default",
    },
    whatsapp: {
      integration_name: "My WhatsApp",
      client_id: "",
      client_secret: "",
      webhook_secret: "",
      redirect_uri: "",
      scopes: "messages",
    },
    slack: {
      integration_name: "My Slack",
      client_id: "",
      client_secret: "",
      webhook_secret: "",
      redirect_uri: window.location.origin + "/auth/slack/callback",
      scopes: "chat:write,channels:read",
    },
    zoom: {
      integration_name: "My Zoom",
      client_id: "",
      client_secret: "",
      webhook_secret: "",
      redirect_uri: window.location.origin + "/auth/zoom/callback",
      scopes: "meeting:write",
    },
    google_calendar: {
      integration_name: "My Google Calendar",
      client_id: "",
      client_secret: "",
      webhook_secret: "",
      redirect_uri: window.location.origin + "/auth/google/callback",
      scopes: "https://www.googleapis.com/auth/calendar",
    },
  });

  const [statuses, setStatuses] = useState<
    Record<IntegrationType, IntegrationStatus>
  >({} as any);

  useEffect(() => {
    loadIntegrations();
    loadCalendlyStatus();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const result = await userIntegrationsService.getUserIntegrations();
      if (result.success && result.data) {
        setIntegrations(result.data);

        // Load existing credentials into form
        for (const integration of result.data) {
          const decrypted = encryptionUtils.decryptCredentials(integration);
          setFormData((prev) => ({
            ...prev,
            [integration.integration_type]: {
              integration_name:
                integration.integration_name ||
                INTEGRATION_CONFIGS[integration.integration_type].name,
              client_id: decrypted.clientId,
              client_secret: decrypted.clientSecret,
              webhook_secret: decrypted.webhookSecret,
              redirect_uri: integration.redirect_uri || "",
              scopes: integration.scopes?.join(",") || "",
            },
          }));
        }

        // Load statuses
        const statusPromises = Object.keys(INTEGRATION_CONFIGS).map(
          async (type) => {
            const statusResult =
              await userIntegrationsService.getIntegrationStatus(
                type as IntegrationType,
              );
            return { type: type as IntegrationType, status: statusResult.data };
          },
        );

        const statusResults = await Promise.all(statusPromises);
        const newStatuses: Record<IntegrationType, IntegrationStatus> =
          {} as any;
        statusResults.forEach(({ type, status }) => {
          if (status) newStatuses[type] = status;
        });
        setStatuses(newStatuses);
      }
    } catch (error) {
      console.error("Failed to load integrations:", error);
      toast.error("Failed to load integrations");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (type: IntegrationType) => {
    try {
      setSaving(type);
      const data = formData[type];

      // Validate required fields
      const config = INTEGRATION_CONFIGS[type];
      const missingFields = config.required_fields.filter((field) => {
        const key =
          field === "clientId"
            ? "client_id"
            : field === "clientSecret"
              ? "client_secret"
              : field === "webhookSecret"
                ? "webhook_secret"
                : field;
        return (
          !data[key as keyof FormData] ||
          data[key as keyof FormData].length === 0
        );
      });

      if (missingFields.length > 0) {
        toast.error(
          `Please fill in required fields: ${missingFields.join(", ")}`,
        );
        return;
      }

      const credentials: IntegrationCredentials = {
        clientId: data.client_id,
        clientSecret: data.client_secret,
        webhookSecret: data.webhook_secret,
      };

      const result = await userIntegrationsService.saveIntegration({
        integration_type: type,
        integration_name: data.integration_name,
        credentials,
        redirect_uri: data.redirect_uri,
        scopes: data.scopes.split(",").map((s) => s.trim()),
      });

      if (result.success) {
        toast.success(result.message || "Integration saved successfully");
        await loadIntegrations();
      } else {
        toast.error(result.error || "Failed to save integration");
      }
    } catch (error) {
      console.error("Failed to save integration:", error);
      toast.error("Failed to save integration");
    } finally {
      setSaving(null);
    }
  };

  const handleTest = async (type: IntegrationType) => {
    try {
      setTesting(type);
      const result = await userIntegrationsService.testIntegration(type);

      if (result.success && result.data) {
        if (result.data.success) {
          toast.success(result.data.message);
        } else {
          toast.error(result.data.message);
        }
      } else {
        toast.error(result.error || "Test failed");
      }
    } catch (error) {
      console.error("Test failed:", error);
      toast.error("Test failed");
    } finally {
      setTesting(null);
    }
  };

  const handleDelete = async (type: IntegrationType) => {
    try {
      const result = await userIntegrationsService.deleteIntegration(type);
      if (result.success) {
        toast.success("Integration deleted successfully");
        await loadIntegrations();

        // Clear form data
        setFormData((prev) => ({
          ...prev,
          [type]: {
            ...prev[type],
            client_id: "",
            client_secret: "",
            webhook_secret: "",
          },
        }));
      } else {
        toast.error(result.error || "Failed to delete integration");
      }
    } catch (error) {
      console.error("Failed to delete integration:", error);
      toast.error("Failed to delete integration");
    }
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const getStatusBadge = (status?: IntegrationStatus) => {
    if (!status) {
      return <Badge variant="secondary">Not Configured</Badge>;
    }

    if (!status.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }

    if (status.isConfigured) {
      return (
        <Badge variant="default" className="bg-green-500">
          ✓ Active
        </Badge>
      );
    }

    return <Badge variant="outline">Partially Configured</Badge>;
  };

  const getIntegrationIcon = (type: IntegrationType) => {
    switch (type) {
      case "calendly":
        return <Calendar className="h-5 w-5" />;
      case "whatsapp":
        return <MessageSquare className="h-5 w-5" />;
      case "slack":
        return <MessageSquare className="h-5 w-5" />;
      case "zoom":
        return <Zap className="h-5 w-5" />;
      case "google_calendar":
        return <Calendar className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const renderIntegrationCard = (type: IntegrationType) => {
    const config = INTEGRATION_CONFIGS[type];
    const status = statuses[type];
    const data = formData[type];
    const isConfigured = status?.isConfigured;
    const hasCredentials = status?.hasCredentials;

    return (
      <Card key={type} className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getIntegrationIcon(type)}
              <div>
                <CardTitle className="text-lg">{config.name}</CardTitle>
                <CardDescription className="text-sm">
                  {config.description}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(status)}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Setup Instructions */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {config.setup_instructions}
              {config.docs_url && (
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 ml-2 h-auto"
                  onClick={() => window.open(config.docs_url, "_blank")}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Documentation
                </Button>
              )}
            </AlertDescription>
          </Alert>

          {/* Configuration Form */}
          <div className="grid gap-4">
            <div>
              <Label htmlFor={`${type}-name`}>Integration Name</Label>
              <Input
                id={`${type}-name`}
                value={data.integration_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [type]: { ...prev[type], integration_name: e.target.value },
                  }))
                }
                placeholder="My Integration"
              />
            </div>

            <div>
              <Label htmlFor={`${type}-client-id`}>
                Client ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id={`${type}-client-id`}
                value={data.client_id}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [type]: { ...prev[type], client_id: e.target.value },
                  }))
                }
                placeholder="Enter your Client ID"
              />
              {hasCredentials?.clientId && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Client ID is configured
                </p>
              )}
            </div>

            <div>
              <Label htmlFor={`${type}-client-secret`}>
                Client Secret <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id={`${type}-client-secret`}
                  type={showPasswords[`${type}-secret`] ? "text" : "password"}
                  value={data.client_secret}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [type]: { ...prev[type], client_secret: e.target.value },
                    }))
                  }
                  placeholder="Enter your Client Secret"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => togglePasswordVisibility(`${type}-secret`)}
                >
                  {showPasswords[`${type}-secret`] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {hasCredentials?.clientSecret && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Client Secret is configured (
                  {encryptionUtils.maskSensitiveData(
                    data.client_secret || "***",
                    3,
                  )}
                  )
                </p>
              )}
            </div>

            {config.webhook_required && (
              <div>
                <Label htmlFor={`${type}-webhook`}>
                  Webhook Secret{" "}
                  {config.webhook_required && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id={`${type}-webhook`}
                    type={
                      showPasswords[`${type}-webhook`] ? "text" : "password"
                    }
                    value={data.webhook_secret}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        [type]: {
                          ...prev[type],
                          webhook_secret: e.target.value,
                        },
                      }))
                    }
                    placeholder="Enter your Webhook Secret"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => togglePasswordVisibility(`${type}-webhook`)}
                  >
                    {showPasswords[`${type}-webhook`] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {hasCredentials?.webhookSecret && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Webhook Secret is configured
                  </p>
                )}
              </div>
            )}

            {config.oauth_enabled && (
              <div>
                <Label htmlFor={`${type}-redirect`}>Redirect URI</Label>
                <Input
                  id={`${type}-redirect`}
                  value={data.redirect_uri}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [type]: { ...prev[type], redirect_uri: e.target.value },
                    }))
                  }
                  placeholder="https://yourdomain.com/auth/callback"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add this URL to your {config.name} app configuration
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => handleSave(type)}
              disabled={saving === type}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving === type ? "Saving..." : "Save Configuration"}
            </Button>

            <Button
              variant="outline"
              onClick={() => handleTest(type)}
              disabled={testing === type || !isConfigured}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testing === type ? "Testing..." : "Test"}
            </Button>

            {isConfigured && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Integration</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete your {config.name}{" "}
                      integration? This will remove all stored credentials and
                      cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">{t("settings.cancel")}</Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDelete(type)}
                    >
                      {t("settings.delete")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Status Information */}
          {status?.errorMessage && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{status.errorMessage}</AlertDescription>
            </Alert>
          )}

          {status?.lastVerified && (
            <p className="text-xs text-gray-500">
              Last verified: {status.lastVerified.toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  /**
   * Load Calendly connection status from user settings
   */
  const loadCalendlyStatus = async () => {
    setCalendlyStatus((prev) => ({ ...prev, isLoading: true }));

    try {
      const connectionStatus = await calendlyService.getConnectionStatus();
      const preferences = await userSettingsService.getAppPreferences();
      const calendlySettings = preferences?.integration_settings?.calendly;

      setCalendlyStatus({
        isConnected: connectionStatus.connected,
        connectionDate: calendlySettings?.connected_at || undefined,
        error: connectionStatus.error,
        isLoading: false,
      });

      // Set the current connection method
      if (calendlySettings?.method) {
        setConnectionMethod(calendlySettings.method);
      }
    } catch (error) {
      console.error("Failed to load Calendly status:", error);
      setCalendlyStatus({
        isConnected: false,
        error: "Failed to check connection status",
        isLoading: false,
      });
    }
  };

  /**
   * Connect using Personal Access Token
   */
  const connectWithPAT = async () => {
    if (!patInput.trim()) {
      toast.error("Please enter your Calendly Personal Access Token");
      return;
    }

    setPatLoading(true);
    try {
      await calendlyService.storePAT(patInput.trim());
      await loadCalendlyStatus();
      setPatInput("");
      toast.success("Calendly PAT connected successfully!");
    } catch (error) {
      console.error("Failed to connect with PAT:", error);
      toast.error("Failed to connect with PAT. Please check your token and try again.");
    } finally {
      setPatLoading(false);
    }
  };

  /**
   * Initiate Calendly OAuth flow
   */
  const connectCalendly = async () => {
    try {
      setCalendlyStatus((prev) => ({ ...prev, isLoading: true }));

      // Detect Safari browser
      const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      if (isSafari) {
        // Use Safari-specific OAuth method
        await calendlyService.initiateSafariOAuth();
        toast.success("Opening Calendly authorization in popup...", {
          description: "Complete the authorization in the popup window"
        });
      } else {
        // Use standard OAuth flow for other browsers
        const authUrl = await calendlyService.getAuthorizationUrl();
        window.location.href = authUrl;
        toast.success("Redirecting to Calendly for authorization...");
      }
    } catch (error) {
      console.error("Failed to initiate Calendly OAuth:", error);
      
      // Enhanced error handling for Safari
      if (error instanceof Error && error.message.includes('Popup blocked')) {
        toast.error("Popup blocked", {
          description: "Please allow popups for this site and try again"
        });
      } else {
        toast.error("Failed to connect to Calendly. Please try again.");
      }
      
      setCalendlyStatus((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to initiate OAuth flow",
      }));
    }
  };

  /**
   * Disconnect Calendly integration (handles both OAuth and PAT methods)
   */
  const disconnectCalendly = async () => {
    try {
      setCalendlyStatus((prev) => ({ ...prev, isLoading: true }));

      // Check current connection method
      const preferences = await userSettingsService.getAppPreferences();
      const calendlySettings = preferences?.integration_settings?.calendly;
      
      if (calendlySettings?.method === 'pat') {
        await calendlyService.disconnectPAT();
      } else {
        await calendlyService.disconnect();
      }

      setCalendlyStatus({
        isConnected: false,
        isLoading: false,
      });
      
      setConnectionMethod('oauth'); // Reset to default

      toast.success("Calendly integration disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect Calendly:", error);
      toast.error("Failed to disconnect Calendly. Please try again.");
      setCalendlyStatus((prev) => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Test Calendly connection
   */
  const testCalendlyConnection = async () => {
    try {
      setCalendlyStatus((prev) => ({ ...prev, isLoading: true }));

      const connectionStatus = await calendlyService.getConnectionStatus();

      if (connectionStatus.connected && connectionStatus.user) {
        toast.success(
          `Calendly connection test passed! Connected as ${connectionStatus.user.name}`,
        );
        await loadCalendlyStatus(); // Refresh status
      } else {
        toast.error(
          `Connection test failed: ${connectionStatus.error || "Not connected"}`,
        );
      }
    } catch (error) {
      console.error("Calendly connection test failed:", error);
      toast.error("Connection test failed. Please check your settings.");
    } finally {
      setCalendlyStatus((prev) => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Render Calendly integration card with OAuth flow
   */
  const renderCalendlyIntegrationCard = () => {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Calendly Integration
                  {calendlyStatus.isConnected && (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                  {calendlyStatus.error && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Error
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Connect your Calendly account for BANT/HEAT lead qualification
                  meetings
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {calendlyStatus.isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={loadCalendlyStatus}
                disabled={calendlyStatus.isLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Connection Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Connection Status</Label>
              <div className="flex items-center gap-2">
                {calendlyStatus.isConnected ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">
                      Connected & Active
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm text-red-600">Not Connected</span>
                  </>
                )}
              </div>
            </div>

            {calendlyStatus.connectionDate && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Connected Since</Label>
                <div className="text-sm text-gray-600">
                  {new Date(calendlyStatus.connectionDate).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {calendlyStatus.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Error:</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                {calendlyStatus.error}
              </p>
            </div>
          )}

          {/* Connection Method Selector */}
          {!calendlyStatus.isConnected && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Connection Method</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={connectionMethod === 'oauth' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConnectionMethod('oauth')}
                  >
                    OAuth
                  </Button>
                  <Button
                    variant={connectionMethod === 'pat' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConnectionMethod('pat')}
                  >
                    Personal Access Token
                  </Button>
                </div>
              </div>
              
              {connectionMethod === 'pat' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Using Personal Access Token (Recommended)
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mb-3">
                    Get your PAT from your Calendly account: Settings → Integrations → API & Webhooks → Personal Access Token
                  </p>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder="Enter your Calendly Personal Access Token"
                        value={patInput}
                        onChange={(e) => setPatInput(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={connectWithPAT}
                        disabled={patLoading || !patInput.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {patLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Key className="h-4 w-4 mr-2" />
                        )}
                        Connect
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OAuth Credentials Info */}
          {connectionMethod === 'oauth' && !calendlyStatus.isConnected && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  OAuth Credentials Ready
                </span>
              </div>
              <p className="text-sm text-blue-700">
                Your Calendly OAuth credentials are pre-configured and ready for
                connection.
              </p>
              <div className="mt-2 text-xs text-blue-600 space-y-1">
                <div>• Client ID: {formData.calendly.client_id}</div>
                <div>• Environment: Production</div>
                <div>• Callback URL: {formData.calendly.redirect_uri}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!calendlyStatus.isConnected ? (
              connectionMethod === 'oauth' && (
                <Button
                  onClick={connectCalendly}
                  disabled={calendlyStatus.isLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {calendlyStatus.isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Connect Calendly Account
                </Button>
              )
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={testCalendlyConnection}
                  disabled={calendlyStatus.isLoading}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Test Connection
                </Button>
                <Button
                  variant="outline"
                  onClick={disconnectCalendly}
                  disabled={calendlyStatus.isLoading}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </>
            )}
          </div>

          {/* Integration Features */}
          {calendlyStatus.isConnected && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-medium text-green-800 mb-2">
                Active Features:
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Automatic BANT/HEAT lead qualification meetings</li>
                <li>• Real-time booking notifications</li>
                <li>• Lead heat progression based on meeting activity</li>
                <li>• Integration with CRM notification system</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Integration Settings
        </h2>
        <p className="text-muted-foreground">
          Securely manage your third-party integration credentials. All
          sensitive data is encrypted before storage.
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> All credentials are encrypted with
          your user-specific key before storage. We never store plain text
          secrets and only you can decrypt your own credentials.
        </AlertDescription>
      </Alert>

      {/* Safari-specific OAuth helper */}
      <SafariOAuthHelper />

      <Tabs defaultValue="calendly" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="calendly" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendly
          </TabsTrigger>
          {Object.entries(INTEGRATION_CONFIGS)
            .slice(1)
            .map(([type, config]) => (
              <TabsTrigger
                key={type}
                value={type}
                className="flex items-center gap-2"
              >
                {getIntegrationIcon(type as IntegrationType)}
                {config.name}
              </TabsTrigger>
            ))}
        </TabsList>

        {/* Calendly Tab - Enhanced with OAuth */}
        <TabsContent value="calendly">
          {renderCalendlyIntegrationCard()}
        </TabsContent>

        {/* Other Integration Tabs */}
        {Object.keys(INTEGRATION_CONFIGS)
          .slice(1)
          .map((type) => (
            <TabsContent key={type} value={type}>
              {renderIntegrationCard(type as IntegrationType)}
            </TabsContent>
          ))}
      </Tabs>
    </div>
  );
}
