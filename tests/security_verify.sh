#!/bin/bash

echo "--- SECURITY VERIFICATION ---"
export PORT=5005
export EXTENSION_API_KEY="test_secret_key"

# 1. Test CORS (Blocked)
echo "Testing CORS rejection (http://evil.com)..."
# Express CORS middleware might return 500 or just not include CORS headers on error
curl -s -I -H "Origin: http://evil.com" http://localhost:$PORT/api/health | grep "Access-Control-Allow-Origin" && echo "❌ CORS NOT REJECTED" || echo "✅ CORS REJECTED (Header missing)"

# 2. Test CORS (Allowed)
echo "Testing CORS allowed (http://localhost:5173)..."
curl -s -I -H "Origin: http://localhost:5173" http://localhost:$PORT/api/health | grep "200 OK" && echo "✅ CORS ALLOWED" || echo "❌ CORS NOT ALLOWED"

# 3. Test Extension Auth (Missing Key)
echo "Testing Extension Auth (Missing Key)..."
curl -s -X POST http://localhost:$PORT/api/scraper/import | grep "Extension API key required" && echo "✅ AUTH MISSING DETECTED" || echo "❌ AUTH MISSING FAILED"

# 4. Test Extension Auth (Invalid Key)
echo "Testing Extension Auth (Invalid Key)..."
curl -s -X POST -H "x-extension-api-key: wrong_key" http://localhost:$PORT/api/scraper/import | grep "Invalid Extension API Key" && echo "✅ INVALID AUTH REJECTED" || echo "❌ INVALID AUTH FAILED"

# 5. Test Extension Auth (Valid Key)
echo "Testing Extension Auth (Valid Key)..."
# We send an empty JSON body to avoid 500 error from destructuring
curl -s -X POST -H "x-extension-api-key: test_secret_key" -H "Content-Type: application/json" -d '{"listings": []}' http://localhost:$PORT/api/scraper/import | grep "Imported 0 listings" && echo "✅ VALID AUTH ACCEPTED" || echo "❌ VALID AUTH FAILED"

echo "--- VERIFICATION COMPLETE ---"
