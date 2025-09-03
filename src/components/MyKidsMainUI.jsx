import React, { useState, useEffect } from 'react';
import { Settings, UserPlus, RotateCcw } from 'lucide-react';

const MyKidsMainUI = () => {
  // State for API data
  const [children, setChildren] = useState([]);
  const [goodBehaviors, setGoodBehaviors] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChildData, setSelectedChildData] = useState(null);

  // API Helper function - ใช้ proxy ที่ตั้งค่าไว้ใน vite.config.js
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`/api/${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      // Normalize PascalCase to camelCase
      if (Array.isArray(data)) {
        return data.map(item => normalizeKeys(item));
      }
      return normalizeKeys(data);
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  // Convert PascalCase to camelCase
  const normalizeKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const normalized = {};
    Object.keys(obj).forEach(key => {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      normalized[camelKey] = obj[key];
    });
    return normalized;
  };

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load children and tasks in parallel
      const [childrenData, tasksData] = await Promise.all([
        apiCall('?children'),
        apiCall('?tasks').catch(() => []) // Fallback to empty array if tasks fail
      ]);

      setChildren(childrenData || []);
      setGoodBehaviors(tasksData || []);

      // Select first child if available
      if (childrenData && childrenData.length > 0 && !selectedChild) {
        setSelectedChild(childrenData[0].id);
      }

      setError(null);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // Initialize selected child
  useEffect(() => {
    if (selectedChild && children.length > 0) {
      const child = children.find(c => c.id === selectedChild);
      setSelectedChildData(child);
    }
  }, [selectedChild, children]);

  const selectChild = (childId) => {
    setSelectedChild(childId);
  };

  const handleTaskComplete = async (behaviorId, points) => {
    if (completedTasks.has(behaviorId) || !selectedChild) return;
    
    try {
      setLoading(true);
      
      // Call API to record the activity
      await apiCall('?activities', {
        method: 'POST',
        body: JSON.stringify({
          ChildId: selectedChild,
          ActivityType: 'good',
          ActivityId: behaviorId,
          Points: points,
          Note: 'ทำงานเสร็จแล้ว'
        }),
      });
      
      // Add visual feedback
      setCompletedTasks(prev => new Set([...prev, behaviorId]));
      
      // Update child's points locally
      if (selectedChildData) {
        const updatedChild = {
          ...selectedChildData,
          totalPoints: (selectedChildData.totalPoints || 0) + points
        };
        setSelectedChildData(updatedChild);
      }

      // Remove from completed after 3 seconds for demo
      setTimeout(() => {
        setCompletedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(behaviorId);
          return newSet;
        });
      }, 3000);

    } catch (error) {
      console.error('Failed to record activity:', error);
      setError('ไม่สามารถบันทึกกิจกรรมได้ กรุณาลองใหม่');
      
      // Auto clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const resetDay = () => {
    setCompletedTasks(new Set());
    // Reload data to get fresh points
    loadData();
  };

  if (loading && children.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error && children.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadData();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  const totalPoints = selectedChildData?.totalPoints || 0;
  const completedTasksCount = completedTasks.size;
  const totalTasksCount = goodBehaviors.length || 7;
  const completionPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🌈</span>
          <h1 className="text-2xl font-bold text-gray-800">MyKids</h1>
        </div>
        <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
          <Settings className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      <div className="px-4 pb-4">
        {/* Children Selection Cards */}
        <div className="flex space-x-3 mb-6 overflow-x-auto">
          {children.map((child) => (
            <div
              key={child.id}
              onClick={() => selectChild(child.id)}
              className={`flex-shrink-0 p-4 rounded-2xl cursor-pointer transition-all ${
                selectedChild === child.id 
                  ? 'bg-white shadow-lg scale-105' 
                  : 'bg-white/60 hover:bg-white/80'
              }`}
              style={selectedChild === child.id ? {
                backgroundColor: child.backgroundColor || '#fce7f3'
              } : {}}
            >
              <div className="text-center min-w-[80px]">
                <div className="text-3xl mb-2">{child.emoji || '😊'}</div>
                <div className="font-semibold text-gray-800 text-sm">
                  {child.name}
                </div>
                <div className="text-xs text-gray-600">
                  {child.age || 0} ขวบ ⭐
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {child.totalPoints || 0} คะแนน
                </div>
              </div>
            </div>
          ))}
          
          {/* Add Child Button */}
          <div className="flex-shrink-0 p-4 bg-white/40 hover:bg-white/60 rounded-2xl cursor-pointer transition-all flex items-center justify-center min-w-[80px]">
            <UserPlus className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        {/* Selected Child Info */}
        {selectedChildData && (
          <div className="bg-white rounded-3xl p-6 mb-6 shadow-lg text-center">
            <div className="text-6xl mb-4">{selectedChildData.emoji || '😊'}</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {selectedChildData.name}
            </h2>
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {totalPoints} คะแนน
            </div>
            <div className="text-gray-500">
              งานสำเร็จ: {completedTasksCount}/{totalTasksCount}({completionPercentage}%)
            </div>
          </div>
        )}

        {/* Task Buttons */}
        <div className="bg-white rounded-3xl p-6 mb-6 shadow-lg">
          <div className="flex justify-center space-x-4 mb-6">
            <button className="flex-1 bg-green-100 text-green-800 py-3 px-6 rounded-2xl font-semibold">
              ✅ งานดี
            </button>
            <button className="flex-1 bg-red-100 text-red-800 py-3 px-6 rounded-2xl font-semibold">
              ❌ พฤติกรรมไม่ดี
            </button>
            <button className="flex-1 bg-orange-100 text-orange-800 py-3 px-6 rounded-2xl font-semibold">
              🎁 รางวัล
            </button>
          </div>

          <div className="text-center mb-4">
            <p className="text-gray-600">กดเพื่อทำเครื่องหมายงานที่เสร็จแล้ว</p>
            <div className="text-sm text-gray-500 mt-1">
              📅 อื่นๆ
            </div>
          </div>

          {/* Good Behaviors List */}
          <div className="space-y-3">
            {goodBehaviors.length > 0 ? goodBehaviors.map((behavior) => {
              const isCompleted = completedTasks.has(behavior.id);
              
              return (
                <button
                  key={behavior.id}
                  onClick={() => handleTaskComplete(behavior.id, behavior.points)}
                  disabled={isCompleted || loading}
                  className={`w-full p-4 rounded-2xl transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-green-200 border-2 border-green-400' 
                      : 'hover:scale-105 shadow-md'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{
                    backgroundColor: isCompleted ? '#bbf7d0' : (behavior.color || '#f3f4f6')
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {behavior.category === 'สุขภาพ' ? '🏥' :
                         behavior.category === 'การเรียน' ? '📚' :
                         behavior.category === 'ความรับผิดชอบ' ? '🤝' : '⭐'}
                      </span>
                      <span className="font-semibold text-gray-800">
                        {behavior.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-green-600">
                        +{behavior.points}
                      </span>
                      {isCompleted && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            }) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📝</div>
                <p>ยังไม่มีรายการงานดี</p>
                <p className="text-sm mt-2">กรุณาเพิ่มงานดีผ่านระบบจัดการ</p>
              </div>
            )}
          </div>
        </div>

        {/* Error message overlay */}
        {error && (
          <div className="fixed top-4 left-4 right-4 bg-red-100 border border-red-300 rounded-lg p-4 shadow-lg z-50">
            <div className="flex items-start">
              <div className="text-red-500 text-xl mr-2">⚠️</div>
              <div className="flex-1">
                <p className="text-red-800 font-medium">เกิดข้อผิดพลาด</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 ml-2"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Reset Button */}
        <button 
          onClick={resetDay}
          disabled={loading}
          className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-colors mb-6 flex items-center justify-center space-x-2 ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed text-gray-600'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          <RotateCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          <span>เริ่มวันใหม่</span>
        </button>

        {/* Progress Bar */}
        {selectedChildData && (
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-gray-800">
                ความคืบหน้าของ {selectedChildData.name}
              </h3>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div 
                className="h-4 rounded-full bg-gradient-to-r from-pink-400 to-green-400 transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            
            <div className="text-center text-sm text-gray-600">
              {completionPercentage}% เสร็จแล้ว
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyKidsMainUI;