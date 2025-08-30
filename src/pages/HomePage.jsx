import { useState } from "react";
import { useChildrenStore } from "../stores/childrenStore";
import AppLayout from "../components/layout/AppLayout";
import ChildSelector from "../components/common/ChildSelector";
import BehaviorTracker from "../components/common/BehaviorTracker";
import  FamilySummary  from "../components/common/FamilySummary";

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

        {showSummary ? <FamilySummary /> : <BehaviorTracker />}
      </div>
    </AppLayout>
  );
};

export default HomePage;
