## 2026-06-03 - [High] Fix Overly Permissive CORS Configuration
**Vulnerability:** The CORS configuration in `server/index.js` allowed any unknown origin to access the API with `credentials: true`.
**Learning:** Returning `callback(null, true)` as a fallback allows malicious sites to make authenticated requests. The code contained `console.log('[CORS] New origin detected (allowing softly):', origin); callback(null, true);`.
**Prevention:** Always explicitly deny unknown origins by returning an error (`callback(new Error('Not allowed by CORS'))`) in the fallback case when `credentials: true` is enabled.
