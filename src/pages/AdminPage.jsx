import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Home,
  Users,
  CheckCircle,
  XCircle,
  Gift,
} from "lucide-react";

// Default data สำหรับการเริ่มต้น
const DEFAULT_CHILDREN = [
  {
    id: "child1",
    name: "น้องแก้ว",
    age: 8,
    emoji: "😊",
    bgColor: "#fecaca", // red-200
  },
];

const DEFAULT_BEHAVIORS = [
  { id: "b1", name: "🦷 แปรงฟัน", points: 3, color: "#bbf7d0" }, // green-200
  { id: "b2", name: "🧸 เก็บของเล่น", points: 2, color: "#bfdbfe" }, // blue-200
  { id: "b3", name: "📚 อ่านหนังสือ", points: 5, color: "#c7d2fe" }, // indigo-200
  { id: "b4", name: "🥗 ทานผัก", points: 4, color: "#a7f3d0" }, // emerald-200
  { id: "b5", name: "📝 ทำการบ้าน", points: 8, color: "#fed7aa" }, // orange-200
];

const DEFAULT_BAD_BEHAVIORS = [
  { id: "bb1", name: "😤 พูดหยาบ", penalty: -3, color: "#fecaca" }, // red-200
  { id: "bb2", name: "🤥 โกหก", penalty: -5, color: "#f3e8ff" }, // purple-200
  { id: "bb3", name: "😭 งอแง", penalty: -2, color: "#fed7aa" }, // orange-200
  { id: "bb4", name: "📱 เล่นมือถือนานเกิน", penalty: -4, color: "#fde68a" }, // yellow-200
];

const DEFAULT_REWARDS = [
  { id: "r1", name: "🍦 ไอศกรีม", cost: 10, icon: "🍦" },
  { id: "r2", name: "🎮 เล่นเกม 30 นาที", cost: 15, icon: "🎮" },
  { id: "r3", name: "🎬 ดูหนัง", cost: 20, icon: "🎬" },
  { id: "r4", name: "🍕 พิซซ่า", cost: 25, icon: "🍕" },
];

const EMOJI_OPTIONS = [
  "😊",
  "😄",
  "🥰",
  "😍",
  "🤗",
  "😎",
  "🤓",
  "🥳",
  "🌟",
  "⭐",
  "✨",
  "🌈",
  "🦄",
  "🐻",
  "🐱",
  "🐶",
  "👶",
  "👧",
  "🧒",
  "👦",
  "💖",
  "💕",
  "🎈",
  "🎀",
];
const COLOR_OPTIONS = [
  { name: "ชมพู", value: "#fecaca" },
  { name: "น้ำเงิน", value: "#bfdbfe" },
  { name: "เขียว", value: "#bbf7d0" },
  { name: "ม่วง", value: "#e9d5ff" },
  { name: "ส้ม", value: "#fed7aa" },
  { name: "เหลือง", value: "#fef3c7" },
  { name: "ฟ้า", value: "#bae6fd" },
  { name: "มิ้นท์", value: "#a7f3d0" },
];

const AdminPage = () => {
  // State สำหรับจัดการข้อมูล
  const [children, setChildren] = useState([]);
  const [behaviors, setBehaviors] = useState([]);
  const [badBehaviors, setBadBehaviors] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [activeTab, setActiveTab] = useState("children");
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({});
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Load data from localStorage when component mounts
  useEffect(() => {
    const savedChildren = localStorage.getItem("children");
    const savedBehaviors = localStorage.getItem("behaviors");
    const savedBadBehaviors = localStorage.getItem("badBehaviors");
    const savedRewards = localStorage.getItem("rewards");

    if (savedChildren) {
      setChildren(JSON.parse(savedChildren));
    } else {
      setChildren(DEFAULT_CHILDREN);
      localStorage.setItem("children", JSON.stringify(DEFAULT_CHILDREN));
    }

    if (savedBehaviors) {
      setBehaviors(JSON.parse(savedBehaviors));
    } else {
      setBehaviors(DEFAULT_BEHAVIORS);
      localStorage.setItem("behaviors", JSON.stringify(DEFAULT_BEHAVIORS));
    }

    if (savedBadBehaviors) {
      setBadBehaviors(JSON.parse(savedBadBehaviors));
    } else {
      setBadBehaviors(DEFAULT_BAD_BEHAVIORS);
      localStorage.setItem(
        "badBehaviors",
        JSON.stringify(DEFAULT_BAD_BEHAVIORS)
      );
    }

    if (savedRewards) {
      setRewards(JSON.parse(savedRewards));
    } else {
      setRewards(DEFAULT_REWARDS);
      localStorage.setItem("rewards", JSON.stringify(DEFAULT_REWARDS));
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (children.length > 0) {
      localStorage.setItem("children", JSON.stringify(children));
    }
  }, [children]);

  useEffect(() => {
    if (behaviors.length > 0) {
      localStorage.setItem("behaviors", JSON.stringify(behaviors));
    }
  }, [behaviors]);

  useEffect(() => {
    if (badBehaviors.length > 0) {
      localStorage.setItem("badBehaviors", JSON.stringify(badBehaviors));
    }
  }, [badBehaviors]);

  useEffect(() => {
    if (rewards.length > 0) {
      localStorage.setItem("rewards", JSON.stringify(rewards));
    }
  }, [rewards]);

  // Helper functions
  const generateId = () => Date.now().toString();

  const startEdit = (item, type) => {
    setEditingItem({ ...item, type });
    setIsAddingNew(false);
  };

  const startAddNew = (type) => {
    const defaultData = {
      children: { name: "", age: "", emoji: "😊", bgColor: "#fecaca" },
      behaviors: { name: "", points: 3, color: "#bbf7d0" },
      badBehaviors: { name: "", penalty: -2, color: "#fecaca" },
      rewards: { name: "", cost: 10, icon: "🎁" },
    };
    setNewItem({ ...defaultData[type], type });
    setIsAddingNew(true);
    setEditingItem(null);
  };

  const saveItem = () => {
    const item = editingItem || newItem;
    const id = item.id || generateId();
    const itemData = { ...item, id };

    switch (item.type) {
      case "children":
        if (editingItem) {
          setChildren((prev) => prev.map((c) => (c.id === id ? itemData : c)));
        } else {
          setChildren((prev) => [...prev, itemData]);
        }
        break;
      case "behaviors":
        if (editingItem) {
          setBehaviors((prev) => prev.map((b) => (b.id === id ? itemData : b)));
        } else {
          setBehaviors((prev) => [...prev, itemData]);
        }
        break;
      case "badBehaviors":
        if (editingItem) {
          setBadBehaviors((prev) =>
            prev.map((b) => (b.id === id ? itemData : b))
          );
        } else {
          setBadBehaviors((prev) => [...prev, itemData]);
        }
        break;
      case "rewards":
        if (editingItem) {
          setRewards((prev) => prev.map((r) => (r.id === id ? itemData : r)));
        } else {
          setRewards((prev) => [...prev, itemData]);
        }
        break;
    }

    setEditingItem(null);
    setNewItem({});
    setIsAddingNew(false);
  };

  const deleteItem = (id, type) => {
    if (!confirm("ต้องการลบรายการนี้ใช่ไหม?")) return;

    switch (type) {
      case "children":
        if (children.length <= 1) {
          alert("ต้องมีลูกอย่างน้อย 1 คนในระบบ");
          return;
        }
        setChildren((prev) => prev.filter((c) => c.id !== id));
        break;
      case "behaviors":
        setBehaviors((prev) => prev.filter((b) => b.id !== id));
        break;
      case "badBehaviors":
        setBadBehaviors((prev) => prev.filter((b) => b.id !== id));
        break;
      case "rewards":
        setRewards((prev) => prev.filter((r) => r.id !== id));
        break;
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setNewItem({});
    setIsAddingNew(false);
  };

  const updateEditingField = (field, value) => {
    if (editingItem) {
      setEditingItem((prev) => ({ ...prev, [field]: value }));
    } else {
      setNewItem((prev) => ({ ...prev, [field]: value }));
    }
  };

  const currentItem = editingItem || newItem;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 via-blue-100 to-green-100">
      <div className="container mx-auto p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              🔧 ระบบจัดการ Admin
            </h1>
            <a
              href="/mykids" // แก้ไข URL ให้ใช้ basepath
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <Home size={18} />
              กลับหน้าหลัก
            </a>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {[
              { id: "children", label: "👥 จัดการลูก", icon: Users },
              { id: "behaviors", label: "✅ งานดี", icon: CheckCircle },
              { id: "badBehaviors", label: "❌ พฤติกรรมไม่ดี", icon: XCircle },
              { id: "rewards", label: "🎁 รางวัล", icon: Gift },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-white shadow-md text-gray-800 transform scale-105"
                      : "bg-white/50 text-gray-600 hover:bg-white/70"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {/* Children Management */}
            {activeTab === "children" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">👥 จัดการข้อมูลลูก</h2>
                  <button
                    onClick={() => startAddNew("children")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    disabled={isAddingNew || editingItem}
                  >
                    <Plus size={18} />
                    เพิ่มลูกใหม่
                  </button>
                </div>

                <div className="space-y-3">
                  {children.map((child) => (
                    <div
                      key={child.id}
                      className="p-4 rounded-lg border-2 border-gray-200"
                      style={{ backgroundColor: child.bgColor + "40" }}
                    >
                      {editingItem && editingItem.id === child.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={currentItem.name || ""}
                            onChange={(e) =>
                              updateEditingField("name", e.target.value)
                            }
                            placeholder="ชื่อ"
                            className="w-full p-2 border rounded-lg"
                          />
                          <input
                            type="number"
                            value={currentItem.age || ""}
                            onChange={(e) =>
                              updateEditingField(
                                "age",
                                parseInt(e.target.value) || ""
                              )
                            }
                            placeholder="อายุ"
                            className="w-full p-2 border rounded-lg"
                          />
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              เลือกอิโมจิ:
                            </label>
                            <div className="grid grid-cols-8 gap-2">
                              {EMOJI_OPTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() =>
                                    updateEditingField("emoji", emoji)
                                  }
                                  className={`p-2 text-xl rounded border-2 hover:bg-gray-100 ${
                                    currentItem.emoji === emoji
                                      ? "border-blue-500 bg-blue-100"
                                      : "border-gray-200"
                                  }`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              เลือกสี:
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              {COLOR_OPTIONS.map((color) => (
                                <button
                                  key={color.value}
                                  onClick={() =>
                                    updateEditingField("bgColor", color.value)
                                  }
                                  className={`p-3 rounded border-2 hover:scale-105 transition-transform ${
                                    currentItem.bgColor === color.value
                                      ? "border-blue-500 ring-2 ring-blue-200"
                                      : "border-gray-200"
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                >
                                  <span className="text-xs font-medium">
                                    {color.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={saveItem}
                              className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                              disabled={!currentItem.name || !currentItem.emoji}
                            >
                              <Save size={16} />
                              บันทึก
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              <X size={16} />
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{child.emoji}</span>
                            <div>
                              <h3 className="font-bold text-lg">
                                {child.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {child.age ? `${child.age} ขวบ` : "ไม่ระบุอายุ"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(child, "children")}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                              disabled={isAddingNew || editingItem}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteItem(child.id, "children")}
                              className="p-2 text-red-600 hover:bg-red-100 rounded"
                              disabled={
                                isAddingNew ||
                                editingItem ||
                                children.length === 1
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add New Child Form */}
                  {isAddingNew && newItem.type === "children" && (
                    <div className="p-4 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50">
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={currentItem.name || ""}
                          onChange={(e) =>
                            updateEditingField("name", e.target.value)
                          }
                          placeholder="ชื่อลูก"
                          className="w-full p-2 border rounded-lg"
                        />
                        <input
                          type="number"
                          value={currentItem.age || ""}
                          onChange={(e) =>
                            updateEditingField(
                              "age",
                              parseInt(e.target.value) || ""
                            )
                          }
                          placeholder="อายุ (ไม่บังคับ)"
                          className="w-full p-2 border rounded-lg"
                        />
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            เลือกอิโมจิ:
                          </label>
                          <div className="grid grid-cols-8 gap-2">
                            {EMOJI_OPTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() =>
                                  updateEditingField("emoji", emoji)
                                }
                                className={`p-2 text-xl rounded border-2 hover:bg-gray-100 ${
                                  currentItem.emoji === emoji
                                    ? "border-blue-500 bg-blue-100"
                                    : "border-gray-200"
                                }`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            เลือกสี:
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {COLOR_OPTIONS.map((color) => (
                              <button
                                key={color.value}
                                onClick={() =>
                                  updateEditingField("bgColor", color.value)
                                }
                                className={`p-3 rounded border-2 hover:scale-105 transition-transform ${
                                  currentItem.bgColor === color.value
                                    ? "border-blue-500 ring-2 ring-blue-200"
                                    : "border-gray-200"
                                }`}
                                style={{ backgroundColor: color.value }}
                              >
                                <span className="text-xs font-medium">
                                  {color.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveItem}
                            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            disabled={!currentItem.name || !currentItem.emoji}
                          >
                            <Save size={16} />
                            เพิ่มลูก
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            <X size={16} />
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    💡 <strong>คำแนะนำ:</strong> ต้องมีลูกอย่างน้อย 1 คนในระบบ •
                    การลบลูกจะลบข้อมูลทั้งหมด • สีและอิโมจิจะแสดงในหน้าหลัก
                  </p>
                </div>
              </div>
            )}

            {/* Good Behaviors Management */}
            {activeTab === "behaviors" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    ✅ จัดการงานและกิจกรรมดี
                  </h2>
                  <button
                    onClick={() => startAddNew("behaviors")}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    disabled={isAddingNew || editingItem}
                  >
                    <Plus size={18} />
                    เพิ่มงานใหม่
                  </button>
                </div>

                <div className="space-y-3">
                  {behaviors.map((behavior) => (
                    <div
                      key={behavior.id}
                      className="p-4 rounded-lg border-2 border-gray-200"
                      style={{ backgroundColor: behavior.color + "60" }}
                    >
                      {editingItem && editingItem.id === behavior.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={currentItem.name || ""}
                            onChange={(e) =>
                              updateEditingField("name", e.target.value)
                            }
                            placeholder="ชื่องาน เช่น 🦷 แปรงฟัน"
                            className="w-full p-2 border rounded-lg"
                          />
                          <input
                            type="number"
                            value={currentItem.points || ""}
                            onChange={(e) =>
                              updateEditingField(
                                "points",
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="คะแนน (1-20)"
                            min="1"
                            max="20"
                            className="w-full p-2 border rounded-lg"
                          />
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              เลือกสี:
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              {COLOR_OPTIONS.map((color) => (
                                <button
                                  key={color.value}
                                  onClick={() =>
                                    updateEditingField("color", color.value)
                                  }
                                  className={`p-3 rounded border-2 hover:scale-105 transition-transform ${
                                    currentItem.color === color.value
                                      ? "border-blue-500 ring-2 ring-blue-200"
                                      : "border-gray-200"
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                >
                                  <span className="text-xs font-medium">
                                    {color.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={saveItem}
                              className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                              disabled={
                                !currentItem.name || !currentItem.points
                              }
                            >
                              <Save size={16} />
                              บันทึก
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              <X size={16} />
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-lg">
                              {behavior.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              +{behavior.points} คะแนน
                            </span>
                            <button
                              onClick={() => startEdit(behavior, "behaviors")}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                              disabled={isAddingNew || editingItem}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() =>
                                deleteItem(behavior.id, "behaviors")
                              }
                              className="p-2 text-red-600 hover:bg-red-100 rounded"
                              disabled={isAddingNew || editingItem}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add New Behavior Form */}
                  {isAddingNew && newItem.type === "behaviors" && (
                    <div className="p-4 rounded-lg border-2 border-dashed border-green-300 bg-green-50">
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={currentItem.name || ""}
                          onChange={(e) =>
                            updateEditingField("name", e.target.value)
                          }
                          placeholder="ชื่องาน เช่น 🦷 แปรงฟัน"
                          className="w-full p-2 border rounded-lg"
                        />
                        <input
                          type="number"
                          value={currentItem.points || ""}
                          onChange={(e) =>
                            updateEditingField(
                              "points",
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="คะแนน (1-20)"
                          min="1"
                          max="20"
                          className="w-full p-2 border rounded-lg"
                        />
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            เลือกสี:
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {COLOR_OPTIONS.map((color) => (
                              <button
                                key={color.value}
                                onClick={() =>
                                  updateEditingField("color", color.value)
                                }
                                className={`p-3 rounded border-2 hover:scale-105 transition-transform ${
                                  currentItem.color === color.value
                                    ? "border-blue-500 ring-2 ring-blue-200"
                                    : "border-gray-200"
                                }`}
                                style={{ backgroundColor: color.value }}
                              >
                                <span className="text-xs font-medium">
                                  {color.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveItem}
                            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            disabled={!currentItem.name || !currentItem.points}
                          >
                            <Save size={16} />
                            เพิ่มงาน
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            <X size={16} />
                            ยกเลิก
                          </button>
                        </div>

                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-700 font-medium mb-2">
                            💡 แนะนำงานยอดนิยม:
                          </p>
                          <div className="grid grid-cols-1 gap-1 text-xs text-blue-600">
                            <div>
                              • 🦷 แปรงฟัน (3-5 คะแนน) • 🧸 เก็บของเล่น (2-3
                              คะแนน)
                            </div>
                            <div>
                              • 📚 อ่านหนังสือ (4-6 คะแนน) • 📝 ทำการบ้าน (8-10
                              คะแนน)
                            </div>
                            <div>
                              • 🥗 ทานผัก (4-6 คะแนน) • 🏃 ออกกำลังกาย (5-7
                              คะแนน)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    💡 <strong>คำแนะนำ:</strong> งานง่าย 1-3 คะแนน • งานปานกลาง
                    4-6 คะแนน • งานยาก 7+ คะแนน
                  </p>
                </div>
              </div>
            )}

            {/* Bad Behaviors Management */}
            {activeTab === "badBehaviors" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">❌ จัดการพฤติกรรมไม่ดี</h2>
                  <button
                    onClick={() => startAddNew("badBehaviors")}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    disabled={isAddingNew || editingItem}
                  >
                    <Plus size={18} />
                    เพิ่มพฤติกรรม
                  </button>
                </div>

                <div className="space-y-3">
                  {badBehaviors.map((behavior) => (
                    <div
                      key={behavior.id}
                      className="p-4 rounded-lg border-2 border-gray-200"
                      style={{ backgroundColor: behavior.color + "60" }}
                    >
                      {editingItem && editingItem.id === behavior.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={currentItem.name || ""}
                            onChange={(e) =>
                              updateEditingField("name", e.target.value)
                            }
                            placeholder="พฤติกรรมไม่ดี เช่น 😤 พูดหยาบ"
                            className="w-full p-2 border rounded-lg"
                          />
                          <input
                            type="number"
                            value={Math.abs(currentItem.penalty) || ""}
                            onChange={(e) =>
                              updateEditingField(
                                "penalty",
                                -(parseInt(e.target.value) || 0)
                              )
                            }
                            placeholder="คะแนนหัก (1-20)"
                            min="1"
                            max="20"
                            className="w-full p-2 border rounded-lg"
                          />
                          <div>
                            <label className="block text-sm font-medium mb-2">
                              เลือกสี:
                            </label>
                            <div className="grid grid-cols-4 gap-2">
                              {COLOR_OPTIONS.map((color) => (
                                <button
                                  key={color.value}
                                  onClick={() =>
                                    updateEditingField("color", color.value)
                                  }
                                  className={`p-3 rounded border-2 hover:scale-105 transition-transform ${
                                    currentItem.color === color.value
                                      ? "border-blue-500 ring-2 ring-blue-200"
                                      : "border-gray-200"
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                >
                                  <span className="text-xs font-medium">
                                    {color.name}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={saveItem}
                              className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                              disabled={
                                !currentItem.name || !currentItem.penalty
                              }
                            >
                              <Save size={16} />
                              บันทึก
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              <X size={16} />
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-lg">
                              {behavior.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                              {behavior.penalty} คะแนน
                            </span>
                            <button
                              onClick={() =>
                                startEdit(behavior, "badBehaviors")
                              }
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                              disabled={isAddingNew || editingItem}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() =>
                                deleteItem(behavior.id, "badBehaviors")
                              }
                              className="p-2 text-red-600 hover:bg-red-100 rounded"
                              disabled={isAddingNew || editingItem}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add New Bad Behavior Form */}
                  {isAddingNew && newItem.type === "badBehaviors" && (
                    <div className="p-4 rounded-lg border-2 border-dashed border-red-300 bg-red-50">
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={currentItem.name || ""}
                          onChange={(e) =>
                            updateEditingField("name", e.target.value)
                          }
                          placeholder="พฤติกรรมไม่ดี เช่น 😤 พูดหยาบ"
                          className="w-full p-2 border rounded-lg"
                        />
                        <input
                          type="number"
                          value={Math.abs(currentItem.penalty) || ""}
                          onChange={(e) =>
                            updateEditingField(
                              "penalty",
                              -(parseInt(e.target.value) || 0)
                            )
                          }
                          placeholder="คะแนนหัก (1-20)"
                          min="1"
                          max="20"
                          className="w-full p-2 border rounded-lg"
                        />
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            เลือกสี:
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {COLOR_OPTIONS.map((color) => (
                              <button
                                key={color.value}
                                onClick={() =>
                                  updateEditingField("color", color.value)
                                }
                                className={`p-3 rounded border-2 hover:scale-105 transition-transform ${
                                  currentItem.color === color.value
                                    ? "border-blue-500 ring-2 ring-blue-200"
                                    : "border-gray-200"
                                }`}
                                style={{ backgroundColor: color.value }}
                              >
                                <span className="text-xs font-medium">
                                  {color.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveItem}
                            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            disabled={!currentItem.name || !currentItem.penalty}
                          >
                            <Save size={16} />
                            เพิ่มพฤติกรรม
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            <X size={16} />
                            ยกเลิก
                          </button>
                        </div>

                        <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                          <p className="text-sm text-orange-700 font-medium mb-2">
                            ⚠️ พฤติกรรมไม่ดีที่พบบ่อย:
                          </p>
                          <div className="grid grid-cols-1 gap-1 text-xs text-orange-600">
                            <div>
                              • 😤 พูดหยาบ (-2 ถึง -4) • 🤥 โกหก (-4 ถึง -6)
                            </div>
                            <div>
                              • 😭 งอแง ร้องไห้ (-1 ถึง -3) • 🤜 ทำร้ายพี่น้อง
                              (-6 ถึง -10)
                            </div>
                            <div>
                              • 📱 เล่นมือถือนานเกิน (-3 ถึง -5) • 🚫
                              ไม่ฟังคำสั่ง (-4 ถึง -8)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    💡 <strong>คำแนะนำ:</strong> เล็กน้อย 1-3 คะแนน • ปานกลาง
                    4-6 คะแนน • ร้ายแรง 7+ คะแนน
                  </p>
                </div>
              </div>
            )}

            {/* Rewards Management */}
            {activeTab === "rewards" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">🎁 จัดการรางวัล</h2>
                  <button
                    onClick={() => startAddNew("rewards")}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    disabled={isAddingNew || editingItem}
                  >
                    <Plus size={18} />
                    เพิ่มรางวัล
                  </button>
                </div>

                <div className="space-y-3">
                  {rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="p-4 rounded-lg border-2 border-gray-200 bg-gradient-to-r from-purple-100 to-pink-100"
                    >
                      {editingItem && editingItem.id === reward.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={currentItem.name || ""}
                            onChange={(e) =>
                              updateEditingField("name", e.target.value)
                            }
                            placeholder="ชื่อรางวัล เช่น 🍦 ไอศกรีม"
                            className="w-full p-2 border rounded-lg"
                          />
                          <input
                            type="text"
                            value={currentItem.icon || ""}
                            onChange={(e) =>
                              updateEditingField("icon", e.target.value)
                            }
                            placeholder="อิโมจิ เช่น 🍦"
                            className="w-full p-2 border rounded-lg"
                          />
                          <input
                            type="number"
                            value={currentItem.cost || ""}
                            onChange={(e) =>
                              updateEditingField(
                                "cost",
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="คะแนนที่ต้องใช้แลก"
                            min="1"
                            className="w-full p-2 border rounded-lg"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={saveItem}
                              className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                              disabled={!currentItem.name || !currentItem.cost}
                            >
                              <Save size={16} />
                              บันทึก
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              <X size={16} />
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{reward.icon}</span>
                            <span className="font-medium text-lg">
                              {reward.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                              {reward.cost} คะแนน
                            </span>
                            <button
                              onClick={() => startEdit(reward, "rewards")}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                              disabled={isAddingNew || editingItem}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteItem(reward.id, "rewards")}
                              className="p-2 text-red-600 hover:bg-red-100 rounded"
                              disabled={isAddingNew || editingItem}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add New Reward Form */}
                  {isAddingNew && newItem.type === "rewards" && (
                    <div className="p-4 rounded-lg border-2 border-dashed border-purple-300 bg-purple-50">
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={currentItem.name || ""}
                          onChange={(e) =>
                            updateEditingField("name", e.target.value)
                          }
                          placeholder="ชื่อรางวัล เช่น 🍦 ไอศกรีม"
                          className="w-full p-2 border rounded-lg"
                        />
                        <input
                          type="text"
                          value={currentItem.icon || ""}
                          onChange={(e) =>
                            updateEditingField("icon", e.target.value)
                          }
                          placeholder="อิโมจิ เช่น 🍦"
                          className="w-full p-2 border rounded-lg"
                        />
                        <input
                          type="number"
                          value={currentItem.cost || ""}
                          onChange={(e) =>
                            updateEditingField(
                              "cost",
                              parseInt(e.target.value) || 0
                            )
                          }
                          placeholder="คะแนนที่ต้องใช้แลก"
                          min="1"
                          className="w-full p-2 border rounded-lg"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveItem}
                            className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            disabled={!currentItem.name || !currentItem.cost}
                          >
                            <Save size={16} />
                            เพิ่มรางวัล
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            <X size={16} />
                            ยกเลิก
                          </button>
                        </div>

                        <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-700 font-medium mb-2">
                            🎁 ไอเดียรางวัล:
                          </p>
                          <div className="grid grid-cols-1 gap-1 text-xs text-yellow-600">
                            <div>
                              • 🍦 ขนมหวาน (5-10 คะแนน) • 🎮 เล่นเกม 30 นาที
                              (15-20)
                            </div>
                            <div>
                              • 🎬 ดูหนัง (20-25) • 🛍️ ซื้อของเล่น (30-50)
                            </div>
                            <div>• 🏊 ไปสวนน้ำ (100+) • 💰 เงินพิเศษ (50+)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    💡 <strong>คำแนะนำ:</strong> รางวัลเล็ก 5-15 คะแนน •
                    รางวัลกลาง 20-50 คะแนน • รางวัลใหญ่ 60+ คะแนน
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {children.length}
              </div>
              <div className="text-sm text-gray-600">ลูกทั้งหมด</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {behaviors.length}
              </div>
              <div className="text-sm text-gray-600">งานดี</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {badBehaviors.length}
              </div>
              <div className="text-sm text-gray-600">พฤติกรรมไม่ดี</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {rewards.length}
              </div>
              <div className="text-sm text-gray-600">รางวัล</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
