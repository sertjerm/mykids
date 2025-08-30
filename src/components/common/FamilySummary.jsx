import { Trophy, Star, TrendingUp, Award, RotateCcw } from 'lucide-react';
import { useChildrenStore } from '../../stores/childrenStore';
import Card from '../ui/Card';
import Button from '../ui/Button';
import ProgressBar from '../ui/ProgressBar';

const FamilySummary = () => {
  const { children, childrenData, resetChildDay } = useChildrenStore();

  // คำนวณสถิติ
  const familyStats = children.map(child => {
    const data = childrenData[child.id];
    const completedTasks = data.behaviors.filter(b => b.completed).length;
    const totalTasks = data.behaviors.length;
    const totalBadBehaviors = data.badBehaviors.reduce((sum, b) => sum + b.count, 0);
    const progress = (completedTasks / totalTasks) * 100;
    
    return {
      ...child,
      points: data.totalPoints,
      completedTasks,
      totalTasks,
      progress,
      totalBadBehaviors,
      data
    };
  });

  // เรียงลำดับตามคะแนน
  const ranking = [...familyStats].sort((a, b) => b.points - a.points);
  const totalFamilyPoints = familyStats.reduce((sum, child) => sum + child.points, 0);
  const averageProgress = familyStats.reduce((sum, child) => sum + child.progress, 0) / familyStats.length;

  // หา Top Performer
  const topPerformer = ranking[0];
  const bestBehavior = getAllBehaviors().reduce((best, current) => 
    current.completedCount > (best?.completedCount || 0) ? current : best
  , null);

  function getAllBehaviors() {
    const behaviorMap = new Map();
    
    children.forEach(child => {
      const data = childrenData[child.id];
      data.behaviors.forEach(behavior => {
        const key = behavior.name;
        if (!behaviorMap.has(key)) {
          behaviorMap.set(key, {
            name: behavior.name,
            completedCount: 0,
            totalCount: 0
          });
        }
        const item = behaviorMap.get(key);
        item.totalCount++;
        if (behavior.completed) {
          item.completedCount++;
        }
      });
    });
    
    return Array.from(behaviorMap.values());
  }

  const resetAllChildren = () => {
    if (confirm('🔄 ต้องการเริ่มวันใหม่สำหรับทุกคนใช่ไหม?')) {
      children.forEach(child => {
        resetChildDay(child.id);
      });
    }
  };

  const getRankEmoji = (index) => {
    const emojis = ['🥇', '🥈', '🥉'];
    return emojis[index] || '🏅';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="text-center rainbow-bg">
        <div className="text-4xl mb-2">👨‍👩‍👧‍👦</div>
        <h1 className="text-2xl font-bold text-gray-700 mb-2">สรุปครอบครัว</h1>
        <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Star className="text-yellow-500 fill-current" size={16} />
            <span className="font-bold">{totalFamilyPoints}</span>
            <span>คะแนนรวม</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="text-green-500" size={16} />
            <span className="font-bold">{Math.round(averageProgress)}%</span>
            <span>ความคืบหน้า</span>
          </div>
        </div>
      </Card>

      {/* Top Performer */}
      <Card style={{ backgroundColor: topPerformer.bgColor }} className="text-center">
        <div className="text-3xl mb-2">🌟</div>
        <h3 className="font-bold text-lg text-gray-700 mb-1">ดาวเด่นวันนี้</h3>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">{topPerformer.emoji}</span>
          <span className="font-bold text-xl text-gray-700">{topPerformer.name}</span>
        </div>
        <div className="text-sm text-gray-600">
          {topPerformer.points} คะแนน • {topPerformer.completedTasks}/{topPerformer.totalTasks} งาน
        </div>
      </Card>

      {/* Leaderboard */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="text-yellow-500" size={20} />
          <h3 className="font-bold text-lg text-gray-700">อันดับคะแนน</h3>
        </div>
        
        <div className="space-y-3">
          {ranking.map((child, index) => (
            <div 
              key={child.id} 
              className="flex items-center justify-between p-3 rounded-2xl"
              style={{ backgroundColor: `${child.bgColor}50` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getRankEmoji(index)}</span>
                <span className="text-lg">{child.emoji}</span>
                <div>
                  <div className="font-medium text-gray-700">{child.name}</div>
                  <div className="text-xs text-gray-500">
                    {child.completedTasks}/{child.totalTasks} งาน • 
                    {child.totalBadBehaviors > 0 && ` ${child.totalBadBehaviors} พฤติกรรมไม่ดี`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Star className="text-yellow-500 fill-current" size={16} />
                  <span className="font-bold text-lg text-gray-700">{child.points}</span>
                </div>
                <div className="text-xs text-gray-500">{Math.round(child.progress)}%</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Individual Progress */}
      <Card>
        <h3 className="font-bold text-lg text-gray-700 mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-500" size={20} />
          ความคืบหน้าแต่ละคน
        </h3>
        
        <div className="space-y-4">
          {familyStats.map(child => (
            <div key={child.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{child.emoji}</span>
                <span className="font-medium text-gray-700">{child.name}</span>
                <span className="text-sm text-gray-500">
                  ({child.completedTasks}/{child.totalTasks})
                </span>
              </div>
              <ProgressBar
                progress={child.progress}
                color={child.color?.includes('pink') ? 'pink' : 
                       child.color?.includes('blue') ? 'blue' : 
                       child.color?.includes('green') ? 'green' : 'rainbow'}
                height="h-2"
                showLabel={false}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Best Behavior */}
      {bestBehavior && (
        <Card className="bg-gradient-to-r from-green-100 to-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <Award className="text-green-500" size={20} />
            <h3 className="font-bold text-lg text-gray-700">งานยอดนิยม</h3>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🏆</div>
            <div className="font-bold text-gray-700">{bestBehavior.name}</div>
            <div className="text-sm text-gray-600">
              ทำได้ {bestBehavior.completedCount}/{bestBehavior.totalCount} คน
            </div>
          </div>
        </Card>
      )}

      {/* Family Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="text-center bg-blue-100">
          <div className="text-2xl mb-1">📋</div>
          <div className="text-sm text-gray-600">งานทั้งหมด</div>
          <div className="font-bold text-lg text-gray-700">
            {familyStats.reduce((sum, child) => sum + child.completedTasks, 0)}/
            {familyStats.reduce((sum, child) => sum + child.totalTasks, 0)}
          </div>
        </Card>

        <Card className="text-center bg-red-100">
          <div className="text-2xl mb-1">⚠️</div>
          <div className="text-sm text-gray-600">พฤติกรรมไม่ดี</div>
          <div className="font-bold text-lg text-gray-700">
            {familyStats.reduce((sum, child) => sum + child.totalBadBehaviors, 0)} ครั้ง
          </div>
        </Card>
      </div>

      {/* Family Challenges */}
      <Card className="bg-gradient-to-r from-purple-100 to-pink-100">
        <h3 className="font-bold text-lg text-gray-700 mb-2 flex items-center gap-2">
          🎯 เป้าหมายครอบครัว
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>คะแนนรวมครอบครัว</span>
            <span className="font-bold">{totalFamilyPoints}/150 🌟</span>
          </div>
          <ProgressBar 
            progress={(totalFamilyPoints / 150) * 100}
            height="h-2"
            showLabel={false}
          />
          {totalFamilyPoints >= 150 && (
            <div className="text-center text-green-600 font-bold">
              🎉 ครอบครัวสุดเจ๋ง! ได้รางวัลพิเศษ!
            </div>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          variant="secondary"
          onClick={resetAllChildren}
          className="w-full"
        >
          <RotateCcw size={18} />
          เริ่มวันใหม่ทุกคน
        </Button>
        
        <div className="text-center text-xs text-gray-500">
          💡 เคล็ดลับ: ครอบครัวที่ได้คะแนนรวม 150+ จะได้รางวัลพิเศษ!
        </div>
      </div>
    </div>
  );
};

export default FamilySummary;