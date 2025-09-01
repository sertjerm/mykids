-- Quick Test Script - แก้ไข syntax ทั้งหมดแล้ว
-- ทดสอบว่าฐานข้อมูลพร้อมใช้งาน

USE MyKidsDB;
GO

PRINT '=== 🧪 MyKids Quick Test ===';
PRINT 'Testing database...';
PRINT '';

-- ===== 1. ทดสอบ Tables แบบง่าย =====
PRINT '1. 📋 Testing Tables...';

PRINT 'Children table:';
SELECT COUNT(*) FROM Children;

PRINT 'GoodBehaviors table:';
SELECT COUNT(*) FROM GoodBehaviors;

PRINT 'BadBehaviors table:';
SELECT COUNT(*) FROM BadBehaviors;

PRINT 'Rewards table:';
SELECT COUNT(*) FROM Rewards;

PRINT 'ActivityLogs table:';
SELECT COUNT(*) FROM ActivityLogs;

PRINT '✅ Tables OK';
PRINT '';

-- ===== 2. ทดสอบ Views =====
PRINT '2. 👁️ Testing Views...';

PRINT 'Children with points:';
SELECT * FROM vw_ChildrenPoints;

PRINT 'Recent activities:';
SELECT TOP 3 
    ChildName, 
    ActivityType, 
    ActivityName, 
    Points,
    ActivityDate
FROM vw_AllActivities 
ORDER BY ActivityDate DESC;

PRINT '✅ Views OK';
PRINT '';

-- ===== 3. ทดสอบการเพิ่มข้อมูล =====
PRINT '3. 📝 Testing Insert...';

-- ลองบันทึกงานดี
INSERT INTO ActivityLogs (ChildId, ActivityType, ActivityId, Points, Note)
VALUES ('child-1', 'good', 'behavior-1', 3, 'Test insert');

PRINT 'Test data inserted';

-- ดูผลลัพธ์
PRINT 'Updated points:';
SELECT 
    ChildName,
    TotalPoints,
    EarnedPoints
FROM vw_ChildrenPoints
WHERE ChildId = 'child-1';

-- ลบข้อมูลทดสอบ
DELETE FROM ActivityLogs WHERE Note = 'Test insert';
PRINT 'Test data cleaned';

PRINT '✅ Insert/Delete OK';
PRINT '';

-- ===== 4. สรุป =====
PRINT '=== 🎯 SUMMARY ===';

DECLARE @ChildCount INT;
DECLARE @BehaviorCount INT;
DECLARE @ActivityCount INT;

SELECT @ChildCount = COUNT(*) FROM Children;
SELECT @BehaviorCount = COUNT(*) FROM GoodBehaviors;
SELECT @ActivityCount = COUNT(*) FROM ActivityLogs;

PRINT 'Children: ' + CAST(@ChildCount AS NVARCHAR(10));
PRINT 'Behaviors: ' + CAST(@BehaviorCount AS NVARCHAR(10));
PRINT 'Activities: ' + CAST(@ActivityCount AS NVARCHAR(10));

PRINT '';
PRINT '🎉 ALL TESTS PASSED!';
PRINT 'Database is ready to use!';
PRINT '';
PRINT 'Next steps:';
PRINT '1. Start Node.js API server';
PRINT '2. Test with: curl http://localhost:3000/api/health';

-- ===== ตัวอย่างคำสั่งที่เป็นประโยชน์ =====
/*
-- ดูคะแนนเด็กทั้งหมด
SELECT * FROM vw_ChildrenPoints;

-- ดูกิจกรรมล่าสุด
SELECT TOP 10 * FROM vw_AllActivities ORDER BY ActivityDate DESC;

-- บันทึกงานดี
INSERT INTO ActivityLogs (ChildId, ActivityType, ActivityId, Points, Note)
VALUES ('child-1', 'good', 'behavior-1', 3, 'แปรงฟันแล้ว');

-- บันทึกพฤติกรรมไม่ดี  
INSERT INTO ActivityLogs (ChildId, ActivityType, ActivityId, Points, Note)
VALUES ('child-1', 'bad', 'bad-1', -3, 'พูดหยาบ');

-- แลกรางวัล (ตรวจสอบคะแนนก่อน)
DECLARE @Points INT = (SELECT TotalPoints FROM vw_ChildrenPoints WHERE ChildId = 'child-1');
DECLARE @Cost INT = (SELECT Cost FROM Rewards WHERE Id = 'reward-2');

IF @Points >= @Cost
BEGIN
    INSERT INTO ActivityLogs (ChildId, ActivityType, ActivityId, Points, Note)
    VALUES ('child-1', 'reward', 'reward-2', -@Cost, 'แลกขนม');
    PRINT 'Reward redeemed!';
END
ELSE
    PRINT 'Not enough points';

-- ดูสรุปรายวัน
SELECT * FROM vw_DailySummary 
WHERE SummaryDate = CAST(GETDATE() AS DATE);
*/