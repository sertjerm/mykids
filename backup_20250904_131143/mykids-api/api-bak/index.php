<?php
// api/index.php - Complete API Endpoints
require __DIR__.'/startup.php';
require __DIR__.'/db.php';
require __DIR__.'/helpers.php';

$pdo = get_pdo();
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($path, '/'));

// Helper function to send JSON response
function sendJson($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Route handling
    if (count($segments) < 2 || $segments[0] !== 'api') {
        sendJson(['error' => 'Invalid API path'], 404);
    }
    
    $endpoint = $segments[1];
    $id = $segments[2] ?? null;
    
    switch ($endpoint) {
        case 'health':
            sendJson(['status' => 'OK', 'timestamp' => date('c')]);
            break;
            
        case 'children':
            handleChildren($pdo, $method, $id);
            break;
            
        case 'behaviors':
            handleBehaviors($pdo, $method, $id);
            break;
            
        case 'bad-behaviors':
            handleBadBehaviors($pdo, $method, $id);
            break;
            
        case 'rewards':
            handleRewards($pdo, $method, $id);
            break;
            
        case 'activities':
            handleActivities($pdo, $method, $id);
            break;
            
        case 'points':
            handlePoints($pdo, $method, $id);
            break;
            
        case 'dashboard':
            handleDashboard($pdo, $method);
            break;
            
        default:
            sendJson(['error' => 'Endpoint not found'], 404);
    }
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendJson(['error' => 'Internal server error', 'message' => $e->getMessage()], 500);
}

// === CHILDREN ENDPOINTS ===
function handleChildren($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                // Get specific child with their current points
                $stmt = $pdo->prepare("
                    SELECT c.*, COALESCE(cp.TotalPoints, 0) as TotalPoints,
                           COALESCE(cp.EarnedPoints, 0) as EarnedPoints,
                           COALESCE(cp.SpentPoints, 0) as SpentPoints
                    FROM Children c
                    LEFT JOIN vw_ChildrenPoints cp ON c.Id = cp.ChildId
                    WHERE c.Id = ? AND c.IsActive = 1
                ");
                $stmt->execute([$id]);
                $child = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$child) {
                    sendJson(['error' => 'Child not found'], 404);
                }
                sendJson($child);
            } else {
                // Get all active children with points
                $stmt = $pdo->query("
                    SELECT c.*, COALESCE(cp.TotalPoints, 0) as TotalPoints,
                           COALESCE(cp.EarnedPoints, 0) as EarnedPoints,
                           COALESCE(cp.SpentPoints, 0) as SpentPoints
                    FROM Children c
                    LEFT JOIN vw_ChildrenPoints cp ON c.Id = cp.ChildId
                    WHERE c.IsActive = 1
                    ORDER BY c.Name
                ");
                sendJson($stmt->fetchAll(PDO::FETCH_ASSOC));
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                INSERT INTO Children (Id, Name, Age, Emoji, BackgroundColor)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $childId = $data['id'] ?? uniqid('child-');
            $stmt->execute([
                $childId,
                $data['name'],
                $data['age'] ?? null,
                $data['emoji'] ?? '😊',
                $data['backgroundColor'] ?? '#fecaca'
            ]);
            
            sendJson(['success' => true, 'id' => $childId], 201);
            break;
            
        case 'PUT':
            if (!$id) {
                sendJson(['error' => 'Child ID required'], 400);
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                UPDATE Children 
                SET Name = ?, Age = ?, Emoji = ?, BackgroundColor = ?
                WHERE Id = ? AND IsActive = 1
            ");
            
            $result = $stmt->execute([
                $data['name'],
                $data['age'],
                $data['emoji'],
                $data['backgroundColor'],
                $id
            ]);
            
            if ($stmt->rowCount() === 0) {
                sendJson(['error' => 'Child not found'], 404);
            }
            
            sendJson(['success' => true]);
            break;
            
        case 'DELETE':
            if (!$id) {
                sendJson(['error' => 'Child ID required'], 400);
            }
            
            // Soft delete
            $stmt = $pdo->prepare("UPDATE Children SET IsActive = 0 WHERE Id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                sendJson(['error' => 'Child not found'], 404);
            }
            
            sendJson(['success' => true]);
            break;
    }
}

// === BEHAVIORS ENDPOINTS ===
function handleBehaviors($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM GoodBehaviors WHERE Id = ? AND IsActive = 1");
                $stmt->execute([$id]);
                $behavior = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$behavior) {
                    sendJson(['error' => 'Behavior not found'], 404);
                }
                sendJson($behavior);
            } else {
                $stmt = $pdo->query("
                    SELECT * FROM GoodBehaviors 
                    WHERE IsActive = 1 
                    ORDER BY Category, Name
                ");
                sendJson($stmt->fetchAll(PDO::FETCH_ASSOC));
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                INSERT INTO GoodBehaviors (Id, Name, Points, Color, Category)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $behaviorId = $data['id'] ?? uniqid('behavior-');
            $stmt->execute([
                $behaviorId,
                $data['name'],
                $data['points'] ?? 3,
                $data['color'] ?? '#bbf7d0',
                $data['category'] ?? 'ทั่วไป'
            ]);
            
            sendJson(['success' => true, 'id' => $behaviorId], 201);
            break;
            
        case 'PUT':
            if (!$id) {
                sendJson(['error' => 'Behavior ID required'], 400);
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                UPDATE GoodBehaviors 
                SET Name = ?, Points = ?, Color = ?, Category = ?
                WHERE Id = ? AND IsActive = 1
            ");
            
            $stmt->execute([
                $data['name'],
                $data['points'],
                $data['color'],
                $data['category'],
                $id
            ]);
            
            if ($stmt->rowCount() === 0) {
                sendJson(['error' => 'Behavior not found'], 404);
            }
            
            sendJson(['success' => true]);
            break;
            
        case 'DELETE':
            if (!$id) {
                sendJson(['error' => 'Behavior ID required'], 400);
            }
            
            $stmt = $pdo->prepare("UPDATE GoodBehaviors SET IsActive = 0 WHERE Id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                sendJson(['error' => 'Behavior not found'], 404);
            }
            
            sendJson(['success' => true]);
            break;
    }
}

// === BAD BEHAVIORS ENDPOINTS ===
function handleBadBehaviors($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM BadBehaviors WHERE Id = ? AND IsActive = 1");
                $stmt->execute([$id]);
                $behavior = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$behavior) {
                    sendJson(['error' => 'Bad behavior not found'], 404);
                }
                sendJson($behavior);
            } else {
                $stmt = $pdo->query("
                    SELECT * FROM BadBehaviors 
                    WHERE IsActive = 1 
                    ORDER BY Category, Name
                ");
                sendJson($stmt->fetchAll(PDO::FETCH_ASSOC));
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                INSERT INTO BadBehaviors (Id, Name, Penalty, Color, Category)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $behaviorId = $data['id'] ?? uniqid('bad-');
            $stmt->execute([
                $behaviorId,
                $data['name'],
                $data['penalty'] ?? 2,
                $data['color'] ?? '#fecaca',
                $data['category'] ?? 'ทั่วไป'
            ]);
            
            sendJson(['success' => true, 'id' => $behaviorId], 201);
            break;
            
        case 'PUT':
            if (!$id) {
                sendJson(['error' => 'Bad behavior ID required'], 400);
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                UPDATE BadBehaviors 
                SET Name = ?, Penalty = ?, Color = ?, Category = ?
                WHERE Id = ? AND IsActive = 1
            ");
            
            $stmt->execute([
                $data['name'],
                $data['penalty'],
                $data['color'],
                $data['category'],
                $id
            ]);
            
            if ($stmt->rowCount() === 0) {
                sendJson(['error' => 'Bad behavior not found'], 404);
            }
            
            sendJson(['success' => true]);
            break;
            
        case 'DELETE':
            if (!$id) {
                sendJson(['error' => 'Bad behavior ID required'], 400);
            }
            
            $stmt = $pdo->prepare("UPDATE BadBehaviors SET IsActive = 0 WHERE Id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                sendJson(['error' => 'Bad behavior not found'], 404);
            }
            
            sendJson(['success' => true]);
            break;
    }
}

// === REWARDS ENDPOINTS ===
function handleRewards($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM Rewards WHERE Id = ? AND IsActive = 1");
                $stmt->execute([$id]);
                $reward = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$reward) {
                    sendJson(['error' => 'Reward not found'], 404);
                }
                sendJson($reward);
            } else {
                $stmt = $pdo->query("
                    SELECT * FROM Rewards 
                    WHERE IsActive = 1 
                    ORDER BY Cost, Name
                ");
                sendJson($stmt->fetchAll(PDO::FETCH_ASSOC));
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                INSERT INTO Rewards (Id, Name, Cost, Icon, Color)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $rewardId = $data['id'] ?? uniqid('reward-');
            $stmt->execute([
                $rewardId,
                $data['name'],
                $data['cost'] ?? 10,
                $data['icon'] ?? '🎁',
                $data['color'] ?? '#ddd6fe'
            ]);
            
            sendJson(['success' => true, 'id' => $rewardId], 201);
            break;
            
        case 'PUT':
            if (!$id) {
                sendJson(['error' => 'Reward ID required'], 400);
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("
                UPDATE Rewards 
                SET Name = ?, Cost = ?, Icon = ?, Color = ?
                WHERE Id = ? AND IsActive = 1
            ");
            
            $stmt->execute([
                $data['name'],
                $data['cost'],
                $data['icon'],
                $data['color'],
                $id
            ]);
            
            if ($stmt->rowCount() === 0) {
                sendJson(['error' => 'Reward not found'], 404);
            }
            
            sendJson(['success' => true]);
            break;
            
        case 'DELETE':
            if (!$id) {
                sendJson(['error' => 'Reward ID required'], 400);
            }
            
            $stmt = $pdo->prepare("UPDATE Rewards SET IsActive = 0 WHERE Id = ?");
            $stmt->execute([$id]);
            
            if ($stmt->rowCount() === 0) {
                sendJson(['error' => 'Reward not found'], 404);
            }
            
            sendJson(['success' => true]);
            break;
    }
}

// === ACTIVITIES ENDPOINTS ===
function handleActivities($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if (isset($_GET['child_id'])) {
                // Get activities for specific child
                $childId = $_GET['child_id'];
                $limit = $_GET['limit'] ?? 50;
                
                $stmt = $pdo->prepare("
                    SELECT TOP (?) * FROM vw_AllActivities
                    WHERE ChildId = ?
                    ORDER BY ActivityDate DESC
                ");
                $stmt->execute([$limit, $childId]);
                sendJson($stmt->fetchAll(PDO::FETCH_ASSOC));
            } else {
                // Get recent activities for all children
                $limit = $_GET['limit'] ?? 20;
                
                $stmt = $pdo->prepare("
                    SELECT TOP (?) * FROM vw_AllActivities
                    ORDER BY ActivityDate DESC
                ");
                $stmt->execute([$limit]);
                sendJson($stmt->fetchAll(PDO::FETCH_ASSOC));
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Validate required fields
            if (!isset($data['childId'], $data['activityType'], $data['activityId'])) {
                sendJson(['error' => 'Missing required fields'], 400);
            }
            
            $childId = $data['childId'];
            $activityType = $data['activityType']; // 'good', 'bad', 'reward'
            $activityId = $data['activityId'];
            $note = $data['note'] ?? '';
            
            // Get points based on activity type
            $points = 0;
            if ($activityType === 'good') {
                $stmt = $pdo->prepare("SELECT Points FROM GoodBehaviors WHERE Id = ?");
                $stmt->execute([$activityId]);
                $behavior = $stmt->fetch();
                $points = $behavior ? $behavior['Points'] : 0;
            } elseif ($activityType === 'bad') {
                $stmt = $pdo->prepare("SELECT Penalty FROM BadBehaviors WHERE Id = ?");
                $stmt->execute([$activityId]);
                $behavior = $stmt->fetch();
                $points = $behavior ? -$behavior['Penalty'] : 0;
            } elseif ($activityType === 'reward') {
                $stmt = $pdo->prepare("SELECT Cost FROM Rewards WHERE Id = ?");
                $stmt->execute([$activityId]);
                $reward = $stmt->fetch();
                if (!$reward) {
                    sendJson(['error' => 'Reward not found'], 404);
                }
                $points = -$reward['Cost'];
                
                // Check if child has enough points
                $stmt = $pdo->prepare("SELECT TotalPoints FROM vw_ChildrenPoints WHERE ChildId = ?");
                $stmt->execute([$childId]);
                $childPoints = $stmt->fetch();
                
                if (!$childPoints || $childPoints['TotalPoints'] < $reward['Cost']) {
                    sendJson(['error' => 'Insufficient points'], 400);
                }
            }
            
            // Insert activity log
            $stmt = $pdo->prepare("
                INSERT INTO ActivityLogs (ChildId, ActivityType, ActivityId, Points, Note)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([$childId, $activityType, $activityId, $points, $note]);
            
            sendJson(['success' => true, 'points' => $points], 201);
            break;
    }
}

// === POINTS ENDPOINTS ===
function handlePoints($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                // Get points for specific child
                $stmt = $pdo->prepare("SELECT * FROM vw_ChildrenPoints WHERE ChildId = ?");
                $stmt->execute([$id]);
                $points = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$points) {
                    sendJson(['ChildId' => $id, 'TotalPoints' => 0, 'EarnedPoints' => 0, 'SpentPoints' => 0]);
                }
                sendJson($points);
            } else {
                // Get points for all children
                $stmt = $pdo->query("SELECT * FROM vw_ChildrenPoints ORDER BY ChildName");
                sendJson($stmt->fetchAll(PDO::FETCH_ASSOC));
            }
            break;
    }
}

// === DASHBOARD ENDPOINT ===
function handleDashboard($pdo, $method) {
    if ($method !== 'GET') {
        sendJson(['error' => 'Method not allowed'], 405);
    }
    
    // Get dashboard data
    $dashboard = [];
    
    // Children with current points
    $stmt = $pdo->query("
        SELECT c.*, COALESCE(cp.TotalPoints, 0) as TotalPoints,
               COALESCE(cp.EarnedPoints, 0) as EarnedPoints,
               COALESCE(cp.SpentPoints, 0) as SpentPoints
        FROM Children c
        LEFT JOIN vw_ChildrenPoints cp ON c.Id = cp.ChildId
        WHERE c.IsActive = 1
        ORDER BY c.Name
    ");
    $dashboard['children'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Today's activities
    $stmt = $pdo->query("SELECT * FROM vw_TodayActivities ORDER BY ActivityDate DESC");
    $dashboard['todayActivities'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Today's summary
    $stmt = $pdo->query("
        SELECT * FROM vw_DailySummary 
        WHERE SummaryDate = CAST(GETDATE() AS DATE)
        ORDER BY ChildName
    ");
    $dashboard['todaySummary'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    sendJson($dashboard);
}

?>