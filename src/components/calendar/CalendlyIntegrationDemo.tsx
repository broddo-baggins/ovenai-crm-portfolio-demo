import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  CheckCircle,
  Clock,
  User,
  ExternalLink,
  Key,
  Shield,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { calendlyService } from '@/services/calendlyService';

interface CalendlyUser {
  uri: string;
  name: string;
  email: string;
  scheduling_url: string;
  timezone: string;
}

interface CalendlyEvent {
  uri: string;
  name: string;
  start_time: string;
  end_time: string;
  status: string;
  event_type: string | {
    name: string;
    scheduling_url: string;
  };
}

export function CalendlyIntegrationDemo() {
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean;
    method?: 'oauth' | 'pat' | null;
    user?: CalendlyUser;
    loading: boolean;
    error?: string;
  }>({
    connected: false,
    loading: true,
  });

  const [events, setEvents] = useState<CalendlyEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const status = await calendlyService.getConnectionStatus();
      setConnectionStatus({
        connected: status.connected,
        method: status.method,
        user: status.user,
        loading: false,
        error: status.error,
      });
    } catch (error) {
      setConnectionStatus({
        connected: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to check connection',
      });
    }
  };

  const fetchEvents = async () => {
    if (!connectionStatus.connected) {
      toast.error('Please connect your Calendly account first');
      return;
    }

    setEventsLoading(true);
    try {
      // Use PAT method if available, otherwise fall back to OAuth
      if (connectionStatus.method === 'pat') {
        const patEvents = await calendlyService.getScheduledEventsWithPAT({
          count: 10,
          status: 'active',
          sort: 'start_time:asc',
        });
        setEvents(patEvents);
      } else {
        // OAuth method - would need to implement getScheduledEvents
        const oauthEvents = await calendlyService.getScheduledEvents({
          count: 10,
          status: 'active',
        });
        setEvents(oauthEvents);
      }
      
      toast.success(`Fetched ${events.length} upcoming events`);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to fetch events. Please try again.');
    } finally {
      setEventsLoading(false);
    }
  };

  const formatEventTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (connectionStatus.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Checking Calendly connection...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Calendly Integration Demo</h2>
        <p className="text-muted-foreground">
          Showcase of the new Personal Access Token (PAT) integration alongside OAuth
        </p>
      </div>

      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Connection Status
          </CardTitle>
          <CardDescription>
            Current Calendly integration status and method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {connectionStatus.connected ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-green-600">Connected</span>
                <Badge variant="outline">
                  {connectionStatus.method === 'pat' ? (
                    <>
                      <Key className="h-3 w-3 mr-1" />
                      Personal Access Token
                    </>
                  ) : (
                    <>
                      <Shield className="h-3 w-3 mr-1" />
                      OAuth
                    </>
                  )}
                </Badge>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-red-600">Not Connected</span>
              </>
            )}
          </div>

          {connectionStatus.user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{connectionStatus.user.name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {connectionStatus.user.email}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{connectionStatus.user.timezone}</span>
                </div>
                <a
                  href={connectionStatus.user.scheduling_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Scheduling Page
                </a>
              </div>
            </div>
          )}

          {connectionStatus.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{connectionStatus.error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={checkConnection} variant="outline" size="sm">
              Refresh Status
            </Button>
            {connectionStatus.connected && (
              <Button onClick={fetchEvents} disabled={eventsLoading} size="sm">
                {eventsLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4 mr-2" />
                )}
                Fetch Events
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>
              Your scheduled Calendly events fetched via {connectionStatus.method?.toUpperCase()} method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={event.uri} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h3 className="font-medium">{event.name}</h3>
                    <p className="text-sm text-gray-600">
                      {typeof event.event_type === 'string' 
                        ? event.event_type 
                        : event.event_type.name}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      {formatEventTime(event.start_time)} - {formatEventTime(event.end_time)}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    {event.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Methods Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Methods</CardTitle>
          <CardDescription>
            Comparison of OAuth vs Personal Access Token approaches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium">OAuth Method</h3>
              </div>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• User authorizes via Calendly login</li>
                <li>• Tokens managed automatically</li>
                <li>• More complex setup</li>
                <li>• Good for multi-tenant apps</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-yellow-600" />
                <h3 className="font-medium">Personal Access Token (Recommended)</h3>
              </div>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• User provides PAT once</li>
                <li>• Direct API access</li>
                <li>• Simpler implementation</li>
                <li>• Perfect for single-user scenarios</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
          <CardDescription>
            How to get your Calendly Personal Access Token
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Getting Your PAT:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Go to your Calendly account settings</li>
                <li>2. Navigate to Integrations → API & Webhooks</li>
                <li>3. Generate a new Personal Access Token</li>
                <li>4. Copy the token and paste it in Settings → Integrations → Calendly</li>
              </ol>
            </div>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Security:</strong> Your PAT is encrypted and stored securely in your user settings.
                Never share your token with others.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 