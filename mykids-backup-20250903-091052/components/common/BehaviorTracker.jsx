import { useState } from "react";
import { Star, RotateCcw } from "lucide-react";
import { useChildrenStore } from "../../stores/childrenStore";
import Card from "../ui/Card";
import Button from "../ui/Button";
import ProgressBar from "../ui/ProgressBar";

const BehaviorTracker = () => {
  const {
    children,
    childrenData,
    selectedChild,
    toggleBehavior,
    addBadBehavior,
    removeBadBehavior,
    resetChildDay,
    toggleReward,
  } = useChildrenStore();

  const [currentTab, setCurrentTab] = useState("good");

  const currentChild =
    children?.find((child) => child.id === selectedChild) || {};
  const currentData = childrenData?.[selectedChild] || {
    behaviors: [],
    totalPoints: 0,
  }; // Default to empty object and array

  if (!currentChild.id) {
    return <div className="text-center text-gray-500">Loading...</div>;
  }

  const rewards = [
    { name: "🎮 เล่นเกม 30 นาที", cost: 20, icon: "🎮" },
    { name: "🍦 ไอศกรีม", cost: 15, icon: "🍦" },
    { name: "🎬 ดูหนัง", cost: 25, icon: "🎬" },
    { name: "🎪 เที่ยวสวนสนุก", cost: 50, icon: "🎪" },
  ];

  const progress =
    currentData.behaviors.length > 0
      ? (currentData.behaviors.filter((b) => b.completed).length /
          currentData.behaviors.length) *
        100
      : 0;

  const redeemReward = (rewardId, cost) => {
    if (currentData.totalPoints >= cost) {
      toggleReward(selectedChild, rewardId);
      alert(`🎉 ${currentChild.name} รับรางวัลเรียบร้อยแล้ว!`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card
        className="text-center"
        style={{ backgroundColor: currentChild.bgColor }}
      >
        <div className="text-4xl mb-2">{currentChild.emoji}</div>
        <h1 className="text-xl font-bold text-gray-700 mb-2">
          {currentChild.name}
        </h1>
        <div className="flex items-center justify-center gap-2">
          <Star className="text-yellow-600 fill-current" size={24} />
          <span className="text-3xl font-bold text-gray-700">
            {currentData.totalPoints}
          </span>
          <span className="text-gray-600">คะแนน</span>
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex gap-1">
        {[
          { key: "good", label: "✅ งานดี" },
          { key: "bad", label: "❌ พฤติกรรมไม่ดี" },
          { key: "rewards", label: "🎁 รางวัล" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCurrentTab(tab.key)}
            className={`flex-1 py-3 px-3 rounded-2xl font-medium transition-all text-sm ${
              currentTab === tab.key
                ? "bg-white shadow-lg text-gray-700"
                : "bg-white/50 text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {/* Good Behaviors */}
        {currentTab === "good" &&
          currentData.behaviors.map((behavior) => (
            <Card
              key={behavior.id}
              hover
              className={`${behavior.completed ? "opacity-75" : ""}`}
              style={{ backgroundColor: behavior.color }}
              onClick={() => toggleBehavior(selectedChild, behavior.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      behavior.completed
                        ? "bg-white border-gray-400"
                        : "border-white bg-white/20"
                    }`}
                  >
                    {behavior.completed && (
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                  <span
                    className={`font-medium text-lg ${
                      behavior.completed
                        ? "text-gray-600 line-through"
                        : "text-gray-700"
                    }`}
                  >
                    {behavior.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-600 fill-current" size={16} />
                  <span className="font-bold text-gray-700">
                    +{behavior.points}
                  </span>
                </div>
              </div>
            </Card>
          ))}

        {/* Bad Behaviors */}
        {currentTab === "bad" && (
          <>
            <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-2xl">
              <p className="text-red-700 text-sm">
                ⚠️ พฤติกรรมไม่ดีจะทำให้คะแนนลดลง กดเพื่อบันทึกเมื่อเกิดขึ้น
              </p>
            </div>

            {currentData.badBehaviors.map((behavior) => (
              <Card
                key={behavior.id}
                style={{ backgroundColor: behavior.color }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-lg text-gray-700">
                    {behavior.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Star className="text-red-500 fill-current" size={16} />
                    <span className="font-bold text-gray-700">
                      {behavior.penalty}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    วันนี้:{" "}
                    <span className="font-bold">{behavior.count} ครั้ง</span>
                    {behavior.count > 0 && (
                      <span className="text-red-600 ml-2">
                        (รวม {behavior.penalty * behavior.count} คะแนน)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => addBadBehavior(selectedChild, behavior.id)}
                      className="bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      +
                    </button>
                    {behavior.count > 0 && (
                      <button
                        onClick={() =>
                          removeBadBehavior(selectedChild, behavior.id)
                        }
                        className="bg-gray-400 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-500 transition-colors"
                      >
                        -
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}

        {/* Rewards */}
        {currentTab === "rewards" &&
          rewards.map((reward, index) => (
            <Card
              key={index}
              hover={currentData.totalPoints >= reward.cost}
              className={
                currentData.totalPoints >= reward.cost ? "" : "opacity-50"
              }
              onClick={() => redeemReward(reward.cost)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{reward.icon}</span>
                  <span className="font-medium text-gray-700">
                    {reward.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="text-yellow-400 fill-current" size={16} />
                  <span className="font-bold text-gray-600">{reward.cost}</span>
                  {currentData.totalPoints >= reward.cost && (
                    <span className="text-green-600 text-sm ml-2">
                      ✓ พอแลกได้
                    </span>
                  )}
                </div>
              </div>
            </Card>
          ))}
      </div>

      {/* Actions */}
      <Button
        variant="secondary"
        onClick={() => resetChildDay(selectedChild)}
        className="w-full"
      >
        <RotateCcw size={18} />
        เริ่มวันใหม่
      </Button>

      {/* Progress Bar */}
      <Card>
        <ProgressBar
          progress={progress}
          label={`ความคืบหน้าของ ${currentChild.name}`}
          color="rainbow"
        />
      </Card>
    </div>
  );
};

export default BehaviorTracker;
