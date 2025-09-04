// utils/dailyDataManager.js
export class DailyDataManager {
  constructor() {
    this.today = this.getTodayString();
  }

  // ได้วันที่ปัจจุบันในรูปแบบ YYYY-MM-DD
  getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // ดึงข้อมูลกิจกรรมของเด็กในวันนี้เท่านั้น
  getTodayActivitiesForChild(childId) {
    try {
      const key = `activities_${childId}_${this.today}`;
      const stored = localStorage.getItem(key);
      
      if (!stored) {
        return {
          completedGoodBehaviors: new Set(),
          completedBadBehaviors: new Set(),
          todayScore: 0,
          activities: []
        };
      }

      const data = JSON.parse(stored);
      return {
        completedGoodBehaviors: new Set(data.completedGoodBehaviors || []),
        completedBadBehaviors: new Set(data.completedBadBehaviors || []),
        todayScore: data.todayScore || 0,
        activities: data.activities || []
      };
    } catch (error) {
      console.error('Error loading today activities:', error);
      return {
        completedGoodBehaviors: new Set(),
        completedBadBehaviors: new Set(),
        todayScore: 0,
        activities: []
      };
    }
  }

  // บันทึกข้อมูลกิจกรรมของวันนี้
  saveTodayActivitiesForChild(childId, data) {
    try {
      const key = `activities_${childId}_${this.today}`;
      const saveData = {
        completedGoodBehaviors: Array.from(data.completedGoodBehaviors),
        completedBadBehaviors: Array.from(data.completedBadBehaviors),
        todayScore: data.todayScore,
        activities: data.activities,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(key, JSON.stringify(saveData));
      
      // อัพเดทคะแนนรวมของเด็กด้วย
      this.updateChildTotalScore(childId, data.todayScore);
      
    } catch (error) {
      console.error('Error saving today activities:', error);
    }
  }

  // อัพเดทคะแนนรวมของเด็ก
  updateChildTotalScore(childId, todayScore) {
    try {
      const children = JSON.parse(localStorage.getItem('children') || '[]');
      const childIndex = children.findIndex(child => child.id === childId);
      
      if (childIndex !== -1) {
        children[childIndex].todayScore = todayScore;
        children[childIndex].lastUpdated = new Date().toISOString();
        localStorage.setItem('children', JSON.stringify(children));
      }
    } catch (error) {
      console.error('Error updating child total score:', error);
    }
  }

  // ตรวจสอบว่า Behavior ถูกทำเสร็จแล้วหรือไม่
  isBehaviorCompleted(childId, behaviorId, behaviorType = 'good') {
    const todayData = this.getTodayActivitiesForChild(childId);
    
    if (behaviorType === 'good') {
      return todayData.completedGoodBehaviors.has(behaviorId);
    } else {
      return todayData.completedBadBehaviors.has(behaviorId);
    }
  }

  // บันทึกการทำ Good Behavior
  completeGoodBehavior(childId, behaviorId, points, behaviorName) {
    const todayData = this.getTodayActivitiesForChild(childId);
    
    // ถ้ายังไม่เคยทำ ให้เพิ่มเข้าไป
    if (!todayData.completedGoodBehaviors.has(behaviorId)) {
      todayData.completedGoodBehaviors.add(behaviorId);
      todayData.todayScore += points;
      
      // เพิ่มรายการกิจกรรม
      todayData.activities.push({
        id: Date.now().toString(),
        behaviorId,
        behaviorName,
        type: 'good',
        points,
        timestamp: new Date().toISOString(),
        date: this.today
      });
      
      // บันทึกข้อมูล
      this.saveTodayActivitiesForChild(childId, todayData);
      
      return { success: true, newScore: todayData.todayScore };
    }
    
    return { success: false, message: 'งานนี้ทำเสร็จแล้ววันนี้' };
  }

  // บันทึกพฤติกรรมไม่ดี
  recordBadBehavior(childId, behaviorId, penalty, behaviorName) {
    const todayData = this.getTodayActivitiesForChild(childId);
    
    // เพิ่มเข้าไปเสมอ (สามารถทำซ้ำได้)
    todayData.completedBadBehaviors.add(behaviorId);
    todayData.todayScore -= penalty;
    
    // เพิ่มรายการกิจกรรม
    todayData.activities.push({
      id: Date.now().toString(),
      behaviorId,
      behaviorName,
      type: 'bad',
      points: -penalty,
      timestamp: new Date().toISOString(),
      date: this.today
    });
    
    // บันทึกข้อมูล
    this.saveTodayActivitiesForChild(childId, todayData);
    
    return { success: true, newScore: todayData.todayScore };
  }

  // ได้รายการเด็กพร้อมคะแนนของวันนี้
  getChildrenWithTodayScores() {
    try {
      const children = JSON.parse(localStorage.getItem('children') || '[]');
      
      return children.map(child => {
        const todayData = this.getTodayActivitiesForChild(child.id);
        return {
          ...child,
          todayScore: todayData.todayScore,
          todayActivitiesCount: todayData.activities.length,
          completedGoodBehaviors: todayData.completedGoodBehaviors.size,
          completedBadBehaviors: todayData.completedBadBehaviors.size
        };
      });
    } catch (error) {
      console.error('Error getting children with today scores:', error);
      return [];
    }
  }

  // รีเซ็ตข้อมูลวันใหม่
  resetForNewDay() {
    this.today = this.getTodayString();
    
    // ล้างข้อมูลเด็กทั้งหมดสำหรับวันใหม่
    const children = this.getChildrenWithTodayScores();
    children.forEach(child => {
      child.todayScore = 0;
    });
    
    return true;
  }

  // ได้รายการกิจกรรมของวันนี้
  getTodayActivitiesList(childId, limit = 10) {
    const todayData = this.getTodayActivitiesForChild(childId);
    return todayData.activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }
}
