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
