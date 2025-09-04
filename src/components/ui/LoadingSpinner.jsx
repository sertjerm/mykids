import React from 'react';

const LoadingSpinner = ({ message = "กำลังโหลดข้อมูล..." }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-purple-600 font-medium">{message}</p>
        <p className="text-sm text-gray-500 mt-2">MyKidsDB2</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
