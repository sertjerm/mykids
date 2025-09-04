import React from 'react';

const ProgressBar = ({ completed, total, percent, label }) => {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-bold text-green-700">
          {total > 0 ? `${completed}/${total} (${percent}%)` : '0%'}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="bg-gradient-to-r from-pink-400 via-purple-400 to-green-400 h-4 rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
