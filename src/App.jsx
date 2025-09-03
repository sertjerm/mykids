// src/App.jsx - Updated App Component พร้อม MyKids UI
import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import useMyKidsStore from './stores/useMyKidsStore';
import MigrationWizard from './components/migration/MigrationWizard';
import MyKidsMainUI from './components/MyKidsMainUI';

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
      <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
    </div>
  </div>
);

function App() {
  const {
    children,
    loading,
    error,
    initializeApp,
    clearError,
  } = useMyKidsStore();

  const [showMigration, setShowMigration] = useState(false);
  const [appInitialized, setAppInitialized] = useState(false);

  // ตรวจสอบว่าควรแสดง Migration หรือไม่
  useEffect(() => {
    const checkMigrationNeeded = () => {
      // ตรวจสอบว่ามีข้อมูลใน localStorage แต่ไม่มีใน API
      const hasLocalData = localStorage.getItem('mykids-children') && 
                          JSON.parse(localStorage.getItem('mykids-children')).length > 0;
      
      const hasApiData = children && children.length > 0;
      
      // ถ้ามีข้อมูลใน localStorage แต่ไม่มีใน API และยังไม่ได้ initialize
      if (hasLocalData && !hasApiData && !appInitialized) {
        setShowMigration(true);
      } else if (!appInitialized) {
        initializeApp().finally(() => setAppInitialized(true));
      }
    };

    checkMigrationNeeded();
  }, [children, initializeApp, appInitialized]);

  // แสดง Migration Wizard
  if (showMigration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 py-8">
        <MigrationWizard
          onComplete={() => {
            setShowMigration(false);
            setAppInitialized(false);
            // Force reload เพื่อแสดงข้อมูลใหม่
            window.location.reload();
          }}
          onCancel={() => {
            setShowMigration(false);
            initializeApp().finally(() => setAppInitialized(true));
          }}
        />
      </div>
    );
  }

  // แสดง Loading ขณะโหลดข้อมูล
  if (loading && !appInitialized) {
    return <LoadingSpinner />;
  }

  // Error boundary - แสดงปุ่มลองใหม่
  if (error && !appInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">ไม่สามารถเชื่อมต่อได้</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                clearError();
                setAppInitialized(false);
                initializeApp().finally(() => setAppInitialized(true));
              }}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              ลองเชื่อมต่อใหม่
            </button>
            <button
              onClick={() => {
                // ใช้งานแบบ offline mode (ถ้ามีข้อมูลใน localStorage)
                clearError();
                setAppInitialized(true);
              }}
              className="w-full px-4 py-2 text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
            >
              ใช้งานแบบออฟไลน์
            </button>
          </div>
        </div>
      </div>
    );
  }

  // แสดง MyKids UI หลัก
  return <MyKidsMainUI />;
}

export default App;