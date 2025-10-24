/**
 * Server Configuration
 * 
 * This file contains all environment variable configurations for the server
 */

export const config = {
  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  
  // Server
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL || 'http://localhost:3002',
  
  // Redis - Used for session management
  redisUrl: process.env.REDIS_URL || '',

  // JWT - Provide development default
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-jwt-secret-key-at-least-32-chars-long-for-security' : ''),
  jwtExpiresIn: '1d',
  refreshTokenExpiresIn: '7d',
  
  // n8n
  n8nBaseUrl: process.env.N8N_BASE_URL || '',
  
  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  
  // SendGrid
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  sendgridTemplateWelcome: process.env.SENDGRID_TEMPLATE_WELCOME || '',
  
  // Feature flags
  allowRegistration: process.env.ALLOW_REGISTRATION === 'true',
  
  // Development options
  isDevelopment: process.env.NODE_ENV === 'development',
  fallbackLoginEnabled: process.env.ENABLE_FALLBACK_LOGIN === 'true' && process.env.NODE_ENV === 'development',
  fallbackToken: process.env.FALLBACK_TOKEN || '', 
};

// Validate required configuration
export const validateConfig = () => {
  // In development, we're more lenient with missing environment variables
  if (config.isDevelopment) {
    const criticalVars = ['supabaseUrl']; // Only require Supabase URL in development
    const missingCritical = criticalVars.filter(name => !config[name as keyof typeof config]);
    
    if (missingCritical.length > 0) {
      throw new Error(`Missing critical environment variables for development: ${missingCritical.join(', ')}`);
    }
    
    // Warn about missing non-critical vars in development
    const optionalVars = ['databaseUrl', 'redisUrl', 'jwtSecret', 'supabaseServiceRoleKey'];
    const missingOptional = optionalVars.filter(name => !config[name as keyof typeof config]);
    
    if (missingOptional.length > 0) {
      console.warn(`⚠️ Development mode: Optional environment variables not set: ${missingOptional.join(', ')}`);
      console.warn('⚠️ Some features may not work correctly without these variables');
    }
    
    return true;
  }
  
  // In production, require all variables
  const requiredVars = [
    'databaseUrl',
    'redisUrl', 
    'jwtSecret',
    'supabaseUrl',
    'supabaseServiceRoleKey',
  ];
  
  const missingVars = requiredVars.filter(name => !config[name as keyof typeof config]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Warn about fallback token security
  if (config.fallbackLoginEnabled && (!config.fallbackToken || config.fallbackToken.length < 32)) {
    console.warn('⚠️ SECURITY WARNING: FALLBACK_TOKEN should be at least 32 characters for security!');
  }

  // Warn about JWT secret security in production
  if (config.nodeEnv === 'production' && (!config.jwtSecret || config.jwtSecret.length < 32)) {
    console.warn('⚠️ SECURITY WARNING: JWT_SECRET should be at least 32 characters in production!');
  }
  
  return true;
};

// Add development warning if developer mode is enabled
if (config.isDevelopment) {
  console.warn('⚠️ DEVELOPMENT MODE ENABLED');
  
  if (config.fallbackLoginEnabled) {
    console.warn('⚠️ FALLBACK LOGIN ENABLED - Only for development use');
  }
}
