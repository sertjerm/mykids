// services/api.js - API Service Layer
const API_BASE_URL = 'https://apps4.coop.ku.ac.th/mykids/api'; // แก้ไข URL ให้ตรงกับ server

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

class ApiService {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || 'API request failed',
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0, null);
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Children endpoints
  async getChildren() {
    return this.request('/children');
  }

  async getChild(id) {
    return this.request(`/children/${id}`);
  }

  async createChild(childData) {
    return this.request('/children', {
      method: 'POST',
      body: JSON.stringify(childData),
    });
  }

  async updateChild(id, childData) {
    return this.request(`/children/${id}`, {
      method: 'PUT',
      body: JSON.stringify(childData),
    });
  }

  async deleteChild(id) {
    return this.request(`/children/${id}`, {
      method: 'DELETE',
    });
  }

  // Behaviors endpoints
  async getBehaviors() {
    return this.request('/behaviors');
  }

  async createBehavior(behaviorData) {
    return this.request('/behaviors', {
      method: 'POST',
      body: JSON.stringify(behaviorData),
    });
  }

  async updateBehavior(id, behaviorData) {
    return this.request(`/behaviors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(behaviorData),
    });
  }

  async deleteBehavior(id) {
    return this.request(`/behaviors/${id}`, {
      method: 'DELETE',
    });
  }

  // Bad behaviors endpoints
  async getBadBehaviors() {
    return this.request('/bad-behaviors');
  }

  async createBadBehavior(behaviorData) {
    return this.request('/bad-behaviors', {
      method: 'POST',
      body: JSON.stringify(behaviorData),
    });
  }

  async updateBadBehavior(id, behaviorData) {
    return this.request(`/bad-behaviors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(behaviorData),
    });
  }

  async deleteBadBehavior(id) {
    return this.request(`/bad-behaviors/${id}`, {
      method: 'DELETE',
    });
  }

  // Rewards endpoints
  async getRewards() {
    return this.request('/rewards');
  }

  async createReward(rewardData) {
    return this.request('/rewards', {
      method: 'POST',
      body: JSON.stringify(rewardData),
    });
  }

  async updateReward(id, rewardData) {
    return this.request(`/rewards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(rewardData),
    });
  }

  async deleteReward(id) {
    return this.request(`/rewards/${id}`, {
      method: 'DELETE',
    });
  }

  // Activities endpoints
  async getActivities(childId = null, limit = 20) {
    const params = new URLSearchParams();
    if (childId) params.append('child_id', childId);
    if (limit) params.append('limit', limit);
    
    const query = params.toString();
    return this.request(`/activities${query ? '?' + query : ''}`);
  }

  async logActivity(activityData) {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }

  // Points endpoints
  async getChildPoints(childId = null) {
    return this.request(`/points${childId ? '/' + childId : ''}`);
  }

  // Dashboard endpoint
  async getDashboard() {
    return this.request('/dashboard');
  }
}

export const apiService = new ApiService();

// hooks/useApi.js - Custom Hooks สำหรับเรียกใช้ API
import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

// Generic hook สำหรับ API calls
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
      setError(err);
      console.error('API Error:', err);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

// Hook สำหรับ Children
export function useChildren() {
  const { data: children, loading, error, refetch } = useApi(() => apiService.getChildren());

  const createChild = useCallback(async (childData) => {
    const result = await apiService.createChild(childData);
    await refetch(); // Refresh data
    return result;
  }, [refetch]);

  const updateChild = useCallback(async (id, childData) => {
    const result = await apiService.updateChild(id, childData);
    await refetch();
    return result;
  }, [refetch]);

  const deleteChild = useCallback(async (id) => {
    const result = await apiService.deleteChild(id);
    await refetch();
    return result;
  }, [refetch]);

  return {
    children: children || [],
    loading,
    error,
    refetch,
    createChild,
    updateChild,
    deleteChild,
  };
}

// Hook สำหรับ Behaviors
export function useBehaviors() {
  const { data: behaviors, loading, error, refetch } = useApi(() => apiService.getBehaviors());

  const createBehavior = useCallback(async (behaviorData) => {
    const result = await apiService.createBehavior(behaviorData);
    await refetch();
    return result;
  }, [refetch]);

  const updateBehavior = useCallback(async (id, behaviorData) => {
    const result = await apiService.updateBehavior(id, behaviorData);
    await refetch();
    return result;
  }, [refetch]);

  const deleteBehavior = useCallback(async (id) => {
    const result = await apiService.deleteBehavior(id);
    await refetch();
    return result;
  }, [refetch]);

  return {
    behaviors: behaviors || [],
    loading,
    error,
    refetch,
    createBehavior,
    updateBehavior,
    deleteBehavior,
  };
}

// Hook สำหรับ Bad Behaviors
export function useBadBehaviors() {
  const { data: badBehaviors, loading, error, refetch } = useApi(() => apiService.getBadBehaviors());

  const createBadBehavior = useCallback(async (behaviorData) => {
    const result = await apiService.createBadBehavior(behaviorData);
    await refetch();
    return result;
  }, [refetch]);

  const updateBadBehavior = useCallback(async (id, behaviorData) => {
    const result = await apiService.updateBadBehavior(id, behaviorData);
    await refetch();
    return result;
  }, [refetch]);

  const deleteBadBehavior = useCallback(async (id) => {
    const result = await apiService.deleteBadBehavior(id);
    await refetch();
    return result;
  }, [refetch]);

  return {
    badBehaviors: badBehaviors || [],
    loading,
    error,
    refetch,
    createBadBehavior,
    updateBadBehavior,
    deleteBadBehavior,
  };
}

// Hook สำหรับ Rewards
export function useRewards() {
  const { data: rewards, loading, error, refetch } = useApi(() => apiService.getRewards());

  const createReward = useCallback(async (rewardData) => {
    const result = await apiService.createReward(rewardData);
    await refetch();
    return result;
  }, [refetch]);

  const updateReward = useCallback(async (id, rewardData) => {
    const result = await apiService.updateReward(id, rewardData);
    await refetch();
    return result;
  }, [refetch]);

  const deleteReward = useCallback(async (id) => {
    const result = await apiService.deleteReward(id);
    await refetch();
    return result;
  }, [refetch]);

  return {
    rewards: rewards || [],
    loading,
    error,
    refetch,
    createReward,
    updateReward,
    deleteReward,
  };
}

// Hook สำหรับ Activities
export function useActivities(childId = null, limit = 20) {
  const { data: activities, loading, error, refetch } = useApi(
    () => apiService.getActivities(childId, limit),
    [childId, limit]
  );

  const logActivity = useCallback(async (activityData) => {
    const result = await apiService.logActivity(activityData);
    await refetch(); // Refresh activities
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

// Hook สำหรับ Dashboard
export function useDashboard() {
  const { data: dashboard, loading, error, refetch } = useApi(() => apiService.getDashboard());

  return {
    dashboard: dashboard || {
      children: [],
      todayActivities: [],
      todaySummary: [],
    },
    loading,
    error,
    refetch,
  };
}

// Hook สำหรับ Child Points
export function useChildPoints(childId = null) {
  const { data: points, loading, error, refetch } = useApi(
    () => apiService.getChildPoints(childId),
    [childId]
  );

  return {
    points: points || (childId ? { TotalPoints: 0 } : []),
    loading,
    error,
    refetch,
  };
}

// Hook สำหรับจัดการ mutations พร้อม optimistic updates
export function useMutation(mutationFn, options = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await mutationFn(...args);
      
      if (options.onSuccess) {
        await options.onSuccess(result);
      }
      
      return result;
    } catch (err) {
      setError(err);
      if (options.onError) {
        options.onError(err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, options]);

  return {
    mutate,
    loading,
    error,
  };
}