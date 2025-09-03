// pages/HomePage.jsx - ใช้ API แทน LocalStorage
import React, { useState, useEffect } from 'react';
import { 
  useChildren, 
  useBehaviors, 
  useBadBehaviors, 
  useRewards, 
  useActivities,
  useMutation 
} from '../hooks/useApi';
import { apiService } from '../services/api';

const HomePage = () => {
  // ใช้ Custom Hooks แทน localStorage
  const { children, loading: childrenLoading } = useChildren();
  const { behaviors, loading: behaviorsLoading } = useBehaviors();
  const { badBehaviors, loading: badBehaviorsLoading } = useBadBehaviors();
  const { rewards, loading: rewardsLoading } = useRewards();
  
  // State สำหรับ UI
  const [selectedChild, setSelectedChild] = useState(null);
  const [activeTab, setActiveTab] = useState("behaviors");
  const [showSummary, setShowSummary] = useState(false);

  // Activities สำหรับเด็กที่เลือก
  const { 
    activities, 
    loading: activitiesLoading, 
    refetch: refetchActivities 
  } = useActivities(selectedChild?.Id, 20);

  // Mutation สำหรับ log activities
  const { mutate: logActivityMutation, loading: activityMutationLoading } = useMutation(
    apiService.logActivity.bind(apiService),
    {
      onSuccess: () => {
        // Refresh activities และ children (สำหรับ updated points)
        refetchActivities();
        // อาจจะต้อง refresh children ด้วย ถ้าต้องการ points ล่าสุด
      },
      onError: (error) => {
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
      }
    }
  );

  // เลือกเด็กคนแรกเป็นค่าเริ่มต้น
  useEffect(() => {
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0]);
    }
  }, [children, selectedChild]);

  // Loading states
  if (childrenLoading || behaviorsLoading || badBehaviorsLoading || rewardsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Handle behavior click - บันทึกพฤติกรรมดี
  const handleBehaviorClick = async (behavior) => {
    if (!selectedChild || activityMutationLoading) return;

    try {
      await logActivityMutation({
        childId: selectedChild.Id,
        activityType: 'good',
        activityId: behavior.Id,
        note: `${selectedChild.Name} ทำ ${behavior.Name}`
      });
      
      // แสดง animation หรือ feedback
      showSuccessMessage(`${selectedChild.Name} ได้ ${behavior.Points} คะแนน!`);
    } catch (error) {
      console.error('Error logging behavior:', error);
    }
  };

  // Handle bad behavior click - บันทึกพฤติกรรมไม่ดี
  const handleBadBehaviorClick = async (badBehavior) => {
    if (!selectedChild || activityMutationLoading) return;

    try {
      await logActivityMutation({
        childId: selectedChild.Id,
        activityType: 'bad',
        activityId: badBehavior.Id,
        note: `${selectedChild.Name} ทำ ${badBehavior.Name}`
      });
      
      showErrorMessage(`${selectedChild.Name} โดนหัก ${badBehavior.Penalty} คะแนน!`);
    } catch (error) {
      console.error('Error logging bad behavior:', error);
    }
  };

  // Handle reward claim - แลกรางวัล
  const handleRewardClaim = async (reward) => {
    if (!selectedChild || activityMutationLoading) return;

    if (!confirm(`ต้องการแลกรางวัล "${reward.Name}" ใช่ไหม? (ใช้ ${reward.Cost} คะแนน)`)) {
      return;
    }

    try {
      await logActivityMutation({
        childId: selectedChild.Id,
        activityType: 'reward',
        activityId: reward.Id,
        note: `${selectedChild.Name} แลก ${reward.Name}`
      });
      
      showSuccessMessage(`${selectedChild.Name} แลกรางวัล ${reward.Name} สำเร็จ!`);
    } catch (error) {
      if (error.message.includes('Insufficient points')) {
        alert('คะแนนไม่เพียงพอ!');
      } else {
        console.error('Error claiming reward:', error);
      }
    }
  };

  // Helper functions สำหรับแสดงข้อความ
  const showSuccessMessage = (message) => {
    // Implementation ขึ้นอยู่กับ toast library ที่ใช้
    console.log('SUCCESS:', message);
    // หรือใช้ toast notification
  };

  const showErrorMessage = (message) => {
    console.log('ERROR:', message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            🌈 MyKids 🌈
          </h1>
          <p className="text-gray-600">ระบบติดตามพฤติกรรมเด็ก</p>
        </div>

        {/* Children Selection */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">เลือกเด็ก</h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {children.map((child) => (
              <button
                key={child.Id}
                onClick={() => setSelectedChild(child)}
                className={`flex-shrink-0 p-4 rounded-xl transition-all duration-200 ${
                  selectedChild?.Id === child.Id
                    ? 'scale-105 shadow-lg'
                    : 'hover:scale-105 hover:shadow-md'
                }`}
                style={{ backgroundColor: child.BackgroundColor }}
              >
                <div className="text-3xl mb-1">{child.Emoji}</div>
                <div className="font-medium text-gray-800">{child.Name}</div>
                <div className="text-sm text-gray-600">
                  {child.TotalPoints || 0} คะแนน
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Child Info */}
        {selectedChild && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: selectedChild.BackgroundColor }}
                >
                  {selectedChild.Emoji}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">{selectedChild.Name}</h3>
                  <p className="text-gray-600">อายุ {selectedChild.Age} ปี</p>
                  <p className="text-lg font-semibold text-purple-600">
                    คะแนนรวม: {selectedChild.TotalPoints || 0} คะแนน
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSummary(!showSummary)}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
              >
                {showSummary ? 'ซ่อนสรุป' : 'แสดงสรุป'}
              </button>
            </div>
          </div>
        )}

        {/* Activities Summary */}
        {showSummary && selectedChild && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">กิจกรรมล่าสุด</h3>
            {activitiesLoading ? (
              <p className="text-gray-500">กำลังโหลด...</p>
            ) : activities.length === 0 ? (
              <p className="text-gray-500">ยังไม่มีกิจกรรม</p>
            ) : (
              <div className="space-y-2">
                {activities.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <span className="font-medium">{activity.ActivityName}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {new Date(activity.ActivityDate).toLocaleString('th-TH')}
                      </span>
                    </div>
                    <span className={`font-semibold ${
                      activity.Points > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {activity.Points > 0 ? '+' : ''}{activity.Points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("behaviors")}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === "behaviors"
                  ? "bg-green-50 text-green-700 border-b-2 border-green-500"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              ✅ งานดี
            </button>
            <button
              onClick={() => setActiveTab("badBehaviors")}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === "badBehaviors"
                  ? "bg-red-50 text-red-700 border-b-2 border-red-500"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              ❌ พฤติกรรมไม่ดี
            </button>
            <button
              onClick={() => setActiveTab("rewards")}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === "rewards"
                  ? "bg-purple-50 text-purple-700 border-b-2 border-purple-500"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              🎁 รางวัล
            </button>
          </div>

          <div className="p-6">
            {/* Good Behaviors Tab */}
            {activeTab === "behaviors" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {behaviors.map((behavior) => (
                  <button
                    key={behavior.Id}
                    onClick={() => handleBehaviorClick(behavior)}
                    disabled={activityMutationLoading}
                    className={`p-4 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md ${
                      activityMutationLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{ backgroundColor: behavior.Color }}
                  >
                    <div className="font-medium text-gray-800 mb-2">{behavior.Name}</div>
                    <div className="text-sm text-gray-600">+{behavior.Points} คะแนน</div>
                  </button>
                ))}
              </div>
            )}

            {/* Bad Behaviors Tab */}
            {activeTab === "badBehaviors" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {badBehaviors.map((badBehavior) => (
                  <button
                    key={badBehavior.Id}
                    onClick={() => handleBadBehaviorClick(badBehavior)}
                    disabled={activityMutationLoading}
                    className={`p-4 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-md ${
                      activityMutationLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{ backgroundColor: badBehavior.Color }}
                  >
                    <div className="font-medium text-gray-800 mb-2">{badBehavior.Name}</div>
                    <div className="text-sm text-gray-600">-{badBehavior.Penalty} คะแนน</div>
                  </button>
                ))}
              </div>
            )}

            {/* Rewards Tab */}
            {activeTab === "rewards" && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {rewards.map((reward) => {
                  const canAfford = selectedChild && (selectedChild.TotalPoints || 0) >= reward.Cost;
                  return (
                    <button
                      key={reward.Id}
                      onClick={() => handleRewardClaim(reward)}
                      disabled={!canAfford || activityMutationLoading}
                      className={`p-4 rounded-xl transition-all duration-200 ${
                        canAfford && !activityMutationLoading
                          ? 'hover:scale-105 hover:shadow-md'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      style={{ backgroundColor: reward.Color || '#ddd6fe' }}
                    >
                      <div className="text-2xl mb-2">{reward.Icon}</div>
                      <div className="font-medium text-gray-800 mb-1">{reward.Name}</div>
                      <div className="text-sm text-gray-600">{reward.Cost} คะแนน</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Loading overlay เมื่อกำลัง log activity */}
        {activityMutationLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              <span className="text-gray-700">กำลังบันทึกข้อมูล...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;