// components/BehaviorButton.jsx - ตัวอย่างการใช้งาน binding ที่ถูกต้อง
import React from 'react';
import { CheckCircle2, Star } from 'lucide-react';

const BehaviorButton = ({ 
  behavior, 
  isCompleted, 
  loading, 
  onClick 
}) => {
  const behaviorId = behavior.Id || behavior.id;
  const behaviorName = behavior.Name || behavior.name;
  const behaviorPoints = behavior.Points || behavior.points;

  return (
    <button
      onClick={() => !isCompleted && onClick(behaviorId)}
      disabled={loading || isCompleted}
      className={\`p-4 rounded-xl text-left transition-all duration-300 \${
        isCompleted
          ? 'bg-green-100 border-2 border-green-400 opacity-75'
          : 'bg-white hover:bg-pink-50 hover:shadow-lg border-2 border-transparent'
      } \${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}\`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* 🎯 Visual Indicator - สำคัญ! */}
          <div className={\`w-6 h-6 rounded-full flex items-center justify-center \${
            isCompleted 
              ? 'bg-green-500 text-white' 
              : 'border-2 border-gray-300 bg-white'
          }\`}>
            {isCompleted && <CheckCircle2 className="w-4 h-4" />}
          </div>
          
          <div>
            <h3 className={\`font-bold \${
              isCompleted ? 'text-green-800 line-through' : 'text-gray-800'
            }\`}>
              {behaviorName}
            </h3>
            {isCompleted && (
              <p className="text-sm text-green-600 mt-1">✅ ทำเสร็จแล้ววันนี้</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500 fill-current" />
          <span className={\`font-bold \${
            isCompleted ? 'text-green-600' : 'text-gray-700'
          }\`}>
            +{behaviorPoints}
          </span>
        </div>
      </div>
    </button>
  );
};

export default BehaviorButton;
