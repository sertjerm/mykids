// src/config/appConfig.js
export const appConfig = {
  api: {
    baseURL: 'https://apps4.coop.ku.ac.th/mykids/api',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  
  app: {
    name: 'MyKids',
    version: '2.0.0',
    description: 'ระบบติดตามพฤติกรรมเด็ก',
  },
  
  features: {
    enableMigration: true,
    enableLocalStorageFallback: true,
  },
  
  storageKeys: {
    children: 'mykids-children',
    activities: 'mykids-activities',
    rewards: 'mykids-rewards',
    goodBehaviors: 'mykids-good-behaviors',
    badBehaviors: 'mykids-bad-behaviors',
  },
};

export default appConfig;
