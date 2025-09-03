<?php
// /mykids/api/index.php - API for IIS Server using sqlsrv
error_reporting(E_ALL);
ini_set('display_errors', 0); // ปิดการแสดง error เพื่อไม่ให้ HTML ปน JSON

// Set headers for CORS and JSON
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Capture any output that might interfere
ob_start();

// Helper function to send JSON response
function sendJson($data, $status = 200) {
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
        'get_params' => $_GET
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
        $apiEndpoints = ['children', 'behaviors', 'rewards', 'activities', 'dashboard', 'health'];
        foreach ($segments as $i => $segment) {
            if (in_array($segment, $apiEndpoints)) {
                $endpoint = $segment;
                $id = $segments[$i + 1] ?? null;
                break;
            }
        }
    }

    // If still no endpoint, try to extract from URL pattern
    if (!$endpoint) {
        if (strpos($requestUri, '/children') !== false) {
            $endpoint = 'children';
        } elseif (strpos($requestUri, '/health') !== false) {
            $endpoint = 'health';
        } elseif (strpos($requestUri, '/behaviors') !== false) {
            $endpoint = 'behaviors';
        } elseif (strpos($requestUri, '/rewards') !== false) {
            $endpoint = 'rewards';
        } elseif (strpos($requestUri, '/dashboard') !== false) {
            $endpoint = 'dashboard';
        }
    }

    // If no endpoint found, show API info
    if (!$endpoint) {
        sendJson([
            'message' => 'MyKids API for IIS Server (sqlsrv)',
            'version' => '1.0.0',
            'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'IIS',
            'php_version' => PHP_VERSION,
            'database_driver' => 'sqlsrv',
            'endpoints' => [
                'GET /children - ดึงเด็กทั้งหมด',
                'GET /children/{id} - ดึงเด็กคนเดียว',
                'POST /children - สร้างเด็กใหม่',
                'GET /behaviors - ดึงพฤติกรรมดี',
                'GET /rewards - ดึงรางวัล',
                'GET /activities - ดึงกิจกรรม',
                'POST /activities - บันทึกกิจกรรม',
                'GET /dashboard - ดึงข้อมูลภาพรวม',
                'GET /health - ตรวจสอบสถานะ'
            ],
            'supported_urls' => [
                'https://apps4.coop.ku.ac.th/mykids/api/?children',
                'https://apps4.coop.ku.ac.th/mykids/api/?health', 
                'https://apps4.coop.ku.ac.th/mykids/api/children',
                'https://apps4.coop.ku.ac.th/mykids/api/health'
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
                'debug' => $debug
            ]);
            break;
            
        case 'children':
            handleChildren($conn, $method, $id);
            break;
            
        case 'behaviors':
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
                'available_endpoints' => ['children', 'behaviors', 'rewards', 'activities', 'dashboard', 'health'],
                'debug' => $debug
            ], 404);
    }
    
} catch (Exception $e) {
    // Clean any output buffer
    if (ob_get_length()) {
        ob_end_clean();
    }
    
    sendJson([
        'error' => 'Server error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'debug' => $debug ?? []
    ], 500);
}

// === HANDLER FUNCTIONS ===

function handleChildren($conn, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                // Get specific child with points
                $sql = "
                    SELECT 
                        c.Id, c.Name, c.Age, c.Emoji, c.BackgroundColor, c.CreatedAt,
                        COALESCE(
                            (SELECT SUM(Points) FROM ActivityLogs WHERE ChildId = c.Id), 
                            0
                        ) as TotalPoints
                    FROM Children c
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
                
                // Convert DateTime objects
                if ($child['CreatedAt'] instanceof DateTime) {
                    $child['CreatedAt'] = $child['CreatedAt']->format('Y-m-d H:i:s');
                }
                
                sqlsrv_free_stmt($stmt);
                sendJson($child);
                
            } else {
                // Get all active children with points
                $sql = "
                    SELECT 
                        c.Id, c.Name, c.Age, c.Emoji, c.BackgroundColor, c.CreatedAt,
                        COALESCE(
                            (SELECT SUM(Points) FROM ActivityLogs WHERE ChildId = c.Id), 
                            0
                        ) as TotalPoints
                    FROM Children c
                    WHERE c.IsActive = 1
                    ORDER BY c.Name
                ";
                
                $stmt = sqlsrv_query($conn, $sql);
                
                if ($stmt === false) {
                    throw new Exception('Query failed: ' . print_r(sqlsrv_errors(), true));
                }
                
                $children = [];
                while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                    // Convert DateTime objects
                    if ($row['CreatedAt'] instanceof DateTime) {
                        $row['CreatedAt'] = $row['CreatedAt']->format('Y-m-d H:i:s');
                    }
                    $children[] = $row;
                }
                
                sqlsrv_free_stmt($stmt);
                sendJson($children);
            }
            break;
            
        case 'POST':
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data || !isset($data['name'])) {
                sendJson([
                    'error' => 'Invalid JSON or missing name',
                    'received' => $data,
                    'raw_input' => $input
                ], 400);
            }
            
            $childId = $data['id'] ?? 'child-' . uniqid();
            
            $sql = "
                INSERT INTO Children (Id, Name, Age, Emoji, BackgroundColor)
                VALUES (?, ?, ?, ?, ?)
            ";
            
            $params = [
                $childId,
                $data['name'],
                $data['age'] ?? null,
                $data['emoji'] ?? '😊',
                $data['backgroundColor'] ?? '#fecaca'
            ];
            
            $stmt = sqlsrv_query($conn, $sql, $params);
            
            if ($stmt === false) {
                throw new Exception('Insert failed: ' . print_r(sqlsrv_errors(), true));
            }
            
            sqlsrv_free_stmt($stmt);
            
            sendJson([
                'success' => true,
                'id' => $childId,
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
        SELECT Id, Name, Points, Color, Category
        FROM GoodBehaviors 
        WHERE IsActive = 1 
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
        SELECT Id, Name, Penalty, Color, Category
        FROM BadBehaviors 
        WHERE IsActive = 1 
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
        SELECT Id, Name, Cost, Icon, Color
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
            $childId = $_GET['child_id'] ?? null;
            
            if ($childId) {
                $sql = "
                    SELECT TOP (?) al.*, c.Name as ChildName
                    FROM ActivityLogs al
                    JOIN Children c ON al.ChildId = c.Id
                    WHERE al.ChildId = ?
                    ORDER BY al.ActivityDate DESC
                ";
                $params = [$limit, $childId];
            } else {
                $sql = "
                    SELECT TOP (?) al.*, c.Name as ChildName
                    FROM ActivityLogs al
                    JOIN Children c ON al.ChildId = c.Id
                    ORDER BY al.ActivityDate DESC
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
                    $row['ActivityDate'] = $row['ActivityDate']->format('Y-m-d H:i:s');
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
            if ($data['activityType'] === 'good') {
                $stmt = sqlsrv_query($conn, "SELECT Points FROM GoodBehaviors WHERE Id = ?", [$data['activityId']]);
                if ($stmt && $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                    $points = $row['Points'];
                }
                if ($stmt) sqlsrv_free_stmt($stmt);
            } elseif ($data['activityType'] === 'bad') {
                $stmt = sqlsrv_query($conn, "SELECT Penalty FROM BadBehaviors WHERE Id = ?", [$data['activityId']]);
                if ($stmt && $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                    $points = -$row['Penalty'];
                }
                if ($stmt) sqlsrv_free_stmt($stmt);
            } elseif ($data['activityType'] === 'reward') {
                $stmt = sqlsrv_query($conn, "SELECT Cost FROM Rewards WHERE Id = ?", [$data['activityId']]);
                if ($stmt && $row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                    $cost = $row['Cost'];
                    
                    // Check if child has enough points
                    $pointsStmt = sqlsrv_query($conn, "SELECT SUM(Points) as total FROM ActivityLogs WHERE ChildId = ?", [$data['childId']]);
                    $currentPoints = 0;
                    if ($pointsStmt && $pointsRow = sqlsrv_fetch_array($pointsStmt, SQLSRV_FETCH_ASSOC)) {
                        $currentPoints = $pointsRow['total'] ?? 0;
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
            $sql = "INSERT INTO ActivityLogs (ChildId, ActivityType, ActivityId, Points, Note) VALUES (?, ?, ?, ?, ?)";
            $params = [
                $data['childId'],
                $data['activityType'],
                $data['activityId'],
                $points,
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
    
    // Get children with current points
    $sql = "
        SELECT 
            c.Id, c.Name, c.Age, c.Emoji, c.BackgroundColor,
            COALESCE(
                (SELECT SUM(Points) FROM ActivityLogs WHERE ChildId = c.Id), 
                0
            ) as TotalPoints
        FROM Children c
        WHERE c.IsActive = 1
        ORDER BY c.Name
    ";
    
    $stmt = sqlsrv_query($conn, $sql);
    
    if ($stmt === false) {
        throw new Exception('Dashboard children query failed: ' . print_r(sqlsrv_errors(), true));
    }
    
    $children = [];
    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
        $children[] = $row;
    }
    sqlsrv_free_stmt($stmt);
    
    // Get today's activities
    $sql = "
        SELECT TOP 10 al.*, c.Name as ChildName
        FROM ActivityLogs al
        JOIN Children c ON al.ChildId = c.Id
        WHERE CAST(al.ActivityDate AS DATE) = CAST(GETDATE() AS DATE)
        ORDER BY al.ActivityDate DESC
    ";
    
    $stmt = sqlsrv_query($conn, $sql);
    
    $todayActivities = [];
    if ($stmt !== false) {
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            if ($row['ActivityDate'] instanceof DateTime) {
                $row['ActivityDate'] = $row['ActivityDate']->format('Y-m-d H:i:s');
            }
            $todayActivities[] = $row;
        }
        sqlsrv_free_stmt($stmt);
    }
    
    // Get recent activities (last 20)
    $sql = "
        SELECT TOP 20 al.*, c.Name as ChildName
        FROM ActivityLogs al
        JOIN Children c ON al.ChildId = c.Id
        ORDER BY al.ActivityDate DESC
    ";
    
    $stmt = sqlsrv_query($conn, $sql);
    
    $recentActivities = [];
    if ($stmt !== false) {
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            if ($row['ActivityDate'] instanceof DateTime) {
                $row['ActivityDate'] = $row['ActivityDate']->format('Y-m-d H:i:s');
            }
            $recentActivities[] = $row;
        }
        sqlsrv_free_stmt($stmt);
    }
    
    sendJson([
        'children' => $children,
        'todayActivities' => $todayActivities,
        'recentActivities' => $recentActivities,
        'timestamp' => date('c'),
        'summary' => [
            'total_children' => count($children),
            'today_activities' => count($todayActivities),
            'total_points' => array_sum(array_column($children, 'TotalPoints'))
        ]
    ]);
}

// Clean output buffer if still active
if (ob_get_length()) {
    ob_end_clean();
}

// Close database connection
if (isset($conn)) {
    sqlsrv_close($conn);
}
?>