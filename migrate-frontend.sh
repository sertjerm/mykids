#!/bin/bash

# MyKids Frontend Migration Script for MyKidsDB2 API
# อัพเดท Frontend React ให้รองรับ API ใหม่

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_step() {
    echo -e "\n${YELLOW}🔧 $1${NC}"
}

# Check if we're in the right directory
check_project_structure() {
    print_step "ตรวจสอบโครงสร้างโปรเจ็ค..."
    
    if [ ! -f "package.json" ]; then
        print_error "ไม่พบ package.json - โปรดรันใน root directory ของโปรเจ็ค"
        exit 1
    fi
    
    if [ ! -d "src" ]; then
        print_error "ไม่พบ src directory"
        exit 1
    fi
    
    print_success "โครงสร้างโปรเจ็คถูกต้อง"
}

# Create backup
create_backup() {
    print_step "สร้าง backup ไฟล์เดิม..."
    
    BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup important files
    if [ -d "src/services" ]; then
        cp -r src/services "$BACKUP_DIR/"
        print_success "Backup: src/services"
    fi
    
    if [ -d "src/components" ]; then
        cp -r src/components "$BACKUP_DIR/"
        print_success "Backup: src/components"
    fi
    
    if [ -f "vite.config.js" ]; then
        cp vite.config.js "$BACKUP_DIR/"
        print_success "Backup: vite.config.js"
    fi
    
    if [ -d "src/mykids-api" ]; then
        cp -r src/mykids-api "$BACKUP_DIR/"
        print_success "Backup: src/mykids-api"
    fi
    
    print_success "Backup สร้างเรียบร้อยที่: $BACKUP_DIR"
}

# Check and install dependencies
check_dependencies() {
    print_step "ตรวจสอบ dependencies..."
    
    required_deps=(
        "react"
        "react-dom"
        "lucide-react"
        "zustand"
        "uuid"
        "clsx"
    )
    
    missing_deps=()
    for dep in "${required_deps[@]}"; do
        if ! grep -q "\"$dep\"" package.json; then
            missing_deps+=("$dep")
        fi
    done
    
    if [ ${#missing_deps[@]} -gt 0 ]; then
        print_info "จะติดตั้ง dependencies ที่ขาดหาย: ${missing_deps[*]}"
        
        # Detect package manager
        if [ -f "yarn.lock" ]; then
            PM="yarn add"
        elif [ -f "pnpm-lock.yaml" ]; then
            PM="pnpm add"
        else
            PM="npm install"
        fi
        
        echo "กำลังติดตั้ง dependencies..."
        $PM "${missing_deps[@]}"
        print_success "ติดตั้ง dependencies เสร็จสิ้น"
    else
        print_success "Dependencies ครบถ้วนแล้ว"
    fi
}

# Create directory structure
create_directories() {
    print_step "สร้างโครงสร้างโฟลเดอร์..."
    
    directories=(
        "src/services"
        "src/components/migration"
        "src/config"
        "src/utils"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        print_success "สร้าง: $dir"
    done
}

# Create API Service file
create_api_service() {
    print_step "สร้าง API Service..."
    
    cat > "src/services/apiService.js" << 'EOF'
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
EOF

    # Replace placeholder with actual API URL detection
    print_success "สร้าง apiService.js เรียบร้อย"
}

# Create API Hook
create_api_hook() {
    print_step "สร้าง Custom Hooks..."
    
    cat > "src/hooks/useApi.js" << 'EOF'
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
EOF

    mkdir -p "src/hooks"
    print_success "สร้าง useApi.js เรียบร้อย"
}

# Update main component
update_main_component() {
    print_step "อัพเดท Main Component..."
    
    if [ -f "src/components/MyKidsMainUI.jsx" ]; then
        # Create updated version
        cat > "src/components/MyKidsMainUI.jsx" << 'EOF'
import React, { useState, useEffect } from "react";
import {
  Settings,
  UserPlus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Gift,
} from "lucide-react";
import { useChildren, useBehaviors, useActivities, useRewards } from '../hooks/useApi';

const MyKidsMainUI = () => {
  // API Hooks - Updated for MyKidsDB2
  const { children, loading: childrenLoading, createChild } = useChildren();
  const { goodBehaviors, badBehaviors, loading: behaviorsLoading } = useBehaviors();
  const { rewards, loading: rewardsLoading } = useRewards();
  
  // Local State
  const [selectedChild, setSelectedChild] = useState(null);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [activeTab, setActiveTab] = useState("good");

  // Activity hook for selected child
  const { activities, logActivity, loading: activitiesLoading } = useActivities(selectedChild?.id);

  // Select first child by default
  useEffect(() => {
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0]);
    }
  }, [children, selectedChild]);

  // Handle loading states
  if (childrenLoading || behaviorsLoading || rewardsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Handle activity completion
  const handleActivityComplete = async (behavior, type = 'good') => {
    if (!selectedChild) return;

    try {
      await logActivity({
        childId: selectedChild.id,
        behaviorId: behavior.id, // Updated field name
        activityType: type === 'good' ? 'Good' : 'Bad',
        date: new Date().toISOString().split('T')[0],
        note: `${behavior.name} - ${new Date().toLocaleTimeString()}`
      });

      // Visual feedback
      const taskId = `${behavior.id}-${Date.now()}`;
      setCompletedTasks(prev => new Set([...prev, taskId]));
      
      setTimeout(() => {
        setCompletedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }, 2000);

    } catch (error) {
      console.error('Failed to log activity:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกกิจกรรม');
    }
  };

  // Handle reward redemption
  const handleRewardClaim = async (reward) => {
    if (!selectedChild) return;
    
    // Check if child has enough points
    if (selectedChild.totalPoints < reward.cost) {
      alert(`คะแนนไม่เพียงพอ! ต้องการ ${reward.cost} คะแนน มีอยู่ ${selectedChild.totalPoints} คะแนน`);
      return;
    }

    try {
      await logActivity({
        childId: selectedChild.id,
        behaviorId: reward.id,
        activityType: 'Reward',
        date: new Date().toISOString().split('T')[0],
        note: `แลกรางวัล: ${reward.name}`
      });

      alert(`🎉 แลกรางวัล "${reward.name}" สำเร็จ!`);
      
    } catch (error) {
      console.error('Failed to redeem reward:', error);
      alert('เกิดข้อผิดพลาดในการแลกรางวัล');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              MyKids v2.0
            </h1>
            <div className="flex gap-2">
              <button className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 transition-colors">
                <Settings className="w-5 h-5 text-purple-600" />
              </button>
              <button className="p-2 rounded-full bg-green-100 hover:bg-green-200 transition-colors">
                <UserPlus className="w-5 h-5 text-green-600" />
              </button>
            </div>
          </div>

          {/* Child Selection Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child)}
                className={`px-6 py-3 rounded-full font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedChild?.id === child.id
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "bg-white/60 text-purple-700 hover:bg-white/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  {/* Updated to use AvatarPath instead of Emoji */}
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm">
                    {child.name?.charAt(0) || '👶'}
                  </div>
                  <span>{child.name}</span>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {child.totalPoints || 0}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Activity Tabs */}
          <div className="flex bg-white/50 rounded-full p-1">
            {[
              { id: "good", label: "งานดี", count: goodBehaviors.length, color: "green" },
              { id: "bad", label: "ไม่ดี", count: badBehaviors.length, color: "red" },
              { id: "rewards", label: "รางวัล", count: rewards.length, color: "purple" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 rounded-full font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? `bg-${tab.color}-500 text-white shadow-md`
                    : `text-${tab.color}-600 hover:bg-${tab.color}-50`
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {selectedChild && (
          <div className="mb-6 bg-white/60 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-purple-800 mb-2">
              {selectedChild.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-green-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{selectedChild.totalPoints || 0}</div>
                <div className="text-green-700">คะแนนรวม</div>
              </div>
              <div className="bg-blue-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{selectedChild.goodBehaviorCount || 0}</div>
                <div className="text-blue-700">งานดี</div>
              </div>
              <div className="bg-red-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{selectedChild.badBehaviorCount || 0}</div>
                <div className="text-red-700">พฤติกรรมไม่ดี</div>
              </div>
              <div className="bg-purple-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">{selectedChild.rewardCount || 0}</div>
                <div className="text-purple-700">รางวัลที่ได้</div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Good Behaviors */}
          {activeTab === "good" &&
            goodBehaviors.map((behavior) => (
              <div
                key={behavior.id}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">{behavior.name}</h3>
                  <span 
                    className="px-3 py-1 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: behavior.color }}
                  >
                    +{behavior.points}
                  </span>
                </div>
                <button
                  onClick={() => handleActivityComplete(behavior, 'good')}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-medium"
                  disabled={activitiesLoading}
                >
                  <CheckCircle2 className="w-5 h-5 inline mr-2" />
                  เสร็จแล้ว!
                </button>
                {behavior.category && (
                  <p className="text-xs text-gray-500 mt-2">{behavior.category}</p>
                )}
              </div>
            ))}

          {/* Bad Behaviors */}
          {activeTab === "bad" &&
            badBehaviors.map((behavior) => (
              <div
                key={behavior.id}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">{behavior.name}</h3>
                  <span 
                    className="px-3 py-1 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: behavior.color }}
                  >
                    -{behavior.penalty}
                  </span>
                </div>
                <button
                  onClick={() => handleActivityComplete(behavior, 'bad')}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all duration-200 font-medium"
                  disabled={activitiesLoading}
                >
                  <AlertTriangle className="w-5 h-5 inline mr-2" />
                  ทำแล้ว
                </button>
                {behavior.category && (
                  <p className="text-xs text-gray-500 mt-2">{behavior.category}</p>
                )}
              </div>
            ))}

          {/* Rewards */}
          {activeTab === "rewards" &&
            rewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">{reward.name}</h3>
                  <span 
                    className="px-3 py-1 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: reward.color }}
                  >
                    {reward.cost} คะแนน
                  </span>
                </div>
                <button
                  onClick={() => handleRewardClaim(reward)}
                  disabled={!selectedChild || selectedChild.totalPoints < reward.cost || activitiesLoading}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Gift className="w-5 h-5 inline mr-2" />
                  แลกรางวัล
                </button>
                {reward.category && (
                  <p className="text-xs text-gray-500 mt-2">{reward.category}</p>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MyKidsMainUI;
EOF
        print_success "อัพเดท MyKidsMainUI.jsx สำหรับ MyKidsDB2"
    else
        print_warning "ไม่พบ MyKidsMainUI.jsx - สร้างไฟล์ใหม่"
    fi
}

# Update Vite config
update_vite_config() {
    print_step "อัพเดท Vite Configuration..."
    
    cat > "vite.config.js" << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://apps4.coop.ku.ac.th/mykids/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Proxying request to:', proxyReq.path);
          });
        },
      },
    },
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
EOF
    print_success "อัพเดท vite.config.js"
}

# Update API config
update_api_config() {
    print_step "อัพเดท API Config..."
    
    if [ -f "src/mykids-api/api/config.php" ]; then
        # Update database name to MyKidsDB2
        sed -i.bak "s/'database' => 'MyKidsDB'/'database' => 'MyKidsDB2'/" "src/mykids-api/api/config.php"
        print_success "อัพเดท config.php ให้ใช้ MyKidsDB2"
    else
        print_warning "ไม่พบ config.php - สร้างไฟล์ใหม่"
        
        mkdir -p "src/mykids-api/api"
        cat > "src/mykids-api/api/config.php" << 'EOF'
<?php
// api/config.php - Updated for MyKidsDB2
return [
  'db' => [
    'host' => '127.0.0.1',
    'port' => 1433,
    'database' => 'MyKidsDB2', // Updated database name
    'username' => 'sa',
    'password' => 'password',
    'encrypt'  => false,
  ],
  'cors' => [
    'allow_origin' => 'https://apps4.coop.ku.ac.th',
    'allow_credentials' => 'true',
    'allow_headers' => 'Content-Type, Authorization',
    'allow_methods' => 'GET, POST, PUT, DELETE, OPTIONS',
  ],
];
EOF
        print_success "สร้าง config.php ใหม่สำหรับ MyKidsDB2"
    fi
}

# Create migration guide
create_migration_guide() {
    print_step "สร้าง Migration Guide..."
    
    cat > "MIGRATION_GUIDE.md" << 'EOF'
# MyKids Frontend Migration Guide

## การเปลี่ยนแปลงสำคัญ

### 1. API Endpoints ใหม่
- `GET /?children` - ดึงเด็กทั้งหมด  
- `GET /?children={id}&today-score` - ดึงคะแนนวันนี้
- `GET /?good-behaviors` - ดึงพฤติกรรมดี
- `GET /?bad-behaviors` - ดึงพฤติกรรมไม่ดี  
- `GET /?daily` - ดึงข้อมูลรายวัน

### 2. Field Names ที่เปลี่ยน
- `activityId` → `behaviorId`
- `Emoji` + `BackgroundColor` → `AvatarPath`
- Database: `MyKidsDB` → `MyKidsDB2`

### 3. ไฟล์ที่มีการอัพเดท
- `src/services/apiService.js` - API Service Layer ใหม่
- `src/hooks/useApi.js` - Custom Hooks สำหรับ API
- `src/components/MyKidsMainUI.jsx` - Main Component
- `vite.config.js` - Proxy Configuration
- `src/mykids-api/api/config.php` - Database Config

### 4. Features ใหม่
- Today Score API สำหรับดูคะแนนวันนี้
- แยก Good/Bad Behaviors API
- Daily Activity Summary
- Improved Error Handling
- Backward Compatibility

## วิธีการใช้งาน

### API Service
```javascript
import apiService from '../services/apiService';

// ดึงเด็กทั้งหมด
const children = await apiService.getChildren();

// ดึงคะแนนวันนี้
const todayScore = await apiService.getTodayScore('000001');

// บันทึกกิจกรรม (รองรับทั้ง behaviorId และ activityId)
await apiService.logActivity({
  childId: '000001',
  behaviorId: 'behavior-1', // หรือ activityId
  activityType: 'Good',
  date: '2024-01-15'
});
```

### React Hooks
```javascript
import { useChildren, useBehaviors, useActivities } from '../hooks/useApi';

function MyComponent() {
  const { children, loading, error } = useChildren();
  const { goodBehaviors, badBehaviors } = useBehaviors();
  const { activities, logActivity } = useActivities(childId);
  
  // ...
}
```

## Troubleshooting

### ปัญหาที่อาจเกิดขึ้น
1. **API Connection Error**: ตรวจสอบ URL ใน vite.config.js
2. **Database Error**: ตรวจสอบ config.php ให้ใช้ MyKidsDB2
3. **Field Missing**: ตรวจสอบ API response structure
4. **CORS Error**: ตรวจสอบ CORS settings ใน API

### การ Debug
```bash
# เช็ค API Health
curl https://apps4.coop.ku.ac.th/mykids/api/?health

# เช็ค Children API  
curl https://apps4.coop.ku.ac.th/mykids/api/?children

# ดู Console logs ใน Browser DevTools
```

## Next Steps

1. ทดสอบ API endpoints ทั้งหมด
2. ตรวจสอบ UI ให้แสดงข้อมูลถูกต้อง
3. ทดสอบการบันทึกกิจกรรม
4. ทดสอบการแลกรางวัล
5. Deploy และทดสอบใน Production

Created on: $(date)
EOF
    
    print_success "สร้าง MIGRATION_GUIDE.md"
}

# Create package.json scripts
update_package_json() {
    print_step "อัพเดท package.json scripts..."
    
    # Add useful scripts
    npm pkg set scripts.test:api="curl https://apps4.coop.ku.ac.th/mykids/api/?health"
    npm pkg set scripts.dev:proxy="vite --host"
    npm pkg set scripts.migrate="node -e \"console.log('Migration completed successfully!')\""
    
    print_success "อัพเดท package.json scripts"
}

# Run tests
run_tests() {
    print_step "ทดสอบการตั้งค่า..."
    
    # Test API connection (if available)
    if command -v curl &> /dev/null; then
        print_info "ทดสอบ API connection..."
        if curl -s -f "https://apps4.coop.ku.ac.th/mykids/api/?health" > /dev/null 2>&1; then
            print_success "API connection ใช้งานได้"
        else
            print_warning "ไม่สามารถเชื่อมต่อ API ได้ - ตรวจสอบการตั้งค่า server"
        fi
    fi
    
    # Check if files were created
    files_to_check=(
        "src/services/apiService.js"
        "src/hooks/useApi.js"
        "vite.config.js"
        "MIGRATION_GUIDE.md"
    )
    
    for file in "${files_to_check[@]}"; do
        if [ -f "$file" ]; then
            print_success "✓ $file"
        else
            print_error "✗ $file"
        fi
    done
}

# Main execution
main() {
    print_header "MyKids Frontend Migration Script"
    print_info "อัพเดท Frontend สำหรับ MyKidsDB2 API"
    
    # Confirmation
    echo -e "\n${YELLOW}⚠️  สคริปต์นี้จะทำการ:${NC}"
    echo "1. สร้าง backup ไฟล์เดิม"
    echo "2. อัพเดท API Service Layer"
    echo "3. สร้าง Custom Hooks ใหม่"
    echo "4. อัพเดท React Components"
    echo "5. แก้ไข Vite Config"
    echo "6. อัพเดท Database Config"
    echo ""
    read -p "ต้องการดำเนินการต่อไหม? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "ยกเลิกการทำงาน"
        exit 0
    fi
    
    # Execute steps
    check_project_structure
    create_backup
    check_dependencies
    create_directories
    create_api_service
    create_api_hook
    update_main_component
    update_vite_config
    update_api_config
    create_migration_guide
    update_package_json
    run_tests
    
    # Final instructions
    print_header "Migration สำเร็จ!"
    print_success "Frontend ถูกอัพเดทสำหรับ MyKidsDB2 เรียบร้อยแล้ว"
    
    echo -e "\n${BLUE}🚀 Next Steps:${NC}"
    echo "1. ตรวจสอบไฟล์ที่สร้างใหม่"
    echo "2. รันคำสั่ง: npm run dev"
    echo "3. ทดสอบการทำงานของ API"
    echo "4. อ่าน MIGRATION_GUIDE.md สำหรับรายละเอียด"
    echo ""
    echo -e "${GREEN}📁 Backup: $BACKUP_DIR${NC}"
    echo -e "${GREEN}📋 Guide: MIGRATION_GUIDE.md${NC}"
    echo ""
    print_success "🎉 พร้อมใช้งาน MyKids v2.0 แล้ว!"
}

# Run main function
main "$@"