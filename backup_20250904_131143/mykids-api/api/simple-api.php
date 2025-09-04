<?php
// /mykids/api/simple-api.php - Simple API using sqlsrv for IIS Server
error_reporting(E_ALL);
ini_set('display_errors', 0); // ปิดการแสดง error เพื่อไม่ให้ HTML ปน JSON

// Force JSON output
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Helper function
function sendJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

// Capture any output that might interfere
ob_start();

try {
    // Get endpoint from query parameter
    $endpoint = $_GET['endpoint'] ?? $_GET['action'] ?? 'info';
    $method = $_SERVER['REQUEST_METHOD'];
    
    // Debug info
    $debug = [
        'endpoint' => $endpoint,
        'method' => $method,
        'get_params' => $_GET,
        'query_string' => $_SERVER['QUERY_STRING'] ?? '',
        'request_uri' => $_SERVER['REQUEST_URI'],
        'timestamp' => date('Y-m-d H:i:s'),
        'php_version' => PHP_VERSION,
        'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
    ];
    
    // Database connection function
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
    
    switch ($endpoint) {
        case 'info':
        case 'test':
            sendJson([
                'message' => 'MyKids Simple API for IIS (sqlsrv version)',
                'status' => 'OK',
                'php_version' => PHP_VERSION,
                'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
                'database_driver' => 'sqlsrv',
                'available_endpoints' => [
                    '?endpoint=health',
                    '?endpoint=children', 
                    '?endpoint=behaviors',
                    '?endpoint=rewards',
                    '?endpoint=test-db'
                ],
                'debug' => $debug
            ]);
            break;
            
        case 'health':
            sendJson([
                'status' => 'healthy',
                'timestamp' => date('c'),
                'php_version' => PHP_VERSION,
                'memory_usage' => memory_get_usage(true),
                'database_driver' => 'sqlsrv',
                'debug' => $debug
            ]);
            break;
            
        case 'test-db':
            try {
                $conn = getDbConnection();
                
                // Test query
                $sql = "SELECT COUNT(*) as count FROM Children WHERE IsActive = 1";
                $stmt = sqlsrv_query($conn, $sql);
                
                if ($stmt === false) {
                    throw new Exception('Query failed: ' . print_r(sqlsrv_errors(), true));
                }
                
                $result = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC);
                $count = $result['count'];
                
                sqlsrv_free_stmt($stmt);
                sqlsrv_close($conn);
                
                sendJson([
                    'database_status' => 'connected',
                    'message' => 'Database connection successful',
                    'children_count' => $count,
                    'driver' => 'sqlsrv',
                    'debug' => $debug
                ]);
                
            } catch (Exception $e) {
                sendJson([
                    'database_status' => 'failed',
                    'error' => $e->getMessage(),
                    'debug' => $debug
                ], 500);
            }
            break;
            
        case 'children':
            try {
                $conn = getDbConnection();
                
                if ($method === 'GET') {
                    // Get all children with points (using simple JOIN or subquery)
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
                        throw new Exception('Children query failed: ' . print_r(sqlsrv_errors(), true));
                    }
                    
                    $children = [];
                    while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
                        // Convert DateTime objects to strings
                        if ($row['CreatedAt'] instanceof DateTime) {
                            $row['CreatedAt'] = $row['CreatedAt']->format('Y-m-d H:i:s');
                        }
                        $children[] = $row;
                    }
                    
                    sqlsrv_free_stmt($stmt);
                    sqlsrv_close($conn);
                    
                    sendJson([
                        'children' => $children,
                        'count' => count($children),
                        'debug' => $debug
                    ]);
                    
                } elseif ($method === 'POST') {
                    $input = file_get_contents('php://input');
                    $data = json_decode($input, true);
                    
                    if (!$data || !isset($data['name'])) {
                        sendJson(['error' => 'Invalid data - name required', 'debug' => $debug], 400);
                    }
                    
                    $childId = 'child-' . uniqid();
                    
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
                    sqlsrv_close($conn);
                    
                    sendJson([
                        'success' => true,
                        'id' => $childId,
                        'message' => 'Child created successfully',
                        'debug' => $debug
                    ], 201);
                } else {
                    sendJson(['error' => 'Method not allowed', 'allowed' => ['GET', 'POST'], 'debug' => $debug], 405);
                }
                
            } catch (Exception $e) {
                sendJson([
                    'error' => 'Children endpoint failed',
                    'message' => $e->getMessage(),
                    'debug' => $debug
                ], 500);
            }
            break;
            
        case 'behaviors':
            try {
                $conn = getDbConnection();
                
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
                sqlsrv_close($conn);
                
                sendJson([
                    'behaviors' => $behaviors,
                    'count' => count($behaviors),
                    'debug' => $debug
                ]);
                
            } catch (Exception $e) {
                sendJson([
                    'error' => 'Failed to fetch behaviors',
                    'message' => $e->getMessage(),
                    'debug' => $debug
                ], 500);
            }
            break;
            
        case 'bad-behaviors':
            try {
                $conn = getDbConnection();
                
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
                sqlsrv_close($conn);
                
                sendJson([
                    'badBehaviors' => $badBehaviors,
                    'count' => count($badBehaviors),
                    'debug' => $debug
                ]);
                
            } catch (Exception $e) {
                sendJson([
                    'error' => 'Failed to fetch bad behaviors',
                    'message' => $e->getMessage(),
                    'debug' => $debug
                ], 500);
            }
            break;
            
        case 'rewards':
            try {
                $conn = getDbConnection();
                
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
                sqlsrv_close($conn);
                
                sendJson([
                    'rewards' => $rewards,
                    'count' => count($rewards),
                    'debug' => $debug
                ]);
                
            } catch (Exception $e) {
                sendJson([
                    'error' => 'Failed to fetch rewards',
                    'message' => $e->getMessage(),
                    'debug' => $debug
                ], 500);
            }
            break;

        case 'activities':
            try {
                $conn = getDbConnection();
                
                if ($method === 'GET') {
                    $childId = $_GET['child_id'] ?? null;
                    $limit = $_GET['limit'] ?? 20;
                    
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
                    sqlsrv_close($conn);
                    
                    sendJson([
                        'activities' => $activities,
                        'count' => count($activities),
                        'debug' => $debug
                    ]);
                    
                } elseif ($method === 'POST') {
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
                                sqlsrv_close($conn);
                                sendJson(['error' => 'Insufficient points', 'required' => $cost, 'available' => $currentPoints], 400);
                            }
                            
                            $points = -$cost;
                            if ($pointsStmt) sqlsrv_free_stmt($pointsStmt);
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
                    sqlsrv_close($conn);
                    
                    sendJson(['success' => true, 'points' => $points, 'debug' => $debug], 201);
                }
                
            } catch (Exception $e) {
                sendJson([
                    'error' => 'Activities endpoint failed',
                    'message' => $e->getMessage(),
                    'debug' => $debug
                ], 500);
            }
            break;
            
        default:
            sendJson([
                'error' => 'Unknown endpoint',
                'endpoint' => $endpoint,
                'available' => ['info', 'health', 'test-db', 'children', 'behaviors', 'bad-behaviors', 'rewards', 'activities'],
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
        'line' => $e->getLine()
    ], 500);
}

// Clean output buffer if still active
if (ob_get_length()) {
    ob_end_clean();
}
?>