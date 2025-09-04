// services/apiService.js
class ApiService {
  constructor() {
    this.baseURL = 'https://apps4.coop.ku.ac.th/mykids/api';
    this.authHeader = '';
  }

  async request(url, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.authHeader && { Authorization: this.authHeader }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.baseURL}${url}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ดึงข้อมูลเด็กทั้งหมด
  async getChildren() {
    return this.request('/children');
  }

  // ดึงข้อมูล behaviors
  async getBehaviors() {
    return this.request('/behaviors');
  }

  // ดึงข้อมูล bad behaviors  
  async getBadBehaviors() {
    return this.request('/bad-behaviors');
  }

  // ดึงข้อมูล rewards
  async getRewards() {
    return this.request('/rewards');
  }

  // ดึงกิจกรรมของเด็กในวันนี้ - สำคัญมาก!
  async getTodayActivities(childId) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return this.request(`/activities?childId=${childId}&date=${today}`);
  }

  // ดึงคะแนนรวมของเด็กในวันนี้
  async getTodayScore(childId) {
    const today = new Date().toISOString().split('T')[0];
    return this.request(`/children/${childId}/today-score?date=${today}`);
  }

  // บันทึกกิจกรรม
  async logActivity(childId, activityType, activityId, points, note = '') {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify({
        childId,
        activityType,
        activityId,
        points,
        note,
        activityDate: new Date().toISOString()
      }),
    });
  }

  // ใช้รางวัล
  async useReward(childId, rewardId, cost, note = '') {
    return this.request('/activities', {
      method: 'POST', 
      body: JSON.stringify({
        childId,
        activityType: 'reward',
        activityId: rewardId,
        points: -cost,
        note,
        activityDate: new Date().toISOString()
      }),
    });
  }
}

export default new ApiService();
