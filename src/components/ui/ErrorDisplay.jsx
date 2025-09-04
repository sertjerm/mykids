import React from 'react';
import { AlertTriangle } from 'lucide-react';

const ErrorDisplay = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
      <div className="text-center bg-white rounded-lg p-8 shadow-lg max-w-md">
        <div className="text-red-500 mb-4">
          <AlertTriangle className="w-12 h-12 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-red-600 mb-2">เกิดข้อผิดพลาด</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            ลองใหม่
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;
