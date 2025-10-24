/**
 * LoginForm component
 * 
 * Handles user authentication with email/password, Google OAuth, and Facebook OAuth.
 * Includes password reset functionality and validation.
 * Enhanced with full database access via service role for development.
 * 
 * @returns {JSX.Element} The rendered login form
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/ClientAuthContext';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { FacebookIcon } from '@/components/icons/FacebookIcon';
import LoginErrorAlert from '@/components/auth/LoginErrorAlert';
import { checkSupabaseConnection } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import EmailField from '@/components/auth/EmailField';
import PasswordField from '@/components/auth/PasswordField';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [_supabaseHealthy, setSupabaseHealthy] = useState<boolean | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Get redirect path
  const from = location.state?.from?.pathname || '/dashboard';

  // Check Supabase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isHealthy = await checkSupabaseConnection();
        if (isHealthy) {
          console.log('Supabase health check successful.');
        } else {
          console.log('Supabase health check failed.');
        }
      } catch (e) {
        console.log('Supabase health check failed (catch):', e);
      }
    };
    checkConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!email || !password) {
      setAuthError(t('auth.errors.fillAllFields', 'Please fill in all fields'));
      return;
    }

    try {
      setIsLoading(true);
      console.log('SECURITY [LoginForm] Starting login process...');

      const result = await login(email, password);
      console.log('SECURITY [LoginForm] Login result:', result);
      
      if (result.success) {
        console.log('SECURITY [LoginForm] Login successful, preparing to navigate...');
        
        // Wait a bit longer to ensure auth state is fully updated
        await new Promise(resolve => setTimeout(resolve, 200));
        
        console.log('SECURITY [LoginForm] Navigating to:', from);
        
        // Navigate to intended destination
        navigate(from, { replace: true });
      } else {
        console.error('SECURITY [LoginForm] Login failed:', result.error);
        setAuthError(result.error || t('auth.errors.loginFailed', 'Login failed'));
      }
    } catch (error: any) {
      console.error('SECURITY [LoginForm] Login error details:', error);
      setAuthError(error.message || t('auth.errors.loginFailed', 'Login failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setAuthError(null);

      const result = await login('', '', 'google');
      
      if (result.success) {
        console.log('Google OAuth initiated successfully');
        // Don't navigate here - the OAuth flow will handle it
      } else {
        const errorMessage = result.error || t('auth.errors.googleLoginFailed', 'Google login failed');
        setAuthError(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || t('auth.errors.googleLoginFailed', 'Google login failed');
      console.error('Google login error:', errorMessage);
      setAuthError(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setIsFacebookLoading(true);
      setAuthError(null);

      const result = await login('', '', 'facebook');
      
      if (result.success) {
        console.log('Facebook OAuth initiated successfully');
        // Don't navigate here - the OAuth flow will handle it
      } else {
        const errorMessage = result.error || t('auth.errors.facebookLoginFailed', 'Facebook login failed');
        setAuthError(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || t('auth.errors.facebookLoginFailed', 'Facebook login failed');
      console.error('Facebook login error:', errorMessage);
      setAuthError(errorMessage);
    } finally {
      setIsFacebookLoading(false);
    }
  };

  // handleFallbackLogin function removed for security

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-4">
        <LoginErrorAlert error={authError} />
        
        <EmailField
          email={email}
          setEmail={setEmail}
          disabled={isLoading}
          required
        />
        
        <PasswordField
          password={password}
          setPassword={setPassword}
          disabled={isLoading}
          required
        />

        <div className="text-center">
          <Link 
            to="/password-recovery" 
            className="text-sm text-primary hover:text-primary/80 hover:underline"
          >
            {t('auth.forgotPassword', 'Forgot your password?')}
          </Link>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || isGoogleLoading || isFacebookLoading}
          data-testid="login-button"
        >
          {isLoading ? t('auth.signingIn', 'Signing in...') : t('auth.signIn', 'Sign In')}
        </Button>

        {/* Social Login */}
        <div className="relative w-full">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t('auth.orContinueWith', 'Or continue with')}
            </span>
          </div>
        </div>

        <div className="flex space-x-2 w-full">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-10"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading || isFacebookLoading}
          >
            <div className="flex items-center justify-center gap-2 w-full">
              {isGoogleLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin shrink-0" />
              ) : (
                <GoogleIcon className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium">Google</span>
            </div>
          </Button>
          
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-10"
            onClick={handleFacebookLogin}
            disabled={isLoading || isGoogleLoading || isFacebookLoading}
          >
            <div className="flex items-center justify-center gap-2 w-full">
              {isFacebookLoading ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin shrink-0" />
              ) : (
                <FacebookIcon className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium">Facebook</span>
            </div>
          </Button>
        </div>

        {/* Development Fallback Login - REMOVED FOR SECURITY */}
      </CardFooter>
    </form>
  );
};

export default LoginForm; 