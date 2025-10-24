
import { verifyToken } from '../../packages/server/src/auth/jwt.service';
import { getSession } from '../../packages/server/src/auth/session.service';

export async function onRequest(context) {
  // Set CORS headers to allow the client to access the API
  const headers = {
    'Access-Control-Allow-Origin': context.request.headers.get('Origin') || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
  
  // Handle preflight requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers
    });
  }

  try {
    const authHeader = context.request.headers.get('Authorization');
    
    // Check if Authorization header exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }), { 
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token format' }), { 
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Check session from Redis (or other session store)
    const session = await getSession(decoded.sessionId);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Session expired' }), { 
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // If all checks pass, return OK with user info
    return new Response(JSON.stringify({ 
      ok: true,
      user: {
        userId: decoded.userId,
        clientId: decoded.clientId,
        role: session.role,
      }
    }), { 
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
      status: 401,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
}
