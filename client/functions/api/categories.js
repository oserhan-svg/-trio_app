export async function onRequest(context) {
  return new Response(JSON.stringify({
    success: true,
    data: [
      { id: 1, name: 'Satılık Daire', count: 45 },
      { id: 2, name: 'Satılık Villa', count: 12 },
      { id: 3, name: 'Satılık Arsa', count: 8 },
      { id: 4, name: 'Kiralık Daire', count: 23 }
    ]
  }, {
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
