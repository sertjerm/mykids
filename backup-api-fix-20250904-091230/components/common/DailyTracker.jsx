// components/common/DailyTracker.jsx
import React, { useState, useEffect } from 'react';
import { useDailyData } from '../../hooks/useDailyData';
import { Star, CheckCircle2, Calendar, TrendingUp } from 'lucide-react';

const DailyTracker = () => {
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');

  const {
    children,
    goodBehaviors,
    todayScore,
    completedGoodBehaviors,
    loading,
    error,
    completeGoodBehavior,
    isBehaviorCompleted,
    getTodayActivities
  } = useDailyData(selectedChildId);

  // เลือกเด็กคนแรกเป็นค่าเริ่มต้น
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  // แสดงข้อความสำเร็จ
  const showMessage = (message) => {
    setShowSuccessMessage(message);
    setTimeout(() => setShowSuccessMessage(''), 3000);
  };

  // จัดการการทำ Good Behavior
  const handleGoodBehavior = async (behaviorId) => {
    const result = await completeGoodBehavior(behaviorId);
    
    if (result.success) {
      showMessage(result.message);
    } else {
      alert(result.message);
    }
  };

  if (loading && children.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-600">กำลังโหลดข้อมูลวันนี้...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">❌ {error}</p>
      </div>
    );
  }

  const selectedChild = children.find(child => child.id === selectedChildId);
  const todayActivities = getTodayActivities(5);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-pink-50 to-blue-50 rounded-2xl">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg animate-bounce">
          {showSuccessMessage}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
          <Calendar className="w-8 h-8" />
          MyKids - ติดตามพฤติกรรมรายวัน
        </h1>
        <p className="text-gray-600">
          วันนี้ {new Date().toLocaleDateString('th-TH')}
        </p>
      </div>

      {/* Children Selection */}
      {children.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-4">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`p-6 rounded-2xl transition-all duration-300 ${
                  selectedChildId === child.id
                    ? 'bg-white shadow-lg ring-4 ring-purple-200 transform scale-105'
                    : 'bg-white/70 hover:bg-white hover:shadow-md'
                }`}
                style={{ backgroundColor: child.backgroundColor }}
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">{child.emoji}</div>
                  <h3 className="font-bold text-gray-800">{child.name}</h3>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-bold text-lg text-gray-700">
                      {child.todayScore || 0}
                    </span>
                    <span className="text-sm text-gray-500">วันนี้</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedChild && (
        <>
          {/* Current Score Display */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {selectedChild.emoji} {selectedChild.name}
            </h2>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600">{todayScore}</div>
                <div className="text-sm text-gray-500">คะแนนวันนี้</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedGoodBehaviors.size}</div>
                <div className="text-sm text-gray-500">งานที่ทำแล้ว</div>
              </div>
            </div>
          </div>

          {/* Good Behaviors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {goodBehaviors.map((behavior) => {
              const isCompleted = isBehaviorCompleted(behavior.id, 'good');
              
              return (
                <button
                  key={behavior.id}
                  onClick={() => !isCompleted && handleGoodBehavior(behavior.id)}
                  disabled={loading || isCompleted}
                  className={`p-6 rounded-2xl transition-all duration-300 text-left ${
                    isCompleted
                      ? 'bg-green-100 border-2 border-green-400'
                      : 'bg-white hover:shadow-lg hover:scale-105 border-2 border-transparent'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ 
                    backgroundColor: isCompleted ? '#dcfce7' : behavior.color || '#ffffff'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-lg font-bold ${
                        isCompleted ? 'text-green-800 line-through' : 'text-gray-800'
                      }`}>
                        {behavior.name}
                      </h3>
                      {behavior.category && (
                        <p className="text-sm text-gray-600 mt-1">
                          หมวด: {behavior.category}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      )}
                      <div className="text-center">
                        <Star className="w-5 h-5 text-yellow-500 fill-current mx-auto" />
                        <span className="font-bold text-gray-700">
                          +{behavior.points}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Today Activities */}
          {todayActivities.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                กิจกรรมวันนี้
              </h3>
              <div className="space-y-3">
                {todayActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium text-gray-800">
                        {activity.behaviorName}
                      </span>
                      <span className="text-sm text-gray-500 ml-2">
                        {new Date(activity.timestamp).toLocaleTimeString('th-TH', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <span className={`font-bold ${
                      activity.points > 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {activity.points > 0 ? '+' : ''}{activity.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* No children message */}
      {children.length === 0 && (
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">ยังไม่มีข้อมูลเด็ก</h2>
          <p className="text-gray-600">
            กรุณาเพิ่มข้อมูลเด็กก่อนใช้งาน
          </p>
        </div>
      )}
    </div>
  );
};

export default DailyTracker;
