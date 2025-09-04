// hooks/useApiDailyData.js - Hook ที่แก้ปัญหา binding แล้ว
import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

export const useApiDailyData = (selectedChildId) => {
  // State สำหรับข้อมูลทั้งหมด
  const [children, setChildren] = useState([]);
  const [goodBehaviors, setGoodBehaviors] = useState([]);
  const [badBehaviors, setBadBehaviors] = useState([]);
  const [rewards, setRewards] = useState([]);
  
  // State สำหรับเด็กที่เลือก - วันนี้เท่านั้น
  const [todayScore, setTodayScore] = useState(0);
  const [completedBehaviors, setCompletedBehaviors] = useState(new Set());
  const [todayActivities, setTodayActivities] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // โหลดข้อมูลพื้นฐาน
  const loadBasicData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [childrenData, behaviorsData, badBehaviorsData, rewardsData] = await Promise.all([
        apiService.getChildren(),
        apiService.getBehaviors(),
        apiService.getBadBehaviors(),
        apiService.getRewards()
      ]);

      setChildren(childrenData);
      setGoodBehaviors(behaviorsData);
      setBadBehaviors(badBehaviorsData);
      setRewards(rewardsData);

      console.log('📊 Loaded basic data:', {
        children: childrenData.length,
        behaviors: behaviorsData.length,
        badBehaviors: badBehaviorsData.length,
        rewards: rewardsData.length
      });

    } catch (err) {
      console.error('❌ Error loading basic data:', err);
      setError('ไม่สามารถโหลดข้อมูลได้: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // โหลดข้อมูลวันนี้ของเด็กที่เลือก - 🎯 จุดสำคัญ!
  const loadChildTodayData = useCallback(async (childId) => {
    if (!childId) {
      setTodayScore(0);
      setCompletedBehaviors(new Set());
      setTodayActivities([]);
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Loading today data for child:', childId);

      // ดึงข้อมูลพร้อมกัน
      const [scoreData, activitiesData] = await Promise.all([
        apiService.getTodayScore(childId).catch(() => ({ totalScore: 0 })),
        apiService.getTodayActivities(childId).catch(() => [])
      ]);

      console.log('📈 Score data:', scoreData);
      console.log('📋 Activities data:', activitiesData);

      // อัพเดทคะแนน
      const score = scoreData.totalScore || scoreData.TotalScore || 0;
      setTodayScore(score);

      // อัพเดทรายการกิจกรรม
      setTodayActivities(activitiesData || []);

      // 🎯 สำคัญที่สุด: สร้าง Set ของ behaviors ที่ทำแล้ววันนี้
      const completedToday = new Set();
      
      if (Array.isArray(activitiesData)) {
        activitiesData.forEach(activity => {
          const activityType = activity.ActivityType || activity.activityType;
          const activityId = activity.ActivityId || activity.activityId;
          
          // เก็บเฉพาะ good behaviors ที่ทำแล้ว
          if (activityType === 'good' && activityId) {
            completedToday.add(activityId);
          }
        });
      }

      setCompletedBehaviors(completedToday);

      console.log('🎯 Completed behaviors today:', Array.from(completedToday));
      console.log('💯 Today score:', score);

    } catch (err) {
      console.error('❌ Error loading child today data:', err);
      setError('ไม่สามารถโหลดข้อมูลเด็กได้: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ตรวจสอบว่า behavior ทำแล้วหรือไม่ - 🎯 ฟังก์ชันสำคัญ!
  const isBehaviorCompleted = useCallback((behaviorId) => {
    const result = completedBehaviors.has(behaviorId);
    console.log(\`🔍 isBehaviorCompleted(\${behaviorId}): \${result}\`);
    return result;
  }, [completedBehaviors]);

  // ทำ good behavior
  const completeGoodBehavior = useCallback(async (behaviorId) => {
    if (!selectedChildId) {
      return { success: false, message: 'ไม่ได้เลือกเด็ก' };
    }

    // ตรวจสอบว่าทำแล้วหรือไม่
    if (isBehaviorCompleted(behaviorId)) {
      return { success: false, message: 'งานนี้ทำแล้ววันนี้' };
    }

    try {
      setLoading(true);

      // หา behavior
      const behavior = goodBehaviors.find(b => (b.Id || b.id) === behaviorId);
      if (!behavior) {
        return { success: false, message: 'ไม่พบงานนี้' };
      }

      const points = behavior.Points || behavior.points || 0;
      const name = behavior.Name || behavior.name;

      console.log(\`🎯 Completing behavior: \${name} (+\${points} points)\`);

      // บันทึกกิจกรรม
      const result = await apiService.logActivity(
        selectedChildId,
        'good',
        behaviorId,
        points,
        'ทำงานเสร็จแล้ว'
      );

      // อัพเดท state ทันที (Optimistic Update)
      setTodayScore(prev => prev + points);
      setCompletedBehaviors(prev => new Set([...prev, behaviorId]));
      
      // รีโหลดข้อมูลเพื่อให้แน่ใจ
      setTimeout(() => {
        loadChildTodayData(selectedChildId);
      }, 500);
      
      return { 
        success: true, 
        message: \`เยี่ยม! +\${points} คะแนน\`,
        newScore: todayScore + points
      };

    } catch (err) {
      console.error('❌ Error completing behavior:', err);
      return { success: false, message: 'เกิดข้อผิดพลาด: ' + err.message };
    } finally {
      setLoading(false);
    }
  }, [selectedChildId, goodBehaviors, isBehaviorCompleted, todayScore, loadChildTodayData]);

  // บันทึก bad behavior
  const recordBadBehavior = useCallback(async (behaviorId) => {
    if (!selectedChildId) {
      return { success: false, message: 'ไม่ได้เลือกเด็ก' };
    }

    try {
      setLoading(true);

      const behavior = badBehaviors.find(b => (b.Id || b.id) === behaviorId);
      if (!behavior) {
        return { success: false, message: 'ไม่พบพฤติกรรมนี้' };
      }

      const penalty = behavior.Penalty || behavior.penalty || 0;
      const name = behavior.Name || behavior.name;

      const result = await apiService.logActivity(
        selectedChildId,
        'bad', 
        behaviorId,
        -penalty,
        'พฤติกรรมไม่ดี'
      );

      // อัพเดท state ทันที
      setTodayScore(prev => prev - penalty);
      
      // รีโหลดข้อมูล
      setTimeout(() => {
        loadChildTodayData(selectedChildId);
      }, 500);
      
      return { 
        success: true, 
        message: \`หักคะแนน -\${penalty}\`,
        newScore: todayScore - penalty
      };

    } catch (err) {
      console.error('❌ Error recording bad behavior:', err);
      return { success: false, message: 'เกิดข้อผิดพลาด: ' + err.message };
    } finally {
      setLoading(false);
    }
  }, [selectedChildId, badBehaviors, todayScore, loadChildTodayData]);

  // ใช้รางวัล
  const useReward = useCallback(async (rewardId) => {
    if (!selectedChildId) {
      return { success: false, message: 'ไม่ได้เลือกเด็ก' };
    }

    try {
      setLoading(true);

      const reward = rewards.find(r => (r.Id || r.id) === rewardId);
      if (!reward) {
        return { success: false, message: 'ไม่พบรางวัลนี้' };
      }

      const cost = reward.Cost || reward.cost || 0;
      const name = reward.Name || reward.name;

      if (todayScore < cost) {
        return { success: false, message: 'คะแนนไม่เพียงพอ' };
      }

      const result = await apiService.useReward(
        selectedChildId,
        rewardId,
        cost,
        'ใช้รางวัล'
      );

      // อัพเดท state ทันที
      setTodayScore(prev => prev - cost);
      
      // รีโหลดข้อมูล
      setTimeout(() => {
        loadChildTodayData(selectedChildId);
      }, 500);
      
      return { 
        success: true, 
        message: \`แลกรางวัลสำเร็จ! -\${cost} คะแนน\`,
        newScore: todayScore - cost
      };

    } catch (err) {
      console.error('❌ Error using reward:', err);
      return { success: false, message: 'เกิดข้อผิดพลาด: ' + err.message };
    } finally {
      setLoading(false);
    }
  }, [selectedChildId, rewards, todayScore, loadChildTodayData]);

  // โหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    loadBasicData();
  }, [loadBasicData]);

  // โหลดข้อมูลเด็กเมื่อเปลี่ยน selectedChildId
  useEffect(() => {
    loadChildTodayData(selectedChildId);
  }, [selectedChildId, loadChildTodayData]);

  // Auto refresh ทุก 30 วินาที (optional)
  useEffect(() => {
    if (!selectedChildId) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto refreshing child data...');
      loadChildTodayData(selectedChildId);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedChildId, loadChildTodayData]);

  return {
    // ข้อมูลพื้นฐาน
    children,
    goodBehaviors,
    badBehaviors,
    rewards,
    
    // ข้อมูลวันนี้ของเด็กที่เลือก
    todayScore,
    completedBehaviors,
    todayActivities,
    
    // สถานะ
    loading,
    error,
    
    // ฟังก์ชัน - 🎯 สำคัญมาก!
    completeGoodBehavior,
    recordBadBehavior,
    useReward,
    isBehaviorCompleted,  // <- ฟังก์ชันสำคัญสำหรับ binding
    
    // Utility functions
    refreshData: () => {
      loadBasicData();
      loadChildTodayData(selectedChildId);
    },
    refreshChildData: () => loadChildTodayData(selectedChildId)
  };
};
