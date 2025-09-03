#!/bin/bash

# MyKids Migration Script
# สคริปต์สำหรับปรับเปลี่ยนจาก LocalStorage ไป Database API

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Icons
ROCKET="🚀"
WRENCH="🔧"
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"

# Configuration
PROJECT_NAME="MyKids"
BACKUP_DIR="./mykids-backup-$(date +%Y%m%d-%H%M%S)"
API_URL="https://apps4.coop.ku.ac.th/mykids/api"
# Functions
print_header() {
    echo
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  $PROJECT_NAME Migration Script${NC}"
    echo -e "${BLUE}================================${NC}"
    echo
}

print_step() {
    echo -e "${PURPLE}$ROCKET $1${NC}"
}

print_success() {
    echo -e "${GREEN}$CHECK $1${NC}"
}

print_error() {
    echo -e "${RED}$CROSS $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$WARNING $1${NC}"
}

print_info() {
    echo -e "${CYAN}$INFO $1${NC}"
}

# Check if we're in a React project
check_react_project() {
    print_step "ตรวจสอบโปรเจ็กต์ React..."
    
    if [ ! -f "package.json" ]; then
        print_error "ไม่พบไฟล์ package.json - กรุณารันในโฟลเดอร์ root ของโปรเจ็กต์"
        exit 1
    fi
    
    if ! grep -q "react" package.json; then
        print_error "ไม่พบ React ในโปรเจ็กต์นี้"
        exit 1
    fi
    
    if [ ! -d "src" ]; then
        print_error "ไม่พบโฟลเดอร์ src"
        exit 1
    fi
    
    print_success "พบโปรเจ็กต์ React"
}

# Prompt for API URL
prompt_api_url() {
    echo
    print_step "ตั้งค่า API URL"
    echo -e "API URL ปัจจุบัน: ${YELLOW}$API_URL${NC}"
    echo -n "ต้องการเปลี่ยน API URL? (y/N): "
    read -r change_url
    
    if [[ $change_url =~ ^[Yy]$ ]]; then
        echo -n "กรอก API URL ใหม่: "
        read -r new_api_url
        if [ -n "$new_api_url" ]; then
            API_URL=$new_api_url
            print_success "เปลี่ยน API URL เป็น: $API_URL"
        fi
    fi
}

# Create backup of existing files
create_backup() {
    print_step "สร้าง backup ของไฟล์เดิม..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup existing files if they exist
    files_to_backup=(
        "src/stores/useMyKidsStore.js"
        "src/App.jsx"
        "package.json"
        "src/components"
        "src/services"
        "src/utils"
        "src/config"
    )
    
    for file in "${files_to_backup[@]}"; do
        if [ -e "$file" ]; then
            cp -r "$file" "$BACKUP_DIR/" 2>/dev/null || true
        fi
    done
    
    print_success "Backup สร้างที่: $BACKUP_DIR"
}

# Check and install dependencies
check_dependencies() {
    print_step "ตรวจสอบ dependencies..."
    
    required_deps=("zustand" "lucide-react")
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
    const endpoint = childId ? `?activities=${childId}` : '?activities';
    return await this.request(endpoint);
  }

  async addGoodActivity(childId, activityId, points, note = '') {
    return await this.request('?activities', {
      method: 'POST',
      body: JSON.stringify({
        childId,
        activityType: 'good',
        activityId,
        points,
        note,
      }),
    });
  }

  async addBadActivity(childId, activityId, points, note = '') {
    return await this.request('?activities', {
      method: 'POST',
      body: JSON.stringify({
        childId,
        activityType: 'bad',
        activityId,
        points: -Math.abs(points),
        note,
      }),
    });
  }

  async redeemReward(childId, rewardId, cost, note = '') {
    return await this.request('?activities', {
      method: 'POST',
      body: JSON.stringify({
        childId,
        activityType: 'reward',
        activityId: rewardId,
        points: -Math.abs(cost),
        note,
      }),
    });
  }

  // Points API
  async getChildPoints(childId) {
    return await this.request(`?points=${childId}`);
  }

  async getAllChildrenPoints() {
    return await this.request('?points');
  }

  // Rewards API
  async getRewards() {
    return await this.request('?rewards');
  }

  async getReward(rewardId) {
    return await this.request(`?rewards=${rewardId}`);
  }

  async createReward(rewardData) {
    return await this.request('?rewards', {
      method: 'POST',
      body: JSON.stringify(rewardData),
    });
  }

  async updateReward(rewardId, rewardData) {
    return await this.request(`?rewards=${rewardId}`, {
      method: 'PUT',
      body: JSON.stringify(rewardData),
    });
  }

  async deleteReward(rewardId) {
    return await this.request(`?rewards=${rewardId}`, {
      method: 'DELETE',
    });
  }

  // Tasks API
  async getGoodBehaviors() {
    return await this.request('?tasks');
  }

  async getBadBehaviors() {
    return await this.request('?bad-behaviors');
  }

  // Health Check
  async healthCheck() {
    return await this.request('?health');
  }

  // Utility Methods
  async resetDailyPoints(childId = null) {
    const endpoint = childId ? `?reset=${childId}` : '?reset';
    return await this.request(endpoint, {
      method: 'POST',
    });
  }

  async importFromLocalStorage(localStorageData) {
    return await this.request('?import', {
      method: 'POST',
      body: JSON.stringify(localStorageData),
    });
  }
}

const apiService = new MyKidsApiService();
export default apiService;
EOF
    
    # Replace API URL placeholder
    sed -i.bak "s|__API_URL_PLACEHOLDER__|$API_URL|g" "src/services/apiService.js"
    rm -f "src/services/apiService.js.bak"
    
    print_success "สร้าง API Service เรียบร้อย"
}

# Create updated Zustand store
create_store() {
    print_step "สร้าง Zustand Store ใหม่..."
    
    cat > "src/stores/useMyKidsStore.js" << 'EOF'
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
EOF
    
    print_success "สร้าง Zustand Store เรียบร้อย"
}

# Create config file
create_config() {
    print_step "สร้างไฟล์ Config..."
    
    cat > "src/config/appConfig.js" << EOF
// src/config/appConfig.js
export const appConfig = {
  api: {
    baseURL: '$API_URL',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  
  app: {
    name: 'MyKids',
    version: '2.0.0',
    description: 'ระบบติดตามพฤติกรรมเด็ก',
  },
  
  features: {
    enableMigration: true,
    enableLocalStorageFallback: true,
  },
  
  storageKeys: {
    children: 'mykids-children',
    activities: 'mykids-activities',
    rewards: 'mykids-rewards',
    goodBehaviors: 'mykids-good-behaviors',
    badBehaviors: 'mykids-bad-behaviors',
  },
};

export default appConfig;
EOF
    
    print_success "สร้าง Config เรียบร้อย"
}

# Create migration wizard (simplified version)
create_migration_component() {
    print_step "สร้าง Migration Component..."
    
    cat > "src/components/migration/MigrationWizard.jsx" << 'EOF'
// src/components/migration/MigrationWizard.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Database, HardDrive, ArrowRight, Loader } from 'lucide-react';
import useMyKidsStore from '../../stores/useMyKidsStore';
import apiService from '../../services/apiService';

const MigrationWizard = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [localData, setLocalData] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState(null);

  const { migrateFromLocalStorage } = useMyKidsStore();

  useEffect(() => {
    checkDataSources();
  }, []);

  const checkDataSources = async () => {
    try {
      const localStorageData = {
        children: JSON.parse(localStorage.getItem('mykids-children') || '[]'),
        activities: JSON.parse(localStorage.getItem('mykids-activities') || '[]'),
        rewards: JSON.parse(localStorage.getItem('mykids-rewards') || '[]'),
      };

      setLocalData(localStorageData);

      const health = await apiService.healthCheck();
      setApiStatus(health);

    } catch (error) {
      setError('ไม่สามารถเชื่อมต่อ API ได้');
      setApiStatus(null);
    }
  };

  const handleMigration = async () => {
    setMigrating(true);
    setError(null);

    try {
      const success = await migrateFromLocalStorage();
      if (success) {
        setStep(2);
      } else {
        setError('การย้ายข้อมูลไม่สำเร็จ');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการย้ายข้อมูล: ' + error.message);
    } finally {
      setMigrating(false);
    }
  };

  const getTotalRecords = (data) => {
    if (!data) return 0;
    return (data.children?.length || 0) + 
           (data.activities?.length || 0) + 
           (data.rewards?.length || 0);
  };

  const hasLocalData = localData && getTotalRecords(localData) > 0;

  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">ย้ายข้อมูลไป Database</h2>
        
        <div className="space-y-4">
          <div className="flex items-center p-4 border rounded-lg">
            <HardDrive className="w-8 h-8 text-blue-500 mr-4" />
            <div className="flex-1">
              <h3 className="font-semibold">ข้อมูลใน LocalStorage</h3>
              {localData ? (
                <div className="text-sm text-gray-600 mt-1">
                  <p>เด็ก: {localData.children?.length || 0} คน</p>
                  <p>กิจกรรม: {localData.activities?.length || 0} รายการ</p>
                  <p>รางวัล: {localData.rewards?.length || 0} รายการ</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">กำลังตรวจสอบ...</p>
              )}
            </div>
            {hasLocalData ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            )}
          </div>

          <div className="flex items-center p-4 border rounded-lg">
            <Database className="w-8 h-8 text-purple-500 mr-4" />
            <div className="flex-1">
              <h3 className="font-semibold">การเชื่อมต่อ Database API</h3>
              {apiStatus ? (
                <p className="text-sm text-green-600 mt-1">เชื่อมต่อสำเร็จ</p>
              ) : error ? (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              ) : (
                <p className="text-sm text-gray-500">กำลังตรวจสอบ...</p>
              )}
            </div>
            {apiStatus ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-500" />
            )}
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            ข้าม
          </button>
          
          {hasLocalData && apiStatus ? (
            <button
              onClick={handleMigration}
              disabled={migrating}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
            >
              {migrating ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  กำลังย้าย...
                </>
              ) : (
                <>
                  เริ่มย้ายข้อมูล
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={checkDataSources}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              ตรวจสอบอีกครั้ง
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Complete
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">ย้ายข้อมูลสำเร็จ!</h2>
      
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <p className="text-lg text-gray-600 mb-2">ข้อมูลทั้งหมดได้ถูกย้ายไป Database เรียบร้อยแล้ว</p>
        <p className="text-sm text-gray-500">ตอนนี้แอปจะใช้ Database แทน LocalStorage</p>
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={onComplete}
          className="px-8 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          เริ่มใช้งาน
        </button>
      </div>
    </div>
  );
};

export default MigrationWizard;
EOF
    
    print_success "สร้าง Migration Component เรียบร้อย"
}

# Update App.jsx
update_app() {
    print_step "อัพเดท App.jsx..."
    
    # Backup existing App.jsx
    if [ -f "src/App.jsx" ]; then
        cp "src/App.jsx" "$BACKUP_DIR/App.jsx.original"
    fi
    
    cat > "src/App.jsx" << 'EOF'
// src/App.jsx - Updated App Component ที่รองรับ API
import React, { useEffect, useState } from 'react';
import { AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import useMyKidsStore from './stores/useMyKidsStore';
import MigrationWizard from './components/migration/MigrationWizard';

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
      <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
    </div>
  </div>
);

function App() {
  const {
    children,
    loading,
    error,
    initializeApp,
    clearError,
  } = useMyKidsStore();

  const [showMigration, setShowMigration] = useState(false);
  const [appInitialized, setAppInitialized] = useState(false);

  useEffect(() => {
    const checkMigrationNeeded = () => {
      const hasLocalData = localStorage.getItem('mykids-children') && 
                          JSON.parse(localStorage.getItem('mykids-children')).length > 0;
      
      const hasApiData = children && children.length > 0;
      
      if (hasLocalData && !hasApiData && !appInitialized) {
        setShowMigration(true);
      } else if (!appInitialized) {
        initializeApp().finally(() => setAppInitialized(true));
      }
    };

    checkMigrationNeeded();
  }, [children, initializeApp, appInitialized]);

  if (showMigration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 py-8">
        <MigrationWizard
          onComplete={() => {
            setShowMigration(false);
            setAppInitialized(false);
            initializeApp().finally(() => setAppInitialized(true));
          }}
          onCancel={() => {
            setShowMigration(false);
            initializeApp().finally(() => setAppInitialized(true));
          }}
        />
      </div>
    );
  }

  if (loading && !appInitialized) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100">
      {error && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div className="bg-red-100 border border-red-300 rounded-lg p-4 shadow-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 text-sm font-medium">เกิดข้อผิดพลาด</p>
                <p className="text-red-700 text-xs mt-1">{error}</p>
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={() => {
                      clearError();
                      initializeApp();
                    }}
                    className="text-xs bg-red-200 hover:bg-red-300 text-red-800 px-2 py-1 rounded"
                  >
                    ลองใหม่
                  </button>
                  <button
                    onClick={clearError}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          MyKids - ระบบติดตามพฤติกรรมเด็ก 🌈
        </h1>
        
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            ระบบเชื่อมต่อ Database สำเร็จ! 
            {children.length > 0 ? ` มีข้อมูลเด็ก ${children.length} คน` : ' ยังไม่มีข้อมูลเด็ก'}
          </p>
          
          <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">🎉 Migration สำเร็จ!</h2>
            <p className="text-gray-600 mb-4">
              ระบบได้ถูกปรับให้ใช้ Database API แทน LocalStorage แล้ว
            </p>
            <div className="text-left text-sm text-gray-500">
              <p>✅ เชื่อมต่อ Database</p>
              <p>✅ API Service</p>
              <p>✅ Migration ข้อมูล</p>
              <p>✅ พร้อมใช้งาน</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
EOF
    
    print_success "อัพเดท App.jsx เรียบร้อย"
}

# Test API connection
test_api() {
    print_step "ทดสอบการเชื่อมต่อ API..."
    
    if command -v curl &> /dev/null; then
        api_test_url="$API_URL?health"
        print_info "ทดสอบ API ที่: $api_test_url"
        
        if curl -s -f "$api_test_url" > /dev/null; then
            print_success "API เชื่อมต่อได้"
        else
            print_warning "ไม่สามารถเชื่อมต่อ API ได้ - กรุณาตรวจสอบว่า API Server รันอยู่"
            print_info "URL: $api_test_url"
        fi
    else
        print_info "ไม่พบ curl - ข้าม API test"
    fi
}

# Create test script
create_test_script() {
    print_step "สร้าง test script..."
    
    cat > "test-mykids-api.js" << EOF
// test-mykids-api.js
// Node.js script สำหรับทดสอบ API

const API_URL = '$API_URL';

async function testApi() {
  console.log('🔍 ทดสอบ MyKids API...');
  console.log('API URL:', API_URL);
  
  try {
    const response = await fetch(API_URL + '?health');
    const data = await response.json();
    
    console.log('✅ API เชื่อมต่อสำเร็จ');
    console.log('Response:', data);
  } catch (error) {
    console.log('❌ API เชื่อมต่อไม่ได้:', error.message);
  }
}

testApi();
EOF
    
    print_success "สร้าง test script: test-mykids-api.js"
}

# Create rollback script
create_rollback_script() {
    print_step "สร้าง rollback script..."
    
    cat > "rollback-mykids.sh" << EOF
#!/bin/bash

# MyKids Rollback Script
echo "🔄 กำลัง rollback MyKids..."

if [ -d "$BACKUP_DIR" ]; then
    echo "📁 กู้คืนไฟล์จาก backup..."
    
    # Restore files
    [ -f "$BACKUP_DIR/useMyKidsStore.js" ] && cp "$BACKUP_DIR/useMyKidsStore.js" "src/stores/"
    [ -f "$BACKUP_DIR/App.jsx.original" ] && cp "$BACKUP_DIR/App.jsx.original" "src/App.jsx"
    
    # Remove new files
    rm -rf "src/services"
    rm -rf "src/components/migration"
    rm -rf "src/config"
    rm -f "test-mykids-api.js"
    
    echo "✅ Rollback เสร็จสิ้น"
else
    echo "❌ ไม่พบ backup directory: $BACKUP_DIR"
fi
EOF
    
    chmod +x "rollback-mykids.sh"
    print_success "สร้าง rollback script: rollback-mykids.sh"
}

# Show final instructions
show_final_instructions() {
    echo
    print_step "การติดตั้งเสร็จสิ้น! 🎉"
    echo
    print_info "สิ่งที่ได้รับการปรับปรุง:"
    echo "  ✅ API Service Layer"
    echo "  ✅ Updated Zustand Store"
    echo "  ✅ Migration System"
    echo "  ✅ Error Handling"
    echo "  ✅ Configuration"
    echo
    print_info "ขั้นตอนถัดไป:"
    echo "  1. รัน: npm run dev (หรือ yarn dev)"
    echo "  2. ตรวจสอบ API connection"
    echo "  3. ทดสอบ Migration (หากมีข้อมูลเก่า)"
    echo "  4. ทดสอบฟีเจอร์ต่างๆ"
    echo
    print_info "Files ที่สำคัญ:"
    echo "  📝 API URL: src/services/apiService.js"
    echo "  🏪 Store: src/stores/useMyKidsStore.js"
    echo "  🔧 Config: src/config/appConfig.js"
    echo "  📦 Backup: $BACKUP_DIR"
    echo
    print_info "หากเกิดปัญหา:"
    echo "  • รัน: ./rollback-mykids.sh (เพื่อกู้คืน)"
    echo "  • ตรวจสอบ API Server และ Database"
    echo "  • ดู Console ใน Browser สำหรับ error"
    echo
    print_success "Migration เสร็จสิ้น! Happy coding! 🚀"
}

# Main execution
main() {
    print_header
    
    # Confirm before proceeding
    echo -e "${YELLOW}การ migrate นี้จะ:${NC}"
    echo "  • สร้าง backup ของไฟล์เดิม"
    echo "  • สร้างไฟล์ใหม่สำหรับ API"
    echo "  • อัพเดท Zustand Store"
    echo "  • เพิ่ม Migration System"
    echo
    echo -n "ต้องการดำเนินการต่อ? (y/N): "
    read -r confirm
    
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_info "ยกเลิกการ migrate"
        exit 0
    fi
    
    # Execute migration steps
    check_react_project
    prompt_api_url
    create_backup
    check_dependencies
    create_directories
    create_api_service
    create_store
    create_config
    create_migration_component
    update_app
    test_api
    create_test_script
    create_rollback_script
    show_final_instructions
}

# Run main function
main "$@"