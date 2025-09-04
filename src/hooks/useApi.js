// src/hooks/useApi.js - Custom Hooks สำหรับใช้งาน MyKidsDB2 API

import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

// Generic API Hook
export function useApi(apiCall, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
    } catch (err) {
      setError(err.message || 'API Error');
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// Children Hooks
export function useChildren() {
  const { data: children, loading, error, refetch } = useApi(() => apiService.getChildren());

  const createChild = useCallback(async (childData) => {
    const result = await apiService.createChild(childData);
    await refetch(); // Refresh data
    return result;
  }, [refetch]);

  return {
    children: children || [],
    loading,
    error,
    refetch,
    createChild,
  };
}

// Child Detail Hook with Today Score
export function useChild(childId) {
  const [child, setChild] = useState(null);
  const [todayScore, setTodayScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchChildData = useCallback(async () => {
    if (!childId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const [childData, scoreData] = await Promise.all([
        apiService.getChild(childId),
        apiService.getTodayScore(childId).catch(() => null) // Optional
      ]);
      
      setChild(childData);
      setTodayScore(scoreData);
    } catch (err) {
      setError(err.message);
      console.error('Child API Error:', err);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchChildData();
  }, [fetchChildData]);

  return { child, todayScore, loading, error, refetch: fetchChildData };
}

// Behaviors Hook
export function useBehaviors() {
  const [allBehaviors, setAllBehaviors] = useState([]);
  const [goodBehaviors, setGoodBehaviors] = useState([]);
  const [badBehaviors, setBadBehaviors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBehaviors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [good, bad] = await Promise.all([
        apiService.getGoodBehaviors(),
        apiService.getBadBehaviors()
      ]);
      
      setGoodBehaviors(good);
      setBadBehaviors(bad);
      setAllBehaviors([...good, ...bad]);
    } catch (err) {
      setError(err.message);
      console.error('Behaviors API Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBehaviors();
  }, [fetchBehaviors]);

  return {
    allBehaviors,
    goodBehaviors,
    badBehaviors,
    loading,
    error,
    refetch: fetchBehaviors,
  };
}

// Activities Hook
export function useActivities(childId = null) {
  const { data: activities, loading, error, refetch } = useApi(
    () => apiService.getActivities(childId), 
    [childId]
  );

  const logActivity = useCallback(async (activityData) => {
    // Map old activityId to new behaviorId for backward compatibility
    const normalizedData = {
      ...activityData,
      behaviorId: activityData.behaviorId || activityData.activityId,
    };
    
    const result = await apiService.logActivity(normalizedData);
    await refetch(); // Refresh data
    return result;
  }, [refetch]);

  return {
    activities: activities || [],
    loading,
    error,
    refetch,
    logActivity,
  };
}

// Rewards Hook
export function useRewards() {
  const { data: rewards, loading, error, refetch } = useApi(() => apiService.getRewards());

  return {
    rewards: rewards || [],
    loading,
    error,
    refetch,
  };
}

// Dashboard Hook
export function useDashboard() {
  const { data: dashboard, loading, error, refetch } = useApi(() => apiService.getDashboard());

  return {
    dashboard: dashboard || { children: [], today_activities: [], summary: {} },
    children: dashboard?.children || [],
    todayActivities: dashboard?.today_activities || [],
    summary: dashboard?.summary || {},
    loading,
    error,
    refetch,
  };
}

// Daily Activity Hook
export function useDailyActivity(childId = null) {
  const { data: dailyActivity, loading, error, refetch } = useApi(
    () => apiService.getDailyActivity(childId),
    [childId]
  );

  return {
    dailyActivity: dailyActivity || [],
    loading,
    error,
    refetch,
  };
}
