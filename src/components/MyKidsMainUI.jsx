import React, { useState, useEffect } from "react";
import {
  Settings,
  UserPlus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Gift,
} from "lucide-react";
import {
  useChildren,
  useBehaviors,
  useActivities,
  useRewards,
} from "../hooks/useApi";

const MyKidsMainUI = () => {
  // API Hooks - Updated for MyKidsDB2
  const { children, loading: childrenLoading, createChild } = useChildren();
  const {
    goodBehaviors,
    badBehaviors,
    loading: behaviorsLoading,
  } = useBehaviors();
  const { rewards, loading: rewardsLoading } = useRewards();

  // Local State
  const [selectedChild, setSelectedChild] = useState(null);
  const [activeTab, setActiveTab] = useState("good");

  // Activity hook for selected child
  const {
    activities,
    logActivity,
    loading: activitiesLoading,
  } = useActivities(selectedChild?.Id);

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
  const handleActivityComplete = async (behavior, type = "good") => {
    if (!selectedChild) return;
    try {
      await logActivity({
        childId: selectedChild.Id,
        activityId: behavior.Id,
        activityType: type === "good" ? "Good" : "Bad",
        note: `${behavior.Name} - ${new Date().toLocaleTimeString()}`,
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกกิจกรรม");
    }
  };

  // Handle reward redemption
  const handleRewardClaim = async (reward) => {
    if (!selectedChild) return;
    if ((selectedChild.TotalPoints || 0) < reward.Cost) {
      alert(
        `คะแนนไม่เพียงพอ! ต้องการ ${reward.Cost} คะแนน มีอยู่ ${
          selectedChild.TotalPoints || 0
        } คะแนน`
      );
      return;
    }
    try {
      await logActivity({
        childId: selectedChild.Id,
        activityId: reward.Id,
        activityType: "Reward",
        note: `แลกรางวัล: ${reward.Name}`,
      });
      alert(`🎉 แลกรางวัล "${reward.Name}" สำเร็จ!`);
    } catch (error) {
      console.error("Failed to redeem reward:", error);
      alert("เกิดข้อผิดพลาดในการแลกรางวัล");
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
                key={child.Id}
                onClick={() => setSelectedChild(child)}
                className={`px-6 py-3 rounded-full font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedChild?.Id === child.Id
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "bg-white/60 text-purple-700 hover:bg-white/80"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-sm">
                    {child.Name?.charAt(0) || "👶"}
                  </div>
                  <span>{child.Name}</span>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                    {child.TotalPoints || 0}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Activity Tabs */}
          <div className="flex bg-white/50 rounded-full p-1">
            {[
              {
                id: "good",
                label: "งานดี",
                count: goodBehaviors.length,
                color: "green",
              },
              {
                id: "bad",
                label: "ไม่ดี",
                count: badBehaviors.length,
                color: "red",
              },
              {
                id: "rewards",
                label: "รางวัล",
                count: rewards.length,
                color: "purple",
              },
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
                <div className="text-2xl font-bold text-green-600">
                  {selectedChild.totalPoints || 0}
                </div>
                <div className="text-green-700">คะแนนรวม</div>
              </div>
              <div className="bg-blue-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedChild.goodBehaviorCount || 0}
                </div>
                <div className="text-blue-700">งานดี</div>
              </div>
              <div className="bg-red-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {selectedChild.badBehaviorCount || 0}
                </div>
                <div className="text-red-700">พฤติกรรมไม่ดี</div>
              </div>
              <div className="bg-purple-100 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {selectedChild.rewardCount || 0}
                </div>
                <div className="text-purple-700">รางวัลที่ได้</div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Good Behaviors */}
          {activeTab === "good" &&
            goodBehaviors.map((behavior) => {
              const isCompleted =
                behavior.ChildId != null && behavior.ChildId !== "";
              return (
                <div
                  key={behavior.Id}
                  className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">{behavior.Name}</h3>
                    <span
                      className="px-3 py-1 rounded-full text-white text-sm font-medium"
                      style={{ backgroundColor: behavior.Color }}
                    >
                      +{behavior.Points}
                    </span>
                  </div>
                  <button
                    onClick={() => handleActivityComplete(behavior, "good")}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-medium"
                    disabled={activitiesLoading || isCompleted}
                  >
                    <CheckCircle2 className="w-5 h-5 inline mr-2" />
                    {isCompleted ? "ทำแล้ววันนี้" : "เสร็จแล้ว!"}
                    {behavior.completedCount > 0 && (
                      <span className="ml-2 text-xs text-green-600">
                        ({behavior.completedCount} ครั้ง)
                      </span>
                    )}
                  </button>
                  {behavior.Category && (
                    <p className="text-xs text-gray-500 mt-2">
                      {behavior.Category}
                    </p>
                  )}
                </div>
              );
            })}

          {/* Bad Behaviors */}
          {activeTab === "bad" &&
            badBehaviors.map((behavior) => (
              <div
                key={behavior.Id}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800">{behavior.Name}</h3>
                  <span
                    className="px-3 py-1 rounded-full text-white text-sm font-medium"
                    style={{ backgroundColor: behavior.Color }}
                  >
                    {behavior.Points}
                  </span>
                </div>
                <button
                  onClick={() => handleActivityComplete(behavior, "bad")}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:from-red-600 hover:to-rose-600 transition-all duration-200 font-medium"
                  disabled={activitiesLoading || behavior.isCompleted}
                >
                  <AlertTriangle className="w-5 h-5 inline mr-2" />
                  {behavior.isCompleted ? "ทำแล้ววันนี้" : "ทำแล้ว"}
                  {behavior.completedCount > 0 && (
                    <span className="ml-2 text-xs text-red-600">
                      ({behavior.completedCount} ครั้ง)
                    </span>
                  )}
                </button>
                {behavior.Category && (
                  <p className="text-xs text-gray-500 mt-2">
                    {behavior.Category}
                  </p>
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
                  disabled={
                    !selectedChild ||
                    selectedChild.totalPoints < reward.cost ||
                    activitiesLoading
                  }
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Gift className="w-5 h-5 inline mr-2" />
                  แลกรางวัล
                </button>
                {reward.category && (
                  <p className="text-xs text-gray-500 mt-2">
                    {reward.category}
                  </p>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default MyKidsMainUI;
