import React, { useState, useEffect } from "react";
import {
  Settings,
  UserPlus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Gift,
} from "lucide-react";

const MyKidsMainUI = () => {
  // State for API data
  const [children, setChildren] = useState([]);
  const [goodBehaviors, setGoodBehaviors] = useState([]);
  const [badBehaviors, setBadBehaviors] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [completedTasks, setCompletedTasks] = useState(new Set());
  const [childActivities, setChildActivities] = useState([]);
  const [pendingActivities, setPendingActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChildData, setSelectedChildData] = useState(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [activeTab, setActiveTab] = useState("good"); // Default to "good" tab

  // API Helper function - ใช้ proxy ที่ตั้งค่าไว้ใน vite.config.js
  const apiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`/api/${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        ...options,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      // Normalize PascalCase to camelCase
      if (Array.isArray(data)) {
        return data.map((item) => normalizeKeys(item));
      }
      return normalizeKeys(data);
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  };

  // Convert PascalCase to camelCase
  const normalizeKeys = (obj) => {
    if (!obj || typeof obj !== "object") return obj;
    const normalized = {};
    Object.keys(obj).forEach((key) => {
      const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
      normalized[camelKey] = obj[key];
    });
    return normalized;
  };

  // Load initial data
  const loadData = async () => {
    setLoading(true);
    try {
      const [childrenData, tasksData, badData] = await Promise.all([
        apiCall("?children"),
        apiCall("?tasks").catch(() => []),
        apiCall("?bad-behaviors").catch(() => []),
      ]);
      setChildren(childrenData || []);
      setGoodBehaviors(tasksData || []);
      setBadBehaviors(badData || []);
      // ถ้ามีข้อมูลเด็ก
      if (childrenData && childrenData.length > 0) {
        const childId = selectedChild || childrenData[0].id;
        // ไม่ต้อง setSelectedChild ถ้าเลือกอยู่แล้ว
        if (!selectedChild) setSelectedChild(childId);
        // โหลด activities ของเด็กที่เลือก
        const acts = await apiCall(`?activities&child_id=${childId}`);
        setChildActivities(acts || []);
        // สร้าง completedTasks เฉพาะกิจกรรมที่เกิดขึ้นวันนี้
        const today = new Date().toISOString().slice(0, 10);
        // ใช้ activityId จาก activities เทียบกับ goodBehaviors.id
        const doneSet = new Set(
          (acts || [])
            .filter(
              (a) => a.activityDate && a.activityDate.slice(0, 10) === today
            )
            .map((a) => a.activityId)
        );
        setCompletedTasks(doneSet);
      }
      setError(null);
    } catch (error) {
      console.error("Failed to load data:", error);
      setError("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันสำหรับส่ง pending activities แบบ batch
  const [saveRetryCount, setSaveRetryCount] = useState(0);
  const MAX_RETRY = 3;
  const savePendingActivities = async () => {
    if (pendingActivities.length === 0) return;
    if (saveRetryCount >= MAX_RETRY) {
      setError(
        `บันทึกกิจกรรมไม่สำเร็จหลังลอง ${MAX_RETRY} ครั้ง กรุณาตรวจสอบการเชื่อมต่อหรือรีเฟรชหน้าใหม่`
      );
      setSaveRetryCount(0);
      return;
    }
    try {
      const promises = pendingActivities.map((activity) =>
        apiCall("?activities", {
          method: "POST",
          body: JSON.stringify({
            childId: activity.childId,
            activityType: activity.activityType,
            activityId: activity.activityId,
            note: activity.note,
          }),
        })
      );
      await Promise.all(promises);
      setPendingActivities([]);
      setError(null);
      setSaveRetryCount(0);
      console.log(`บันทึก ${pendingActivities.length} กิจกรรมสำเร็จ`);
    } catch (error) {
      console.error("Failed to save activities:", error);
      setError(
        `ไม่สามารถบันทึก ${
          pendingActivities.length
        } กิจกรรมได้ - จะลองใหม่อัตโนมัติ (${saveRetryCount + 1}/${MAX_RETRY})`
      );
      setSaveRetryCount((retry) => retry + 1);
      if (saveRetryCount + 1 < MAX_RETRY) {
        setTimeout(() => {
          savePendingActivities();
        }, 5000);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedChild && children.length > 0) {
      const child = children.find((c) => c.id === selectedChild);
      setSelectedChildData(child);
      // โหลด activities ของเด็กคนนั้น
      const fetchActivities = async () => {
        try {
          const acts = await apiCall(`?activities&child_id=${selectedChild}`);
          setChildActivities(acts || []);
          // สร้าง completedTasks เฉพาะกิจกรรมที่เกิดขึ้นวันนี้
          const today = new Date().toISOString().slice(0, 10);
          const doneSet = new Set(
            (acts || [])
              .filter(
                (a) => a.activityDate && a.activityDate.slice(0, 10) === today
              )
              .map((a) => a.activityId)
          );
          setCompletedTasks(doneSet);
        } catch (err) {
          setChildActivities([]);
          setCompletedTasks(new Set());
        }
      };
      fetchActivities();
    }
  }, [selectedChild, children]);

  useEffect(() => {
    if (pendingActivities.length > 0) {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
      const timer = setTimeout(() => {
        savePendingActivities();
      }, 2000);
      setAutoSaveTimer(timer);
    }
  }, [pendingActivities.length]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  const selectChild = (childId) => {
    setSelectedChild(childId);
  };

  const handleTaskComplete = async (behaviorId, points) => {
    if (!selectedChild) return;
    const today = new Date().toISOString().slice(0, 10);
    // หา activity log id ทั้งหมดของวันนี้ที่ activityId ตรงกัน
    const acts = childActivities.filter(
      (a) =>
        a.activityId === behaviorId &&
        a.activityDate &&
        a.activityDate.slice(0, 10) === today
    );
    if (acts.length > 0) {
      // ถ้ากดซ้ำ ให้ลบทุก record ของ activityId ในวันนี้
      for (const act of acts) {
        if (act.id) {
          try {
            await apiCall(`?activities&id=${act.id}`, { method: "DELETE" });
          } catch (err) {}
        }
      }
      setCompletedTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(behaviorId);
        return newSet;
      });
      return;
    }
    // ถ้ายังไม่มี activityId นี้ในวันนี้ ให้เพิ่ม
    setCompletedTasks((prev) => new Set([...prev, behaviorId]));
    if (selectedChildData) {
      const updatedChild = {
        ...selectedChildData,
        totalPoints: (selectedChildData.totalPoints || 0) + points,
      };
      setSelectedChildData(updatedChild);
    }
    let activityType = "good";
    let note = "ทำงานเสร็จแล้ว";
    let actualPoints = points;
    const bad = badBehaviors.find((b) => b.id === behaviorId);
    if (bad) {
      activityType = "bad";
      note = "พฤติกรรมไม่ดี";
      actualPoints = bad.penalty;
    }
    const activity = {
      id: `temp_${Date.now()}_${behaviorId}`,
      childId: selectedChild,
      activityType,
      activityId: behaviorId,
      points: actualPoints,
      note,
      timestamp: Date.now(),
    };
    setPendingActivities((prev) => [...prev, activity]);
  };

  const resetDay = () => {
    setCompletedTasks(new Set());
    setPendingActivities([]);
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    loadData();
  };

  if (loading && children.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error && children.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadData();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  const totalPoints = selectedChildData?.totalPoints || 0;
  const completedTasksCount = completedTasks.size;
  const totalTasksCount = goodBehaviors.length || 7;
  const completionPercentage =
    totalTasksCount > 0
      ? Math.round((completedTasksCount / totalTasksCount) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-2xl mx-auto flex justify-between items-center p-6 pb-2">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🌈</span>
          <h1 className="text-2xl font-bold text-gray-800">MyKids</h1>
        </div>
        <button className="p-2 hover:bg-white/20 rounded-lg transition-colors">
          <Settings className="w-6 h-6 text-gray-600" />
        </button>
      </div>
      {/* Children Selection Cards */}
      <div className="w-full max-w-2xl mx-auto px-6">
        <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
          {children.map((child) => (
            <div
              key={child.id}
              onClick={() => selectChild(child.id)}
              className={`flex-shrink-0 px-6 py-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                selectedChild === child.id
                  ? "bg-pink-200 shadow-lg scale-105 border-2 border-pink-400"
                  : "bg-white/60 hover:bg-white/80"
              }`}
              style={{ minWidth: 120 }}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{child.emoji || "😊"}</div>
                <div className="font-semibold text-gray-800 text-base">
                  {child.name}
                </div>
                <div className="text-xs text-gray-600">
                  {child.age || 0} ขวบ
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {child.totalPoints || 0} คะแนน
                </div>
              </div>
            </div>
          ))}
          <div className="flex-shrink-0 px-6 py-4 bg-white/40 hover:bg-white/60 rounded-2xl cursor-pointer transition-all flex items-center justify-center min-w-[120px]">
            <UserPlus className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>
      {/* Selected Child Info */}
        {selectedChildData && (
          <div className="w-full max-w-2xl mx-auto bg-pink-100 rounded-3xl p-8 mb-6 shadow-lg text-center flex flex-col items-center">
            <div className="text-6xl mb-2">{selectedChildData.emoji || "😊"}</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">{selectedChildData.name}</h2>
            <div className="text-3xl font-bold text-pink-600 mb-1">{totalPoints} คะแนน</div>
            <div className="text-gray-500 text-base">งานสำเร็จ: {completedTasksCount}/{totalTasksCount} ({completionPercentage}%)</div>
          </div>
        )}
        {/* Tab Navigation */}
        <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl p-6 mb-6 shadow-lg">
          <div className="flex justify-center gap-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab("good")}
              className={`px-6 py-2 flex items-center space-x-2 rounded-t-2xl font-semibold text-lg transition-all ${
                activeTab === "good"
                  ? "bg-pink-200 text-pink-700 border-b-4 border-pink-400"
                  : "text-gray-500"
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>งานดี</span>
            </button>
            <button
              onClick={() => setActiveTab("bad")}
              className={`px-6 py-2 flex items-center space-x-2 rounded-t-2xl font-semibold text-lg transition-all ${
                activeTab === "bad"
                  ? "bg-red-200 text-red-700 border-b-4 border-red-400"
                  : "text-gray-500"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              <span>พฤติกรรมไม่ดี</span>
            </button>
            <button
              onClick={() => setActiveTab("rewards")}
              className={`px-6 py-2 flex items-center space-x-2 rounded-t-2xl font-semibold text-lg transition-all ${
                activeTab === "rewards"
                  ? "bg-orange-200 text-orange-700 border-b-4 border-orange-400"
                  : "text-gray-500"
              }`}
            >
              <Gift className="w-5 h-5" />
              <span>รางวัล</span>
            </button>
          </div>
          {/* Tab Content */}
          {activeTab === "good" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {goodBehaviors.length > 0 ? (
                goodBehaviors.map((behavior) => {
                  const isCompleted = completedTasks.has(behavior.id);
                  return (
                    <button
                      key={behavior.id}
                      onClick={() => handleTaskComplete(behavior.id, behavior.points)}
                      disabled={loading}
                      className={`flex flex-col items-start p-5 rounded-2xl transition-all duration-300 shadow-md border-2 ${
                        isCompleted
                          ? "bg-green-100 border-green-400"
                          : "bg-white border-transparent hover:bg-pink-50 hover:border-pink-300"
                      } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      style={{ minHeight: 90 }}
                    >
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-3">
                          {behavior.category === "สุขภาพ"
                            ? "🏥"
                            : behavior.category === "การเรียน"
                            ? "📚"
                            : behavior.category === "ความรับผิดชอบ"
                            ? "🤝"
                            : "⭐"}
                        </span>
                        <span className="font-semibold text-gray-800 text-lg">
                          {behavior.name}
                        </span>
                      </div>
                      <div className="flex items-center mt-2">
                        <span className="text-lg font-bold text-green-600 mr-2">
                          +{behavior.points}
                        </span>
                        {isCompleted && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm">✓</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500 col-span-2">
                  <div className="text-4xl mb-4">📝</div>
                  <p>ยังไม่มีรายการงานดี</p>
                  <p className="text-sm mt-2">กรุณาเพิ่มงานดีผ่านระบบจัดการ</p>
                </div>
              )}
            </div>
          )}
          {activeTab === "bad" && (
            <div className="space-y-3">
              <div className="font-bold text-red-700 mb-2">พฤติกรรมไม่ดี</div>
              {badBehaviors.length > 0 ? (
                badBehaviors.map((behavior) => {
                  const isCompleted = completedTasks.has(behavior.id);
                  return (
                    <button
                      key={behavior.id}
                      onClick={() =>
                        handleTaskComplete(behavior.id, behavior.penalty)
                      }
                      disabled={isCompleted || loading}
                      className={`w-full p-4 rounded-2xl transition-all duration-300 ${
                        isCompleted
                          ? "bg-red-200 border-2 border-red-400"
                          : "hover:scale-105 shadow-md"
                      } ${
                        loading
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                      style={{
                        backgroundColor: isCompleted
                          ? "#fecaca"
                          : behavior.color || "#f3f4f6",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {behavior.name.charAt(0)}
                          </span>
                          <span className="font-semibold text-gray-800">
                            {behavior.name.replace(/^[^\w\u0E00-\u0E7F]+/, "")}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold text-red-600">
                            {behavior.penalty}
                          </span>
                          {isCompleted && (
                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm">✓</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-4">😔</div>
                  <p>ยังไม่มีรายการพฤติกรรมไม่ดี</p>
                  <p className="text-sm mt-2">
                    กรุณาเพิ่มพฤติกรรมไม่ดีผ่านระบบจัดการ
                  </p>
                </div>
              )}
            </div>
          )}
          {activeTab === "rewards" && (
            <div className="space-y-3">
              <div className="font-bold text-orange-700 mb-2">รางวัล</div>
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🎁</div>
                <p>ฟีเจอร์รางวัลยังไม่พร้อมใช้งาน</p>
                <p className="text-sm mt-2">กรุณาตั้งค่ารางวัลผ่านระบบจัดการ</p>
              </div>
            </div>
          )}
        </div>
        {/* Pending Activities Status */}
        {pendingActivities.length > 0 && (
          <div className="fixed top-20 right-4 bg-blue-100 border border-blue-300 rounded-lg p-3 shadow-lg z-40">
            <div className="flex items-center text-blue-800 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span>กำลังบันทึก {pendingActivities.length} กิจกรรม...</span>
              <button
                onClick={() => savePendingActivities()}
                className="ml-2 px-2 py-1 bg-blue-200 rounded text-xs hover:bg-blue-300"
              >
                บันทึกเลย
              </button>
            </div>
          </div>
        )}
        {/* Error message overlay */}
        {error && (
          <div className="fixed top-4 left-4 right-4 bg-red-100 border border-red-300 rounded-lg p-4 shadow-lg z-50">
            <div className="flex items-start">
              <div className="text-red-500 text-xl mr-2">⚠️</div>
              <div className="flex-1">
                <p className="text-red-800 font-medium">เกิดข้อผิดพลาด</p>
                <p className="text-red-700 text-sm">{error}</p>
                {pendingActivities.length > 0 && (
                  <button
                    onClick={() => savePendingActivities()}
                    className="mt-2 px-3 py-1 bg-red-200 text-red-800 rounded text-sm hover:bg-red-300"
                  >
                    ลองบันทึกอีกครั้ง
                  </button>
                )}
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 ml-2"
              >
                ×
              </button>
            </div>
          </div>
        )}
        {/* Reset Button & Progress Bar */}
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
          <button
            onClick={resetDay}
            disabled={loading}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-colors mb-6 flex items-center justify-center space-x-2 ${
              loading
                ? "bg-gray-400 cursor-not-allowed text-gray-600"
                : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
          >
            <RotateCcw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            <span>เริ่มวันใหม่</span>
          </button>
          {/* Progress Bar */}
          {selectedChildData && (
            <div className="w-full bg-white rounded-2xl p-6 shadow-lg mb-8">
              <div className="text-center mb-4">
                <h3 className="font-semibold text-gray-800">
                  ความคืบหน้าของ {selectedChildData.name}
                </h3>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div
                  className="h-4 rounded-full bg-gradient-to-r from-pink-400 to-green-400 transition-all duration-500"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <div className="text-center text-sm text-gray-600">
                {completionPercentage}% เสร็จแล้ว
              </div>
            </div>
          )}
        </div>
      </div>
  
  );
};

export default MyKidsMainUI;
