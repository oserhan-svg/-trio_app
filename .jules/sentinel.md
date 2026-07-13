## 2024-05-24 - Overly Permissive CORS with Credentials
**Vulnerability:** CORS configuration allowed any unknown origin and explicitly passed credentials (credentials: true) dynamically.
**Learning:** Using 'allowing softly' logs or 'callback(null, true)' for unknown origins with credentials effectively disables Same-Origin Policy protections for authenticated users.
**Prevention:** Always default to explicit denial ('callback(new Error())') for unknown origins when credentials are enabled.
