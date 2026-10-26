export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  // Mock listings data
  const mockListings = [
    {
      id: 1063113447,
      title: "Ayvalık Merkez Deniz Manzaralı",
      price: 2500000,
      location: "Ayvalık, Balıkesir",
      type: "Satılık Daire",
      images: ["https://example.com/img1.jpg"]
    },
    {
      id: 1102432038,
      title: "Altınova Sahil Yolu",
      price: 3200000,
      location: "Altınova, Balıkesir",
      type: "Satılık Villa",
      images: ["https://example.com/img2.jpg"]
    }
  ];
  
  return new Response(JSON.stringify({
    success: true,
    data: mockListings,
    total: mockListings.length
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
