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
