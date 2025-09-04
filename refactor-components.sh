#!/bin/bash

# MyKids Component Refactoring Script
# แยก MyKidsMainUI เป็น components ย่อยๆ

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "\n${YELLOW}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Create component directories
create_directories() {
    print_step "สร้างโครงสร้าง components..."
    
    directories=(
        "src/components/ui"
        "src/components/layout"
        "src/components/behaviors"
        "src/components/children"
        "src/components/rewards"
        "src/components/common"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        print_success "สร้าง: $dir"
    done
}

# Create Header Component
create_header_component() {
    print_step "สร้าง Header Component..."
    
    cat > "src/components/layout/Header.jsx" << 'EOF'
import React from 'react';
import { Settings, UserPlus } from 'lucide-react';

const Header = ({ children, selectedChild, onChildSelect, activeTab, onTabChange, summary }) => {
  const tabs = [
    { id: "good", label: "งานดี", count: summary?.goodBehaviorsCount || 0, color: "green" },
    { id: "bad", label: "ไม่ดี", count: summary?.badBehaviorsCount || 0, color: "red" },
    { id: "rewards", label: "รางวัล", count: summary?.rewardsCount || 0, color: "purple" },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm shadow-lg sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              MyKids v2.0
            </h1>
            <p className="text-sm text-gray-500">
              {children?.length || 0} เด็ก • {summary?.todayActivitiesCount || 0} กิจกรรมวันนี้
            </p>
          </div>
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
          {children?.map((child) => (
            <button
              key={child.Id}
              onClick={() => onChildSelect(child)}
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
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
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
  );
};

export default Header;
EOF

    print_success "สร้าง Header.jsx"
}

# Create Child Stats Component
create_child_stats_component() {
    print_step "สร้าง ChildStats Component..."
    
    cat > "src/components/children/ChildStats.jsx" << 'EOF'
import React from 'react';
import { TrendingUp } from 'lucide-react';

const ChildStats = ({ child }) => {
  if (!child) return null;

  const stats = [
    {
      label: "คะแนนรวม",
      value: child.TotalPoints || 0,
      color: "green",
      bgColor: "bg-green-100",
      textColor: "text-green-600"
    },
    {
      label: "งานดี",
      value: child.GoodBehaviorCount || 0,
      color: "blue",
      bgColor: "bg-blue-100",
      textColor: "text-blue-600"
    },
    {
      label: "พฤติกรรมไม่ดี",
      value: child.BadBehaviorCount || 0,
      color: "red",
      bgColor: "bg-red-100",
      textColor: "text-red-600"
    },
    {
      label: "รางวัลที่ได้",
      value: child.RewardCount || 0,
      color: "purple",
      bgColor: "bg-purple-100",
      textColor: "text-purple-600"
    }
  ];

  return (
    <div className="mb-6 bg-white/60 rounded-2xl p-6 backdrop-blur-sm">
      <h2 className="text-xl font-bold text-purple-800 mb-2 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        {child.Name}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bgColor} rounded-lg p-3 text-center`}>
            <div className={`text-2xl font-bold ${stat.textColor}`}>
              {stat.value}
            </div>
            <div className={`${stat.textColor.replace('600', '700')}`}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChildStats;
EOF

    print_success "สร้าง ChildStats.jsx"
}

# Create Good Behaviors Component
create_good_behaviors_component() {
    print_step "สร้าง GoodBehaviors Component..."
    
    cat > "src/components/behaviors/GoodBehaviors.jsx" << 'EOF'
import React from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import ProgressBar from '../ui/ProgressBar';

const GoodBehaviors = ({ 
  behaviors, 
  completedBehaviorIds, 
  onActivityComplete, 
  activitiesLoading 
}) => {
  if (!behaviors || behaviors.length === 0) {
    return (
      <div className="bg-white/80 rounded-2xl shadow p-8 text-center">
        <p className="text-gray-500">ไม่มีงานดีให้ทำ</p>
      </div>
    );
  }

  const completedCount = completedBehaviorIds.size;
  const totalCount = behaviors.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white/80 rounded-2xl shadow p-4 mb-6">
      <h3 className="text-lg font-bold text-green-700 mb-2">งานดีวันนี้</h3>
      <div className="mb-2 text-sm text-gray-500">กดเพื่อทำเครื่องหมายงานที่เสร็จแล้ว</div>
      
      <ul className="space-y-3">
        {behaviors.map((behavior) => {
          const isCompleted = completedBehaviorIds.has(behavior.Id);
          return (
            <li 
              key={behavior.Id}
              className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all duration-200 ${
                isCompleted 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-gray-50 border-gray-200 hover:border-green-400'
              } shadow-sm`}
            >
              <div className="flex items-center gap-3">
                {behavior.Emoji && <span className="text-2xl">{behavior.Emoji}</span>}
                <span className="font-medium text-gray-800">{behavior.Name}</span>
                <span 
                  className="text-xs px-2 py-1 rounded-full ml-2" 
                  style={{ backgroundColor: behavior.Color, color: '#fff' }}
                >
                  +{behavior.Points}
                </span>
                {behavior.Category && (
                  <span className="text-xs text-gray-500 ml-2">{behavior.Category}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <span className="flex items-center gap-1 text-green-600 font-semibold">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                ) : (
                  <button
                    onClick={() => onActivityComplete(behavior, "good")}
                    disabled={activitiesLoading}
                    className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-lg font-medium hover:from-green-500 hover:to-emerald-500 transition-all duration-200 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      
      <ProgressBar 
        completed={completedCount}
        total={totalCount}
        percent={progressPercent}
        label="ความคืบหน้างานดีวันนี้"
      />
      
      {/* ปุ่มเริ่มวันใหม่ */}
      <div className="mt-6 flex justify-center">
        <button
          className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-lg flex items-center gap-2 shadow-lg transition-all duration-200"
          onClick={() => window.location.reload()}
        >
          <RotateCcw className="w-5 h-5" /> เริ่มวันใหม่
        </button>
      </div>
    </div>
  );
};

export default GoodBehaviors;
EOF

    print_success "สร้าง GoodBehaviors.jsx"
}

# Create Bad Behaviors Component
create_bad_behaviors_component() {
    print_step "สร้าง BadBehaviors Component..."
    
    cat > "src/components/behaviors/BadBehaviors.jsx" << 'EOF'
import React from 'react';

const BadBehaviors = ({ 
  behaviors, 
  badBehaviorCounts, 
  onBadBehaviorCountChange 
}) => {
  if (!behaviors || behaviors.length === 0) {
    return (
      <div className="bg-white/80 rounded-2xl shadow p-8 text-center">
        <p className="text-gray-500">ไม่มีพฤติกรรมไม่ดีที่ต้องติดตาม</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 rounded-2xl shadow p-4 mb-6">
      <h3 className="text-lg font-bold text-red-700 mb-2">พฤติกรรมไม่ดี</h3>
      <div className="mb-2 text-sm text-gray-500">กด + เพื่อบันทึกพฤติกรรมไม่ดี กด - เพื่อลด</div>
      <div className="mb-2 text-sm text-yellow-600 flex items-center gap-2">
        <span>🟡</span> ระดับปานกลาง
      </div>
      
      <ul className="space-y-3">
        {behaviors.map((behavior) => {
          const count = badBehaviorCounts[behavior.Id] || 0;
          return (
            <li 
              key={behavior.Id}
              className={`flex items-center justify-between rounded-xl px-4 py-3 border transition-all duration-200 ${
                count > 0 
                  ? 'bg-red-50 border-red-300' 
                  : 'bg-gray-50 border-gray-200 hover:border-red-400'
              } shadow-sm`}
            >
              <div className="flex items-center gap-3">
                {behavior.Emoji && <span className="text-2xl">{behavior.Emoji}</span>}
                <span className="font-medium text-gray-800">{behavior.Name}</span>
                <span 
                  className="text-xs px-2 py-1 rounded-full ml-2" 
                  style={{ backgroundColor: behavior.Color, color: '#fff' }}
                >
                  -{Math.abs(behavior.Points)} คะแนน
                </span>
                {count > 0 && (
                  <span className="ml-2 text-xs font-bold text-red-600">{count} ครั้ง</span>
                )}
                {behavior.Category && (
                  <span className="text-xs text-gray-500 ml-2">{behavior.Category}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onBadBehaviorCountChange(behavior, -1)}
                  disabled={count === 0}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded-lg font-bold text-lg hover:bg-red-200 transition-all duration-200 disabled:opacity-50"
                >
                  -
                </button>
                <button
                  onClick={() => onBadBehaviorCountChange(behavior, 1)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded-lg font-bold text-lg hover:bg-red-200 transition-all duration-200"
                >
                  +
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default BadBehaviors;
EOF

    print_success "สร้าง BadBehaviors.jsx"
}

# Create Rewards Component
create_rewards_component() {
    print_step "สร้าง Rewards Component..."
    
    cat > "src/components/rewards/RewardsList.jsx" << 'EOF'
import React from 'react';
import { Gift } from 'lucide-react';

const RewardsList = ({ 
  rewards, 
  selectedChild, 
  onRewardClaim, 
  activitiesLoading 
}) => {
  if (!rewards || rewards.length === 0) {
    return (
      <div className="bg-white/80 rounded-2xl shadow p-8 text-center">
        <p className="text-gray-500">ไม่มีรางวัลให้แลก</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rewards.map((reward) => {
        const canAfford = selectedChild && (selectedChild.TotalPoints || 0) >= reward.Cost;
        
        return (
          <div
            key={reward.Id}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">{reward.Name}</h3>
              <span
                className="px-3 py-1 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: reward.Color }}
              >
                {reward.Cost} คะแนน
              </span>
            </div>
            
            <div className="mb-4">
              {reward.Category && (
                <p className="text-xs text-gray-500">{reward.Category}</p>
              )}
              <div className="text-sm text-gray-600 mt-1">
                คะแนนที่มี: {selectedChild?.TotalPoints || 0} / {reward.Cost}
              </div>
              {!canAfford && (
                <div className="text-xs text-red-500 mt-1">
                  ต้องการอีก {reward.Cost - (selectedChild?.TotalPoints || 0)} คะแนน
                </div>
              )}
            </div>
            
            <button
              onClick={() => onRewardClaim(reward)}
              disabled={!canAfford || activitiesLoading}
              className={`w-full py-3 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                canAfford
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
                  : 'bg-gray-400'
              }`}
            >
              <Gift className="w-5 h-5 inline mr-2" />
              {canAfford ? 'แลกรางวัล' : 'คะแนนไม่พอ'}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default RewardsList;
EOF

    print_success "สร้าง RewardsList.jsx"
}

# Create UI Components
create_ui_components() {
    print_step "สร้าง UI Components..."
    
    # Progress Bar
    cat > "src/components/ui/ProgressBar.jsx" << 'EOF'
import React from 'react';

const ProgressBar = ({ completed, total, percent, label }) => {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-bold text-green-700">
          {total > 0 ? `${completed}/${total} (${percent}%)` : '0%'}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="bg-gradient-to-r from-pink-400 via-purple-400 to-green-400 h-4 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
EOF

    # Loading Spinner
    cat > "src/components/ui/LoadingSpinner.jsx" << 'EOF'
import React from 'react';

const LoadingSpinner = ({ message = "กำลังโหลดข้อมูล..." }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-purple-600 font-medium">{message}</p>
        <p className="text-sm text-gray-500 mt-2">MyKidsDB2</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
EOF

    # Error Display
    cat > "src/components/ui/ErrorDisplay.jsx" << 'EOF'
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ErrorDisplay = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
      <div className="text-center bg-white rounded-lg p-8 shadow-lg max-w-md">
        <div className="text-red-500 mb-4">
          <AlertTriangle className="w-12 h-12 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-red-600 mb-2">เกิดข้อผิดพลาด</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            ลองใหม่
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
EOF

    print_success "สร้าง UI Components"
}

# Create Main Component (Refactored)
create_main_component_refactored() {
    print_step "สร้าง Main Component ที่ refactor แล้ว..."
    
    cat > "src/components/MyKidsMainUI.jsx" << 'EOF'
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
EOF

    print_success "สร้าง Main Component ที่ refactor แล้ว"
}

# Create index files for easier imports
create_index_files() {
    print_step "สร้าง index files..."
    
    # Layout index
    cat > "src/components/layout/index.js" << 'EOF'
export { default as Header } from './Header';
EOF

    # Children index
    cat > "src/components/children/index.js" << 'EOF'
export { default as ChildStats } from './ChildStats';
EOF

    # Behaviors index
    cat > "src/components/behaviors/index.js" << 'EOF'
export { default as GoodBehaviors } from './GoodBehaviors';
export { default as BadBehaviors } from './BadBehaviors';
EOF

    # Rewards index
    cat > "src/components/rewards/index.js" << 'EOF'
export { default as RewardsList } from './RewardsList';
EOF

    # UI index
    cat > "src/components/ui/index.js" << 'EOF'
export { default as ProgressBar } from './ProgressBar';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as ErrorDisplay } from './ErrorDisplay';
EOF

    print_success "สร้าง index files"
}

# Create component map documentation
create_component_docs() {
    print_step "สร้าง Component Documentation..."
    
    cat > "COMPONENT_STRUCTURE.md" << 'EOF'
# MyKids Component Structure

## 🏗️ Component Architecture

```
src/components/
├── MyKidsMainUI.jsx          # Main container (150 lines)
├── layout/
│   ├── Header.jsx           # Header with tabs (80 lines)  
│   └── index.js
├── children/
│   ├── ChildStats.jsx       # Child statistics display (60 lines)
│   └── index.js
├── behaviors/
│   ├── GoodBehaviors.jsx    # Good behaviors list (100 lines)
│   ├── BadBehaviors.jsx     # Bad behaviors list (80 lines) 
│   └── index.js
├── rewards/
│   ├── RewardsList.jsx      # Rewards grid (70 lines)
│   └── index.js
└── ui/
    ├── ProgressBar.jsx      # Progress bar component (25 lines)
    ├── LoadingSpinner.jsx   # Loading state (20 lines)
    ├── ErrorDisplay.jsx     # Error state (25 lines)
    └── index.js
```

## 📊 Before vs After

### Before Refactoring:
- ❌ 1 file with 500+ lines
- ❌ Hard to maintain
- ❌ Mixed responsibilities
- ❌ Difficult to test individual parts

### After Refactoring:
- ✅ 9 focused components
- ✅ Single responsibility principle
- ✅ Easy to maintain and test
- ✅ Reusable components
- ✅ Better organization

## 🎯 Component Responsibilities

### MyKidsMainUI (Main Container)
- State management
- API hooks coordination
- Event handling
- Component composition

### Header
- Navigation tabs
- Child selection
- App title and stats

### ChildStats  
- Display child statistics
- Points, behaviors, rewards count

### GoodBehaviors
- Good behaviors list
- Progress tracking
- Activity completion

### BadBehaviors
- Bad behaviors tracking  
- Count increment/decrement
- Category display

### RewardsList
- Available rewards
- Point requirements
- Redemption handling

### UI Components
- LoadingSpinner: Loading states
- ErrorDisplay: Error handling  
- ProgressBar: Progress visualization

## 🚀 Usage Examples

### Import Components
```javascript
// Individual imports
import Header from './components/layout/Header';
import ChildStats from './components/children/ChildStats';

// Barrel imports
import { Header } from './components/layout';
import { ChildStats } from './components/children';
```

### Component Props
```javascript
// Header Component
<Header
  children={children}
  selectedChild={selectedChild}
  onChildSelect={handleChildSelect}
  activeTab={activeTab}
  onTabChange={handleTabChange}
  summary={summary}
/>

// GoodBehaviors Component
<GoodBehaviors
  behaviors={goodBehaviors}
  completedBehaviorIds={completedBehaviorIds}
  onActivityComplete={handleActivityComplete}
  activitiesLoading={activitiesLoading}
/>
```

## 🔄 Migration Benefits

1. **Maintainability**: Each component has a single responsibility
2. **Testability**: Components can be tested in isolation
3. **Reusability**: Components can be reused across different pages
4. **Performance**: Easier to implement React.memo for optimization
5. **Development**: Multiple developers can work on different components
6. **Code Review**: Smaller, focused pull requests

## 📝 Next Steps

1. Add PropTypes or TypeScript for type checking
2. Add unit tests for each component
3. Implement React.memo for performance optimization
4. Add Storybook for component documentation
5. Consider adding more granular components (e.g., BehaviorCard, ChildTab)

Created on: $(date)
EOF

    print_success "สร้าง COMPONENT_STRUCTURE.md"
}

# Main execution
main() {
    echo -e "\n${BLUE}=== MyKids Component Refactoring Script ===${NC}"
    echo -e "${BLUE}แยก MyKidsMainUI เป็น components ย่อยๆ${NC}\n"
    
    # Confirmation
    echo -e "${YELLOW}⚠️  สคริปต์นี้จะ:${NC}"
    echo "1. สร้าง 9 components ใหม่"
    echo "2. แยก MyKidsMainUI ออกเป็นส่วนย่อยๆ"
    echo "3. ลดขนาดไฟล์จาก 500+ บรรทัด เป็น 150 บรรทัด"
    echo "4. เพิ่ม maintainability และ reusability"
    echo ""
    read -p "ต้องการดำเนินการต่อไหม? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "ยกเลิกการทำงาน"
        exit 0
    fi
    
    # Execute steps
    create_directories
    create_header_component
    create_child_stats_component
    create_good_behaviors_component
    create_bad_behaviors_component
    create_rewards_component
    create_ui_components
    create_main_component_refactored
    create_index_files
    create_component_docs
    
    # Summary
    echo -e "\n${BLUE}=== Refactoring สำเร็จ! ===${NC}"
    echo -e "${GREEN}✅ สร้าง 9 components ใหม่${NC}"
    echo -e "${GREEN}✅ ลดขนาดไฟล์หลักจาก 500+ เป็น 150 บรรทัด${NC}"
    echo -e "${GREEN}✅ เพิ่ม maintainability และ testability${NC}"
    echo ""
    echo -e "${BLUE}📁 Components ที่สร้าง:${NC}"
    echo "  • layout/Header.jsx (80 lines)"
    echo "  • children/ChildStats.jsx (60 lines)"
    echo "  • behaviors/GoodBehaviors.jsx (100 lines)"
    echo "  • behaviors/BadBehaviors.jsx (80 lines)"
    echo "  • rewards/RewardsList.jsx (70 lines)"
    echo "  • ui/LoadingSpinner.jsx (20 lines)"
    echo "  • ui/ErrorDisplay.jsx (25 lines)"
    echo "  • ui/ProgressBar.jsx (25 lines)"
    echo ""
    echo -e "${GREEN}📋 อ่านคู่มือเพิ่มเติมที่: COMPONENT_STRUCTURE.md${NC}"
    echo -e "${GREEN}🎉 พร้อมใช้งาน MyKids แบบ Clean Architecture แล้ว!${NC}"
}

# Run main function
main "$@"