// src/services/apiService.js
// Updated API Service สำหรับใช้กับ Vite Proxy

// ใช้ environment variable ที่กำหนดใน vite.config.js
const API_BASE_URL = import.meta.env.MODE === 'development' 
  ? '/api'  // ใช้ proxy ใน development
  : 'https://apps4.coop.ku.ac.th/mykids/api';  // ใช้ direct URL ใน production

console.log(`🌐 API Mode: ${import.meta.env.MODE}, Base URL: ${API_BASE_URL}`);

class MyKidsApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method สำหรับ HTTP requests
  async request(endpoint, options = {}) {
    // ใน development ใช้ proxy: /api/?children
    // ใน production ใช้ direct: https://apps4.coop.ku.ac.th/mykids/api/?children
    const url = `${this.baseURL}/${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...options,
    };

    try {
      console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📥 API Response:`, data);
      
      // แปลง response format ให้ตรงกับที่ client คาดหวัง
      return this.normalizeResponse(data);
    } catch (error) {
      console.error('❌ API request failed:', error);
      throw error;
    }
  }

  // Normalize API response format
  normalizeResponse(rawData) {
    if (Array.isArray(rawData)) {
      return {
        data: rawData.map(item => this.normalizeItem(item)),
        success: true
      };
    }
    
    if (rawData && typeof rawData === 'object') {
      return {
        data: this.normalizeItem(rawData),
        success: true
      };
    }
    
    return {
      data: rawData,
      success: true
    };
  }

  // แปลง PascalCase เป็น camelCase
  normalizeItem(item) {
    if (!item || typeof item !== 'object') return item;
    
    const normalized = {};
    
    Object.keys(item).forEach(key => {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      normalized[camelKey] = item[key];
    });
    
    return normalized;
  }

  // ========== API ENDPOINTS ==========
  
  async getChildren() {
    return await this.request('?children');
  }

  async getChild(childId) {
    return await this.request(`?children=${childId}`);
  }

  async createChild(childData) {
    // แปลงกลับเป็น PascalCase สำหรับส่งไป API
    const apiData = this.prepareForApi(childData);
    
    return await this.request('?children', {
      method: 'POST',
      body: JSON.stringify(apiData),
    });
  }

  async getActivities(childId = null) {
    const endpoint = childId ? `?activities=${childId}` : '?activities';
    return await this.request(endpoint);
  }

  async addGoodActivity(childId, activityId, points, note = '') {
    const data = {
      childId,
      activityType: 'good',
      activityId,
      points,
      note,
    };
    
    return await this.request('?activities', {
      method: 'POST',
      body: JSON.stringify(this.prepareForApi(data)),
    });
  }

  async addBadActivity(childId, activityId, points, note = '') {
    const data = {
      childId,
      activityType: 'bad',
      activityId,
      points: -Math.abs(points),
      note,
    };
    
    return await this.request('?activities', {
      method: 'POST',
      body: JSON.stringify(this.prepareForApi(data)),
    });
  }

  async redeemReward(childId, rewardId, cost, note = '') {
    const data = {
      childId,
      activityType: 'reward',
      activityId: rewardId,
      points: -Math.abs(cost),
      note,
    };
    
    return await this.request('?activities', {
      method: 'POST',
      body: JSON.stringify(this.prepareForApi(data)),
    });
  }

  async getChildPoints(childId) {
    return await this.request(`?points=${childId}`);
  }

  async getAllChildrenPoints() {
    return await this.request('?points');
  }

  async getRewards() {
    return await this.request('?rewards');
  }

  async getGoodBehaviors() {
    return await this.request('?tasks');
  }

  async getBadBehaviors() {
    return await this.request('?bad-behaviors');
  }

  async healthCheck() {
    try {
      const response = await this.request('?health');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // ========== UTILITY METHODS ==========
  
  prepareForApi(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.prepareItemForApi(item));
    }
    
    if (data && typeof data === 'object') {
      return this.prepareItemForApi(data);
    }
    
    return data;
  }

  prepareItemForApi(item) {
    if (!item || typeof item !== 'object') return item;
    
    const prepared = {};
    
    Object.keys(item).forEach(key => {
      const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
      prepared[pascalKey] = item[key];
    });
    
    return prepared;
  }

  async importFromLocalStorage(localStorageData) {
    return await this.request('?import', {
      method: 'POST',
      body: JSON.stringify(this.prepareForApi(localStorageData)),
    });
  }

  // Migration helper
  async migrateFromLocalStorage() {
    try {
      const localStorageData = {
        children: JSON.parse(localStorage.getItem('mykids-children') || '[]'),
        activities: JSON.parse(localStorage.getItem('mykids-activities') || '[]'),
        rewards: JSON.parse(localStorage.getItem('mykids-rewards') || '[]'),
        goodBehaviors: JSON.parse(localStorage.getItem('mykids-good-behaviors') || '[]'),
        badBehaviors: JSON.parse(localStorage.getItem('mykids-bad-behaviors') || '[]'),
      };

      await this.importFromLocalStorage(localStorageData);
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    }
  }
}

// สร้าง singleton instance
const apiService = new MyKidsApiService();

// Export สำหรับ debug
if (import.meta.env.MODE === 'development') {
  window.myKidsApi = apiService;
  console.log('🛠️ MyKids API Service available at window.myKidsApi');
  console.log('🔗 API Base URL:', API_BASE_URL);
}

export default apiService;