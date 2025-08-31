import { Users } from "lucide-react";
import { useChildrenStore } from "../../stores/childrenStore";

const ChildSelector = ({
  children = [], // Default to an empty array if children is undefined
  selectedChild,
  showSummary,
  onChildSelect = () => {}, // Default to no-op function
  onShowSummary = () => {}, // Default to no-op function
}) => {
  const { childrenData = {} } = useChildrenStore(); // Default to an empty object if childrenData is undefined

  return (
    <div className="mb-6">
      <div className="flex gap-2 mb-3">
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => onChildSelect(child.id)}
            className={`flex-1 p-3 rounded-2xl transition-all transform hover:scale-[1.02] ${
              selectedChild === child.id && !showSummary
                ? "shadow-lg scale-[1.02]"
                : "bg-white/50 hover:bg-white/70"
            }`}
            style={{
              backgroundColor:
                selectedChild === child.id && !showSummary
                  ? child.bgColor
                  : undefined,
            }}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">{child.emoji}</div>
              <div className="text-sm font-medium text-gray-700">
                {child.name}
              </div>
              <div className="text-xs text-gray-600">
                {childrenData[child.id]?.totalPoints || 0} คะแนน
              </div>
            </div>
          </button>
        ))}
        <button
          onClick={onShowSummary}
          className={`px-4 py-3 rounded-2xl transition-all ${
            showSummary
              ? "bg-gradient-to-r from-pink-200 to-purple-200 shadow-lg"
              : "bg-white/50 hover:bg-white/70"
          }`}
        >
          <Users size={20} className="text-gray-700" />
        </button>
      </div>
    </div>
  );
};

export default ChildSelector;
