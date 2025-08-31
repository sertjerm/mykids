import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { persist } from "zustand/middleware";
import { RAINBOW_COLORS } from "../utils/colors";

// Initial behaviors and rewards that will be converted to shared templates
const INITIAL_SHARED_BEHAVIORS = {
  behaviors: [
    {
      id: uuidv4(),
      name: "🦷 แปรงฟัน",
      points: 5,
      color: RAINBOW_COLORS.cyan,
    },
    {
      id: uuidv4(),
      name: "🧸 เก็บของเล่น",
      points: 3,
      color: RAINBOW_COLORS.orange,
    },
    {
      id: uuidv4(),
      name: "📚 อ่านหนังสือ",
      points: 4,
      color: RAINBOW_COLORS.purple,
    },
    {
      id: uuidv4(),
      name: "🥗 ทานผัก",
      points: 6,
      color: RAINBOW_COLORS.green,
    },
  ],
  badBehaviors: [
    {
      id: uuidv4(),
      name: "😤 พูดหยาบ",
      penalty: -3,
      color: RAINBOW_COLORS.red,
    },
    {
      id: uuidv4(),
      name: "🤥 โกหก",
      penalty: -5,
      color: RAINBOW_COLORS.orange,
    },
    {
      id: uuidv4(),
      name: "😭 งอแง",
      penalty: -2,
      color: RAINBOW_COLORS.yellow,
    },
    {
      id: uuidv4(),
      name: "🤜 ทำร้ายพี่น้อง",
      penalty: -8,
      color: RAINBOW_COLORS.indigo,
    },
  ],
  rewards: [
    {
      id: uuidv4(),
      name: "🎮 เล่นเกม 30 นาที",
      cost: 15,
    },
    {
      id: uuidv4(),
      name: "📱 ดูยูทูป 30 นาที",
      cost: 10,
    },
    {
      id: uuidv4(),
      name: "🧸 ของเล่นใหม่",
      cost: 50,
    },
  ],
};

// Initial children with their completion records
const INITIAL_CHILDREN = [
  {
    id: uuidv4(),
    name: "น้องแนน",
    emoji: "🌈",
    color: "rainbow-pink",
    bgColor: RAINBOW_COLORS.pink,
    age: 8,
    behaviors: [], // Record of completed behaviors
    rewards: [], // Record of claimed rewards
    points: 0,
  },
];

const useChildrenStore = create(
  persist(
    (set, get) => ({
      children: INITIAL_CHILDREN,
      sharedBehaviors: INITIAL_SHARED_BEHAVIORS,
      selectedChild: null, // Track the currently selected child

      // Add a child
      addChild: (child) =>
        set((state) => ({
          children: [
            ...state.children,
            {
              id: uuidv4(),
              ...child,
              points: 0,
              behaviors: [], // Individual record of completed behaviors
              rewards: [], // Individual record of claimed rewards
            },
          ],
        })),

      // Remove a child
      removeChild: (childId) =>
        set((state) => ({
          children: state.children.filter((child) => child.id !== childId),
        })),

      // Update child details
      updateChild: (childId, updates) =>
        set((state) => ({
          children: state.children.map((child) =>
            child.id === childId ? { ...child, ...updates } : child
          ),
        })),

      // Calculate total points for a child
      calculateTotalPoints: (childId) => {
        const state = get();
        const child = state.children.find((c) => c.id === childId);
        if (!child) return 0;

        // Sum up points from completed behaviors
        const behaviorPoints = child.behaviors.reduce((total, record) => {
          const behavior = state.sharedBehaviors.behaviors.find(
            (b) => b.id === record.behaviorId
          );
          const badBehavior = state.sharedBehaviors.badBehaviors.find(
            (b) => b.id === record.behaviorId
          );

          if (behavior) {
            return total + (behavior.points || 0);
          }
          if (badBehavior) {
            return total + (badBehavior.penalty || 0); // Penalty is already negative
          }
          return total;
        }, 0);

        // Subtract points from claimed rewards
        const rewardPoints = child.rewards.reduce((total, record) => {
          const reward = state.sharedBehaviors.rewards.find(
            (r) => r.id === record.rewardId
          );
          return total - (reward?.cost || 0);
        }, 0);

        return behaviorPoints + rewardPoints;
      },

      // Shared behavior templates management
      addSharedBehavior: (behavior) =>
        set((state) => ({
          sharedBehaviors: {
            ...state.sharedBehaviors,
            behaviors: [
              ...state.sharedBehaviors.behaviors,
              { ...behavior, id: uuidv4() },
            ],
          },
        })),

      updateSharedBehavior: (behaviorId, updates) =>
        set((state) => ({
          sharedBehaviors: {
            ...state.sharedBehaviors,
            behaviors: state.sharedBehaviors.behaviors.map((behavior) =>
              behavior.id === behaviorId
                ? { ...behavior, ...updates }
                : behavior
            ),
          },
        })),

      removeSharedBehavior: (behaviorId) =>
        set((state) => ({
          sharedBehaviors: {
            ...state.sharedBehaviors,
            behaviors: state.sharedBehaviors.behaviors.filter(
              (behavior) => behavior.id !== behaviorId
            ),
          },
        })),

      // Bad behavior templates management
      addSharedBadBehavior: (behavior) =>
        set((state) => ({
          sharedBehaviors: {
            ...state.sharedBehaviors,
            badBehaviors: [
              ...state.sharedBehaviors.badBehaviors,
              { ...behavior, id: uuidv4() },
            ],
          },
        })),

      updateSharedBadBehavior: (behaviorId, updates) =>
        set((state) => ({
          sharedBehaviors: {
            ...state.sharedBehaviors,
            badBehaviors: state.sharedBehaviors.badBehaviors.map((behavior) =>
              behavior.id === behaviorId
                ? { ...behavior, ...updates }
                : behavior
            ),
          },
        })),

      removeSharedBadBehavior: (behaviorId) =>
        set((state) => ({
          sharedBehaviors: {
            ...state.sharedBehaviors,
            badBehaviors: state.sharedBehaviors.badBehaviors.filter(
              (behavior) => behavior.id !== behaviorId
            ),
          },
        })),

      // Reward templates management
      addSharedReward: (reward) =>
        set((state) => ({
          sharedBehaviors: {
            ...state.sharedBehaviors,
            rewards: [
              ...state.sharedBehaviors.rewards,
              { ...reward, id: uuidv4() },
            ],
          },
        })),

      updateSharedReward: (rewardId, updates) =>
        set((state) => ({
          sharedBehaviors: {
            ...state.sharedBehaviors,
            rewards: state.sharedBehaviors.rewards.map((reward) =>
              reward.id === rewardId ? { ...reward, ...updates } : reward
            ),
          },
        })),

      removeSharedReward: (rewardId) =>
        set((state) => ({
          sharedBehaviors: {
            ...state.sharedBehaviors,
            rewards: state.sharedBehaviors.rewards.filter(
              (reward) => reward.id !== rewardId
            ),
          },
        })),

      // Record a completed behavior for a child
      recordBehavior: (
        childId,
        behaviorId,
        timestamp = new Date().toISOString()
      ) =>
        set((state) => ({
          children: state.children.map((child) =>
            child.id === childId
              ? {
                  ...child,
                  behaviors: [...child.behaviors, { behaviorId, timestamp }],
                }
              : child
          ),
        })),

      // Claim a reward for a child
      claimReward: (childId, rewardId, timestamp = new Date().toISOString()) =>
        set((state) => {
          const child = state.children.find((c) => c.id === childId);
          const reward = state.sharedBehaviors.rewards.find(
            (r) => r.id === rewardId
          );

          if (!child || !reward) return state;

          const currentPoints = get().calculateTotalPoints(childId);
          if (currentPoints < reward.cost) return state;

          return {
            children: state.children.map((c) =>
              c.id === childId
                ? {
                    ...c,
                    rewards: [...c.rewards, { rewardId, timestamp }],
                  }
                : c
            ),
          };
        }),

      // Remove a behavior record from a child
      removeBehaviorRecord: (childId, timestamp) =>
        set((state) => ({
          children: state.children.map((child) =>
            child.id === childId
              ? {
                  ...child,
                  behaviors: child.behaviors.filter(
                    (record) => record.timestamp !== timestamp
                  ),
                }
              : child
          ),
        })),

      // Remove a reward claim from a child
      removeRewardClaim: (childId, timestamp) =>
        set((state) => ({
          children: state.children.map((child) =>
            child.id === childId
              ? {
                  ...child,
                  rewards: child.rewards.filter(
                    (record) => record.timestamp !== timestamp
                  ),
                }
              : child
          ),
        })),

      // Set the selected child
      setSelectedChild: (childId) =>
        set(() => ({
          selectedChild: childId,
        })),
    }),
    {
      name: "children-store",
    }
  )
);

export { useChildrenStore };
