const Module = require('module');
const originalRequire = Module.prototype.require;

Module.prototype.require = function(id) {
  if (id === 'express') {
    return {
      Router: () => ({
        get: () => {},
        post: () => {},
        use: () => {}
      })
    };
  }
  if (id.includes('dealController')) {
    return {
      getDeals: () => {},
      createDeal: () => {},
      getFinancialStats: () => {},
      getDealSummaryLetter: () => {},
      runInternalMigration: () => {}
    };
  }
  if (id === 'jsonwebtoken') {
    return { verify: () => {} };
  }
  if (id === 'dotenv') {
    return { config: () => {} };
  }
  return originalRequire.apply(this, arguments);
};

require('./server/routes/dealRoutes');
console.log('Successfully loaded dealRoutes without errors');
