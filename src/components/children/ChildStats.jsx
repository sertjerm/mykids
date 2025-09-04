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
