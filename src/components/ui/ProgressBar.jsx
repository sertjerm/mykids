import clsx from 'clsx';

const ProgressBar = ({ 
  progress = 0, 
  color = 'rainbow', 
  height = 'h-3',
  showLabel = true,
  label,
  className 
}) => {
  const progressPercentage = Math.min(Math.max(progress, 0), 100);

  const colorClasses = {
    rainbow: 'bg-gradient-to-r from-pink-400 via-purple-400 via-blue-400 to-green-400',
    blue: 'bg-blue-400',
    green: 'bg-green-400',
    pink: 'bg-pink-400',
    purple: 'bg-purple-400'
  };

  return (
    <div className={clsx('space-y-2', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">{label}</span>
          <span className="font-bold text-gray-700">{Math.round(progressPercentage)}%</span>
        </div>
      )}
      
      <div className={clsx('bg-gray-200 rounded-full overflow-hidden', height)}>
        <div
          className={clsx('h-full rounded-full transition-all duration-700 ease-out', colorClasses[color] || colorClasses.rainbow)}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
