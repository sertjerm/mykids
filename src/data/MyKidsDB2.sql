

-- สร้างฐานข้อมูลใหม่
CREATE DATABASE [MyKidsDB2]
COLLATE Thai_CI_AS;
GO

USE [MyKidsDB2];
GO

-- ลบตารางเก่าทั้งหมด
IF OBJECT_ID('dbo.ActivityLogs', 'U') IS NOT NULL DROP TABLE [dbo].[ActivityLogs];
IF OBJECT_ID('dbo.DailyActivity', 'U') IS NOT NULL DROP TABLE [dbo].[DailyActivity];
IF OBJECT_ID('dbo.Rewards', 'U') IS NOT NULL DROP TABLE [dbo].[Rewards];
IF OBJECT_ID('dbo.Behaviors', 'U') IS NOT NULL DROP TABLE [dbo].[Behaviors];
IF OBJECT_ID('dbo.Children', 'U') IS NOT NULL DROP TABLE [dbo].[Children];
GO

-- สร้างตาราง Children
CREATE TABLE [dbo].[Children](
    [AutoId] [int] IDENTITY(1,1) NOT NULL,
    [Id] [nvarchar](50) COLLATE Thai_CI_AS NOT NULL,
    [Name] [nvarchar](100) COLLATE Thai_CI_AS NOT NULL,
    [Age] [int] NULL,
    [AvatarPath] [nvarchar](255) COLLATE Thai_CI_AS NULL,
    [CreatedAt] [datetime] NULL DEFAULT (GETDATE()),
    [IsActive] [bit] NULL DEFAULT (1),
    PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY];
GO

-- รีเซ็ต IDENTITY เพื่อให้เริ่มจาก 4 (สำหรับ Id 000004)
DBCC CHECKIDENT ('dbo.Children', RESEED, 3);
GO

-- สร้างทริกเกอร์ INSTEAD OF INSERT
CREATE TRIGGER [dbo].[trg_Children_InsteadOfInsert]
ON [dbo].[Children]
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @TempTable TABLE (
        Id [nvarchar](50) COLLATE Thai_CI_AS,
        [Name] [nvarchar](100) COLLATE Thai_CI_AS,
        [Age] [int],
        [AvatarPath] [nvarchar](255) COLLATE Thai_CI_AS,
        [CreatedAt] [datetime],
        [IsActive] [bit]
    );
    DECLARE @CurrentIdentity [int];
    SELECT @CurrentIdentity = ISNULL(IDENT_CURRENT('dbo.Children'), 3);
    PRINT 'Current IDENTITY value: ' + CAST(@CurrentIdentity AS NVARCHAR);

    -- แทรกข้อมูลลงตารางชั่วคราว
    INSERT INTO @TempTable
    SELECT 
        RIGHT('000000' + CAST((ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) + @CurrentIdentity) AS NVARCHAR(6)), 6) AS Id,
        [Name],
        [Age],
        [AvatarPath],
        ISNULL([CreatedAt], GETDATE()),
        ISNULL([IsActive], 1)
    FROM inserted;

    -- แสดงค่า Id เพื่อดีบัก
    SELECT 'ChildId to be inserted: ' AS DebugMessage, Id FROM @TempTable;

    -- แทรกข้อมูลลง Children
    INSERT INTO [dbo].[Children] ([Id], [Name], [Age], [AvatarPath], [CreatedAt], [IsActive])
    SELECT 
        Id,
        [Name],
        [Age],
        [AvatarPath],
        [CreatedAt],
        [IsActive]
    FROM @TempTable;
END;
GO

-- สร้างตาราง Behaviors (เพิ่มคอลัมน์ IsRepeatable)
CREATE TABLE [dbo].[Behaviors](
    [Id] [nvarchar](50) COLLATE Thai_CI_AS NOT NULL,
    [Name] [nvarchar](200) COLLATE Thai_CI_AS NOT NULL,
    [Points] [int] NOT NULL,
    [Color] [nvarchar](20) COLLATE Thai_CI_AS NOT NULL,
    [Category] [nvarchar](50) COLLATE Thai_CI_AS NULL,
    [Type] [nvarchar](10) COLLATE Thai_CI_AS NOT NULL,
    [IsRepeatable] [bit] NOT NULL DEFAULT (0), -- 0 = ครั้งเดียว, 1 = หลายครั้ง
    [IsActive] [bit] NULL DEFAULT (1),
    PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY];
GO

-- สร้างตาราง DailyActivity
CREATE TABLE [dbo].[DailyActivity](
    [BehaviorId] [nvarchar](50) COLLATE Thai_CI_AS NOT NULL,
    [ChildId] [nvarchar](50) COLLATE Thai_CI_AS NOT NULL,
    [ActivityDate] [date] NOT NULL,
    [Count] [int] NOT NULL DEFAULT 1,
    [TotalPoints] [int] NOT NULL,
    [CreatedAt] [datetime] NULL DEFAULT (GETDATE()),
    [UpdatedAt] [datetime] NULL,
    PRIMARY KEY CLUSTERED ([BehaviorId], [ChildId], [ActivityDate])
) ON [PRIMARY];
GO

-- สร้างตาราง Rewards
CREATE TABLE [dbo].[Rewards](
    [Id] [nvarchar](50) COLLATE Thai_CI_AS NOT NULL,
    [Name] [nvarchar](200) COLLATE Thai_CI_AS NOT NULL,
    [Cost] [int] NOT NULL,
    [Color] [nvarchar](20) COLLATE Thai_CI_AS NOT NULL,
    [Category] [nvarchar](50) COLLATE Thai_CI_AS NULL,
    [IsActive] [bit] NULL DEFAULT (1),
    PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY];
GO

-- สร้างตาราง ActivityLogs
CREATE TABLE [dbo].[ActivityLogs](
    [Id] [bigint] IDENTITY(1,1) NOT NULL,
    [ChildId] [nvarchar](50) COLLATE Thai_CI_AS NOT NULL,
    [BehaviorId] [nvarchar](50) COLLATE Thai_CI_AS NOT NULL,
    [ActivityType] [nvarchar](20) COLLATE Thai_CI_AS NOT NULL,
    [Points] [int] NOT NULL,
    [ActivityDate] [date] NULL DEFAULT (CAST(GETDATE() AS date)),
    [Note] [nvarchar](500) COLLATE Thai_CI_AS NULL,
    PRIMARY KEY CLUSTERED ([Id] ASC)
) ON [PRIMARY];
GO

-- เพิ่ม Foreign Keys
ALTER TABLE [dbo].[DailyActivity] WITH CHECK ADD
    CONSTRAINT [FK_DailyActivity_ChildId] FOREIGN KEY([ChildId]) REFERENCES [dbo].[Children] ([Id]),
    CONSTRAINT [FK_DailyActivity_BehaviorId] FOREIGN KEY([BehaviorId]) REFERENCES [dbo].[Behaviors] ([Id]);
GO

ALTER TABLE [dbo].[ActivityLogs] WITH CHECK ADD
    CONSTRAINT [FK_ActivityLogs_ChildId] FOREIGN KEY([ChildId]) REFERENCES [dbo].[Children] ([Id]),
    CONSTRAINT [FK_ActivityLogs_BehaviorId] FOREIGN KEY([BehaviorId]) REFERENCES [dbo].[Behaviors] ([Id]);
GO

-- เพิ่ม Check Constraints
ALTER TABLE [dbo].[Behaviors] WITH CHECK ADD
    CONSTRAINT [CK_Behaviors_Type] CHECK ([Type] IN ('Good', 'Bad'));
GO

ALTER TABLE [dbo].[Rewards] WITH CHECK ADD
    CONSTRAINT [CK_Rewards_Cost] CHECK ([Cost] > 0);
GO

-- เริ่ม transaction
BEGIN TRANSACTION;
BEGIN TRY
    -- เพิ่มข้อมูลตัวอย่างสำหรับ Children
    INSERT INTO [dbo].[Children] ([Name], [Age], [AvatarPath])
    VALUES
        ('น้องภูมิ', 8, '/avatars/child1.png'),
        ('น้องใบหม่อน', 6, '/avatars/child2.png'),
        ('น้องเบน', 5, '/avatars/child3.png');
    
    -- ตรวจสอบข้อมูลใน Children
    PRINT 'ข้อมูลในตาราง Children หลัง INSERT:';
    SELECT * FROM [dbo].[Children];
    IF NOT EXISTS (SELECT 1 FROM [dbo].[Children] WHERE Id IN ('000004', '000005', '000006'))
    BEGIN
        RAISERROR ('การ INSERT ข้อมูลลงตาราง Children ล้มเหลว หรือ Id ไม่ตรงตามที่คาดหวัง', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
    PRINT 'เพิ่มข้อมูลใน Children สำเร็จ';

    -- เพิ่มข้อมูลตัวอย่างสำหรับ Behaviors (กำหนด IsRepeatable)
    DELETE FROM [dbo].[Behaviors];
    INSERT INTO [dbo].[Behaviors] ([Id], [Name], [Points], [Color], [Category], [Type], [IsRepeatable])
    VALUES
        ('g001', 'ทำการบ้านเสร็จ', 10, '#4CAF50', 'การศึกษา', 'Good', 0), -- ครั้งเดียว
        ('g002', 'ช่วยงานบ้าน', 5, '#2196F3', 'ความรับผิดชอบ', 'Good', 1), -- หลายครั้ง
        ('g003', 'อ่านหนังสือ', 8, '#673AB7', 'การศึกษา', 'Good', 1), -- หลายครั้ง
        ('b001', 'ไม่ทำการบ้าน', -5, '#F44336', 'การศึกษา', 'Bad', 0), -- ครั้งเดียว
        ('b002', 'ทะเลาะกับพี่น้อง', -3, '#FF9800', 'พฤติกรรม', 'Bad', 1), -- หลายครั้ง
        ('b003', 'ไม่ยอมเข้านอน', -2, '#FF5722', 'กิจวัตร', 'Bad', 1); -- หลายครั้ง
    PRINT 'เพิ่มข้อมูลใน Behaviors สำเร็จ';

    -- เพิ่มข้อมูลตัวอย่างสำหรับ Rewards
    DELETE FROM [dbo].[Rewards];
    INSERT INTO [dbo].[Rewards] ([Id], [Name], [Cost], [Color], [Category])
    VALUES
        ('r001', 'เล่นเกมได้ 1 ชั่วโมง', 20, '#9C27B0', 'กิจกรรม'),
        ('r002', 'ไอศกรีม 1 ถ้วย', 15, '#E91E63', 'ของกิน'),
        ('r003', 'ดูการ์ตูนเพิ่ม 30 นาที', 10, '#3F51B5', 'กิจกรรม'),
        ('r004', 'ไปเที่ยวสวนสัตว์', 50, '#009688', 'กิจกรรมนอกบ้าน');
    PRINT 'เพิ่มข้อมูลใน Rewards สำเร็จ';

    -- เพิ่มข้อมูลตัวอย่างสำหรับ ActivityLogs
    DELETE FROM [dbo].[ActivityLogs];
    INSERT INTO [dbo].[ActivityLogs] ([ChildId], [BehaviorId], [ActivityType], [Points], [ActivityDate], [Note])
    VALUES
        ('000004', 'g001', 'Good', 10, '2025-09-04', 'ทำการบ้านคณิตศาสตร์เสร็จสมบูรณ์'),
        ('000004', 'g002', 'Good', 5, '2025-09-04', 'ช่วยแม่ล้างจานหลังอาหารเช้า'),
        ('000004', 'b002', 'Bad', -3, '2025-09-03', 'ทะเลาะกับน้องใบหม่อนเรื่องของเล่น'),
        ('000005', 'g003', 'Good', 8, '2025-09-04', 'อ่านนิทานก่อนนอน 30 นาที'),
        ('000005', 'b001', 'Bad', -5, '2025-09-04', 'ลืมทำการบ้านภาษาไทย'),
        ('000005', 'g002', 'Good', 5, '2025-09-03', 'ช่วยพ่อรดน้ำต้นไม้ในสวน'),
        ('000006', 'b003', 'Bad', -2, '2025-09-04', 'ไม่ยอมเข้านอนตามเวลา'),
        ('000006', 'g001', 'Good', 10, '2025-09-03', 'ทำการบ้านศิลปะเสร็จสวยงาม'),
        ('000006', 'g003', 'Good', 8, '2025-09-02', 'อ่านหนังสือภาพเกี่ยวกับสัตว์');
    PRINT 'เพิ่มข้อมูลใน ActivityLogs สำเร็จ';

    -- เพิ่มข้อมูลตัวอย่างสำหรับ DailyActivity
    DELETE FROM [dbo].[DailyActivity];
    INSERT INTO [dbo].[DailyActivity] ([BehaviorId], [ChildId], [ActivityDate], [Count], [TotalPoints])
    VALUES
        ('g001', '000004', '2025-09-04', 1, 10),
        ('g002', '000004', '2025-09-04', 2, 10),
        ('b002', '000004', '2025-09-03', 1, -3),
        ('g003', '000005', '2025-09-04', 1, 8),
        ('b001', '000005', '2025-09-04', 1, -5),
        ('g002', '000005', '2025-09-03', 1, 5),
        ('b003', '000006', '2025-09-04', 1, -2),
        ('g001', '000006', '2025-09-03', 1, 10),
        ('g003', '000006', '2025-09-02', 1, 8);
    PRINT 'เพิ่มข้อมูลใน DailyActivity สำเร็จ';

    -- ตรวจสอบข้อมูลทั้งหมด
    SELECT * FROM [dbo].[Children];
    SELECT * FROM [dbo].[Behaviors];
    SELECT * FROM [dbo].[Rewards];
    SELECT * FROM [dbo].[ActivityLogs];
    SELECT * FROM [dbo].[DailyActivity];

    COMMIT TRANSACTION;
    PRINT 'Transaction สำเร็จ: สร้างฐานข้อมูล MyKidsDB2 ใหม่สำเร็จแล้ว พร้อมโครงสร้างและข้อมูลตัวอย่าง';
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorLine INT = ERROR_LINE();
    PRINT 'เกิดข้อผิดพลาด: ' + @ErrorMessage + ' ที่บรรทัด ' + CAST(@ErrorLine AS NVARCHAR);
    RAISERROR (@ErrorMessage, 16, 1);
END CATCH;
GO