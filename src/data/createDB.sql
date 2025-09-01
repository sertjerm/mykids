-- MyKids Simple Database - แก้ไขปัญหาทั้งหมดแล้ว
-- รองรับกรณีที่ Database มีอยู่แล้ว

-- ===== 1. จัดการ Database ที่มีอยู่ =====

-- ตรวจสอบและปิด connections
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'MyKidsDB')
BEGIN
    PRINT 'Database MyKidsDB already exists. Dropping existing database...';
    
    -- ปิด connections ทั้งหมด
    ALTER DATABASE MyKidsDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    
    -- ลบ database เดิม
    DROP DATABASE MyKidsDB;
    
    PRINT 'Old database dropped successfully.';
END

-- สร้าง database ใหม่
CREATE DATABASE MyKidsDB COLLATE Thai_CI_AS;
PRINT 'New database MyKidsDB created successfully.';
GO

USE MyKidsDB;
GO

PRINT 'Now creating tables and views...';

-- ===== 2. สร้าง TABLES ก่อน =====

-- ตารางเด็ก
CREATE TABLE Children (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(100) NOT NULL,
    Age INT NULL,
    Emoji NVARCHAR(10) NOT NULL,
    BackgroundColor NVARCHAR(20) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1
);

-- ตารางงานดี/กิจกรรม
CREATE TABLE GoodBehaviors (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Points INT NOT NULL CHECK(Points > 0),
    Color NVARCHAR(20) NOT NULL,
    Category NVARCHAR(50) NULL,
    IsActive BIT DEFAULT 1
);

-- ตารางพฤติกรรมไม่ดี
CREATE TABLE BadBehaviors (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Penalty INT NOT NULL CHECK(Penalty > 0),
    Color NVARCHAR(20) NOT NULL,
    Category NVARCHAR(50) NULL,
    IsActive BIT DEFAULT 1
);

-- ตารางรางวัล
CREATE TABLE Rewards (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Cost INT NOT NULL CHECK(Cost > 0),
    Color NVARCHAR(20) NOT NULL,
    Category NVARCHAR(50) NULL,
    IsActive BIT DEFAULT 1
);

-- ตารางบันทึกกิจกรรม (รวมทุกอย่างไว้ตารางเดียว)
CREATE TABLE ActivityLogs (
    Id BIGINT IDENTITY(1,1) PRIMARY KEY,
    ChildId NVARCHAR(50) NOT NULL,
    ActivityType NVARCHAR(20) NOT NULL, -- 'good', 'bad', 'reward'
    ActivityId NVARCHAR(50) NOT NULL,   -- behavior/reward ID
    Points INT NOT NULL,                -- บวก=ได้คะแนน, ลบ=หักคะแนน/ใช้คะแนน
    ActivityDate DATETIME2 DEFAULT GETDATE(),
    Note NVARCHAR(500) NULL,
    
    FOREIGN KEY (ChildId) REFERENCES Children(Id)
);

PRINT 'Tables created successfully.';

-- ===== 3. สร้าง INDEXES =====

CREATE INDEX IX_ActivityLogs_ChildId_Date ON ActivityLogs (ChildId, ActivityDate DESC);
CREATE INDEX IX_ActivityLogs_Type ON ActivityLogs (ActivityType);
CREATE INDEX IX_Children_Active ON Children (IsActive) WHERE IsActive = 1;

PRINT 'Indexes created successfully.';

-- ===== 4. ใส่ข้อมูลเริ่มต้นก่อน (เพื่อให้ Views ทำงานได้) =====

-- เด็ก
INSERT INTO Children (Id, Name, Age, Emoji, BackgroundColor) VALUES
('child-1', 'น้องมิว', 7, '😊', '#fce7f3'),
('child-2', 'น้องโบ', 5, '🤗', '#dbeafe');

-- งานดี
INSERT INTO GoodBehaviors (Id, Name, Points, Color, Category) VALUES
('behavior-1', 'แปรงฟัน', 3, '#bbf7d0', 'สุขภาพ'),
('behavior-2', 'ทำการบ้าน', 8, '#bae6fd', 'การเรียน'),
('behavior-3', 'เก็บของเล่น', 3, '#fed7aa', 'ความรับผิดชอบ'),
('behavior-4', 'อ่านหนังสือ', 5, '#e9d5ff', 'การเรียน'),
('behavior-5', 'ออกกำลังกาย', 4, '#a7f3d0', 'สุขภาพ'),
('behavior-6', 'ช่วยงานบ้าน', 6, '#fde68a', 'ความรับผิดชอบ');

-- พฤติกรรมไม่ดี
INSERT INTO BadBehaviors (Id, Name, Penalty, Color, Category) VALUES
('bad-1', 'พูดหยาบ', 3, '#fecaca', 'ความประพฤติ'),
('bad-2', 'โกหก', 5, '#fca5a5', 'ความประพฤติ'),
('bad-3', 'ไม่ส่งการบ้าน', 10, '#f87171', 'การเรียน'),
('bad-4', 'งอแง', 2, '#fed7d7', 'ความประพฤติ'),
('bad-5', 'เล่นเกมนานเกิน', 4, '#fbb6ce', 'การเรียน');

-- รางวัล
INSERT INTO Rewards (Id, Name, Cost, Color, Category) VALUES
('reward-1', 'ดูการ์ตูนเพิ่ม 30 นาที', 15, '#c7d2fe', 'สิทธิพิเศษ'),
('reward-2', 'ขนมที่ชอบ', 10, '#fde68a', 'ขนม'),
('reward-3', 'ของเล่นเล็ก', 25, '#f9a8d4', 'ของเล่น'),
('reward-4', 'เที่ยวสวนสนุก', 100, '#a78bfa', 'กิจกรรม'),
('reward-5', 'ซื้อหนังสือใหม่', 30, '#34d399', 'การเรียน');

-- ข้อมูลทดสอบ
INSERT INTO ActivityLogs (ChildId, ActivityType, ActivityId, Points, Note) VALUES
('child-1', 'good', 'behavior-1', 3, 'แปรงฟันเช้า'),
('child-1', 'good', 'behavior-2', 8, 'ทำการบ้านเสร็จ'),
('child-2', 'good', 'behavior-1', 3, 'แปรงฟันก่อนนอน'),
('child-2', 'bad', 'bad-4', -2, 'งอแงตอนเช้า');

PRINT 'Initial data inserted successfully.';

-- ===== 5. สร้าง VIEWS (หลังจากมี Tables และ Data แล้ว) =====
GO

-- View สำหรับดูคะแนนปัจจุบันของเด็กแต่ละคน
CREATE VIEW vw_ChildrenPoints AS
SELECT 
    c.Id as ChildId,
    c.Name as ChildName,
    c.Emoji,
    c.BackgroundColor,
    ISNULL(SUM(al.Points), 0) as TotalPoints,
    ISNULL(SUM(CASE WHEN al.ActivityType = 'good' THEN al.Points ELSE 0 END), 0) as EarnedPoints,
    ISNULL(SUM(CASE WHEN al.ActivityType = 'bad' THEN ABS(al.Points) ELSE 0 END), 0) as DeductedPoints,
    ISNULL(SUM(CASE WHEN al.ActivityType = 'reward' THEN ABS(al.Points) ELSE 0 END), 0) as UsedPoints,
    COUNT(CASE WHEN al.ActivityType = 'good' THEN 1 END) as GoodBehaviorCount,
    COUNT(CASE WHEN al.ActivityType = 'bad' THEN 1 END) as BadBehaviorCount,
    COUNT(CASE WHEN al.ActivityType = 'reward' THEN 1 END) as RewardCount
FROM Children c
LEFT JOIN ActivityLogs al ON c.Id = al.ChildId
WHERE c.IsActive = 1
GROUP BY c.Id, c.Name, c.Emoji, c.BackgroundColor;
GO

-- View สำหรับดูกิจกรรมวันนี้
CREATE VIEW vw_TodayActivities AS
SELECT 
    al.Id,
    c.Name as ChildName,
    c.Emoji,
    al.ActivityType,
    CASE 
        WHEN al.ActivityType = 'good' THEN gb.Name
        WHEN al.ActivityType = 'bad' THEN bb.Name  
        WHEN al.ActivityType = 'reward' THEN r.Name
    END as ActivityName,
    al.Points,
    al.ActivityDate,
    al.Note,
    CASE 
        WHEN al.ActivityType = 'good' THEN gb.Color
        WHEN al.ActivityType = 'bad' THEN bb.Color  
        WHEN al.ActivityType = 'reward' THEN r.Color
    END as ActivityColor
FROM ActivityLogs al
INNER JOIN Children c ON al.ChildId = c.Id
LEFT JOIN GoodBehaviors gb ON al.ActivityType = 'good' AND al.ActivityId = gb.Id
LEFT JOIN BadBehaviors bb ON al.ActivityType = 'bad' AND al.ActivityId = bb.Id  
LEFT JOIN Rewards r ON al.ActivityType = 'reward' AND al.ActivityId = r.Id
WHERE CAST(al.ActivityDate AS DATE) = CAST(GETDATE() AS DATE)
AND c.IsActive = 1;
GO

-- View สำหรับดูประวัติกิจกรรมทั้งหมด
CREATE VIEW vw_AllActivities AS
SELECT 
    al.Id,
    c.Name as ChildName,
    c.Emoji,
    al.ActivityType,
    CASE 
        WHEN al.ActivityType = 'good' THEN gb.Name
        WHEN al.ActivityType = 'bad' THEN bb.Name  
        WHEN al.ActivityType = 'reward' THEN r.Name
    END as ActivityName,
    CASE 
        WHEN al.ActivityType = 'good' THEN gb.Category
        WHEN al.ActivityType = 'bad' THEN bb.Category  
        WHEN al.ActivityType = 'reward' THEN r.Category
    END as Category,
    al.Points,
    al.ActivityDate,
    al.Note,
    CASE 
        WHEN al.ActivityType = 'good' THEN gb.Color
        WHEN al.ActivityType = 'bad' THEN bb.Color  
        WHEN al.ActivityType = 'reward' THEN r.Color
    END as ActivityColor
FROM ActivityLogs al
INNER JOIN Children c ON al.ChildId = c.Id
LEFT JOIN GoodBehaviors gb ON al.ActivityType = 'good' AND al.ActivityId = gb.Id
LEFT JOIN BadBehaviors bb ON al.ActivityType = 'bad' AND al.ActivityId = bb.Id  
LEFT JOIN Rewards r ON al.ActivityType = 'reward' AND al.ActivityId = r.Id
WHERE c.IsActive = 1;
GO

-- View สำหรับสรุปรายวัน
CREATE VIEW vw_DailySummary AS
SELECT 
    CAST(al.ActivityDate AS DATE) as SummaryDate,
    c.Name as ChildName,
    c.Emoji,
    COUNT(CASE WHEN al.ActivityType = 'good' THEN 1 END) as GoodBehaviors,
    COUNT(CASE WHEN al.ActivityType = 'bad' THEN 1 END) as BadBehaviors,
    COUNT(CASE WHEN al.ActivityType = 'reward' THEN 1 END) as RewardsUsed,
    SUM(CASE WHEN al.ActivityType = 'good' THEN al.Points ELSE 0 END) as PointsEarned,
    SUM(CASE WHEN al.ActivityType = 'bad' THEN ABS(al.Points) ELSE 0 END) as PointsLost,
    SUM(CASE WHEN al.ActivityType = 'reward' THEN ABS(al.Points) ELSE 0 END) as PointsSpent,
    SUM(al.Points) as NetPoints
FROM ActivityLogs al
INNER JOIN Children c ON al.ChildId = c.Id
WHERE c.IsActive = 1
GROUP BY CAST(al.ActivityDate AS DATE), c.Id, c.Name, c.Emoji;
GO

PRINT '';
PRINT '🎉 ===== SUCCESS! MyKids Database สร้างเสร็จสมบูรณ์! =====';
PRINT '';
PRINT '✅ สิ่งที่ได้:';
PRINT '   • 5 Tables: Children, GoodBehaviors, BadBehaviors, Rewards, ActivityLogs';
PRINT '   • 4 Views: ChildrenPoints, TodayActivities, AllActivities, DailySummary';
PRINT '   • 3 Indexes สำหรับ Performance';
PRINT '   • ข้อมูลตัวอย่าง: 2 เด็ก, 6 งานดี, 5 พฤติกรรมไม่ดี, 5 รางวัล';
PRINT '';
PRINT '🔍 ทดสอบดู:';
PRINT '   SELECT * FROM vw_ChildrenPoints;';
PRINT '   SELECT * FROM vw_TodayActivities;';
PRINT '';
PRINT '🚀 พร้อมใช้งาน API แล้ว!';

-- ===== 6. ตัวอย่างการใช้งาน =====

/*
-- ทดสอบดูข้อมูล
SELECT 'Children with Points' as TableName;
SELECT * FROM vw_ChildrenPoints;

SELECT 'Today Activities' as TableName;
SELECT * FROM vw_TodayActivities;

-- ตัวอย่างการบันทึกกิจกรรม:

-- 1. บันทึกงานดี
INSERT INTO ActivityLogs (ChildId, ActivityType, ActivityId, Points, Note)
SELECT 'child-1', 'good', 'behavior-1', Points, 'แปรงฟันแล้ว'
FROM GoodBehaviors WHERE Id = 'behavior-1';

-- 2. บันทึกพฤติกรรมไม่ดี
INSERT INTO ActivityLogs (ChildId, ActivityType, ActivityId, Points, Note)
SELECT 'child-1', 'bad', 'bad-1', -Penalty, 'พูดคำหยาบ'
FROM BadBehaviors WHERE Id = 'bad-1';

-- 3. แลกรางวัล (ตรวจสอบคะแนนก่อน)
DECLARE @CurrentPoints INT = (SELECT TotalPoints FROM vw_ChildrenPoints WHERE ChildId = 'child-1');
DECLARE @RewardCost INT = (SELECT Cost FROM Rewards WHERE Id = 'reward-1');

IF @CurrentPoints >= @RewardCost
BEGIN
    INSERT INTO ActivityLogs (ChildId, ActivityType, ActivityId, Points, Note)
    VALUES ('child-1', 'reward', 'reward-1', -@RewardCost, 'แลกรางวัลดูการ์ตูน');
    PRINT 'แลกรางวัลสำเร็จ!';
END
ELSE
BEGIN
    PRINT 'คะแนนไม่พอ! มี ' + CAST(@CurrentPoints AS NVARCHAR) + ' ต้องการ ' + CAST(@RewardCost AS NVARCHAR);
END

-- 4. ดูประวัติ
SELECT * FROM vw_AllActivities 
WHERE ChildName = 'น้องมิว' 
ORDER BY ActivityDate DESC;

-- 5. ดูสรุปรายวัน
SELECT * FROM vw_DailySummary 
WHERE SummaryDate = CAST(GETDATE() AS DATE)
ORDER BY ChildName;
*/

-- ===== ตัวอย่างการใช้งาน =====

/*
-- 1. ดูคะแนนเด็กทั้งหมด
SELECT * FROM vw_ChildrenPoints;

-- 2. ดูกิจกรรมวันนี้
SELECT * FROM vw_TodayActivities ORDER BY ActivityDate DESC;

-- 3. บันทึกการทำงานดี
INSERT INTO ActivityLogs (ChildId, ActivityType, ActivityId, Points, Note)
SELECT 'child-1', 'good', 'behavior-1', Points, 'แปรงฟันแล้ว'
FROM GoodBehaviors WHERE Id = 'behavior-1';

-- 4. บันทึกพฤติกรรมไม่ดี
INSERT INTO ActivityLogs (ChildId, ActivityType, ActivityId, Points, Note)
SELECT 'child-1', 'bad', 'bad-1', -Penalty, 'พูดคำหยาบ'
FROM BadBehaviors WHERE Id = 'bad-1';

-- 5. แลกรางวัล (ตรวจสอบคะแนนก่อน)
DECLARE @CurrentPoints INT = (SELECT TotalPoints FROM vw_ChildrenPoints WHERE ChildId = 'child-1');
DECLARE @RewardCost INT = (SELECT Cost FROM Rewards WHERE Id = 'reward-1');

IF @CurrentPoints >= @RewardCost
BEGIN
    INSERT INTO ActivityLogs (ChildId, ActivityType, ActivityId, Points, Note)
    VALUES ('child-1', 'reward', 'reward-1', -@RewardCost, 'แลกรางวัลดูการ์ตูน');
    PRINT 'แลกรางวัลสำเร็จ!';
END
ELSE
BEGIN
    PRINT 'คะแนนไม่พอ!';
END

-- 6. ดูประวัติกิจกรรมของเด็กคนหนึ่ง
SELECT * FROM vw_AllActivities 
WHERE ChildName = 'น้องมิว' 
ORDER BY ActivityDate DESC;

-- 7. ดูสรุปรายวัน
SELECT * FROM vw_DailySummary 
WHERE SummaryDate = CAST(GETDATE() AS DATE)
ORDER BY ChildName;

-- 8. เพิ่มเด็กใหม่
INSERT INTO Children (Id, Name, Age, Emoji, BackgroundColor) 
VALUES ('child-3', 'น้องแอน', 6, '🥰', '#e9d5ff');

-- 9. เพิ่มงานดีใหม่
INSERT INTO GoodBehaviors (Id, Name, Points, Color, Category)
VALUES ('behavior-7', 'ดื่มนม', 2, '#fef3c7', 'สุขภาพ');

-- 10. ลบกิจกรรมเก่า (สำหรับ cleanup)
DELETE FROM ActivityLogs 
WHERE ActivityDate < DATEADD(DAY, -30, GETDATE());
*/