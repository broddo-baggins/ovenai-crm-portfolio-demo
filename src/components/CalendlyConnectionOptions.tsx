import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Key, Shield, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { CalendlyPATSetup } from '@/components/CalendlyPATSetup';
import { calendlyService } from '@/services/calendlyService';
import { toast } from 'sonner';

interface CalendlyConnectionOptionsProps {
  onSuccess?: (user: any) => void;
}

export const CalendlyConnectionOptions: React.FC<CalendlyConnectionOptionsProps> = ({ onSuccess }) => {
  const [isConnectingOAuth, setIsConnectingOAuth] = useState(false);

  const handleOAuthConnect = async () => {
    setIsConnectingOAuth(true);
    try {
      const authUrl = await calendlyService.getAuthorizationUrl();
      window.location.href = authUrl;
      toast.info("Redirecting to Calendly for authorization...");
    } catch (error) {
      console.error("Error connecting to Calendly:", error);
      toast.error("Failed to connect to Calendly. Please try again.");
      setIsConnectingOAuth(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Connect Your Calendly Account</h3>
        <p className="text-muted-foreground">
          Choose your preferred connection method. Both methods provide the same functionality.
        </p>
      </div>

      <Tabs defaultValue="pat" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pat" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Personal Token (Recommended)
          </TabsTrigger>
          <TabsTrigger value="oauth" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            OAuth Login
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pat" className="mt-6">
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Recommended:</strong> Simple setup with no developer account required. Most users should choose this option.
              </AlertDescription>
            </Alert>
            
            <CalendlyPATSetup onSuccess={onSuccess} />
          </div>
        </TabsContent>

        <TabsContent value="oauth" className="mt-6">
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> OAuth requires a Calendly developer account. Only use this if you have already set up OAuth credentials.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  OAuth Login Flow
                </CardTitle>
                <CardDescription>
                  Connect using Calendly's OAuth authentication (requires developer account)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* OAuth Requirements */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Requirements for OAuth:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Calendly developer account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>OAuth application registered with Calendly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Client ID and Client Secret configured</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                      <span>Redirect URI: <code className="bg-muted px-1 rounded">https://amityogev.com/auth/calendly/callback</code></span>
                    </li>
                  </ul>
                </div>

                {/* OAuth Flow Steps */}
                <div className="space-y-4">
                  <h4 className="font-semibold">OAuth Flow:</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        1
                      </div>
                      <span className="text-sm">Click "Connect with OAuth" below</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        2
                      </div>
                      <span className="text-sm">Redirect to Calendly login page</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        3
                      </div>
                      <span className="text-sm">Authorize OvenAI to access your calendar</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        4
                      </div>
                      <span className="text-sm">Return to OvenAI with connected account</span>
                    </div>
                  </div>
                </div>

                {/* OAuth Connect Button */}
                <Button 
                  onClick={handleOAuthConnect}
                  disabled={isConnectingOAuth}
                  className="w-full"
                >
                  {isConnectingOAuth ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Redirecting to Calendly...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Connect with OAuth
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                {/* Developer Account Setup Link */}
                <div className="text-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">
                    Don't have a developer account yet?
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://developer.calendly.com/getting-started', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Set up Developer Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Comparison Table */}
      <div className="mt-8">
        <h4 className="font-semibold mb-4">Method Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border rounded-lg">
            <thead>
              <tr className="bg-muted">
                <th className="border border-border p-3 text-left">Feature</th>
                <th className="border border-border p-3 text-center">Personal Token</th>
                <th className="border border-border p-3 text-center">OAuth Login</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-border p-3 font-medium">Setup Time</td>
                <td className="border border-border p-3 text-center text-green-600">2 minutes</td>
                <td className="border border-border p-3 text-center text-yellow-600">30+ minutes</td>
              </tr>
              <tr>
                <td className="border border-border p-3 font-medium">Developer Account</td>
                <td className="border border-border p-3 text-center text-green-600">Not required</td>
                <td className="border border-border p-3 text-center text-red-600">Required</td>
              </tr>
              <tr>
                <td className="border border-border p-3 font-medium">Maintenance</td>
                <td className="border border-border p-3 text-center text-green-600">None</td>
                <td className="border border-border p-3 text-center text-yellow-600">Token refresh</td>
              </tr>
              <tr>
                <td className="border border-border p-3 font-medium">Security</td>
                <td className="border border-border p-3 text-center text-green-600">Secure</td>
                <td className="border border-border p-3 text-center text-green-600">Enterprise</td>
              </tr>
              <tr>
                <td className="border border-border p-3 font-medium">Features</td>
                <td className="border border-border p-3 text-center text-green-600">Full access</td>
                <td className="border border-border p-3 text-center text-green-600">Full access</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 