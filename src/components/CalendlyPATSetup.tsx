import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Key, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { calendlyService } from '@/services/calendlyService';
import { toast } from 'sonner';

interface CalendlyPATSetupProps {
  onSuccess?: (user: any) => void;
}

export const CalendlyPATSetup: React.FC<CalendlyPATSetupProps> = ({ onSuccess }) => {
  const [pat, setPat] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showPat, setShowPat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    if (!pat.trim()) {
      setError('Please enter your Calendly Personal Access Token');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const user = await calendlyService.storePAT(pat.trim());
      
      toast.success('Calendly Connected Successfully!', {
        description: `Welcome ${user.name}! Your calendar is now integrated.`
      });

      if (onSuccess) {
        onSuccess(user);
      }
    } catch (error) {
      console.error('Failed to connect Calendly PAT:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect to Calendly');
      toast.error('Failed to connect to Calendly');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5 text-blue-600" />
          Connect Calendly (Simple Setup)
        </CardTitle>
        <CardDescription>
          Use your Personal Access Token to connect Calendly without needing a developer account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>No Developer Account Required!</strong> This method uses your personal Calendly token for direct API access.
          </AlertDescription>
        </Alert>

        {/* Step-by-step guide */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">How to get your Personal Access Token:</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">Go to Calendly Integrations</p>
                <p className="text-sm text-muted-foreground">
                  Visit your Calendly account settings and navigate to integrations
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.open('https://calendly.com/integrations/api_webhooks', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Calendly Integrations
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">Generate Personal Access Token</p>
                <p className="text-sm text-muted-foreground">
                  Click on "API & Webhooks" and then "Create Token" to generate your PAT
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <p className="font-medium">Copy and paste your token below</p>
                <p className="text-sm text-muted-foreground">
                  The token will be securely stored and encrypted in your account
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Token input */}
        <div className="space-y-2">
          <Label htmlFor="pat">Personal Access Token</Label>
          <div className="relative">
            <Input
              id="pat"
              type={showPat ? 'text' : 'password'}
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="Enter your Calendly Personal Access Token"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPat(!showPat)}
            >
              {showPat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        {/* Connect button */}
        <Button 
          onClick={handleConnect} 
          disabled={isConnecting || !pat.trim()}
          className="w-full"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Connecting...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Connect Calendly
            </>
          )}
        </Button>

        {/* Benefits */}
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
            SUCCESS Benefits of PAT Method:
          </h4>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>• No developer account required</li>
            <li>• Simple one-time setup</li>
            <li>• Direct API access to your calendar</li>
            <li>• Secure token storage with encryption</li>
            <li>• Works with all Calendly plans</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}; 