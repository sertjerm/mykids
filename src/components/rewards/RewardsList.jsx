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
