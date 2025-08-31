import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RotateCcw, Users, Star, Settings, Plus, Minus } from 'lucide-react';

// Default configuration - สามารถแก้ไขได้ตามต้องการ
const DEFAULT_CONFIG = {
  children: [
    {
      id: 'child1',
      name: 'น้องทีฟา',
      age: 11,
      gender: 'female', // female, male
      emoji: '👧',
      bgColor: '#fecaca', // red-200
    },
    {
      id: 'child2', 
      name: 'น้องทีฟอง',
      age: 10,
      gender: 'male',
      emoji: '👦',
      bgColor: '#bfdbfe', // blue-200
    }
  ],
  behaviors: [
    { id: 'b1', name: '🦷 แปรงฟัน', points: 3, color: '#bbf7d0' }, // green-200
    { id: 'b2', name: '🧸 เก็บของเล่น', points: 2, color: '#bfdbfe' }, // blue-200  
    { id: 'b3', name: '📚 อ่านหนังสือ', points: 5, color: '#c7d2fe' }, // indigo-200
    { id: 'b4', name: '🥗 ทานผัก', points: 4, color: '#a7f3d0' }, // emerald-200
    { id: 'b5', name: '📝 ทำการบ้าน', points: 8, color: '#fed7aa' }, // orange-200
    { id: 'b6', name: '🚿 อาบน้ำ', points: 3, color: '#e0e7ff' }, // indigo-100
    { id: 'b7', name: '🧺 ช่วยซักผ้า', points: 6, color: '#fef3c7' }, // yellow-200
  ],
  badBehaviors: [
    { id: 'bb1', name: '😤 พูดหยาบ', penalty: -3, color: '#fecaca' }, // red-200
    { id: 'bb2', name: '🤥 โกหก', penalty: -5, color: '#f3e8ff' }, // purple-200
    { id: 'bb3', name: '😭 งอแง', penalty: -2, color: '#fed7aa' }, // orange-200
    { id: 'bb4', name: '📱 เล่นมือถือนานเกิน', penalty: -4, color: '#fde68a' }, // yellow-200
    { id: 'bb5', name: '🤜 ทำร้ายพี่น้อง', penalty: -8, color: '#f87171' }, // red-400
    { id: 'bb6', name: '🚫 ไม่ฟังคำสั่ง', penalty: -6, color: '#a78bfa' }, // violet-400
  ],
  rewards: [
    { id: 'r1', name: '🍦 ไอศกรีม', cost: 10, icon: '🍦' },
    { id: 'r2', name: '🎮 เล่นเกม 30 นาที', cost: 15, icon: '🎮' },
    { id: 'r3', name: '🎬 ดูหนัง', cost: 20, icon: '🎬' },
    { id: 'r4', name: '🍕 พิซซ่า', cost: 25, icon: '🍕' },
    { id: 'r5', name: '🧸 ของเล่นใหม่', cost: 50, icon: '🧸' },
    { id: 'r6', name: '🎪 ไปงานเทศกาล', cost: 80, icon: '🎪' },
    { id: 'r7', name: '💰 เงินพิเศษ 100 บาท', cost: 100, icon: '💰' },
    { id: 'r8', name: '🎂 เค้กวันเกิด', cost: 60, icon: '🎂' },
    { id: 'r9', name: '🏊 ไปสวนน้ำ', cost: 120, icon: '🏊' },
    { id: 'r10', name: '🛍️ ไปช้อปปิ้ง', cost: 150, icon: '🛍️' },
  ]
};

const HomePage = () => {
  // State สำหรับจัดการข้อมูล
  const [children, setChildren] = useState([]);
  const [behaviors, setBehaviors] = useState([]);
  const [badBehaviors, setBadBehaviors] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [activeTab, setActiveTab] = useState('behaviors');
  const [childrenProgress, setChildrenProgress] = useState({});
  const [childrenUsedPoints, setChildrenUsedPoints] = useState({});
  const [childrenBadBehaviorCounts, setChildrenBadBehaviorCounts] = useState({});

  // โหลดข้อมูลจาก localStorage เมื่อ component เริ่มทำงาน
  useEffect(() => {
    const loadData = () => {
      const savedChildren = JSON.parse(localStorage.getItem('children') || 'null');
      const savedBehaviors = JSON.parse(localStorage.getItem('behaviors') || 'null');
      const savedBadBehaviors = JSON.parse(localStorage.getItem('badBehaviors') || 'null');
      const savedRewards = JSON.parse(localStorage.getItem('rewards') || 'null');
      const savedProgress = JSON.parse(localStorage.getItem('childrenProgress') || '{}');
      const savedBadBehaviorCounts = JSON.parse(localStorage.getItem('childrenBadBehaviorCounts') || '{}');
      const savedUsedPoints = JSON.parse(localStorage.getItem('childrenUsedPoints') || '{}');

      // ใช้ข้อมูลจาก localStorage หรือข้อมูลเริ่มต้นจาก config
      setChildren(savedChildren || DEFAULT_CONFIG.children);
      setBehaviors(savedBehaviors || DEFAULT_CONFIG.behaviors);
      setBadBehaviors(savedBadBehaviors || DEFAULT_CONFIG.badBehaviors);
      setRewards(savedRewards || DEFAULT_CONFIG.rewards);
      setChildrenProgress(savedProgress);
      setChildrenBadBehaviorCounts(savedBadBehaviorCounts);
      setChildrenUsedPoints(savedUsedPoints);

      // บันทึกข้อมูลเริ่มต้นถ้ายังไม่มีใน localStorage
      if (!savedChildren) localStorage.setItem('children', JSON.stringify(DEFAULT_CONFIG.children));
      if (!savedBehaviors) localStorage.setItem('behaviors', JSON.stringify(DEFAULT_CONFIG.behaviors));
      if (!savedBadBehaviors) localStorage.setItem('badBehaviors', JSON.stringify(DEFAULT_CONFIG.badBehaviors));
      if (!savedRewards) localStorage.setItem('rewards', JSON.stringify(DEFAULT_CONFIG.rewards));

      // ตั้งค่าเด็กที่เลือกเป็นคนแรก
      const childrenToUse = savedChildren || DEFAULT_CONFIG.children;
      if (childrenToUse.length > 0 && !selectedChild) {
        setSelectedChild(childrenToUse[0].id);
      }
    };

    loadData();
  }, [selectedChild]);

  // บันทึกข้อมูลความคืบหน้าและคะแนนเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    if (Object.keys(childrenProgress).length > 0) {
      localStorage.setItem('childrenProgress', JSON.stringify(childrenProgress));
    }
  }, [childrenProgress]);

  useEffect(() => {
    if (Object.keys(childrenBadBehaviorCounts).length > 0) {
      localStorage.setItem('childrenBadBehaviorCounts', JSON.stringify(childrenBadBehaviorCounts));
    }
  }, [childrenBadBehaviorCounts]);

  useEffect(() => {
    if (Object.keys(childrenUsedPoints).length > 0) {
      localStorage.setItem('childrenUsedPoints', JSON.stringify(childrenUsedPoints));
    }
  }, [childrenUsedPoints]);

  // ฟังก์ชันคำนวณคะแนนรวม
  const calculateTotalPoints = (childId) => {
    let totalPoints = 0;
    
    // คะแนนจากงานดี
    const progress = childrenProgress[childId] || {};
    Object.entries(progress).forEach(([behaviorId, isCompleted]) => {
      if (isCompleted) {
        const behavior = behaviors.find(b => b.id === behaviorId);
        if (behavior) {
          totalPoints += behavior.points;
        }
      }
    });
    
    // หักคะแนนจากพฤติกรรมไม่ดี
    const badBehaviorCounts = childrenBadBehaviorCounts[childId] || {};
    Object.entries(badBehaviorCounts).forEach(([behaviorId, count]) => {
      const behavior = badBehaviors.find(b => b.id === behaviorId);
      if (behavior && count > 0) {
        totalPoints += behavior.penalty * count; // penalty is negative
      }
    });
    
    // หักคะแนนที่ใช้แลกรางวัลไป
    const usedPoints = childrenUsedPoints[childId] || 0;
    totalPoints -= usedPoints;
    
    return Math.max(0, totalPoints);
  };

  // ฟังก์ชันสำหรับจัดการงานดี
  const toggleGoodBehavior = (childId, behaviorId) => {
    setChildrenProgress(prev => {
      const childProgress = prev[childId] || {};
      const currentStatus = childProgress[behaviorId] || false;
      return {
        ...prev,
        [childId]: {
          ...childProgress,
          [behaviorId]: !currentStatus
        }
      };
    });
  };

  // ฟังก์ชันสำหรับจัดการพฤติกรรมไม่ดี
  const addBadBehavior = (childId, behaviorId) => {
    setChildrenBadBehaviorCounts(prev => {
      const childCounts = prev[childId] || {};
      const currentCount = childCounts[behaviorId] || 0;
      return {
        ...prev,
        [childId]: {
          ...childCounts,
          [behaviorId]: currentCount + 1
        }
      };
    });
  };

  const removeBadBehavior = (childId, behaviorId) => {
    setChildrenBadBehaviorCounts(prev => {
      const childCounts = prev[childId] || {};
      const currentCount = childCounts[behaviorId] || 0;
      if (currentCount <= 1) {
        const { [behaviorId]: _, ...rest } = childCounts;
        return {
          ...prev,
          [childId]: rest
        };
      }
      return {
        ...prev,
        [childId]: {
          ...childCounts,
          [behaviorId]: currentCount - 1
        }
      };
    });
  };

  // ฟังก์ชันสำหรับแลกรางวัล
  const redeemReward = (childId, rewardId) => {
    const reward = rewards.find(r => r.id === rewardId);
    const currentPoints = calculateTotalPoints(childId);
    
    if (!reward || currentPoints < reward.cost) {
      alert('คะแนนไม่พอสำหรับรางวัลนี้!');
      return;
    }

    if (!confirm(`ต้องการใช้ ${reward.cost} คะแนนแลก ${reward.name} ใช่ไหม?`)) {
      return;
    }

    // เพิ่มคะแนนที่ใช้ไป
    setChildrenUsedPoints(prev => ({
      ...prev,
      [childId]: (prev[childId] || 0) + reward.cost
    }));

    alert(`🎉 ยินดีด้วย! ได้รับ ${reward.name} แล้ว!`);
  };

  // ฟังก์ชันรีเซ็ตวัน
  const resetChildDay = (childId) => {
    if (!confirm('ต้องการเริ่มวันใหม่ใช่ไหม? (จะรีเซ็ตความคืบหน้างานและพฤติกรรมทั้งหมด แต่รางวัลที่แลกไปแล้วจะยังคงอยู่)')) {
      return;
    }

    setChildrenProgress(prev => ({
      ...prev,
      [childId]: {}
    }));

    setChildrenBadBehaviorCounts(prev => ({
      ...prev,
      [childId]: {}
    }));
  };

  // รีเซ็ตทุกคน
  const resetAllChildren = () => {
    if (!confirm('ต้องการเริ่มวันใหม่สำหรับทุกคนใช่ไหม? (รีเซ็ตความคืบหน้าและพฤติกรรม แต่คะแนนรางวัลที่ใช้ไปจะยังคงอยู่)')) {
      return;
    }

    setChildrenProgress({});
    setChildrenBadBehaviorCounts({});
  };

  // รีเซ็ตคะแนนรางวัลทั้งหมด (สำหรับเริ่มเดือนใหม่)
  const resetAllRewards = (childId) => {
    if (!confirm('ต้องการรีเซ็ตคะแนนรางวัลใช่ไหม? (จะทำให้คะแนนที่ใช้แลกรางวัลกลับมาเป็น 0)')) {
      return;
    }

    setChildrenUsedPoints(prev => ({
      ...prev,
      [childId]: 0
    }));
  };

  // คำนวณสถิติ
  const getCurrentChild = () => children.find(c => c.id === selectedChild);
  const getCurrentChildProgress = () => childrenProgress[selectedChild] || {};

  const getCompletedTasksCount = (childId) => {
    const progress = childrenProgress[childId] || {};
    return Object.values(progress).filter(Boolean).length;
  };

  const getProgressPercentage = (childId) => {
    if (behaviors.length === 0) return 0;
    const completed = getCompletedTasksCount(childId);
    return Math.round((completed / behaviors.length) * 100);
  };

  const getBadBehaviorCount = (childId, behaviorId) => {
    const counts = childrenBadBehaviorCounts[childId] || {};
    return counts[behaviorId] || 0;
  };

  // ถ้าไม่มีข้อมูล แสดงข้อความแนะนำ
  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 via-blue-100 to-green-100 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-6xl mb-4">🌈</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">ยินดีต้อนรับสู่ MyKids!</h1>
            <p className="text-gray-600 mb-6">
              ยังไม่มีข้อมูลในระบบ กรุณาไปยังหน้าจัดการเพื่อเพิ่มข้อมูลลูกและกิจกรรมต่างๆ
            </p>
            <a
              href="/?admin" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              <Settings size={20} />
              ไปยังหน้าจัดการ
            </a>
          </div>
        </div>
      </div>
    );
  }

  const currentChild = getCurrentChild();
  const currentProgress = getCurrentChildProgress();
  const currentPoints = selectedChild ? calculateTotalPoints(selectedChild) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 via-blue-100 to-green-100">
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">🌈 MyKids</h1>
            <a href="/?admin" className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
              <Settings size={24} />
            </a>
          </div>

          {/* Child Selector */}
          <div className="mb-6">
            <div className="flex gap-2 mb-3">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => {
                    setSelectedChild(child.id);
                    setShowSummary(false);
                  }}
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
                      {child.age ? `${child.age} ขวบ` : ''} {child.gender === 'female' ? '👧' : '👦'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {calculateTotalPoints(child.id)} คะแนน
                    </div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => setShowSummary(true)}
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

          {/* Main Content */}
          {showSummary ? (
            // Family Summary
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Users size={24} />
                  สรุปครอบครัว
                </h2>
                
                {/* Family Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {children.reduce((sum, child) => sum + calculateTotalPoints(child.id), 0)}
                    </div>
                    <div className="text-sm text-gray-600">คะแนนรวม</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(
                        children.reduce((sum, child) => sum + getProgressPercentage(child.id), 0) / children.length
                      )}%
                    </div>
                    <div className="text-sm text-gray-600">ความคืบหน้าเฉลี่ย</div>
                  </div>
                </div>

                {/* Individual Progress */}
                <div className="space-y-3">
                  {children.map(child => {
                    const progress = getProgressPercentage(child.id);
                    const points = calculateTotalPoints(child.id);
                    const completed = getCompletedTasksCount(child.id);
                    
                    return (
                      <div key={child.id} className="p-3 rounded-lg border" style={{ backgroundColor: child.bgColor + '30' }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{child.emoji}</span>
                            <span className="font-medium">{child.name}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-600">{points} คะแนน</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                          <div 
                            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-600">
                          งานเสร็จแล้ว: {completed}/{behaviors.length} งาน ({progress}%)
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={resetAllChildren}
                  className="w-full mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw size={18} />
                  เริ่มวันใหม่ทุกคน
                </button>
              </div>
            </div>
          ) : (
            // Individual Child View
            currentChild && (
              <div className="space-y-6">
                {/* Child Header */}
                <div className="bg-white rounded-2xl shadow-lg p-6" style={{ backgroundColor: currentChild.bgColor + '20' }}>
                  <div className="text-center">
                    <div className="text-4xl mb-2">{currentChild.emoji}</div>
                    <h2 className="text-2xl font-bold text-gray-800">{currentChild.name}</h2>
                    <div className="text-3xl font-bold text-purple-600 mt-2">
                      {currentPoints} คะแนน
                    </div>
                    {(childrenUsedPoints[selectedChild] || 0) > 0 && (
                      <div className="text-sm text-gray-500 mt-1">
                        (ใช้แลกรางวัลไป {childrenUsedPoints[selectedChild]} คะแนน)
                      </div>
                    )}
                    <div className="text-sm text-gray-600 mt-1">
                      งานเสร็จ: {getCompletedTasksCount(selectedChild)}/{behaviors.length} 
                      ({getProgressPercentage(selectedChild)}%)
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-2xl shadow-lg p-4">
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setActiveTab('behaviors')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'behaviors'
                          ? 'bg-green-100 text-green-700 shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      ✅ งานดี
                    </button>
                    <button
                      onClick={() => setActiveTab('badBehaviors')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'badBehaviors'
                          ? 'bg-red-100 text-red-700 shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      ❌ พฤติกรรมไม่ดี
                    </button>
                    <button
                      onClick={() => setActiveTab('rewards')}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'rewards'
                          ? 'bg-purple-100 text-purple-700 shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      🎁 รางวัล
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="space-y-3">
                    {/* Good Behaviors Tab */}
                    {activeTab === 'behaviors' && behaviors.length > 0 && (
                      <>
                        <div className="text-sm text-gray-600 mb-3">
                          กดเพื่อทำเครื่องหมายงานที่เสร็จแล้ว
                        </div>
                        
                        {/* Group by category */}
                        {Object.entries(
                          behaviors.reduce((groups, behavior) => {
                            const category = behavior.category || 'other';
                            if (!groups[category]) groups[category] = [];
                            groups[category].push(behavior);
                            return groups;
                          }, {})
                        ).map(([category, categoryBehaviors]) => (
                          <div key={category} className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 px-2">
                              {category === 'personal_care' ? '🚿 ดูแลตัวเอง' :
                               category === 'household' ? '🧹 งานบ้าน' :
                               category === 'education' ? '📚 การศึกษา' :
                               category === 'health' ? '🏃 สุขภาพ' :
                               category === 'social' ? '👥 สังคม' :
                               category === 'spiritual' ? '🙏 จิตใจ' :
                               '📋 อื่นๆ'}
                            </h4>
                            <div className="space-y-2">
                              {categoryBehaviors.map(behavior => {
                                const isCompleted = currentProgress[behavior.id] || false;
                                return (
                                  <button
                                    key={behavior.id}
                                    onClick={() => toggleGoodBehavior(selectedChild, behavior.id)}
                                    className={`w-full p-3 rounded-xl transition-all transform hover:scale-[1.02] ${
                                      isCompleted 
                                        ? 'bg-green-100 border-2 border-green-300 shadow-md' 
                                        : 'border-2 border-gray-200 hover:border-green-300'
                                    }`}
                                    style={{ 
                                      backgroundColor: isCompleted ? behavior.color + '80' : behavior.color + '40' 
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-gray-800 text-sm">{behavior.name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-green-600">+{behavior.points}</span>
                                        {isCompleted && <CheckCircle size={18} className="text-green-500" />}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Bad Behaviors Tab */}
                    {activeTab === 'badBehaviors' && badBehaviors.length > 0 && (
                      <>
                        <div className="text-sm text-gray-600 mb-3">
                          กด + เพื่อบันทึกพฤติกรรมไม่ดี กด - เพื่อลด
                        </div>
                        
                        {/* Group by severity */}
                        {Object.entries(
                          badBehaviors.reduce((groups, behavior) => {
                            const severity = behavior.severity || 'medium';
                            if (!groups[severity]) groups[severity] = [];
                            groups[severity].push(behavior);
                            return groups;
                          }, {})
                        ).map(([severity, severityBehaviors]) => (
                          <div key={severity} className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 px-2">
                              {severity === 'low' ? '🟢 ระดับเบา' :
                               severity === 'medium' ? '🟡 ระดับปานกลาง' :
                               severity === 'high' ? '🟠 ระดับสูง' :
                               '🔴 ระดับวิกฤต'}
                            </h4>
                            <div className="space-y-2">
                              {severityBehaviors.map(behavior => {
                                const count = getBadBehaviorCount(selectedChild, behavior.id);
                                return (
                                  <div
                                    key={behavior.id}
                                    className="p-3 rounded-xl border-2 border-gray-200"
                                    style={{ backgroundColor: behavior.color + '40' }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-gray-800 text-sm">{behavior.name}</span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold text-red-600">
                                          {behavior.penalty} คะแนน
                                        </span>
                                        {count > 0 && (
                                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                            {count} ครั้ง
                                          </span>
                                        )}
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => removeBadBehavior(selectedChild, behavior.id)}
                                            disabled={count === 0}
                                            className={`p-1 rounded ${
                                              count > 0 
                                                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                          >
                                            <Minus size={14} />
                                          </button>
                                          <button
                                            onClick={() => addBadBehavior(selectedChild, behavior.id)}
                                            className="p-1 rounded bg-red-200 hover:bg-red-300 text-red-700"
                                          >
                                            <Plus size={14} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Rewards Tab */}
                    {activeTab === 'rewards' && rewards.length > 0 && (
                      <>
                        <div className="text-sm text-gray-600 mb-3">
                          ใช้คะแนนที่ได้แลกรางวัลต่างๆ
                        </div>
                        
                        {/* Group by category */}
                        {Object.entries(
                          rewards.reduce((groups, reward) => {
                            const category = reward.category || 'other';
                            if (!groups[category]) groups[category] = [];
                            groups[category].push(reward);
                            return groups;
                          }, {})
                        ).map(([category, categoryRewards]) => (
                          <div key={category} className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 px-2">
                              {category === 'food' ? '🍽️ อาหาร' :
                               category === 'entertainment' ? '🎮 ความบันเทิง' :
                               category === 'toys' ? '🧸 ของเล่น' :
                               category === 'experience' ? '🎪 ประสบการณ์' :
                               category === 'money' ? '💰 เงิน' :
                               category === 'education' ? '📚 การศึกษา' :
                               '🎁 อื่นๆ'}
                            </h4>
                            <div className="space-y-2">
                              {categoryRewards.map(reward => {
                                const canAfford = currentPoints >= reward.cost;
                                return (
                                  <button
                                    key={reward.id}
                                    onClick={() => redeemReward(selectedChild, reward.id)}
                                    disabled={!canAfford}
                                    className={`w-full p-3 rounded-xl transition-all transform hover:scale-[1.02] ${
                                      canAfford
                                        ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-200 hover:border-purple-300'
                                        : 'bg-gray-100 border-2 border-gray-200 opacity-50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <span className="text-2xl">{reward.icon}</span>
                                        <div className="text-left">
                                          <div className="font-medium text-gray-700 text-sm">{reward.name}</div>
                                          {reward.description && (
                                            <div className="text-xs text-gray-600">{reward.description}</div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Star className="text-yellow-400 fill-current" size={14} />
                                        <span className="font-bold text-gray-600 text-sm">{reward.cost}</span>
                                        {canAfford && (
                                          <span className="text-green-600 text-xs ml-1">✓</span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {/* Empty State */}
                    {((activeTab === 'behaviors' && behaviors.length === 0) ||
                      (activeTab === 'badBehaviors' && badBehaviors.length === 0) ||
                      (activeTab === 'rewards' && rewards.length === 0)) && (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-2">🤷‍♀️</div>
                        <p>ยังไม่มีรายการในหมวดนี้</p>
                        <p className="text-sm mt-1">ไปยังหน้าจัดการเพื่อเพิ่มรายการใหม่</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => resetChildDay(selectedChild)}
                    className="w-full px-4 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 font-medium"
                  >
                    <RotateCcw size={18} />
                    เริ่มวันใหม่
                  </button>
                  
                  {(childrenUsedPoints[selectedChild] || 0) > 0 && (
                    <button
                      onClick={() => resetAllRewards(selectedChild)}
                      className="w-full px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Star size={16} />
                      รีเซ็ตคะแนนรางวัล ({childrenUsedPoints[selectedChild]} คะแนน)
                    </button>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    ความคืบหน้าของ {currentChild.name}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div 
                      className="bg-gradient-to-r from-pink-400 via-purple-400 via-blue-400 to-green-400 h-4 rounded-full transition-all duration-500" 
                      style={{ width: `${getProgressPercentage(selectedChild)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 text-center">
                    {getProgressPercentage(selectedChild)}% เสร็จแล้ว
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;