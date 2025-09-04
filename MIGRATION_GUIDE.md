# MyKids Frontend Migration Guide

## การเปลี่ยนแปลงสำคัญ

### 1. API Endpoints ใหม่
- `GET /?children` - ดึงเด็กทั้งหมด  
- `GET /?children={id}&today-score` - ดึงคะแนนวันนี้
- `GET /?good-behaviors` - ดึงพฤติกรรมดี
- `GET /?bad-behaviors` - ดึงพฤติกรรมไม่ดี  
- `GET /?daily` - ดึงข้อมูลรายวัน

### 2. Field Names ที่เปลี่ยน
- `activityId` → `behaviorId`
- `Emoji` + `BackgroundColor` → `AvatarPath`
- Database: `MyKidsDB` → `MyKidsDB2`

### 3. ไฟล์ที่มีการอัพเดท
- `src/services/apiService.js` - API Service Layer ใหม่
- `src/hooks/useApi.js` - Custom Hooks สำหรับ API
- `src/components/MyKidsMainUI.jsx` - Main Component
- `vite.config.js` - Proxy Configuration
- `src/mykids-api/api/config.php` - Database Config

### 4. Features ใหม่
- Today Score API สำหรับดูคะแนนวันนี้
- แยก Good/Bad Behaviors API
- Daily Activity Summary
- Improved Error Handling
- Backward Compatibility

## วิธีการใช้งาน

### API Service
```javascript
import apiService from '../services/apiService';

// ดึงเด็กทั้งหมด
const children = await apiService.getChildren();

// ดึงคะแนนวันนี้
const todayScore = await apiService.getTodayScore('000001');

// บันทึกกิจกรรม (รองรับทั้ง behaviorId และ activityId)
await apiService.logActivity({
  childId: '000001',
  behaviorId: 'behavior-1', // หรือ activityId
  activityType: 'Good',
  date: '2024-01-15'
});
```

### React Hooks
```javascript
import { useChildren, useBehaviors, useActivities } from '../hooks/useApi';

function MyComponent() {
  const { children, loading, error } = useChildren();
  const { goodBehaviors, badBehaviors } = useBehaviors();
  const { activities, logActivity } = useActivities(childId);
  
  // ...
}
```

## Troubleshooting

### ปัญหาที่อาจเกิดขึ้น
1. **API Connection Error**: ตรวจสอบ URL ใน vite.config.js
2. **Database Error**: ตรวจสอบ config.php ให้ใช้ MyKidsDB2
3. **Field Missing**: ตรวจสอบ API response structure
4. **CORS Error**: ตรวจสอบ CORS settings ใน API

### การ Debug
```bash
# เช็ค API Health
curl https://apps4.coop.ku.ac.th/mykids/api/?health

# เช็ค Children API  
curl https://apps4.coop.ku.ac.th/mykids/api/?children

# ดู Console logs ใน Browser DevTools
```

## Next Steps

1. ทดสอบ API endpoints ทั้งหมด
2. ตรวจสอบ UI ให้แสดงข้อมูลถูกต้อง
3. ทดสอบการบันทึกกิจกรรม
4. ทดสอบการแลกรางวัล
5. Deploy และทดสอบใน Production

Created on: $(date)
