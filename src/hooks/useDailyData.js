// hooks/useDailyData.js
import { useState, useEffect, useCallback } from 'react';
import { DailyDataManager } from '../utils/dailyDataManager';

// สร้าง instance เดียว
const dailyManager = new DailyDataManager();

export const useDailyData = (selectedChildId) => {
  // State สำหรับข้อมูลทั้งหมด
  const [children, setChildren] = useState([]);
  const [goodBehaviors, setGoodBehaviors] = useState([]);
  const [badBehaviors, setBadBehaviors] = useState([]);
  const [rewards, setRewards] = useState([]);
  
  // State สำหรับเด็กที่เลือก
  const [childTodayData, setChildTodayData] = useState({
    completedGoodBehaviors: new Set(),
    completedBadBehaviors: new Set(),
    todayScore: 0,
    activities: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // โหลดข้อมูลพื้นฐานทั้งหมด
  const loadBasicData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // โหลดข้อมูลจาก localStorage
      const childrenData = JSON.parse(localStorage.getItem('children') || '[]');
      const behavorsData = JSON.parse(localStorage.getItem('behaviors') || '[]');
      const badBehaviorsData = JSON.parse(localStorage.getItem('badBehaviors') || '[]');
      const rewardsData = JSON.parse(localStorage.getItem('rewards') || '[]');

      // อัพเดทข้อมูลเด็กให้มีคะแนนวันนี้
      const childrenWithTodayScores = dailyManager.getChildrenWithTodayScores();
      
      setChildren(childrenWithTodayScores);
      setGoodBehaviors(behavorsData);
      setBadBehaviors(badBehaviorsData);
      setRewards(rewardsData);

    } catch (err) {
      console.error('Error loading basic data:', err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }, []);

  // โหลดข้อมูลของเด็กที่เลือกสำหรับวันนี้
  const loadChildTodayData = useCallback((childId) => {
    if (!childId) {
      setChildTodayData({
        completedGoodBehaviors: new Set(),
        completedBadBehaviors: new Set(),
        todayScore: 0,
        activities: []
      });
      return;
    }

    try {
      const todayData = dailyManager.getTodayActivitiesForChild(childId);
      setChildTodayData(todayData);
    } catch (err) {
      console.error('Error loading child today data:', err);
      setError('ไม่สามารถโหลดข้อมูลเด็กได้');
    }
  }, []);

  // ทำ Good Behavior
  const completeGoodBehavior = useCallback(async (behaviorId) => {
    if (!selectedChildId) return { success: false, message: 'ไม่ได้เลือกเด็ก' };

    try {
      setLoading(true);

      const behavior = goodBehaviors.find(b => b.id === behaviorId);
      if (!behavior) {
        return { success: false, message: 'ไม่พบงานนี้' };
      }

      const result = dailyManager.completeGoodBehavior(
        selectedChildId, 
        behaviorId, 
        behavior.points, 
        behavior.name
      );

      if (result.success) {
        loadChildTodayData(selectedChildId);
        loadBasicData();
        
        return { 
          success: true, 
          message: `เยี่ยม! +${behavior.points} คะแนน`,
          newScore: result.newScore 
        };
      } else {
        return result;
      }

    } catch (err) {
      console.error('Error completing good behavior:', err);
      return { success: false, message: 'เกิดข้อผิดพลาด' };
    } finally {
      setLoading(false);
    }
  }, [selectedChildId, goodBehaviors, loadChildTodayData, loadBasicData]);

  // ตรวจสอบว่าทำงานแล้วหรือไม่
  const isBehaviorCompleted = useCallback((behaviorId, type = 'good') => {
    if (!selectedChildId) return false;
    return dailyManager.isBehaviorCompleted(selectedChildId, behaviorId, type);
  }, [selectedChildId]);

  // ได้รายการกิจกรรมวันนี้
  const getTodayActivities = useCallback((limit = 10) => {
    if (!selectedChildId) return [];
    return dailyManager.getTodayActivitiesList(selectedChildId, limit);
  }, [selectedChildId]);

  // โหลดข้อมูลเมื่อ component mount
  useEffect(() => {
    loadBasicData();
  }, [loadBasicData]);

  // โหลดข้อมูลเด็กเมื่อเปลี่ยน selectedChildId
  useEffect(() => {
    loadChildTodayData(selectedChildId);
  }, [selectedChildId, loadChildTodayData]);

  // ตรวจสอบเปลี่ยนวันใหม่
  useEffect(() => {
    const checkNewDay = () => {
      const currentDate = dailyManager.getTodayString();
      const lastDate = localStorage.getItem('lastActiveDate');
      
      if (lastDate && lastDate !== currentDate) {
        // วันใหม่! รีเซ็ตข้อมูล
        dailyManager.resetForNewDay();
        loadBasicData();
        loadChildTodayData(selectedChildId);
      }
      
      localStorage.setItem('lastActiveDate', currentDate);
    };

    checkNewDay();
    
    // ตรวจสอบทุก 5 นาที
    const interval = setInterval(checkNewDay, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedChildId, loadBasicData, loadChildTodayData]);

  return {
    // ข้อมูลพื้นฐาน
    children,
    goodBehaviors,
    badBehaviors, 
    rewards,
    
    // ข้อมูลของเด็กที่เลือกวันนี้
    childTodayData,
    todayScore: childTodayData.todayScore,
    completedGoodBehaviors: childTodayData.completedGoodBehaviors,
    completedBadBehaviors: childTodayData.completedBadBehaviors,
    
    // สถานะ
    loading,
    error,
    
    // ฟังก์ชัน
    completeGoodBehavior,
    isBehaviorCompleted,
    getTodayActivities,
    refreshData: loadBasicData,
    
    // ตัวจัดการ
    dailyManager
  };
};
