import { create } from 'zustand';
import { storage } from '../utils/storage';
import { RAINBOW_COLORS } from '../utils/colors';

const INITIAL_CHILDREN = [
  {
    id: 1,
    name: 'น้องแนน',
    emoji: '🌈',
    color: 'rainbow-pink',
    bgColor: RAINBOW_COLORS.pink,
    age: 8
  },
  {
    id: 2, 
    name: 'น้องนิค',
    emoji: '🦄',
    color: 'rainbow-blue',
    bgColor: RAINBOW_COLORS.blue,
    age: 10
  },
  {
    id: 3,
    name: 'น้องนิล',
    emoji: '🌟',
    color: 'rainbow-green', 
    bgColor: RAINBOW_COLORS.green,
    age: 5
  }
];

const INITIAL_BEHAVIORS = {
  1: {
    behaviors: [
      { id: 1, name: '🦷 แปรงฟัน', points: 5, completed: false, color: RAINBOW_COLORS.cyan },
      { id: 2, name: '🧸 เก็บของเล่น', points: 3, completed: false, color: RAINBOW_COLORS.orange },
      { id: 3, name: '📚 อ่านหนังสือ', points: 4, completed: false, color: RAINBOW_COLORS.purple },
      { id: 4, name: '🥗 ทานผัก', points: 6, completed: false, color: RAINBOW_COLORS.green }
    ],
    badBehaviors: [
      { id: 1, name: '😤 พูดหยาบ', penalty: -3, count: 0, color: RAINBOW_COLORS.red },
      { id: 2, name: '🤥 โกหก', penalty: -5, count: 0, color: RAINBOW_COLORS.orange },
      { id: 3, name: '😭 งอแง', penalty: -2, count: 0, color: RAINBOW_COLORS.yellow },
      { id: 4, name: '🤜 ทำร้ายพี่น้อง', penalty: -8, count: 0, color: RAINBOW_COLORS.indigo }
    ],
    totalPoints: 0
  },
  2: {
    behaviors: [
      { id: 1, name: '🦷 แปรงฟัน', points: 5, completed: false, color: RAINBOW_COLORS.blue },
      { id: 2, name: '🧸 เก็บของเล่น', points: 3, completed: false, color: RAINBOW_COLORS.mint },
      { id: 3, name: '📚 ทำการบ้าน', points: 8, completed: false, color: RAINBOW_COLORS.purple },
      { id: 4, name: '🏃 ออกกำลังกาย', points: 4, completed: false, color: RAINBOW_COLORS.pink }
    ],
    badBehaviors: [
      { id: 1, name: '📱 เล่นมือถือนานเกิน', penalty: -4, count: 0, color: RAINBOW_COLORS.red },
      { id: 2, name: '📝 ไม่ส่งการบ้าน', penalty: -10, count: 0, color: RAINBOW_COLORS.orange },
      { id: 3, name: '🤥 โกหก', penalty: -6, count: 0, color: RAINBOW_COLORS.yellow },
      { id: 4, name: '😤 ดื้อพ่อแม่', penalty: -5, count: 0, color: RAINBOW_COLORS.cyan }
    ],
    totalPoints: 0
  },
  3: {
    behaviors: [
      { id: 1, name: '🦷 แปรงฟัน', points: 3, completed: false, color: RAINBOW_COLORS.green },
      { id: 2, name: '🧸 เก็บของเล่น', points: 2, completed: false, color: RAINBOW_COLORS.pink },
      { id: 3, name: '🥛 ดื่มนม', points: 2, completed: false, color: RAINBOW_COLORS.blue },
      { id: 4, name: '😴 นอนเองไม่งอแง', points: 5, completed: false, color: RAINBOW_COLORS.indigo }
    ],
    badBehaviors: [
      { id: 1, name: '😭 ร้องไห้งอแง', penalty: -2, count: 0, color: RAINBOW_COLORS.red },
      { id: 2, name: '🍼 ไม่ยอมดื่มนม', penalty: -2, count: 0, color: RAINBOW_COLORS.orange },
      { id: 3, name: '🤜 ตีพี่น้อง', penalty: -5, count: 0, color: RAINBOW_COLORS.yellow },
      { id: 4, name: '🚫 ไม่ฟังคำสั่ง', penalty: -3, count: 0, color: RAINBOW_COLORS.purple }
    ],
    totalPoints: 0
  }
};

const calculateTotalPoints = (childData) => {
  let total = 0;
  childData.behaviors.forEach(b => {
    if (b.completed) total += b.points;
  });
  childData.badBehaviors.forEach(b => {
    total += b.penalty * b.count;
  });
  return Math.max(0, total);
};

export const useChildrenStore = create((set, get) => ({
  children: storage.get('children', INITIAL_CHILDREN),
  childrenData: storage.get('childrenData', INITIAL_BEHAVIORS),
  selectedChild: storage.get('selectedChild', 1),

  setSelectedChild: (childId) => {
    set({ selectedChild: childId });
    storage.set('selectedChild', childId);
  },

  toggleBehavior: (childId, behaviorId) => {
    const state = get();
    const child = state.childrenData[childId];
    
    const updatedBehaviors = child.behaviors.map(behavior => {
      if (behavior.id === behaviorId) {
        return { ...behavior, completed: !behavior.completed };
      }
      return behavior;
    });

    const updatedChild = { ...child, behaviors: updatedBehaviors };
    const newTotalPoints = calculateTotalPoints(updatedChild);

    const updatedChildrenData = {
      ...state.childrenData,
      [childId]: { ...updatedChild, totalPoints: newTotalPoints }
    };

    set({ childrenData: updatedChildrenData });
    storage.set('childrenData', updatedChildrenData);
  },

  addBadBehavior: (childId, behaviorId) => {
    const state = get();
    const child = state.childrenData[childId];
    
    const updatedBadBehaviors = child.badBehaviors.map(behavior => {
      if (behavior.id === behaviorId) {
        return { ...behavior, count: behavior.count + 1 };
      }
      return behavior;
    });

    const updatedChild = { ...child, badBehaviors: updatedBadBehaviors };
    const newTotalPoints = calculateTotalPoints(updatedChild);

    const updatedChildrenData = {
      ...state.childrenData,
      [childId]: { ...updatedChild, totalPoints: newTotalPoints }
    };

    set({ childrenData: updatedChildrenData });
    storage.set('childrenData', updatedChildrenData);
  },

  removeBadBehavior: (childId, behaviorId) => {
    const state = get();
    const child = state.childrenData[childId];
    const badBehavior = child.badBehaviors.find(b => b.id === behaviorId);
    
    if (badBehavior.count === 0) return;
    
    const updatedBadBehaviors = child.badBehaviors.map(behavior => {
      if (behavior.id === behaviorId) {
        return { ...behavior, count: behavior.count - 1 };
      }
      return behavior;
    });

    const updatedChild = { ...child, badBehaviors: updatedBadBehaviors };
    const newTotalPoints = calculateTotalPoints(updatedChild);

    const updatedChildrenData = {
      ...state.childrenData,
      [childId]: { ...updatedChild, totalPoints: newTotalPoints }
    };

    set({ childrenData: updatedChildrenData });
    storage.set('childrenData', updatedChildrenData);
  },

  resetChildDay: (childId) => {
    const state = get();
    const child = state.childrenData[childId];

    const updatedChildrenData = {
      ...state.childrenData,
      [childId]: {
        ...child,
        behaviors: child.behaviors.map(b => ({ ...b, completed: false })),
        badBehaviors: child.badBehaviors.map(b => ({ ...b, count: 0 })),
        totalPoints: 0
      }
    };

    set({ childrenData: updatedChildrenData });
    storage.set('childrenData', updatedChildrenData);
  }
}));
