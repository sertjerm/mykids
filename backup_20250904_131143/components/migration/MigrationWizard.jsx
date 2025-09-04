// src/components/migration/MigrationWizard.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Database, HardDrive, ArrowRight, Loader } from 'lucide-react';
import useMyKidsStore from '../../stores/useMyKidsStore';
import apiService from '../../services/apiService';

const MigrationWizard = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [localData, setLocalData] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [error, setError] = useState(null);

  const { migrateFromLocalStorage } = useMyKidsStore();

  useEffect(() => {
    checkDataSources();
  }, []);

  const checkDataSources = async () => {
    try {
      const localStorageData = {
        children: JSON.parse(localStorage.getItem('mykids-children') || '[]'),
        activities: JSON.parse(localStorage.getItem('mykids-activities') || '[]'),
        rewards: JSON.parse(localStorage.getItem('mykids-rewards') || '[]'),
      };

      setLocalData(localStorageData);

      const health = await apiService.healthCheck();
      setApiStatus(health);

    } catch (error) {
      setError('ไม่สามารถเชื่อมต่อ API ได้');
      setApiStatus(null);
    }
  };

  const handleMigration = async () => {
    setMigrating(true);
    setError(null);

    try {
      const success = await migrateFromLocalStorage();
      if (success) {
        setStep(2);
      } else {
        setError('การย้ายข้อมูลไม่สำเร็จ');
      }
    } catch (error) {
      setError('เกิดข้อผิดพลาดในการย้ายข้อมูล: ' + error.message);
    } finally {
      setMigrating(false);
    }
  };

  const getTotalRecords = (data) => {
    if (!data) return 0;
    return (data.children?.length || 0) + 
           (data.activities?.length || 0) + 
           (data.rewards?.length || 0);
  };

  const hasLocalData = localData && getTotalRecords(localData) > 0;

  if (step === 1) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">ย้ายข้อมูลไป Database</h2>
        
        <div className="space-y-4">
          <div className="flex items-center p-4 border rounded-lg">
            <HardDrive className="w-8 h-8 text-blue-500 mr-4" />
            <div className="flex-1">
              <h3 className="font-semibold">ข้อมูลใน LocalStorage</h3>
              {localData ? (
                <div className="text-sm text-gray-600 mt-1">
                  <p>เด็ก: {localData.children?.length || 0} คน</p>
                  <p>กิจกรรม: {localData.activities?.length || 0} รายการ</p>
                  <p>รางวัล: {localData.rewards?.length || 0} รายการ</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">กำลังตรวจสอบ...</p>
              )}
            </div>
            {hasLocalData ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            )}
          </div>

          <div className="flex items-center p-4 border rounded-lg">
            <Database className="w-8 h-8 text-purple-500 mr-4" />
            <div className="flex-1">
              <h3 className="font-semibold">การเชื่อมต่อ Database API</h3>
              {apiStatus ? (
                <p className="text-sm text-green-600 mt-1">เชื่อมต่อสำเร็จ</p>
              ) : error ? (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              ) : (
                <p className="text-sm text-gray-500">กำลังตรวจสอบ...</p>
              )}
            </div>
            {apiStatus ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-500" />
            )}
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            ข้าม
          </button>
          
          {hasLocalData && apiStatus ? (
            <button
              onClick={handleMigration}
              disabled={migrating}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center"
            >
              {migrating ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  กำลังย้าย...
                </>
              ) : (
                <>
                  เริ่มย้ายข้อมูล
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={checkDataSources}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              ตรวจสอบอีกครั้ง
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Complete
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">ย้ายข้อมูลสำเร็จ!</h2>
      
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <p className="text-lg text-gray-600 mb-2">ข้อมูลทั้งหมดได้ถูกย้ายไป Database เรียบร้อยแล้ว</p>
        <p className="text-sm text-gray-500">ตอนนี้แอปจะใช้ Database แทน LocalStorage</p>
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={onComplete}
          className="px-8 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          เริ่มใช้งาน
        </button>
      </div>
    </div>
  );
};

export default MigrationWizard;
