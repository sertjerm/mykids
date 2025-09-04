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
