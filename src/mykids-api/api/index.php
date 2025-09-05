<?php
// /mykids/api/index.php - Complete API for MyKidsDB2 with sqlsrv
error_reporting(E_ALL);
ini_set('display_errors', 0); // ปิดการแสดง error เพื่อไม่ให้ HTML ปน JSON

// ล้าง output buffer ก่อน
while (ob_get_level()) {
    ob_end_clean();
}
ob_start();

// เพิ่ม timezone setting ที่ต้นไฟล์
date_default_timezone_set('Asia/Bangkok');

// ตั้งค่า CORS headers อย่างถูกต้อง
function setCorsHeaders() {
    // ตรวจสอบ origin ที่ส่งมา
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    
    // กำหนด allowed origins
    $allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:5173', 
        'https://localhost:3000',
        'https://localhost:5173',
        'https://apps4.coop.ku.ac.th',
        'http://apps4.coop.ku.ac.th'
    ];
    
    // ตรวจสอบว่า origin ได้รับอนุญาตหรือไม่
    if ($origin === '*' || in_array($origin, $allowedOrigins) || 
        strpos($origin, 'localhost') !== false || 
        strpos($origin, 'apps4.coop.ku.ac.th') !== false) {
        header("Access-Control-Allow-Origin: " . $origin);
    } else {
        header("Access-Control-Allow-Origin: *");
    }
    
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With');
    header('Access-Control-Allow-Credentials: false');
    header('Access-Control-Max-Age: 86400');
    header('Content-Type: application/json; charset=utf-8');
}

// ตั้งค่า CORS headers ทันที
setCorsHeaders();

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Helper function to send JSON response
function sendJson($data, $status = 200) {
    // ล้าง output buffer
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    // ตั้งค่า headers อีกครั้ง
    setCorsHeaders();
    
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

// Database connection function using sqlsrv for MyKidsDB2
function getDbConnection() {
    try {
        $config = require __DIR__ . '/config.php';
        $db = $config['db'];
        
        $connectionInfo = [
            "Database" => $db['database'], // อ่านจาก config (MyKidsDB2)
            "UID" => $db['username'],
            "PWD" => $db['password'],
            "MultipleActiveResultSets" => true,
            "CharacterSet" => "UTF-8"
        ];
        
        $conn = sqlsrv_connect($db['host'], $connectionInfo);
        
        if (!$conn) {
            throw new Exception('Database connection failed: ' . print_r(sqlsrv_errors(), true));
        }
        
        return $conn;
    } catch (Exception $e) {
        throw new Exception('Database setup failed: ' . $e->getMessage());
    }
}

try {
    // Get request information
    $method = $_SERVER['REQUEST_METHOD'];
    $requestUri = $_SERVER['REQUEST_URI'];
    $scriptName = $_SERVER['SCRIPT_NAME'];
    $pathInfo = $_SERVER['PATH_INFO'] ?? '';

    // Parse endpoint from different URL formats
    $endpoint = null;
    $id = null;

    // Debug info
    $debug = [
        'method' => $method,
        'request_uri' => $requestUri,
        'script_name' => $scriptName,
        'path_info' => $pathInfo,
        'query_string' => $_SERVER['QUERY_STRING'] ?? '',
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'get_params' => $_GET,
        'http_origin' => $_SERVER['HTTP_ORIGIN'] ?? 'none'
    ];

    // Method 1: Check query parameters (?children, ?health, etc.)
    if (!empty($_GET)) {
        $queryKeys = array_keys($_GET);
        if (!empty($queryKeys)) {
            $endpoint = $queryKeys[0];
            $value = $_GET[$endpoint];
            $id = ($value !== '' && $value !== '1') ? $value : null;
        }
    }

    // Method 2: Parse from PATH_INFO (IIS URL Rewrite)
    if (!$endpoint && $pathInfo) {
        $segments = array_filter(explode('/', trim($pathInfo, '/')));
        if (!empty($segments)) {
            $endpoint = $segments[0];
            $id = $segments[1] ?? null;
        }
    }

    // Method 3: Parse from REQUEST_URI (fallback)
    if (!$endpoint) {
        // Remove script name from URI to get the path
        $path = str_replace($scriptName, '', $requestUri);
        $path = parse_url($path, PHP_URL_PATH);
        
        // Remove query string
        if (strpos($path, '?') !== false) {
            $path = substr($path, 0, strpos($path, '?'));
        }
        
        $segments = array_filter(explode('/', trim($path, '/')));
        
        // Look for API endpoints in the path - updated for MyKidsDB2
        $apiEndpoints = ['children', 'behaviors', 'good-behaviors', 'bad-behaviors', 'rewards', 'activities', 'dashboard', 'health', 'tasks', 'daily', 'behavior-summary', 'today-summary'];
        foreach ($segments as $i => $segment) {
            if (in_array($segment, $apiEndpoints)) {
                $endpoint = $segment;
                $id = $segments[$i + 1] ?? null;
                break;
            }
        }
    }

    // Special handling for common endpoints
    if (!$endpoint) {
        $uri = strtolower($requestUri);
        if (strpos($uri, 'children') !== false) {
            $endpoint = 'children';
        } elseif (strpos($uri, 'good-behavior') !== false) {
            $endpoint = 'good-behaviors';
        } elseif (strpos($uri, 'bad-behavior') !== false) {
            $endpoint = 'bad-behaviors';
        } elseif (strpos($uri, 'behavior') !== false) {
            $endpoint = 'behaviors';
        } elseif (strpos($uri, 'health') !== false) {
            $endpoint = 'health';
        } elseif (strpos($uri, 'tasks') !== false) {
            $endpoint = 'tasks'; // alias for good-behaviors
        } elseif (strpos($uri, 'reward') !== false) {
            $endpoint = 'rewards';
        } elseif (strpos($uri, 'activit') !== false) {
            $endpoint = 'activities';
        } elseif (strpos($uri, 'dashboard') !== false) {
            $endpoint = 'dashboard';
        } elseif (strpos($uri, 'daily') !== false) {
            $endpoint = 'daily';
        } elseif (strpos($uri, 'behavior-summary') !== false) {
            $endpoint = 'behavior-summary';
        } elseif (strpos($uri, 'today-summary') !== false) {
            $endpoint = 'today-summary';
        }
    }

    // If no endpoint found, show API info
    if (!$endpoint) {
        sendJson([
            'message' => 'MyKids API v2.0 for MyKidsDB2 (Complete)',
            'version' => '2.0.2',
            'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'IIS',
            'php_version' => PHP_VERSION,
            'database' => 'MyKidsDB2 (from config)',
            'database_driver' => 'sqlsrv',
            'timezone' => date_default_timezone_get(),
            'cors_enabled' => true,
            'endpoints' => [
                'GET /?children - ดึงเด็กทั้งหมด',
                'GET /?children={id} - ดึงเด็กคนเดียว',
                'GET /?children={id}&today-score - ดึงคะแนนวันนี้',
                'POST /?children - สร้างเด็กใหม่',
                'GET /?behaviors - ดึงพฤติกรรมทั้งหมด',
                'GET /?good-behaviors หรือ /?tasks - ดึงพฤติกรรมดี',
                'GET /?bad-behaviors - ดึงพฤติกรรมไม่ดี',
                'GET /?rewards - ดึงรางวัล',
                'GET /?activities - ดึงกิจกรรม',
                'POST /?activities - บันทึกกิจกรรม',
                'GET /?daily - ดึงข้อมูลรายวัน (DailyActivity)',
                'GET /?dashboard - ดึงข้อมูลภาพรวม',
                'GET /?today-summary - ดึงสรุปวันนี้จาก view',
                'GET /?health - ตรวจสอบสถานะ',
                'GET /?behavior-summary - ดึงข้อมูลสรุปพฤติกรรม'
            ],
            'new_features_v2' => [
                'Today Score: GET /?children={id}&today-score',
                'Separate Good/Bad Behaviors: /?good-behaviors, /?bad-behaviors',
                'Daily Activity Summary: /?daily',
                'Thailand Timezone Support',
                'Improved DateTime handling',
                'Support both activityId and behaviorId',
                'Behavior Summary: /?behavior-summary',
                'Today Summary: /?today-summary (SUM(TotalPoints * TotalCount))'
            ],
            'example_urls' => [
                'https://apps4.coop.ku.ac.th/mykids/api/?children',
                'https://apps4.coop.ku.ac.th/mykids/api/?children=000001&today-score',
                'https://apps4.coop.ku.ac.th/mykids/api/?good-behaviors',
                'https://apps4.coop.ku.ac.th/mykids/api/?bad-behaviors',
                'https://apps4.coop.ku.ac.th/mykids/api/?daily',
                'https://apps4.coop.ku.ac.th/mykids/api/?today-summary',
                'https://apps4.coop.ku.ac.th/mykids/api/?today-summary&childId=000001&date=2025-09-04',
                'https://apps4.coop.ku.ac.th/mykids/api/?health',
                'https://apps4.coop.ku.ac.th/mykids/api/?behavior-summary'
            ],
            'current_request' => $debug
        ]);
    }

    // Connect to database and handle request
    $conn = getDbConnection();
    
    switch ($endpoint) {
        case 'health':
            sendJson([
                'status' => 'OK',
                'timestamp' => date('c'),
                'database' => 'MyKidsDB2 Connected (sqlsrv)',
                'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'IIS',
                'php_version' => PHP_VERSION,
                'timezone' => date_default_timezone_get(),
                'memory_usage' => memory_get_usage(true),
                'endpoint_detected' => $endpoint,
                'cors_origin' => $_SERVER['HTTP_ORIGIN'] ?? '*'
            ]);
            break;
            
        case 'children':
            handleChildren($conn, $method, $id);
            break;
            
        case 'behaviors':
            handleAllBehaviors($conn, $method, $id);
            break;

        case 'behavior-summary':
            handleBehaviorSummary($conn, $method, $id);
            break;

        case 'today-summary':
            handleTodaySummary($conn, $method, $id);
            break;
            
        case 'good-behaviors':
        case 'tasks':
            handleGoodBehaviors($conn, $method, $id);
            break;
            
        case 'bad-behaviors':
        case 'badbehaviors':
            handleBadBehaviors($conn, $method, $id);
            break;
            
        case 'rewards':
            handleRewards($conn, $method, $id);
            break;
            
        case 'activities':
            handleActivities($conn, $method, $id);
            break;
            
        case 'daily':
            handleDailyActivity($conn, $method, $id);
            break;
            
        case 'dashboard':
            handleDashboard($conn, $method);
            break;
            
        default:
            sendJson([
                'error' => 'Unknown endpoint',
                'endpoint' => $endpoint,
                'available_endpoints' => ['children', 'behaviors', 'behavior-summary', 'today-summary', 'good-behaviors', 'bad-behaviors', 'rewards', 'activities', 'daily', 'dashboard', 'health'],
                'debug' => $debug
            ], 404);
    }
    
} catch (Exception $e) {
    // Clean any output buffer
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    sendJson([
        'error' => 'Server error',
        'message' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine(),
        'debug' => $debug ?? []
    ], 500);
}

// === HANDLER FUNCTIONS สำหรับ MyKidsDB2 ===

function handleChildren($conn, $method, $id) {
    switch ($method) {
        case 'GET':
            // ตรวจสอบว่าต้องการ today-score หรือไม่
            if (isset($_GET['today-score']) || strpos($_SERVER['QUERY_STRING'], 'today-score') !== false) {
                if (!$id) {
                    sendJson(['error' => 'Child ID is required for today-score'], 400);
                }
                
                // ดึงคะแนนวันนี้เท่านั้น
                $today = date('Y-m-d');
                $sql = "
                    SELECT 
                        c.Id,
                        c.Name,
                        COALESCE(SUM(al.Points), 0) as TodayScore,
                        COUNT(CASE WHEN al.ActivityType = 'Good' THEN 1 END) as TodayGoodBehaviors,
                        COUNT(CASE WHEN al.ActivityType = 'Bad' THEN 1 END) as TodayBadBehaviors,
                        COUNT(CASE WHEN al.ActivityType = 'Reward' THEN 1 END) as TodayRewards
                    FROM Children c
                    LEFT JOIN ActivityLogs al ON c.Id = al.ChildId 
                        AND CAST(al.ActivityDate AS DATE) = ?
                    WHERE c.Id = ? AND c.IsActive = 1
                    GROUP BY c.Id, c.Name
                ";
                
                $stmt = sqlsrv_query($conn, $sql, [$today, $id]);
                
                if ($stmt === false) {
                    throw new Exception('Today score query failed: ' . print_r(sqlsrv_errors(), true));
                }
                
                $result = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
                
                if (!$result) {
                    sqlsrv_free_stmt($stmt);
                    sendJson(['error' => 'Child not found', 'id' => $id], 404);
                }
                
                sqlsrv_free_stmt($stmt);
                sendJson([
                    'childId' => $result['Id'],
                    'childName' => $result['Name'],
                    'date' => $today,
                    'totalScore' => (int)$result['TodayScore'],
                    'todayActivities' => [
                        'goodBehaviors' => (int)$result['TodayGoodBehaviors'],
                        'badBehaviors' => (int)$result['TodayBadBehaviors'],
                        'rewards' => (int)$result['TodayRewards']
                    ],
                    'timestamp' => date('c')
                ]);
            }
            
            if ($id) {
                // Get specific child with calculated points
                $sql = "
                    SELECT 
                        c.Id, c.Name, c.Age, c.AvatarPath, 
                        CONVERT(varchar(23), c.CreatedAt, 121) as CreatedAt,
                        COALESCE(points.TotalPoints, 0) as TotalPoints,
                        COALESCE(points.EarnedPoints, 0) as EarnedPoints,
                        COALESCE(points.DeductedPoints, 0) as DeductedPoints,
                        COALESCE(activity_counts.GoodBehaviorCount, 0) as GoodBehaviorCount,
                        COALESCE(activity_counts.BadBehaviorCount, 0) as BadBehaviorCount,
                        COALESCE(activity_counts.RewardCount, 0) as RewardCount
                    FROM Children c
                    LEFT JOIN (
                        SELECT ChildId,
                            SUM(CASE WHEN Points > 0 THEN Points ELSE 0 END) as EarnedPoints,
                            SUM(CASE WHEN Points < 0 THEN ABS(Points) ELSE 0 END) as DeductedPoints,
                            SUM(Points) as TotalPoints
                        FROM ActivityLogs
                        GROUP BY ChildId
                    ) points ON c.Id = points.ChildId
                    LEFT JOIN (
                        SELECT ChildId,
                            SUM(CASE WHEN ActivityType = 'Good' THEN 1 ELSE 0 END) as GoodBehaviorCount,
                            SUM(CASE WHEN ActivityType = 'Bad' THEN 1 ELSE 0 END) as BadBehaviorCount,
                            SUM(CASE WHEN ActivityType = 'Reward' THEN 1 ELSE 0 END) as RewardCount
                        FROM ActivityLogs
                        GROUP BY ChildId
                    ) activity_counts ON c.Id = activity_counts.ChildId
                    WHERE c.Id = ? AND c.IsActive = 1
                ";
                
                $stmt = sqlsrv_query($conn, $sql, [$id]);
                
                if ($stmt === false) {
                    throw new Exception('Query failed: ' . print_r(sqlsrv_errors(), true));
                }
                
                $child = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
                
                if (!$child) {
                    sqlsrv_free_stmt($stmt);
                    sendJson(['error' => 'Child not found', 'id' => $id], 404);
                }
                
                sqlsrv_free_stmt($stmt);
                sendJson($child);
                
            } else {
                // Get all children with calculated points
                $sql = "
                    SELECT 
                        c.Id, c.Name, c.Age, c.AvatarPath, 
                        CONVERT(varchar(23), c.CreatedAt, 121) as CreatedAt,
                        COALESCE(points.TotalPoints, 0) as TotalPoints,
                        COALESCE(points.EarnedPoints, 0) as EarnedPoints,
                        COALESCE(points.DeductedPoints, 0) as DeductedPoints,
                        COALESCE(activity_counts.GoodBehaviorCount, 0) as GoodBehaviorCount,
                        COALESCE(activity_counts.BadBehaviorCount, 0) as BadBehaviorCount,
                        COALESCE(activity_counts.RewardCount, 0) as RewardCount
                    FROM Children c
                    LEFT JOIN (
                        SELECT ChildId,
                            SUM(CASE WHEN Points > 0 THEN Points ELSE 0 END) as EarnedPoints,
                            SUM(CASE WHEN Points < 0 THEN ABS(Points) ELSE 0 END) as DeductedPoints,
                            SUM(Points) as TotalPoints
                        FROM ActivityLogs
                        GROUP BY ChildId
                    ) points ON c.Id = points.ChildId
                    LEFT JOIN (
                        SELECT ChildId,
                            SUM(CASE WHEN ActivityType = 'Good' THEN 1 ELSE 0 END) as GoodBehaviorCount,
                            SUM(CASE WHEN ActivityType = 'Bad' THEN 1 ELSE 0 END) as BadBehaviorCount,
                            SUM(CASE WHEN ActivityType = 'Reward' THEN 1 ELSE 0 END) as RewardCount
                        FROM ActivityLogs
                        GROUP BY ChildId
                    ) activity_counts ON c.Id = activity_counts.ChildId
                    WHERE c.IsActive = 1
                    ORDER BY c.Id
                ";
                
                $stmt = sqlsrv_query($conn, $sql);
                
                if ($stmt === false) {
                    throw new Exception('Query failed: ' . print_r(sqlsrv_errors(), true));
                }
                
                $children = [];
                while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                    $children[] = $row;
                }
                
                sqlsrv_free_stmt($stmt);
                sendJson($children);
            }
            break;
            
        case 'POST':
            // Handle creating new child
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data || !isset($data['name'])) {
                sendJson(['error' => 'Missing required fields: name'], 400);
            }
            
            // Generate new ID
            $sql = "SELECT MAX(CAST(Id AS INT)) as MaxId FROM Children WHERE Id LIKE '0000%'";
            $stmt = sqlsrv_query($conn, $sql);
            $maxId = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)['MaxId'] ?? 0;
            $newId = sprintf("%06d", $maxId + 1);
            
            $sql = "INSERT INTO Children (Id, Name, Age, AvatarPath) VALUES (?, ?, ?, ?)";
            $params = [
                $newId,
                $data['name'],
                $data['age'] ?? null,
                $data['avatarPath'] ?? null
            ];
            
            $stmt = sqlsrv_query($conn, $sql, $params);
            
            if ($stmt === false) {
                throw new Exception('Insert failed: ' . print_r(sqlsrv_errors(), true));
            }
            
            sqlsrv_free_stmt($stmt);
            sendJson(['success' => true, 'id' => $newId], 201);
            break;
            
        default:
            sendJson(['error' => 'Method not allowed', 'allowed' => ['GET', 'POST']], 405);
    }
}

function handleAllBehaviors($conn, $method, $id) {
    if ($method !== 'GET') {
        sendJson(['error' => 'Method not allowed', 'allowed' => ['GET']], 405);
    }
    
    $sql = "
        SELECT Id, Name, Points, Color, Category, Type, IsRepeatable, IsActive
        FROM Behaviors 
        WHERE IsActive = 1 
        ORDER BY Type DESC, Points DESC, Name
    ";
    
    $stmt = sqlsrv_query($conn, $sql);
    
    if ($stmt === false) {
        throw new Exception('Behaviors query failed: ' . print_r(sqlsrv_errors(), true));
    }
    
    $behaviors = [];
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $behaviors[] = $row;
    }
    
    sqlsrv_free_stmt($stmt);
    sendJson($behaviors);
}

function handleGoodBehaviors($conn, $method, $id) {
    if ($method !== 'GET') {
        sendJson(['error' => 'Method not allowed', 'allowed' => ['GET']], 405);
    }
    
    $sql = "
        SELECT Id, Name, Points, Color, Category, IsRepeatable, IsActive
        FROM Behaviors 
        WHERE Type = 'Good' AND IsActive = 1 
        ORDER BY Points DESC, Name
    ";
    
    $stmt = sqlsrv_query($conn, $sql);
    
    if ($stmt === false) {
        throw new Exception('Good behaviors query failed: ' . print_r(sqlsrv_errors(), true));
    }
    
    $behaviors = [];
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $behaviors[] = $row;
    }
    
    sqlsrv_free_stmt($stmt);
    sendJson($behaviors);
}

function handleBadBehaviors($conn, $method, $id) {
    if ($method !== 'GET') {
        sendJson(['error' => 'Method not allowed', 'allowed' => ['GET']], 405);
    }
    
    $sql = "
        SELECT Id, Name, Points, Color, Category, IsRepeatable, IsActive
        FROM Behaviors 
        WHERE Type = 'Bad' AND IsActive = 1 
        ORDER BY Points DESC, Name
    ";
    
    $stmt = sqlsrv_query($conn, $sql);
    
    if ($stmt === false) {
        throw new Exception('Bad behaviors query failed: ' . print_r(sqlsrv_errors(), true));
    }
    
    $behaviors = [];
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $behaviors[] = $row;
    }
    
    sqlsrv_free_stmt($stmt);
    sendJson($behaviors);
}

function handleRewards($conn, $method, $id) {
    if ($method !== 'GET') {
        sendJson(['error' => 'Method not allowed', 'allowed' => ['GET']], 405);
    }
    
    $sql = "
        SELECT Id, Name, Cost, Color, Category, IsActive
        FROM Rewards 
        WHERE IsActive = 1 
        ORDER BY Cost, Name
    ";
    
    $stmt = sqlsrv_query($conn, $sql);
    
    if ($stmt === false) {
        throw new Exception('Rewards query failed: ' . print_r(sqlsrv_errors(), true));
    }
    
    $rewards = [];
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $rewards[] = $row;
    }
    
    sqlsrv_free_stmt($stmt);
    sendJson($rewards);
}

function handleActivities($conn, $method, $id) {
    switch ($method) {
        case 'GET':
            $limit = $_GET['limit'] ?? 50;
            $childId = $_GET['child_id'] ?? $_GET['childId'] ?? $id;
            $date = $_GET['date'] ?? null;
            
            // ตรวจสอบว่าเป็นการดึงข้อมูลสำหรับ Daily Summary หรือไม่
            if ($childId && $date) {
                // ใช้ view ใหม่หรือ SQL ที่ปรับปรุง
                try {
                    // ลองใช้ view ใหม่ก่อน - สำหรับดึงข้อมูล behaviors พร้อมสถานะสำหรับเด็กคนนั้นในวันนั้น
                    $sql = "
                        SELECT 
                            b.Id, 
                            b.Name, 
                            b.Points, 
                            b.Color, 
                            b.Category, 
                            b.Type,
                            b.IsRepeatable,
                            ISNULL(d.Count, 0) AS cnt,
                            ISNULL(d.Count, 0) * b.Points AS TotalPoints,
                            CASE WHEN d.Count > 0 THEN 1 ELSE 0 END AS isCompleted,
                            ISNULL(d.Count, 0) AS completedCount,
                            d.ChildId,
                            d.ActivityDate
                        FROM Behaviors b
                        LEFT OUTER JOIN DailyActivity d ON b.Id = d.BehaviorId 
                            AND d.ChildId = ? 
                            AND d.ActivityDate = ?
                        WHERE b.IsActive = 1
                        ORDER BY b.Type DESC, b.Points DESC, b.Name
                    ";
                    $params = [$childId, $date];
                } catch (Exception $e) {
                    // หาก view หรือ table ไม่มี ใช้ SQL โดยตรงจาก ActivityLogs
                    $sql = "
                        SELECT 
                            b.Id, 
                            b.Name, 
                            b.Points, 
                            b.Color, 
                            b.Category, 
                            b.Type,
                            b.IsRepeatable,
                            COALESCE(COUNT(al.Id), 0) AS cnt,
                            COALESCE(COUNT(al.Id) * b.Points, 0) AS TotalPoints,
                            CASE WHEN COUNT(al.Id) > 0 THEN 1 ELSE 0 END AS isCompleted,
                            COALESCE(COUNT(al.Id), 0) AS completedCount,
                            ? AS ChildId,
                            ? AS ActivityDate
                        FROM Behaviors b
                        LEFT OUTER JOIN ActivityLogs al ON b.Id = al.BehaviorId 
                            AND al.ChildId = ? 
                            AND CAST(al.ActivityDate AS DATE) = ?
                        WHERE b.IsActive = 1
                        GROUP BY b.Id, b.Name, b.Points, b.Color, b.Category, b.Type, b.IsRepeatable
                        ORDER BY b.Type DESC, b.Points DESC, b.Name
                    ";
                    $params = [$childId, $date, $childId, $date];
                }
                
                $stmt = sqlsrv_query($conn, $sql, $params);
                
                if ($stmt === false) {
                    throw new Exception('Daily behavior summary query failed: ' . print_r(sqlsrv_errors(), true));
                }
                
                $behaviors = [];
                while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                    // แปลง ActivityDate เป็น string ถ้าเป็น DateTime object
                    if (isset($row['ActivityDate']) && $row['ActivityDate'] instanceof DateTime) {
                        $row['ActivityDate'] = $row['ActivityDate']->format('Y-m-d');
                    }
                    
                    // ทำให้แน่ใจว่า isCompleted เป็น boolean
                    $row['isCompleted'] = (bool)($row['isCompleted'] ?? false);
                    $row['completedCount'] = (int)($row['completedCount'] ?? 0);
                    $row['cnt'] = (int)($row['cnt'] ?? 0);
                    $row['TotalPoints'] = (int)($row['TotalPoints'] ?? 0);
                    
                    $behaviors[] = $row;
                }
                
                sqlsrv_free_stmt($stmt);
                
                sendJson([
                    'date' => $date,
                    'childId' => $childId,
                    'behaviors' => $behaviors,
                    'summary' => [
                        'totalBehaviors' => count($behaviors),
                        'completedBehaviors' => count(array_filter($behaviors, fn($b) => $b['isCompleted'])),
                        'totalPoints' => array_sum(array_column($behaviors, 'TotalPoints')),
                        'goodBehaviors' => count(array_filter($behaviors, fn($b) => $b['Type'] === 'Good')),
                        'badBehaviors' => count(array_filter($behaviors, fn($b) => $b['Type'] === 'Bad'))
                    ],
                    'timestamp' => date('c')
                ]);
                
            } elseif ($childId) {
                // ดึงกิจกรรมของเด็กคนเดียว (ทั้งหมด) - ใช้ ActivityLogs เหมือนเดิม
                $sql = "
                    SELECT TOP (?)
                        al.Id as ActivityLogId,
                        al.ChildId,
                        al.BehaviorId as ActivityId,
                        al.ActivityType,
                        al.Points,
                        CONVERT(varchar(10), al.ActivityDate, 121) as ActivityDate,
                        al.Note,
                        c.Name as ChildName,
                        CASE 
                            WHEN al.ActivityType = 'Good' THEN b.Name
                            WHEN al.ActivityType = 'Bad' THEN b.Name
                            WHEN al.ActivityType = 'Reward' THEN r.Name
                            ELSE 'Unknown'
                        END as ActivityName,
                        CASE 
                            WHEN al.ActivityType = 'Good' THEN b.Color
                            WHEN al.ActivityType = 'Bad' THEN b.Color
                            WHEN al.ActivityType = 'Reward' THEN r.Color
                            ELSE '#gray'
                        END as ActivityColor
                    FROM ActivityLogs al
                    LEFT JOIN Children c ON al.ChildId = c.Id
                    LEFT JOIN Behaviors b ON al.BehaviorId = b.Id
                    LEFT JOIN Rewards r ON al.BehaviorId = r.Id
                    WHERE al.ChildId = ?
                    ORDER BY al.Id DESC
                ";
                $params = [$limit, $childId];
                
                $stmt = sqlsrv_query($conn, $sql, $params);
                
                if ($stmt === false) {
                    throw new Exception('Activities query failed: ' . print_r(sqlsrv_errors(), true));
                }
                
                $activities = [];
                while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                    $activities[] = $row;
                }
                
                sqlsrv_free_stmt($stmt);
                sendJson($activities);
                
            } else {
                // ดึงกิจกรรมทั้งหมด - ใช้ ActivityLogs เหมือนเดิม
                $sql = "
                    SELECT TOP (?)
                        al.Id as ActivityLogId,
                        al.ChildId,
                        al.BehaviorId as ActivityId,
                        al.ActivityType,
                        al.Points,
                        CONVERT(varchar(10), al.ActivityDate, 121) as ActivityDate,
                        al.Note,
                        c.Name as ChildName,
                        CASE 
                            WHEN al.ActivityType = 'Good' THEN b.Name
                            WHEN al.ActivityType = 'Bad' THEN b.Name
                            WHEN al.ActivityType = 'Reward' THEN r.Name
                            ELSE 'Unknown'
                        END as ActivityName,
                        CASE 
                            WHEN al.ActivityType = 'Good' THEN b.Color
                            WHEN al.ActivityType = 'Bad' THEN b.Color
                            WHEN al.ActivityType = 'Reward' THEN r.Color
                            ELSE '#gray'
                        END as ActivityColor
                    FROM ActivityLogs al
                    LEFT JOIN Children c ON al.ChildId = c.Id
                    LEFT JOIN Behaviors b ON al.BehaviorId = b.Id
                    LEFT JOIN Rewards r ON al.BehaviorId = r.Id
                    ORDER BY al.Id DESC
                ";
                $params = [$limit];
                
                $stmt = sqlsrv_query($conn, $sql, $params);
                
                if ($stmt === false) {
                    throw new Exception('Activities query failed: ' . print_r(sqlsrv_errors(), true));
                }
                
                $activities = [];
                while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                    $activities[] = $row;
                }
                
                sqlsrv_free_stmt($stmt);
                sendJson($activities);
            }
            break;
            
        case 'POST':
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            // รองรับทั้ง activityId และ behaviorId สำหรับ backward compatibility
            $behaviorId = $data['behaviorId'] ?? $data['activityId'] ?? null;
            
            if (!$data || !isset($data['childId'], $data['activityType']) || !$behaviorId) {
                sendJson(['error' => 'Missing required fields: childId, activityType, and behaviorId/activityId'], 400);
            }
            
            // Calculate points based on activity type
            $points = 0;
            $activityType = ucfirst(strtolower($data['activityType'])); // Good, Bad, Reward
            
            if ($activityType === 'Good' || $activityType === 'Bad') {
                $stmt = sqlsrv_query($conn, "SELECT Points FROM Behaviors WHERE Id = ? AND Type = ?", [$behaviorId, $activityType]);
                if ($stmt && $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                    $points = $activityType === 'Bad' ? -abs($row['Points']) : $row['Points'];
                } else {
                    sendJson(['error' => 'Behavior not found', 'behaviorId' => $behaviorId, 'type' => $activityType], 404);
                }
                if ($stmt) sqlsrv_free_stmt($stmt);
            } elseif ($activityType === 'Reward') {
                $stmt = sqlsrv_query($conn, "SELECT Cost FROM Rewards WHERE Id = ?", [$behaviorId]);
                if ($stmt && $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                    $cost = $row['Cost'];
                    
                    // Check if child has enough points
                    $pointsStmt = sqlsrv_query($conn, "SELECT COALESCE(SUM(Points), 0) as TotalPoints FROM ActivityLogs WHERE ChildId = ?", [$data['childId']]);
                    $currentPoints = 0;
                    if ($pointsStmt && $pointsRow = sqlsrv_fetch_array($pointsStmt, SQLSRV_FETCH_ASSOC)) {
                        $currentPoints = $pointsRow['TotalPoints'] ?? 0;
                    }
                    
                    if ($currentPoints < $cost) {
                        if ($pointsStmt) sqlsrv_free_stmt($pointsStmt);
                        sendJson(['error' => 'Insufficient points', 'required' => $cost, 'available' => $currentPoints], 400);
                    }
                    
                    $points = -$cost;
                    if ($pointsStmt) sqlsrv_free_stmt($pointsStmt);
                } else {
                    sendJson(['error' => 'Reward not found'], 404);
                }
                if ($stmt) sqlsrv_free_stmt($stmt);
            }
            
            // Insert activity log
            $sql = "INSERT INTO ActivityLogs (ChildId, BehaviorId, ActivityType, Points, ActivityDate, Note) VALUES (?, ?, ?, ?, ?, ?)";
            $params = [
                $data['childId'],
                $behaviorId,
                $activityType,
                $points,
                $data['date'] ?? date('Y-m-d'),
                $data['note'] ?? ''
            ];
            
            $stmt = sqlsrv_query($conn, $sql, $params);
            
            if ($stmt === false) {
                throw new Exception('Activity log insert failed: ' . print_r(sqlsrv_errors(), true));
            }
            
            sqlsrv_free_stmt($stmt);
            
            // Update/Insert DailyActivity summary if table exists and for Good/Bad only
            if ($activityType === 'Good' || $activityType === 'Bad') {
                try {
                    $updateDailyActivity = "
                        MERGE DailyActivity AS target
                        USING (SELECT ? as BehaviorId, ? as ChildId, ? as ActivityDate, ? as Points) AS source
                        ON target.BehaviorId = source.BehaviorId 
                           AND target.ChildId = source.ChildId 
                           AND target.ActivityDate = source.ActivityDate
                        WHEN MATCHED THEN
                            UPDATE SET 
                                Count = Count + 1,
                                TotalPoints = TotalPoints + source.Points,
                                UpdatedAt = GETDATE()
                        WHEN NOT MATCHED THEN
                            INSERT (BehaviorId, ChildId, ActivityDate, Count, TotalPoints, CreatedAt)
                            VALUES (source.BehaviorId, source.ChildId, source.ActivityDate, 1, source.Points, GETDATE());
                    ";
                    
                    $dailyParams = [
                        $behaviorId, 
                        $data['childId'], 
                        $data['date'] ?? date('Y-m-d'),
                        $points
                    ];
                    
                    $dailyStmt = sqlsrv_query($conn, $updateDailyActivity, $dailyParams);
                    if ($dailyStmt === false) {
                        throw new Exception('DailyActivity merge failed: ' . print_r(sqlsrv_errors(), true));
                    }
                    if ($dailyStmt) {
                        sqlsrv_free_stmt($dailyStmt);
                    }
                } catch (Exception $e) {
                    // DailyActivity table might not exist or other error, log but continue
                    error_log('DailyActivity update failed: ' . $e->getMessage());
                }
            }
            
            sendJson(['success' => true, 'points' => $points, 'activityType' => $activityType], 201);
            break;
            
        default:
            sendJson(['error' => 'Method not allowed', 'allowed' => ['GET', 'POST']], 405);
    }
}

function handleDailyActivity($conn, $method, $id) {
    if ($method !== 'GET') {
        sendJson(['error' => 'Method not allowed', 'allowed' => ['GET']], 405);
    }
    
    $childId = $_GET['child_id'] ?? $_GET['childId'] ?? $id;
    $date = $_GET['date'] ?? date('Y-m-d');
    $limit = $_GET['limit'] ?? 30;
    
    try {
        if ($childId) {
            // Get daily activity for specific child
            $sql = "
                SELECT TOP (?)
                    da.BehaviorId, da.ChildId, da.ActivityDate, da.Count, da.EarnedPoints,
                    da.ActivityType,
                    c.Name as ChildName,
                    CASE 
                        WHEN da.ActivityType IN ('Good', 'Bad') THEN b.Name
                        ELSE r.Name
                    END as ActivityName
                FROM DailyActivity da
                LEFT JOIN Children c ON da.ChildId = c.Id
                LEFT JOIN Behaviors b ON da.BehaviorId = b.Id
                LEFT JOIN Rewards r ON da.BehaviorId = r.Id
                WHERE da.ChildId = ?
                ORDER BY da.ActivityDate DESC, da.EarnedPoints DESC
            ";
            $params = [$limit, $childId];
        } else {
            // Get daily activity summary for all children
            $sql = "
                SELECT TOP (?)
                    da.ChildId, da.ActivityDate,
                    SUM(CASE WHEN da.EarnedPoints > 0 THEN da.EarnedPoints ELSE 0 END) as EarnedPoints,
                    SUM(CASE WHEN da.EarnedPoints < 0 THEN ABS(da.EarnedPoints) ELSE 0 END) as DeductedPoints,
                    SUM(da.EarnedPoints) as NetPoints,
                    COUNT(*) as ActivityCount,
                    c.Name as ChildName
                FROM DailyActivity da
                LEFT JOIN Children c ON da.ChildId = c.Id
                GROUP BY da.ChildId, da.ActivityDate, c.Name
                ORDER BY da.ActivityDate DESC, NetPoints DESC
            ";
            $params = [$limit];
        }
        
        $stmt = sqlsrv_query($conn, $sql, $params);
        
        if ($stmt === false) {
            throw new Exception('Daily activity query failed: ' . print_r(sqlsrv_errors(), true));
        }
        
        $dailyActivities = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            if (isset($row['ActivityDate']) && $row['ActivityDate'] instanceof DateTime) {
                $row['ActivityDate'] = $row['ActivityDate']->format('Y-m-d');
            }
            $dailyActivities[] = $row;
        }
        
        sqlsrv_free_stmt($stmt);
        sendJson($dailyActivities);
        
    } catch (Exception $e) {
        // If DailyActivity table doesn't exist, return empty array
        sendJson([
            'message' => 'DailyActivity table not available',
            'error' => $e->getMessage(),
            'data' => []
        ]);
    }
}

function handleDashboard($conn, $method) {
    if ($method !== 'GET') {
        sendJson(['error' => 'Method not allowed', 'allowed' => ['GET']], 405);
    }
    
    try {
        // Get children with points from ActivityLogs (for real-time data)
        $childrenSql = "
            SELECT 
                c.Id, c.Name, c.Age, c.AvatarPath,
                COALESCE(points.TotalPoints, 0) as TotalPoints,
                COALESCE(points.EarnedPoints, 0) as EarnedPoints,
                COALESCE(points.DeductedPoints, 0) as DeductedPoints,
                COALESCE(activity_counts.GoodBehaviorCount, 0) as GoodBehaviorCount,
                COALESCE(activity_counts.BadBehaviorCount, 0) as BadBehaviorCount,
                COALESCE(activity_counts.RewardCount, 0) as RewardCount
            FROM Children c
            LEFT JOIN (
                SELECT ChildId,
                    SUM(CASE WHEN Points > 0 THEN Points ELSE 0 END) as EarnedPoints,
                    SUM(CASE WHEN Points < 0 THEN ABS(Points) ELSE 0 END) as DeductedPoints,
                    SUM(Points) as TotalPoints
                FROM ActivityLogs
                GROUP BY ChildId
            ) points ON c.Id = points.ChildId
            LEFT JOIN (
                SELECT ChildId,
                    SUM(CASE WHEN ActivityType = 'Good' THEN 1 ELSE 0 END) as GoodBehaviorCount,
                    SUM(CASE WHEN ActivityType = 'Bad' THEN 1 ELSE 0 END) as BadBehaviorCount,
                    SUM(CASE WHEN ActivityType = 'Reward' THEN 1 ELSE 0 END) as RewardCount
                FROM ActivityLogs
                GROUP BY ChildId
            ) activity_counts ON c.Id = activity_counts.ChildId
            WHERE c.IsActive = 1
            ORDER BY c.Id
        ";
        
        $stmt = sqlsrv_query($conn, $childrenSql);
        
        if ($stmt === false) {
            throw new Exception('Children query failed: ' . print_r(sqlsrv_errors(), true));
        }
        
        $children = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            $children[] = $row;
        }
        sqlsrv_free_stmt($stmt);
        
        // Get behavior summary from view
        $behaviorSummarySql = "
            SELECT 
                Id, Name, Points, Color, Category, Type,
                ChildId, ActivityDate,
                CompletedChildrenCount,
                TotalCount,
                TotalPoints,
                isCompleted
            FROM vw_BehaviorDailySummary
            ORDER BY Type DESC, Points DESC, Name, ChildId, ActivityDate
        ";
        
        $behaviorStmt = sqlsrv_query($conn, $behaviorSummarySql);
        
        $behaviorSummary = [];
        if ($behaviorStmt !== false) {
            while ($row = sqlsrv_fetch_array($behaviorStmt, SQLSRV_FETCH_ASSOC)) {
                // แปลง ActivityDate เป็น string ถ้าเป็น DateTime object
                if (isset($row['ActivityDate']) && $row['ActivityDate'] instanceof DateTime) {
                    $row['ActivityDate'] = $row['ActivityDate']->format('Y-m-d');
                }
                
                // แปลงค่าให้เป็นประเภทที่ถูกต้อง
                $row['isCompleted'] = (bool)($row['isCompleted'] ?? false);
                $row['CompletedChildrenCount'] = (int)($row['CompletedChildrenCount'] ?? 0);
                $row['TotalCount'] = (int)($row['TotalCount'] ?? 0);
                $row['TotalPoints'] = (int)($row['TotalPoints'] ?? 0);
                
                $behaviorSummary[] = $row;
            }
            sqlsrv_free_stmt($behaviorStmt);
        }
        
        // Get today's activities
        $today = date('Y-m-d');
        $todayActivitiesSql = "
            SELECT 
                al.Id as ActivityLogId,
                al.ChildId,
                al.BehaviorId as ActivityId,
                al.ActivityType,
                al.Points,
                CONVERT(varchar(10), al.ActivityDate, 121) as ActivityDate,
                al.Note,
                c.Name as ChildName,
                CASE 
                    WHEN al.ActivityType = 'Good' THEN b.Name
                    WHEN al.ActivityType = 'Bad' THEN b.Name
                    WHEN al.ActivityType = 'Reward' THEN r.Name
                    ELSE 'Unknown'
                END as ActivityName,
                CASE 
                    WHEN al.ActivityType = 'Good' THEN b.Color
                    WHEN al.ActivityType = 'Bad' THEN b.Color
                    WHEN al.ActivityType = 'Reward' THEN r.Color
                    ELSE '#gray'
                END as ActivityColor
            FROM ActivityLogs al
            LEFT JOIN Children c ON al.ChildId = c.Id
            LEFT JOIN Behaviors b ON al.BehaviorId = b.Id
            LEFT JOIN Rewards r ON al.BehaviorId = r.Id
            WHERE CAST(al.ActivityDate AS DATE) = ?
            ORDER BY al.Id DESC
        ";
        
        $todayStmt = sqlsrv_query($conn, $todayActivitiesSql, [$today]);
        
        $todayActivities = [];
        if ($todayStmt !== false) {
            while ($row = sqlsrv_fetch_array($todayStmt, SQLSRV_FETCH_ASSOC)) {
                $todayActivities[] = $row;
            }
            sqlsrv_free_stmt($todayStmt);
        }
        
        // Get today's summary by child from vw_BehaviorDailySummary (ใช้ SQL ที่คุณให้มา)
        $todaySummaryByChild = [];
        try {
            $todaySummarySql = "
                SELECT 
                    t.ChildId,
                    c.Name as ChildName,
                    t.ActivityDate,
                    SUM(t.TotalPoints * t.TotalCount) as TodayTotalPoints,
                    COUNT(DISTINCT t.Id) as TodayBehaviorCount,
                    SUM(t.TotalCount) as TodayActivitiesCount
                FROM vw_BehaviorDailySummary t
                LEFT JOIN Children c ON t.ChildId = c.Id
                WHERE t.ChildId IS NOT NULL AND t.ActivityDate = ?
                GROUP BY t.ChildId, c.Name, t.ActivityDate
                ORDER BY TodayTotalPoints DESC
            ";
            
            $todaySummaryStmt = sqlsrv_query($conn, $todaySummarySql, [$today]);
            
            if ($todaySummaryStmt !== false) {
                while ($row = sqlsrv_fetch_array($todaySummaryStmt, SQLSRV_FETCH_ASSOC)) {
                    // แปลง ActivityDate เป็น string ถ้าเป็น DateTime object
                    if (isset($row['ActivityDate']) && $row['ActivityDate'] instanceof DateTime) {
                        $row['ActivityDate'] = $row['ActivityDate']->format('Y-m-d');
                    }
                    
                    // คำนวณ EarnedPoints และ DeductedPoints
                    $totalPoints = (int)$row['TodayTotalPoints'];
                    $row['TodayEarnedPoints'] = $totalPoints > 0 ? $totalPoints : 0;
                    $row['TodayDeductedPoints'] = $totalPoints < 0 ? abs($totalPoints) : 0;
                    $row['TodayTotalPoints'] = $totalPoints;
                    $row['TodayBehaviorCount'] = (int)$row['TodayBehaviorCount'];
                    $row['TodayActivitiesCount'] = (int)$row['TodayActivitiesCount'];
                    
                    $todaySummaryByChild[] = $row;
                }
                sqlsrv_free_stmt($todaySummaryStmt);
            }
        } catch (Exception $e) {
            // View might not exist, fallback to DailyActivity
            try {
                $fallbackSql = "
                    SELECT 
                        da.ChildId,
                        c.Name as ChildName,
                        da.ActivityDate,
                        SUM(CASE WHEN da.TotalPoints > 0 THEN da.TotalPoints ELSE 0 END) as TodayEarnedPoints,
                        SUM(CASE WHEN da.TotalPoints < 0 THEN ABS(da.TotalPoints) ELSE 0 END) as TodayDeductedPoints,
                        SUM(da.TotalPoints) as TodayTotalPoints,
                        COUNT(da.BehaviorId) as TodayActivitiesCount
                    FROM DailyActivity da
                    LEFT JOIN Children c ON da.ChildId = c.Id
                    WHERE da.ActivityDate = ?
                    GROUP BY da.ChildId, c.Name, da.ActivityDate
                    ORDER BY TodayTotalPoints DESC
                ";
                
                $fallbackStmt = sqlsrv_query($conn, $fallbackSql, [$today]);
                
                if ($fallbackStmt !== false) {
                    while ($row = sqlsrv_fetch_array($fallbackStmt, SQLSRV_FETCH_ASSOC)) {
                        if (isset($row['ActivityDate']) && $row['ActivityDate'] instanceof DateTime) {
                            $row['ActivityDate'] = $row['ActivityDate']->format('Y-m-d');
                        }
                        $todaySummaryByChild[] = $row;
                    }
                    sqlsrv_free_stmt($fallbackStmt);
                }
            } catch (Exception $fallbackError) {
                // Both view and DailyActivity not available
                $todaySummaryByChild = [];
            }
        }
        
        // Calculate overall statistics
        $totalChildren = count($children);
        $activeChildren = count(array_filter($children, fn($c) => $c['TotalPoints'] > 0));
        $totalSystemPoints = array_sum(array_column($children, 'TotalPoints'));
        $todayActivitiesCount = count($todayActivities);
        
        // Behavior statistics from view - ปรับการคำนวณสำหรับ view ใหม่
        $uniqueBehaviors = [];
        foreach ($behaviorSummary as $behavior) {
            $key = $behavior['Id'];
            if (!isset($uniqueBehaviors[$key])) {
                $uniqueBehaviors[$key] = $behavior;
            }
        }
        
        $totalBehaviors = count($uniqueBehaviors);
        $activeBehaviors = count(array_filter($uniqueBehaviors, fn($b) => $b['isCompleted']));
        $goodBehaviors = count(array_filter($uniqueBehaviors, fn($b) => $b['Type'] === 'Good'));
        $badBehaviors = count(array_filter($uniqueBehaviors, fn($b) => $b['Type'] === 'Bad'));
        $totalBehaviorPoints = array_sum(array_column($behaviorSummary, 'TotalPoints'));
        
        sendJson([
            'children' => $children,
            'behavior_summary' => $behaviorSummary,
            'today_activities' => $todayActivities,
            'today_summary_by_child' => $todaySummaryByChild,
            'statistics' => [
                'children' => [
                    'total' => $totalChildren,
                    'active' => $activeChildren,
                    'total_points' => $totalSystemPoints
                ],
                'behaviors' => [
                    'total' => $totalBehaviors,
                    'active' => $activeBehaviors,
                    'good' => $goodBehaviors,
                    'bad' => $badBehaviors,
                    'total_points' => $totalBehaviorPoints,
                    'unique_behaviors' => count($uniqueBehaviors),
                    'behavior_instances' => count($behaviorSummary)
                ],
                'today' => [
                    'activities_count' => $todayActivitiesCount,
                    'active_children' => count($todaySummaryByChild),
                    'total_today_points' => array_sum(array_column($todaySummaryByChild, 'TodayTotalPoints'))
                ]
            ],
            'timestamp' => date('c'),
            'database_version' => 'MyKidsDB2',
            'data_sources' => [
                'children' => 'ActivityLogs (real-time)',
                'behavior_summary' => 'vw_BehaviorDailySummary (with ChildId, ActivityDate)',
                'today_activities' => 'ActivityLogs',
                'today_summary' => 'vw_BehaviorDailySummary (SUM(TotalPoints * TotalCount))'
            ]
        ]);
        
    } catch (Exception $e) {
        sendJson([
            'error' => 'Dashboard query failed',
            'message' => $e->getMessage(),
            'fallback_data' => [
                'children' => [],
                'behavior_summary' => [],
                'today_activities' => []
            ]
        ], 500);
    }
}

function handleBehaviorSummary($conn, $method, $id) {
    if ($method !== 'GET') {
        sendJson(['error' => 'Method not allowed', 'allowed' => ['GET']], 405);
    }
    
    try {
        $sql = "
            SELECT 
                Id, Name, Points, Color, Category, Type,
                CompletedChildrenCount,
                TotalCount,
                TotalPoints,
                isCompleted
            FROM vw_BehaviorDailySummary
            ORDER BY Type DESC, Points DESC, Name
        ";
        
        $stmt = sqlsrv_query($conn, $sql);
        
        if ($stmt === false) {
            throw new Exception('Behavior summary query failed: ' . print_r(sqlsrv_errors(), true));
        }
        
        $behaviors = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            // แปลงค่าให้เป็นประเภทที่ถูกต้อง
            $row['isCompleted'] = (bool)($row['isCompleted'] ?? false);
            $row['CompletedChildrenCount'] = (int)($row['CompletedChildrenCount'] ?? 0);
            $row['TotalCount'] = (int)($row['TotalCount'] ?? 0);
            $row['TotalPoints'] = (int)($row['TotalPoints'] ?? 0);
            
            $behaviors[] = $row;
        }
        
        sqlsrv_free_stmt($stmt);
        
        sendJson([
            'behaviors' => $behaviors,
            'summary' => [
                'totalBehaviors' => count($behaviors),
                'completedBehaviors' => count(array_filter($behaviors, fn($b) => $b['isCompleted'])),
                'totalActiveChildren' => max(array_column($behaviors, 'CompletedChildrenCount')),
                'goodBehaviors' => count(array_filter($behaviors, fn($b) => $b['Type'] === 'Good')),
                'badBehaviors' => count(array_filter($behaviors, fn($b) => $b['Type'] === 'Bad'))
            ],
            'timestamp' => date('c')
        ]);
        
    } catch (Exception $e) {
        sendJson([
            'error' => 'View not available',
            'message' => $e->getMessage(),
            'fallback' => 'Use /?behaviors instead'
        ], 500);
    }
}

function handleTodaySummary($conn, $method, $id) {
    if ($method !== 'GET') {
        sendJson(['error' => 'Method not allowed', 'allowed' => ['GET']], 405);
    }
    
    try {
        $childId = $_GET['child_id'] ?? $_GET['childId'] ?? $id;
        $date = $_GET['date'] ?? date('Y-m-d');
        
        $sql = "
            SELECT 
                t.ChildId,
                c.Name as ChildName,
                t.ActivityDate,
                SUM(t.TotalPoints * t.TotalCount) as total
            FROM vw_BehaviorDailySummary t
            LEFT JOIN Children c ON t.ChildId = c.Id
            WHERE t.ChildId IS NOT NULL
        ";
        
        $params = [];
        
        if ($childId) {
            $sql .= " AND t.ChildId = ?";
            $params[] = $childId;
        }
        
        if ($date) {
            $sql .= " AND t.ActivityDate = ?";
            $params[] = $date;
        }
        
        $sql .= " GROUP BY t.ChildId, c.Name, t.ActivityDate ORDER BY total DESC";
        
        $stmt = sqlsrv_query($conn, $sql, $params);
        
        if ($stmt === false) {
            throw new Exception('Today summary query failed: ' . print_r(sqlsrv_errors(), true));
        }
        
        $summary = [];
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            // แปลง ActivityDate เป็น string ถ้าเป็น DateTime object
            if (isset($row['ActivityDate']) && $row['ActivityDate'] instanceof DateTime) {
                $row['ActivityDate'] = $row['ActivityDate']->format('Y-m-d');
            }
            
            $row['total'] = (int)$row['total'];
            $summary[] = $row;
        }
        
        sqlsrv_free_stmt($stmt);
        
        sendJson([
            'summary' => $summary,
            'filters' => [
                'childId' => $childId,
                'date' => $date
            ],
            'statistics' => [
                'total_children' => count($summary),
                'total_points' => array_sum(array_column($summary, 'total')),
                'highest_score' => $summary ? max(array_column($summary, 'total')) : 0,
                'lowest_score' => $summary ? min(array_column($summary, 'total')) : 0
            ],
            'timestamp' => date('c')
        ]);
        
    } catch (Exception $e) {
        sendJson([
            'error' => 'Summary query failed',
            'message' => $e->getMessage(),
            'fallback' => 'Use /?dashboard instead'
        ], 500);
    }
}

// Clean output buffer if still active
while (ob_get_level()) {
    ob_end_clean();
}

// Close database connection
if (isset($conn)) {
    sqlsrv_close($conn);
}
?>