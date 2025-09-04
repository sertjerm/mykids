<?php
// /mykids/api/index.php - Fixed API for IIS Server using sqlsrv with MyKidsDB2
error_reporting(E_ALL);
ini_set('display_errors', 0); // ปิดการแสดง error เพื่อไม่ให้ HTML ปน JSON

// ล้าง output buffer ก่อน
while (ob_get_level()) {
    ob_end_clean();
}
ob_start();

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

// Database connection function using sqlsrv
function getDbConnection() {
    try {
        $config = require __DIR__ . '/config.php';
        $db = $config['db'];
        
        $connectionInfo = [
            "Database" => $db['database'],
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
        
        // Look for API endpoints in the path
        $apiEndpoints = ['children', 'behaviors', 'rewards', 'activities', 'dashboard', 'health', 'tasks', 'bad-behaviors'];
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
        } elseif (strpos($uri, 'health') !== false) {
            $endpoint = 'health';
        } elseif (strpos($uri, 'behaviors') !== false) {
            $endpoint = 'behaviors';
        } elseif (strpos($uri, 'tasks') !== false) {
            $endpoint = 'tasks';
        } elseif (strpos($uri, 'bad-behaviors') !== false) {
            $endpoint = 'bad-behaviors';
        } elseif (strpos($uri, 'rewards') !== false) {
            $endpoint = 'rewards';
        } elseif (strpos($uri, 'activities') !== false) {
            $endpoint = 'activities';
        } elseif (strpos($uri, 'dashboard') !== false) {
            $endpoint = 'dashboard';
        }
    }

    // If no endpoint found, show API info
    if (!$endpoint) {
        sendJson([
            'message' => 'MyKids API for IIS Server (sqlsrv)',
            'version' => '1.0.1',
            'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'IIS',
            'php_version' => PHP_VERSION,
            'database_driver' => 'sqlsrv',
            'cors_enabled' => true,
            'endpoints' => [
                'GET /?children - ดึงเด็กทั้งหมด',
                'GET /?children={id} - ดึงเด็กคนเดียว',
                'POST /?children - สร้างเด็กใหม่',
                'GET /?tasks - ดึงพฤติกรรมดี',
                'GET /?bad-behaviors - ดึงพฤติกรรมไม่ดี',
                'GET /?rewards - ดึงรางวัล',
                'GET /?activities - ดึงกิจกรรม',
                'POST /?activities - บันทึกกิจกรรม',
                'GET /?dashboard - ดึงข้อมูลภาพรวม',
                'GET /?health - ตรวจสอบสถานะ'
            ],
            'example_urls' => [
                'https://apps4.coop.ku.ac.th/mykids/api/?children',
                'https://apps4.coop.ku.ac.th/mykids/api/?health', 
                'https://apps4.coop.ku.ac.th/mykids/api/?tasks'
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
                'database' => 'Connected (sqlsrv)',
                'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'IIS',
                'php_version' => PHP_VERSION,
                'memory_usage' => memory_get_usage(true),
                'endpoint_detected' => $endpoint,
                'cors_origin' => $_SERVER['HTTP_ORIGIN'] ?? '*'
            ]);
            break;
            
        case 'children':
            handleChildren($conn, $method, $id);
            break;
            
        case 'behaviors':
        case 'tasks':
            handleBehaviors($conn, $method, $id);
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
            
        case 'dashboard':
            handleDashboard($conn, $method);
            break;
            
        default:
            sendJson([
                'error' => 'Unknown endpoint',
                'endpoint' => $endpoint,
                'available_endpoints' => ['children', 'behaviors', 'tasks', 'bad-behaviors', 'rewards', 'activities', 'dashboard', 'health'],
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
            if ($id) {
                // Get specific child with calculated points
                $sql = "
                    SELECT 
                        c.Id, c.Name, c.Age, c.AvatarPath, c.CreatedAt,
                        COALESCE(points.TotalPoints, 0) as TotalPoints,
                        COALESCE(points.EarnedPoints, 0) as EarnedPoints,
                        COALESCE(points.DeductedPoints, 0) as DeductedPoints,
                        COALESCE(activity_counts.GoodBehaviorCount, 0) as GoodBehaviorCount,
                        COALESCE(activity_counts.BadBehaviorCount, 0) as BadBehaviorCount
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
                            SUM(CASE WHEN ActivityType = 'Bad' THEN 1 ELSE 0 END) as BadBehaviorCount
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
                        c.Id, c.Name, c.Age, c.AvatarPath, c.CreatedAt,
                        COALESCE(points.TotalPoints, 0) as TotalPoints,
                        COALESCE(points.EarnedPoints, 0) as EarnedPoints,
                        COALESCE(points.DeductedPoints, 0) as DeductedPoints,
                        COALESCE(activity_counts.GoodBehaviorCount, 0) as GoodBehaviorCount,
                        COALESCE(activity_counts.BadBehaviorCount, 0) as BadBehaviorCount
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
                            SUM(CASE WHEN ActivityType = 'Bad' THEN 1 ELSE 0 END) as BadBehaviorCount
                        FROM ActivityLogs
                        GROUP BY ChildId
                    ) activity_counts ON c.Id = activity_counts.ChildId
                    WHERE c.IsActive = 1
                    ORDER BY c.Name
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
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data || (!isset($data['Name']) && !isset($data['name']))) {
                sendJson([
                    'error' => 'Invalid JSON or missing name field',
                    'received' => $data,
                    'raw_input' => $input
                ], 400);
            }
            
            $sql = "
                INSERT INTO Children (Name, Age, AvatarPath)
                VALUES (?, ?, ?)
            ";
            
            $params = [
                $data['Name'] ?? $data['name'],
                $data['Age'] ?? $data['age'] ?? null,
                $data['AvatarPath'] ?? $data['avatarPath'] ?? '/avatars/default.png'
            ];
            
            $stmt = sqlsrv_query($conn, $sql, $params);
            
            if ($stmt === false) {
                throw new Exception('Insert failed: ' . print_r(sqlsrv_errors(), true));
            }
            
            sqlsrv_free_stmt($stmt);
            
            sendJson([
                'success' => true,
                'message' => 'Child created successfully'
            ], 201);
            break;
            
        default:
            sendJson(['error' => 'Method not allowed', 'method' => $method, 'allowed' => ['GET', 'POST']], 405);
    }
}

function handleBehaviors($conn, $method, $id) {
    if ($method !== 'GET') {
        sendJson(['error' => 'Method not allowed', 'allowed' => ['GET']], 405);
    }
    
    $sql = "
        SELECT Id, Name, Points, Color, Category, IsRepeatable
        FROM Behaviors 
        WHERE Type = 'Good' AND IsActive = 1 
        ORDER BY Category, Name
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

function handleBadBehaviors($conn, $method, $id) {
    if ($method !== 'GET') {
        sendJson(['error' => 'Method not allowed', 'allowed' => ['GET']], 405);
    }
    
    $sql = "
        SELECT Id, Name, Points as Penalty, Color, Category, IsRepeatable
        FROM Behaviors 
        WHERE Type = 'Bad' AND IsActive = 1 
        ORDER BY Category, Name
    ";
    
    $stmt = sqlsrv_query($conn, $sql);
    
    if ($stmt === false) {
        throw new Exception('Bad behaviors query failed: ' . print_r(sqlsrv_errors(), true));
    }
    
    $badBehaviors = [];
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $badBehaviors[] = $row;
    }
    
    sqlsrv_free_stmt($stmt);
    sendJson($badBehaviors);
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
            $limit = $_GET['limit'] ?? 20;
            $childId = $_GET['child_id'] ?? $_GET['childId'] ?? $id;
            $date = $_GET['date'] ?? null;
            
            if ($childId && $date) {
                // ดึงกิจกรรมของเด็กคนเดียวในวันที่กำหนด
                $sql = "
                    SELECT 
                        al.Id as ActivityLogId,
                        al.ChildId,
                        al.BehaviorId as ActivityId,
                        al.ActivityType,
                        al.Points,
                        al.ActivityDate,
                        al.Note,
                        c.Name as ChildName,
                        CASE 
                            WHEN al.ActivityType = 'Good' THEN b.Name
                            WHEN al.ActivityType = 'Bad' THEN b.Name
                            WHEN al.ActivityType = 'Reward' THEN r.Name
                            ELSE 'Unknown'
                        END as ActivityName
                    FROM ActivityLogs al
                    LEFT JOIN Children c ON al.ChildId = c.Id
                    LEFT JOIN Behaviors b ON al.BehaviorId = b.Id
                    LEFT JOIN Rewards r ON al.BehaviorId = r.Id
                    WHERE al.ChildId = ? 
                    AND al.ActivityDate = ?
                    ORDER BY al.Id DESC
                ";
                $params = [$childId, $date];
            } elseif ($childId) {
                // ดึงกิจกรรมของเด็กคนเดียว (ทั้งหมด)
                $sql = "
                    SELECT TOP (?)
                        al.Id as ActivityLogId,
                        al.ChildId,
                        al.BehaviorId as ActivityId,
                        al.ActivityType,
                        al.Points,
                        al.ActivityDate,
                        al.Note,
                        c.Name as ChildName,
                        CASE 
                            WHEN al.ActivityType = 'Good' THEN b.Name
                            WHEN al.ActivityType = 'Bad' THEN b.Name
                            WHEN al.ActivityType = 'Reward' THEN r.Name
                            ELSE 'Unknown'
                        END as ActivityName
                    FROM ActivityLogs al
                    LEFT JOIN Children c ON al.ChildId = c.Id
                    LEFT JOIN Behaviors b ON al.BehaviorId = b.Id
                    LEFT JOIN Rewards r ON al.BehaviorId = r.Id
                    WHERE al.ChildId = ?
                    ORDER BY al.Id DESC
                ";
                $params = [$limit, $childId];
            } else {
                // ดึงกิจกรรมทั้งหมด
                $sql = "
                    SELECT TOP (?)
                        al.Id as ActivityLogId,
                        al.ChildId,
                        al.BehaviorId as ActivityId,
                        al.ActivityType,
                        al.Points,
                        al.ActivityDate,
                        al.Note,
                        c.Name as ChildName,
                        CASE 
                            WHEN al.ActivityType = 'Good' THEN b.Name
                            WHEN al.ActivityType = 'Bad' THEN b.Name
                            WHEN al.ActivityType = 'Reward' THEN r.Name
                            ELSE 'Unknown'
                        END as ActivityName
                    FROM ActivityLogs al
                    LEFT JOIN Children c ON al.ChildId = c.Id
                    LEFT JOIN Behaviors b ON al.BehaviorId = b.Id
                    LEFT JOIN Rewards r ON al.BehaviorId = r.Id
                    ORDER BY al.Id DESC
                ";
                $params = [$limit];
            }
            
            $stmt = sqlsrv_query($conn, $sql, $params);
            
            if ($stmt === false) {
                throw new Exception('Activities query failed: ' . print_r(sqlsrv_errors(), true));
            }
            
            $activities = [];
            while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                if ($row['ActivityDate'] instanceof DateTime) {
                    $row['ActivityDate'] = $row['ActivityDate']->format('Y-m-d\TH:i:s.v');
                }
                $activities[] = $row;
            }
            
            sqlsrv_free_stmt($stmt);
            sendJson($activities);
            break;
            
        case 'POST':
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data || !isset($data['childId'], $data['activityType'], $data['activityId'])) {
                sendJson(['error' => 'Missing required fields: childId, activityType, activityId'], 400);
            }
            
            // Calculate points based on activity type
            $points = 0;
            $activityType = ucfirst(strtolower($data['activityType'])); // Good, Bad, Reward
            
            if ($activityType === 'Good' || $activityType === 'Bad') {
                $stmt = sqlsrv_query($conn, "SELECT Points FROM Behaviors WHERE Id = ? AND Type = ?", [$data['activityId'], $activityType]);
                if ($stmt && $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                    $points = $activityType === 'Bad' ? -abs($row['Points']) : $row['Points'];
                }
                if ($stmt) sqlsrv_free_stmt($stmt);
            } elseif ($activityType === 'Reward') {
                $stmt = sqlsrv_query($conn, "SELECT Cost FROM Rewards WHERE Id = ?", [$data['activityId']]);
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
                $data['activityId'],
                $activityType,
                $points,
                date('Y-m-d'),
                $data['note'] ?? ''
            ];
            
            $stmt = sqlsrv_query($conn, $sql, $params);
            
            if ($stmt === false) {
                throw new Exception('Activity log insert failed: ' . print_r(sqlsrv_errors(), true));
            }
            
            sqlsrv_free_stmt($stmt);
            sendJson(['success' => true, 'points' => $points], 201);
            break;
            
        default:
            sendJson(['error' => 'Method not allowed', 'allowed' => ['GET', 'POST']], 405);
    }
}

function handleDashboard($conn, $method) {
    if ($method !== 'GET') {
        sendJson(['error' => 'Method not allowed', 'allowed' => ['GET']], 405);
    }
    
    // Get children with points
    $sql = "
        SELECT 
            c.Id, c.Name, c.Age, c.AvatarPath,
            COALESCE(points.TotalPoints, 0) as TotalPoints,
            COALESCE(points.EarnedPoints, 0) as EarnedPoints,
            COALESCE(points.DeductedPoints, 0) as DeductedPoints,
            COALESCE(activity_counts.GoodBehaviorCount, 0) as GoodBehaviorCount,
            COALESCE(activity_counts.BadBehaviorCount, 0) as BadBehaviorCount
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
                SUM(CASE WHEN ActivityType = 'Bad' THEN 1 ELSE 0 END) as BadBehaviorCount
            FROM ActivityLogs
            GROUP BY ChildId
        ) activity_counts ON c.Id = activity_counts.ChildId
        WHERE c.IsActive = 1
        ORDER BY c.Name
    ";
    
    $stmt = sqlsrv_query($conn, $sql);
    
    if ($stmt === false) {
        throw new Exception('Dashboard query failed: ' . print_r(sqlsrv_errors(), true));
    }
    
    $children = [];
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $children[] = $row;
    }
    sqlsrv_free_stmt($stmt);
    
    // Get today's activities
    $todayStmt = sqlsrv_query($conn, "
        SELECT 
            al.Id as ActivityLogId,
            al.ChildId,
            al.BehaviorId as ActivityId,
            al.ActivityType,
            al.Points,
            al.ActivityDate,
            al.Note,
            c.Name as ChildName,
            CASE 
                WHEN al.ActivityType = 'Good' THEN b.Name
                WHEN al.ActivityType = 'Bad' THEN b.Name
                WHEN al.ActivityType = 'Reward' THEN r.Name
                ELSE 'Unknown'
            END as ActivityName
        FROM ActivityLogs al
        LEFT JOIN Children c ON al.ChildId = c.Id
        LEFT JOIN Behaviors b ON al.BehaviorId = b.Id
        LEFT JOIN Rewards r ON al.BehaviorId = r.Id
        WHERE al.ActivityDate = CAST(GETDATE() AS DATE)
        ORDER BY al.Id DESC
    ");
    
    $todayActivities = [];
    if ($todayStmt) {
        while ($row = sqlsrv_fetch_array($todayStmt, SQLSRV_FETCH_ASSOC)) {
            if ($row['ActivityDate'] instanceof DateTime) {
                $row['ActivityDate'] = $row['ActivityDate']->format('Y-m-d H:i:s');
            }
            $todayActivities[] = $row;
        }
        sqlsrv_free_stmt($todayStmt);
    }
    
    sendJson([
        'children' => $children,
        'today_activities' => $todayActivities,
        'timestamp' => date('c'),
        'summary' => [
            'total_children' => count($children),
            'total_points' => array_sum(array_column($children, 'TotalPoints')),
            'today_activities_count' => count($todayActivities)
        ]
    ]);
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