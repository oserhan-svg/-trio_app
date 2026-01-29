const { getSessionManager } = require('./server/services/sessionManager');
const sm = getSessionManager();
console.log('Session Stats:', JSON.stringify(sm.getStats(), null, 2));
