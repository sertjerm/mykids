// src/services/apiService.js
// API Service Layer สำหรับเชื่อมต่อ MyKids Database API

const API_BASE_URL = '__API_URL_PLACEHOLDER__';

class MyKidsApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Children API
  async getChildren() {
    return await this.request('?children');
  }

  async getChild(childId) {
    return await this.request(`?children=${childId}`);
  }

  async createChild(childData) {
    return await this.request('?children', {
      method: 'POST',
      body: JSON.stringify(childData),
    });
  }

  async updateChild(childId, childData) {
    return await this.request(`?children=${childId}`, {
      method: 'PUT',
      body: JSON.stringify(childData),
    });
  }

  async deleteChild(childId) {
    return await this.request(`?children=${childId}`, {
      method: 'DELETE',
    });
  }

  // Activities API
  async getActivities(childId = null) {
    const endpoint = childId ? `?activities&child_id=${childId}` : '?activities';
    return await this.request(endpoint);
  }

  async logActivity(activityData) {
    return await this.request('?activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }

  // Behaviors API - Updated for MyKidsDB2
  async getAllBehaviors() {
    return await this.request('?behaviors');
  }

  async getGoodBehaviors() {
    return await this.request('?good-behaviors');
  }

  async getBadBehaviors() {
    return await this.request('?bad-behaviors');
  }

  // Rewards API
  async getRewards() {
    return await this.request('?rewards');
  }

  // Dashboard API
  async getDashboard() {
    return await this.request('?dashboard');
  }

  // Daily Activity API - NEW
  async getDailyActivity(childId = null) {
    const endpoint = childId ? `?daily&child_id=${childId}` : '?daily';
    return await this.request(endpoint);
  }

  // Today Score API - NEW
  async getTodayScore(childId) {
    return await this.request(`?children=${childId}&today-score`);
  }

  // Health Check
  async healthCheck() {
    return await this.request('?health');
  }
}

// Auto-detect API URL
const getApiBaseUrl = () => {
  // Production
  if (window.location.hostname === 'apps4.coop.ku.ac.th') {
    return 'https://apps4.coop.ku.ac.th/mykids/api';
  }
  
  // Development
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5173/api'; // Vite proxy
  }
  
  // Default fallback
  return '/api';
};

export const apiService = new MyKidsApiService();
apiService.baseURL = getApiBaseUrl();

export default apiService;
