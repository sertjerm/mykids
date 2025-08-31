import React, { useState } from "react";
import { useChildrenStore } from "../stores/childrenStore";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { RAINBOW_COLORS } from "../utils/colors";
import AppLayout from "../components/layout/AppLayout";

const AdminPage = () => {
  const {
    children,
    addChild,
    updateChild,
    removeChild,
    sharedBehaviors,
    addSharedBehavior,
    addSharedBadBehavior,
    addSharedReward,
    updateSharedBehavior,
    updateSharedBadBehavior,
    updateSharedReward,
    removeSharedBehavior,
    removeSharedBadBehavior,
    removeSharedReward,
  } = useChildrenStore();

  const [activeTab, setActiveTab] = useState("behaviors");
  const [newItem, setNewItem] = useState({
    name: "",
    points: 0,
    color: RAINBOW_COLORS.blue,
  });
  const [isAdding, setIsAdding] = useState(false);

  // บันทึกข้อมูลใหม่
  const handleSave = () => {
    if (!newItem.name) return;

    if (activeTab === "behaviors") {
      addSharedBehavior(newItem);
    } else if (activeTab === "badBehaviors") {
      addSharedBadBehavior({
        ...newItem,
        penalty: -Math.abs(newItem.points), // แปลงเป็นค่าลบเสมอ
      });
    } else if (activeTab === "rewards") {
      addSharedReward({
        ...newItem,
        cost: Math.abs(newItem.points), // ใช้ points เป็น cost
      });
    }

    setIsAdding(false);
    setNewItem({ name: "", points: 0, color: RAINBOW_COLORS.blue });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold mb-4">การตั้งค่าระบบ</h1>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "behaviors", label: "✅ งานและกิจกรรม" },
            { id: "badBehaviors", label: "⚠️ พฤติกรรมไม่ดี" },
            { id: "rewards", label: "🎁 รางวัล" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-white shadow-md text-gray-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Good Behaviors Management */}
        {activeTab === "behaviors" && (
          <Card>
            <h2 className="text-xl font-bold mb-4">งานและกิจกรรม</h2>
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-blue-800 text-sm">
                  💡 รายการงานและกิจกรรมนี้จะใช้ร่วมกันสำหรับทุกคนในครอบครัว
                </p>
              </div>

              {/* List of behaviors */}
              <div className="space-y-2">
                {(sharedBehaviors?.behaviors || []).map((behavior) => (
                  <Card
                    key={behavior.id}
                    style={{ backgroundColor: behavior.color }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">
                        {behavior.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          +{behavior.points} คะแนน
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setNewItem(behavior);
                            setIsAdding(true);
                          }}
                        >
                          แก้ไข
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  setNewItem({
                    name: "",
                    points: 0,
                    color: RAINBOW_COLORS.blue,
                  });
                  setIsAdding(true);
                }}
              >
                + เพิ่มงานใหม่
              </Button>
            </div>
          </Card>
        )}

        {/* Bad Behaviors Management */}
        {activeTab === "badBehaviors" && (
          <Card>
            <h2 className="text-xl font-bold mb-4">พฤติกรรมที่ไม่ดี</h2>
            <div className="space-y-3">
              <div className="bg-red-50 p-4 rounded-lg mb-4">
                <p className="text-red-800 text-sm">
                  ⚠️ รายการพฤติกรรมที่ไม่ดีนี้จะใช้ร่วมกันสำหรับทุกคนในครอบครัว
                </p>
              </div>

              {/* List of bad behaviors */}
              <div className="space-y-2">
                {(sharedBehaviors?.badBehaviors || []).map((behavior) => (
                  <Card
                    key={behavior.id}
                    style={{ backgroundColor: behavior.color }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">
                        {behavior.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-red-600">
                          {behavior.penalty} คะแนน
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setNewItem({
                              ...behavior,
                              points: Math.abs(behavior.penalty),
                            });
                            setIsAdding(true);
                          }}
                        >
                          แก้ไข
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  setNewItem({
                    name: "",
                    points: 0,
                    color: RAINBOW_COLORS.red,
                  });
                  setIsAdding(true);
                }}
              >
                + เพิ่มพฤติกรรมที่ไม่ดี
              </Button>
            </div>
          </Card>
        )}

        {/* Rewards Management */}
        {activeTab === "rewards" && (
          <Card>
            <h2 className="text-xl font-bold mb-4">รางวัล</h2>
            <div className="space-y-3">
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <p className="text-yellow-800 text-sm">
                  🎁 รายการรางวัลนี้จะใช้ร่วมกันสำหรับทุกคนในครอบครัว
                </p>
              </div>

              {/* List of rewards */}
              <div className="space-y-2">
                {(sharedBehaviors?.rewards || []).map((reward) => (
                  <Card key={reward.id}>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">{reward.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{reward.cost} คะแนน</span>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setNewItem({ ...reward, points: reward.cost });
                            setIsAdding(true);
                          }}
                        >
                          แก้ไข
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  setNewItem({ name: "", points: 0 });
                  setIsAdding(true);
                }}
              >
                + เพิ่มรางวัลใหม่
              </Button>
            </div>
          </Card>
        )}

        {/* Add/Edit Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Card className="w-full max-w-md mx-4">
              <h3 className="text-xl font-bold mb-4">
                {activeTab === "behaviors" && "เพิ่มงานใหม่"}
                {activeTab === "badBehaviors" && "เพิ่มพฤติกรรมที่ไม่ดี"}
                {activeTab === "rewards" && "เพิ่มรางวัลใหม่"}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {activeTab === "rewards"
                      ? "ชื่อรางวัล"
                      : "ชื่องาน/พฤติกรรม"}
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    value={newItem.name}
                    onChange={(e) =>
                      setNewItem({ ...newItem, name: e.target.value })
                    }
                    placeholder={
                      activeTab === "behaviors"
                        ? "📚 อ่านหนังสือ"
                        : activeTab === "badBehaviors"
                        ? "😤 พูดหยาบ"
                        : "🎮 เล่นเกม 30 นาที"
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {activeTab === "rewards" ? "คะแนนที่ใช้แลก" : "คะแนน"}
                  </label>
                  <input
                    type="number"
                    className="w-full p-2 border rounded-lg"
                    value={newItem.points}
                    onChange={(e) =>
                      setNewItem({
                        ...newItem,
                        points: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                {activeTab !== "rewards" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">สี</label>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(RAINBOW_COLORS).map(([key, color]) => (
                        <button
                          key={key}
                          className={`w-full h-8 rounded-lg ${
                            newItem.color === color
                              ? "ring-2 ring-blue-500"
                              : ""
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewItem({ ...newItem, color })}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setIsAdding(false)}
                  >
                    ยกเลิก
                  </Button>
                  <Button className="flex-1" onClick={handleSave}>
                    บันทึก
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminPage;
