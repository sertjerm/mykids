import { useState } from 'react';
import { useChildrenStore } from '../stores/childrenStore';
import AppLayout from '../components/layout/AppLayout';
import ChildSelector from '../components/common/ChildSelector';
import BehaviorTracker from '../components/common/BehaviorTracker';

const HomePage = () => {
  const { children, selectedChild, setSelectedChild } = useChildrenStore();
  const [showSummary, setShowSummary] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6">
        <ChildSelector 
          children={children}
          selectedChild={selectedChild}
          showSummary={showSummary}
          onChildSelect={(childId) => {
            setSelectedChild(childId);
            setShowSummary(false);
          }}
          onShowSummary={() => setShowSummary(true)}
        />
        
        {showSummary ? (
          <div className="text-center text-gray-500">
            <h2 className="text-2xl font-bold mb-4">📊 สรุปครอบครัว</h2>
            <p>กำลังพัฒนาส่วนนี้...</p>
          </div>
        ) : (
          <BehaviorTracker />
        )}
      </div>
    </AppLayout>
  );
};

export default HomePage;
