export async function onRequest(context) {
  const { request, env } = context;
  
  return new Response(JSON.stringify({
    message: 'Trio API - Emlak Platformu',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      listings: '/api/listings',
      categories: '/api/categories'
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

export async function onRequestOptions(context) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
