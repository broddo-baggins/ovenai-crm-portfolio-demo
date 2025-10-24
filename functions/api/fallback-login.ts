export async function onRequest(context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': context.request.headers.get('Origin') || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight requests
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers
    });
  }

  // Get environment from context or env
  const environment = context.env.VITE_ENVIRONMENT || 'production';
  const enableFallbackLogin = context.env.VITE_ENABLE_FALLBACK_LOGIN === 'true';
  const fallbackToken = context.env.FALLBACK_TOKEN;

  // Block fallback login in production or if not enabled
  if (environment !== 'development' || !enableFallbackLogin) {
    return new Response(JSON.stringify({ 
      error: 'Fallback login is only available in development environment when explicitly enabled' 
    }), { 
      status: 403,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  // Ensure fallback token exists for security
  if (!fallbackToken || fallbackToken.length < 32) {
    return new Response(JSON.stringify({ 
      error: 'Fallback login is not properly configured (missing or insecure token)' 
    }), { 
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Parse request body
    const requestData = await context.request.json();
    const { email } = requestData;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { 
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // Create a development-only user session
    return new Response(JSON.stringify({
      success: true,
      accessToken: 'dev-token-' + Math.random().toString(36).substring(2),
      user: {
        id: 'dev-' + Buffer.from(email).toString('base64'),
        email: email,
        clientId: 'dev-client',
        clientName: 'Development Client',
        name: 'Development User',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE'
      }
    }), { 
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Fallback login error:', error);
    return new Response(JSON.stringify({ error: 'Invalid request data' }), { 
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
}
