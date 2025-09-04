# 📅 MyKids Daily Data System

## การใช้งาน Daily Data Manager

### 1. Import และใช้งาน Hook

```javascript
import { useDailyData } from './hooks/useDailyData';

const MyComponent = () => {
  const [selectedChildId, setSelectedChildId] = useState(null);
  
  const {
    children,              // เด็กทั้งหมดพร้อมคะแนนวันนี้
    goodBehaviors,         // รายการงานดี
    todayScore,           // คะแนนวันนี้ของเด็กที่เลือก
    completedGoodBehaviors, // Set ของงานที่ทำแล้ว
    loading,              // สถานะการโหลด
    error,                // ข้อผิดพลาด
    completeGoodBehavior, // ฟังก์ชันบันทึกงาน
    isBehaviorCompleted   // ฟังก์ชันตรวจสอบ
  } = useDailyData(selectedChildId);

  // ใช้งาน
  const handleBehavior = async (behaviorId) => {
    const result = await completeGoodBehavior(behaviorId);
    if (result.success) {
      console.log(result.message);
    }
  };

  return (
    <div>
      {/* UI ของคุณ */}
    </div>
  );
};
```

### 2. ฟีเจอร์หลัก

#### ✅ การโหลดข้อมูลวันนี้เท่านั้น
- ระบบจะแยกเก็บข้อมูลตามวัน (`activities_childId_YYYY-MM-DD`)
- คะแนนรวมเป็นของวันปัจจุบันเท่านั้น
- Auto-reset เมื่อข้ามวันใหม่

#### ✅ Binding สถานะ Selected
- ใช้ `isBehaviorCompleted(behaviorId)` ตรวจสอบ
- แสดง visual feedback (เช็คมาร์ค, สีเขียว)
- ป้องกันการทำซ้ำในวันเดียวกัน

#### ✅ การจัดการข้อมูล
- เก็บประวัติกิจกรรมรายวัน
- อัพเดทคะแนนแบบ real-time
- Backup ข้อมูลอัตโนมัติ

### 3. API Reference

#### DailyDataManager

```javascript
const manager = new DailyDataManager();

// ดึงข้อมูลวันนี้
const todayData = manager.getTodayActivitiesForChild(childId);

// ตรวจสอบงานที่ทำแล้ว
const isCompleted = manager.isBehaviorCompleted(childId, behaviorId);

// บันทึกงานดี
const result = manager.completeGoodBehavior(childId, behaviorId, points, name);

// ดึงรายการเด็กพร้อมคะแนน
const children = manager.getChildrenWithTodayScores();
```

#### useDailyData Hook

```javascript
const {
  children,                // Array เด็กพร้อมคะแนนวันนี้
  goodBehaviors,          // Array งานดี
  todayScore,            // Number คะแนนวันนี้
  completedGoodBehaviors, // Set งานที่ทำแล้ว
  loading,               // Boolean สถานะโหลด
  error,                 // String ข้อผิดพลาด
  completeGoodBehavior,  // Function บันทึกงาน
  isBehaviorCompleted,   // Function ตรวจสอบ
  getTodayActivities,    // Function ดึงกิจกรรม
  refreshData,           // Function รีเฟรช
  dailyManager          // Instance ของ DailyDataManager
} = useDailyData(selectedChildId);
```

### 4. ตัวอย่างการใช้งาน

```javascript
// ตรวจสอบว่าทำงานแล้วหรือไม่
const isCompleted = isBehaviorCompleted(behaviorId);

// แสดง UI ตามสถานะ
<button
  disabled={isCompleted}
  className={isCompleted ? 'completed' : 'normal'}
  onClick={() => handleBehavior(behaviorId)}
>
  {isCompleted && <CheckIcon />}
  {behaviorName}
  {isCompleted && <span>✅ เสร็จแล้ว</span>}
</button>

// บันทึกงาน
const handleBehavior = async (behaviorId) => {
  const result = await completeGoodBehavior(behaviorId);
  
  if (result.success) {
    showSuccessMessage(result.message);
  } else {
    showError(result.message);
  }
};
```

### 5. การทำงานของระบบ

1. **เมื่อเปิดแอป**: โหลดข้อมูลเด็ก + ข้อมูลวันนี้
2. **เลือกเด็ก**: โหลดข้อมูลวันนี้ของเด็กคนนั้น
3. **ทำงาน**: บันทึก + อัพเดท UI ทันที
4. **ข้ามวัน**: รีเซ็ตทุกอย่างเป็น 0

### 6. ข้อดี

- **Performance**: เก็บข้อมูลแยกตามวัน ไม่หนัก
- **Accuracy**: คะแนนแม่นยำของวันปัจจุบัน  
- **UX**: แสดงสถานะ selected ถูกต้อง
- **Reliable**: ป้องกันข้อมูลผิดพลาด
- **Scalable**: รองรับเด็กหลายคน

## 🚨 หมายเหตุสำคัญ

- ข้อมูลจะรีเซ็ตทุกวัน (00:00)
- ต้องมีข้อมูล `children`, `behaviors` ใน localStorage
- รองรับ React 16.8+ (Hooks)
- ต้องมี localStorage support

## 🔧 Troubleshooting

### ถ้าข้อมูลไม่อัพเดท
```javascript
// Force refresh
refreshData();
```

### ถ้าต้องการ reset manual
```javascript
dailyManager.resetForNewDay();
refreshData();
```
