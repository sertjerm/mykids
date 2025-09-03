// src/stores/useMyKidsStore.js
// Updated Zustand Store ที่ใช้ API แทน Local Storage

import { create } from 'zustand';
import apiService from '../services/apiService';

const useMyKidsStore = create((set, get) => ({
  // State
  children: [],
  activities: [],
  goodBehaviors: [],
  badBehaviors: [],
  rewards: [],
  selectedChild: null,
  loading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // Initialize App
  initializeApp: async () => {
    set({ loading: true, error: null });
    
    try {
      await apiService.healthCheck();
      
      const [
        childrenData,
        goodBehaviorsData,
        badBehaviorsData,
        rewardsData,
      ] = await Promise.all([
        apiService.getChildren(),
        apiService.getGoodBehaviors(),
        apiService.getBadBehaviors(),
        apiService.getRewards(),
      ]);

      set({
        children: childrenData.data || [],
        goodBehaviors: goodBehaviorsData.data || [],
        badBehaviors: badBehaviorsData.data || [],
        rewards: rewardsData.data || [],
        loading: false,
      });

      const children = childrenData.data || [];
      if (children.length > 0 && !get().selectedChild) {
        get().selectChild(children[0].id);
      }

    } catch (error) {
      console.error('Failed to initialize app:', error);
      set({ 
        error: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาตรวจสอบการตั้งค่า API',
        loading: false 
      });
    }
  },

  // Select Child
  selectChild: async (childId) => {
    set({ selectedChild: childId, loading: true });
    
    try {
      const activitiesData = await apiService.getActivities(childId);
      set({ 
        activities: activitiesData.data || [],
        loading: false 
      });
    } catch (error) {
      console.error('Failed to load child activities:', error);
      set({ error: 'ไม่สามารถโหลดข้อมูลกิจกรรมได้', loading: false });
    }
  },

  // Child Actions
  addChild: async (childData) => {
    set({ loading: true });
    try {
      const result = await apiService.createChild(childData);
      const childrenData = await apiService.getChildren();
      set({ 
        children: childrenData.data || [],
        loading: false 
      });
      return result;
    } catch (error) {
      console.error('Failed to add child:', error);
      set({ error: 'ไม่สามารถเพิ่มเด็กใหม่ได้', loading: false });
      throw error;
    }
  },

  // Activity Actions
  addGoodActivity: async (childId, activityId, points, note = '') => {
    try {
      await apiService.addGoodActivity(childId, activityId, points, note);
      if (get().selectedChild === childId) {
        await get().selectChild(childId);
      }
      return true;
    } catch (error) {
      console.error('Failed to add good activity:', error);
      set({ error: 'ไม่สามารถบันทึกกิจกรรมได้' });
      return false;
    }
  },

  addBadActivity: async (childId, activityId, points, note = '') => {
    try {
      await apiService.addBadActivity(childId, activityId, points, note);
      if (get().selectedChild === childId) {
        await get().selectChild(childId);
      }
      return true;
    } catch (error) {
      console.error('Failed to add bad activity:', error);
      set({ error: 'ไม่สามารถบันทึกพฤติกรรมได้' });
      return false;
    }
  },

  redeemReward: async (childId, rewardId, cost, note = '') => {
    try {
      const pointsData = await apiService.getChildPoints(childId);
      const currentPoints = pointsData.data?.totalPoints || 0;
      
      if (currentPoints < cost) {
        set({ error: 'คะแนนไม่เพียงพอ' });
        return false;
      }

      await apiService.redeemReward(childId, rewardId, cost, note);
      
      if (get().selectedChild === childId) {
        await get().selectChild(childId);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to redeem reward:', error);
      set({ error: 'ไม่สามารถแลกรางวัลได้' });
      return false;
    }
  },

  // Utility
  clearError: () => set({ error: null }),

  getSelectedChild: () => {
    const { selectedChild, children } = get();
    return children.find(child => child.id === selectedChild) || null;
  },

  getTotalPoints: (childId) => {
    const { activities } = get();
    return activities
      .filter(activity => activity.childId === childId)
      .reduce((total, activity) => total + (activity.points || 0), 0);
  },

  // Migration Helper
  migrateFromLocalStorage: async () => {
    set({ loading: true });
    
    try {
      const localStorageData = {
        children: JSON.parse(localStorage.getItem('mykids-children') || '[]'),
        activities: JSON.parse(localStorage.getItem('mykids-activities') || '[]'),
        rewards: JSON.parse(localStorage.getItem('mykids-rewards') || '[]'),
        goodBehaviors: JSON.parse(localStorage.getItem('mykids-good-behaviors') || '[]'),
        badBehaviors: JSON.parse(localStorage.getItem('mykids-bad-behaviors') || '[]'),
      };

      await apiService.importFromLocalStorage(localStorageData);
      await get().initializeApp();
      
      set({ loading: false });
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      set({ error: 'ไม่สามารถย้ายข้อมูลได้', loading: false });
      return false;
    }
  },
}));

export default useMyKidsStore;
