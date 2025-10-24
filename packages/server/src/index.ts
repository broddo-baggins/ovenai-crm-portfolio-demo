import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { createClient } from '@supabase/supabase-js';
import { config, validateConfig } from './config';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import crypto from 'crypto';
import { WebSocketServer } from 'ws';
import http from 'http';

// Load environment variables from root directory
dotenv.config({ path: '../../.env' });
dotenv.config({ path: '../../.env.local' });

// Validate configuration
try {
  validateConfig();
} catch (error) {
  console.error('Configuration error:', error);
  process.exit(1);
}

// Initialize Redis client
import './auth/session.service';

// Initialize Supabase Admin Client
let supabaseAdmin: any;
if (config.supabaseUrl && config.supabaseServiceRoleKey) {
  supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false } // Server-side client doesn't need to persist sessions
  });
} else {
  console.warn('Supabase admin client not initialized. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);
      
      // Handle authentication
      if (data.action === 'authenticate') {
        // Add authentication logic here
        ws.send(JSON.stringify({ type: 'AUTH_SUCCESS' }));
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Add notifications endpoint
app.get('/api/notifications', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Add leads endpoint
app.get('/api/leads', async (req, res) => {
  try {
    const { project_id, current_project_id } = req.query;
    
    let query = supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply project filtering if provided
    if (current_project_id) {
      query = query.eq('current_project_id', current_project_id);
    } else if (project_id) {
      query = query.eq('project_id', project_id);
    }
    
    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Add conversations endpoint
app.get('/api/conversations', async (req, res) => {
  try {
    const { lead_id } = req.query;
    
    let query = supabaseAdmin
      .from('conversations')
      .select('*')
      .order('timestamp', { ascending: false });
    
    // Apply lead filtering if provided
    if (lead_id) {
      query = query.eq('lead_id', lead_id);
    }
    
    const { data, error } = await query;

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Add ping endpoint for connectivity checks
app.get('/api/ping', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'pong'
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  if (!supabaseAdmin) {
    return res.status(503).json({ status: 'error', message: 'Supabase client not initialized', supabase: 'unhealthy', timestamp: new Date().toISOString() });
  }
  try {
    // Perform a lightweight operation to check Supabase health, e.g., list storage buckets (or users, tables etc. with limit 1)
    const { error } = await supabaseAdmin.storage.listBuckets({ limit: 1 });
    if (error) {
      console.error('Supabase health check failed:', error);
      return res.status(503).json({ status: 'error', supabase: 'unhealthy', message: error.message, timestamp: new Date().toISOString() });
    }
    res.json({ status: 'ok', supabase: 'healthy', timestamp: new Date().toISOString() });
  } catch (e: any) {
    console.error('Supabase health check exception:', e);
    return res.status(500).json({ status: 'error', supabase: 'unhealthy', message: e.message || 'Internal server error', timestamp: new Date().toISOString() });
  }
});

// Development fallback routes (only enabled in development/testing)
if (config.isDevelopment && config.fallbackLoginEnabled) {
  // Special development endpoint for testing without full backend
  app.post('/dev-api/auth/fallback-login', (req, res) => {
    const { email, environment } = req.body;
    
    console.log('Development fallback login attempt:', { email, environment });
    
    // Simple validation
    if (!email || !email.includes('@')) {
      return res.status(401).json({ error: 'Invalid email format' });
    }
    
    // Check if fallback is enabled
    if (!config.fallbackLoginEnabled) {
      console.log('Fallback login rejected: fallback disabled in configuration');
      return res.status(403).json({ error: 'Fallback login is disabled' });
    }
    
    // Generate token-based access without exposing credentials
    const tokenTimestamp = Date.now();
    let role = 'STAFF';
    
    // Set role based on email pattern (no credentials exposed)
    if (email.includes('admin')) {
      role = 'ADMIN';
    } else if (email.includes('super')) {
      role = 'SUPER_ADMIN';
    }
    
    // Create deterministic but secure user ID based on email
    // This ensures the same email always gets the same ID in dev mode
    const fallbackToken = config.fallbackToken || 'development-only-token';
    const userId = crypto
      .createHash('sha256')
      .update(email + fallbackToken)
      .digest('hex')
      .substring(0, 24);
    
    // Generate development-only mock response
    const mockResponse = {
      success: true,
      accessToken: `dev-token-${tokenTimestamp}-${userId}`,
      user: {
        id: userId,
        email: email,
        clientId: 'dev-client',
        clientName: 'Development Project',
        name: email.split('@')[0],
        role: role,
        status: 'ACTIVE'
      }
    };
    
    console.log('Returning development access token for:', email);
    res.json(mockResponse);
  });
  
  console.log('📝 Development API endpoints enabled');
}

// Start server
const PORT = config.port;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
});
