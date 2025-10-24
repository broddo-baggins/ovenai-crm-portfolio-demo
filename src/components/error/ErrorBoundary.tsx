import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// Error fallback component that can use hooks
const ErrorFallback: React.FC<{ error?: Error; onRefresh: () => void; onGoHome: () => void }> = ({ 
  error, 
  onRefresh, 
  onGoHome 
}) => {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl text-gray-900 dark:text-gray-100">
            {t('errors.boundary.title', 'Something went wrong')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {t('errors.boundary.message', "We're sorry, but something unexpected happened. This error has been reported and our team is working on it.")}
          </p>
          
          {process.env.NODE_ENV === 'development' && error && (
            <details className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('errors.boundary.developmentOnly', 'Error Details (Development Only)')}
              </summary>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                <div className="font-mono">
                  <div className="text-red-600 dark:text-red-400 font-semibold">
                    {error.name}: {error.message}
                  </div>
                  <div className="mt-2 text-gray-500 dark:text-gray-500">
                    {error.stack}
                  </div>
                </div>
              </div>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button 
              onClick={onRefresh}
              className="flex-1 flex items-center justify-center gap-2"
              variant="default"
            >
              <RefreshCw className="h-4 w-4" />
              {t('errors.boundary.tryAgain', 'Try Again')}
            </Button>
            <Button 
              onClick={onGoHome}
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              {t('errors.boundary.goHome', 'Go Home')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In production, this would send to your error monitoring service
    // e.g., Sentry, LogRocket, Bugsnag, etc.
    try {
      // Example: Sentry
      // Sentry.withScope((scope) => {
      //   scope.setTag('errorBoundary', true);
      //   scope.setContext('errorInfo', errorInfo);
      //   Sentry.captureException(error);
      // });
      
      // For now, send to console in development-like environments
      console.error('[Production Error]:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    } catch (logError) {
      console.error('Failed to log error to service:', logError);
    }
  };

  private handleRefresh = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback 
          error={this.state.error}
          onRefresh={this.handleRefresh}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
} 