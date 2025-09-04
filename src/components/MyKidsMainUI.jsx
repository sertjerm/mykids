import React, { useState, useEffect } from "react";
import { useChildren, useBehaviors, useActivities, useRewards } from "../hooks/useApi";

// Import Components
import Header from "./layout/Header";
import ChildStats from "./children/ChildStats";
import GoodBehaviors from "./behaviors/GoodBehaviors";
import BadBehaviors from "./behaviors/BadBehaviors";
import RewardsList from "./rewards/RewardsList";
import LoadingSpinner from "./ui/LoadingSpinner";
import ErrorDisplay from "./ui/ErrorDisplay";

const MyKidsMainUI = () => {
  // API Hooks
  const { children, loading: childrenLoading, error: childrenError, refetch: refetchChildren } = useChildren();
  const { goodBehaviors, badBehaviors, loading: behaviorsLoading, error: behaviorsError } = useBehaviors();
  const { rewards, loading: rewardsLoading, error: rewardsError } = useRewards();

  // Local State
  const [selectedChild, setSelectedChild] = useState(null);
  const [activeTab, setActiveTab] = useState("good");
  const [badBehaviorCounts, setBadBehaviorCounts] = useState({});

  // Activity hook for selected child
  const { activities, logActivity, loading: activitiesLoading } = useActivities(selectedChild?.Id);

  // Computed values
  const completedBehaviorIds = React.useMemo(() => {
    const set = new Set();
    if (Array.isArray(activities)) {
      activities.forEach((activity) => {
        if (
          activity.ActivityType === "Good" &&
          activity.ChildId === selectedChild?.Id &&
          activity.ActivityId
        ) {
          set.add(activity.ActivityId);
        }
      });
    }
    return set;
  }, [activities, selectedChild]);

  const summary = React.useMemo(() => ({
    goodBehaviorsCount: goodBehaviors?.length || 0,
    badBehaviorsCount: badBehaviors?.length || 0,
    rewardsCount: rewards?.length || 0,
    todayActivitiesCount: activities?.length || 0,
  }), [goodBehaviors, badBehaviors, rewards, activities]);

  // Event Handlers
  const handleChildSelect = (child) => {
    setSelectedChild(child);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleActivityComplete = async (behavior, type = "good") => {
    if (!selectedChild) return;
    
    try {
      await logActivity({
        childId: selectedChild.Id,
        activityId: behavior.Id,
        activityType: type === "good" ? "Good" : "Bad",
        note: `${behavior.Name} - ${new Date().toLocaleTimeString()}`,
      });
      
      // Refetch children data to update points
      refetchChildren();
    } catch (error) {
      console.error("Failed to log activity:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกกิจกรรม: " + error.message);
    }
  };

  const handleBadBehaviorCount = async (behavior, delta) => {
    if (!selectedChild) return;
    
    const currentCount = badBehaviorCounts[behavior.Id] || 0;
    const newCount = Math.max(0, currentCount + delta);
    
    try {
      if (delta > 0) {
        await logActivity({
          childId: selectedChild.Id,
          activityId: behavior.Id,
          activityType: "Bad",
          note: `${behavior.Name} - ${new Date().toLocaleTimeString()}`,
        });
        
        // Refetch children data
        refetchChildren();
      }
      
      // Update local state
      setBadBehaviorCounts(prev => ({
        ...prev,
        [behavior.Id]: newCount
      }));
    } catch (error) {
      console.error("Failed to update bad behavior count:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกพฤติกรรมไม่ดี: " + error.message);
    }
  };

  const handleRewardClaim = async (reward) => {
    if (!selectedChild) return;
    
    if ((selectedChild.TotalPoints || 0) < reward.Cost) {
      alert(
        `คะแนนไม่เพียงพอ! ต้องการ ${reward.Cost} คะแนน มีอยู่ ${selectedChild.TotalPoints || 0} คะแนน`
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
      
      // Refetch children data
      refetchChildren();
    } catch (error) {
      console.error("Failed to redeem reward:", error);
      alert("เกิดข้อผิดพลาดในการแลกรางวัล: " + error.message);
    }
  };

  // Effects
  useEffect(() => {
    if (children?.length > 0 && !selectedChild) {
      setSelectedChild(children[0]);
    }
  }, [children, selectedChild]);

  // Loading States
  const isLoading = childrenLoading || behaviorsLoading || rewardsLoading;
  const error = childrenError || behaviorsError || rewardsError;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={refetchChildren} />;
  }

  // Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      <Header
        children={children}
        selectedChild={selectedChild}
        onChildSelect={handleChildSelect}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        summary={summary}
      />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <ChildStats child={selectedChild} />

        {activeTab === "good" && (
          <GoodBehaviors
            behaviors={goodBehaviors}
            completedBehaviorIds={completedBehaviorIds}
            onActivityComplete={handleActivityComplete}
            activitiesLoading={activitiesLoading}
          />
        )}

        {activeTab === "bad" && (
          <BadBehaviors
            behaviors={badBehaviors}
            badBehaviorCounts={badBehaviorCounts}
            onBadBehaviorCountChange={handleBadBehaviorCount}
          />
        )}

        {activeTab === "rewards" && (
          <RewardsList
            rewards={rewards}
            selectedChild={selectedChild}
            onRewardClaim={handleRewardClaim}
            activitiesLoading={activitiesLoading}
          />
        )}
      </div>
    </div>
  );
};

export default MyKidsMainUI;
