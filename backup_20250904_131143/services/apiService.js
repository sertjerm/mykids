// services/apiService.js
class ApiService {
  constructor() {
    this.baseURL = "https://apps4.coop.ku.ac.th/mykids/api";
    this.authHeader = "";
  }

  async request(url, options = {}) {
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...(this.authHeader && { Authorization: this.authHeader }),
        ...options.headers,
      },
      ...options,
    };

    try {
      // url เช่น '/?children', '/?behaviors', '/?activities', ...
      const response = await fetch(`${this.baseURL}${url}`, config);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // ดึงข้อมูลเด็กทั้งหมด
  async getChildren() {
    return this.request("/?children");
  }

  // ดึงข้อมูล behaviors
  async getBehaviors() {
    return this.request("/?behaviors");
  }

  // ดึงข้อมูล bad behaviors
  async getBadBehaviors() {
    return this.request("/?bad-behaviors");
  }

  // ดึงข้อมูล rewards
  async getRewards() {
    return this.request("/?rewards");
  }

  // ดึงกิจกรรมของเด็กในวันนี้ - สำคัญมาก!
  async getTodayActivities(childId) {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return this.request(`/?activities&childId=${childId}&date=${today}`);
  }

  // ดึงคะแนนรวมของเด็กในวันนี้ (API ปัจจุบันไม่มี endpoint เฉพาะ ต้องดึงกิจกรรมวันนี้แล้วรวมคะแนนเอง)
  async getTodayScore(childId) {
    const today = new Date().toISOString().split("T")[0];
    // ดึงกิจกรรมวันนี้แล้วรวมคะแนน
    const activities = await this.request(
      `/?activities&childId=${childId}&date=${today}`
    );
    return activities.reduce((sum, act) => sum + (act.Points || 0), 0);
  }

  // บันทึกกิจกรรม
  async logActivity(childId, activityType, activityId, note = "") {
    // points ไม่ต้องส่ง ให้ backend คำนวณเอง
    return this.request("/?activities", {
      method: "POST",
      body: JSON.stringify({
        childId,
        activityType,
        activityId,
        note,
      }),
    });
  }

  // ใช้รางวัล
  async useReward(childId, rewardId, note = "") {
    // ไม่ต้องส่ง cost, backend จะตรวจสอบเอง
    return this.request("/?activities", {
      method: "POST",
      body: JSON.stringify({
        childId,
        activityType: "reward",
        activityId: rewardId,
        note,
      }),
    });
  }
}

export default new ApiService();
