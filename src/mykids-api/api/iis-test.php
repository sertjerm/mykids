<?php
// /mykids/api/iis-test.php - IIS Server Test
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>IIS MyKids API Test</title>
    <style>
        body { font-family: Segoe UI, Tahoma, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { color: green; } .error { color: red; } .info { color: blue; }
        button { background: #007cba; color: white; padding: 8px 15px; border: none; border-radius: 3px; cursor: pointer; margin: 5px; }
        button:hover { background: #005a87; }
        .response { background: #f8f8f8; border: 1px solid #ddd; padding: 10px; margin-top: 10px; border-radius: 3px; white-space: pre-wrap; font-family: monospace; max-height: 200px; overflow-y: auto; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 MyKids API - IIS Server Test</h1>
        
        <div class="section">
            <h2>1. Server Information</h2>
            <table>
                <tr><th>Property</th><th>Value</th></tr>
                <tr><td>Server Software</td><td class="info"><?= $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown' ?></td></tr>
                <tr><td>PHP Version</td><td class="info"><?= PHP_VERSION ?></td></tr>
                <tr><td>Current Directory</td><td><?= __DIR__ ?></td></tr>
                <tr><td>Document Root</td><td><?= $_SERVER['DOCUMENT_ROOT'] ?? 'N/A' ?></td></tr>
                <tr><td>Script Name</td><td><?= $_SERVER['SCRIPT_NAME'] ?></td></tr>
                <tr><td>Request URI</td><td><?= $_SERVER['REQUEST_URI'] ?></td></tr>
                <tr><td>Server Name</td><td><?= $_SERVER['SERVER_NAME'] ?></td></tr>
                <tr><td>HTTPS</td><td><?= isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'Yes' : 'No' ?></td></tr>
            </table>
        </div>

        <div class="section">
            <h2>2. File Structure Check</h2>
            <?php
            $requiredFiles = ['index.php', 'config.php', 'db.php', 'web.config'];
            echo '<table><tr><th>File</th><th>Status</th><th>Size</th></tr>';
            foreach ($requiredFiles as $file) {
                $path = __DIR__ . '/' . $file;
                $exists = file_exists($path);
                $size = $exists ? filesize($path) : 0;
                $status = $exists ? '<span class="success">✅ Found</span>' : '<span class="error">❌ Missing</span>';
                echo "<tr><td>$file</td><td>$status</td><td>" . ($exists ? number_format($size) . ' bytes' : '-') . "</td></tr>";
            }
            echo '</table>';
            ?>
        </div>

        <div class="section">
            <h2>3. Database Connection Test</h2>
            <?php
            try {
                if (file_exists(__DIR__ . '/config.php')) {
                    $config = require __DIR__ . '/config.php';
                    echo '<span class="success">✅ Config file loaded</span><br>';
                    echo 'Database: ' . $config['db']['database'] . '<br>';
                    echo 'Host: ' . $config['db']['host'] . '<br>';
                    
                    if (file_exists(__DIR__ . '/db.php')) {
                        require __DIR__ . '/db.php';
                        $pdo = get_pdo();
                        echo '<span class="success">✅ Database connected successfully</span><br>';
                        
                        // Test query
                        $stmt = $pdo->query("SELECT COUNT(*) as count FROM Children WHERE IsActive = 1");
                        $result = $stmt->fetch();
                        echo 'Active children count: <strong>' . $result['count'] . '</strong><br>';
                        
                        $stmt = $pdo->query("SELECT COUNT(*) as count FROM GoodBehaviors WHERE IsActive = 1");
                        $result = $stmt->fetch();
                        echo 'Good behaviors count: <strong>' . $result['count'] . '</strong><br>';
                        
                        $stmt = $pdo->query("SELECT COUNT(*) as count FROM Rewards WHERE IsActive = 1");
                        $result = $stmt->fetch();
                        echo 'Rewards count: <strong>' . $result['count'] . '</strong><br>';
                    }
                } else {
                    echo '<span class="error">❌ Config file not found</span>';
                }
            } catch (Exception $e) {
                echo '<span class="error">❌ Database error: ' . htmlspecialchars($e->getMessage()) . '</span>';
            }
            ?>
        </div>

        <div class="section">
            <h2>4. IIS URL Rewrite Test</h2>
            <p>Testing different URL formats that should work with IIS:</p>
            
            <h3>Query Parameter Format (recommended for IIS):</h3>
            <a href="?health" target="_blank">?health</a> | 
            <a href="?children" target="_blank">?children</a> | 
            <a href="?behaviors" target="_blank">?behaviors</a> | 
            <a href="?rewards" target="_blank">?rewards</a> | 
            <a href="?dashboard" target="_blank">?dashboard</a>
            
            <h3>Clean URL Format (requires URL Rewrite):</h3>
            <a href="health" target="_blank">health</a> | 
            <a href="children" target="_blank">children</a> | 
            <a href="behaviors" target="_blank">behaviors</a> | 
            <a href="rewards" target="_blank">rewards</a> | 
            <a href="dashboard" target="_blank">dashboard</a>
        </div>

        <div class="section">
            <h2>5. JavaScript API Tests</h2>
            <p>Click buttons to test API endpoints:</p>
            
            <button onclick="testAPI('health')">Test Health</button>
            <button onclick="testAPI('children')">Test Children</button>
            <button onclick="testAPI('behaviors')">Test Behaviors</button>
            <button onclick="testAPI('rewards')">Test Rewards</button>
            <button onclick="testAPI('dashboard')">Test Dashboard</button>
            <button onclick="testCreateChild()">Test Create Child</button>
            
            <div id="apiResponse" class="response">Click buttons above to test API endpoints...</div>
        </div>

        <div class="section">
            <h2>6. cURL Commands for Testing</h2>
            <p>Use these commands in command prompt or PowerShell:</p>
            <div class="response">
# Test health endpoint
curl "https://apps4.coop.ku.ac.th/mykids/api/?health"
curl "https://apps4.coop.ku.ac.th/mykids/api/health"

# Test children endpoint  
curl "https://apps4.coop.ku.ac.th/mykids/api/?children"
curl "https://apps4.coop.ku.ac.th/mykids/api/children"

# Test dashboard
curl "https://apps4.coop.ku.ac.th/mykids/api/?dashboard"
curl "https://apps4.coop.ku.ac.th/mykids/api/dashboard"

# Create new child (POST)
curl -X POST "https://apps4.coop.ku.ac.th/mykids/api/?children" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"น้องทดสอบ\",\"age\":5,\"emoji\":\"😊\",\"backgroundColor\":\"#fecaca\"}"
            </div>
        </div>

        <div class="section">
            <h2>7. IIS Configuration Check</h2>
            <?php
            $webConfigExists = file_exists(__DIR__ . '/web.config');
            if ($webConfigExists) {
                echo '<span class="success">✅ web.config file found</span><br>';
                $webConfigContent = file_get_contents(__DIR__ . '/web.config');
                if (strpos($webConfigContent, 'rewrite') !== false) {
                    echo '<span class="success">✅ URL rewrite rules configured</span><br>';
                } else {
                    echo '<span class="error">❌ URL rewrite rules not found in web.config</span><br>';
                }
                if (strpos($webConfigContent, 'Access-Control-Allow-Origin') !== false) {
                    echo '<span class="success">✅ CORS headers configured</span><br>';
                } else {
                    echo '<span class="error">❌ CORS headers not configured</span><br>';
                }
            } else {
                echo '<span class="error">❌ web.config file not found</span><br>';
                echo 'Please create web.config file for URL rewriting and CORS.';
            }
            ?>
        </div>

        <div class="section">
            <h2>8. Troubleshooting Tips</h2>
            <ul>
                <li><strong>404 errors:</strong> Check if IIS URL Rewrite module is installed and enabled</li>
                <li><strong>CORS errors:</strong> Verify web.config has correct CORS headers</li>
                <li><strong>Database errors:</strong> Check config.php database credentials</li>
                <li><strong>PHP errors:</strong> Check IIS error logs in Event Viewer</li>
                <li><strong>Permission issues:</strong> Ensure IIS_IUSRS has read/execute permissions</li>
            </ul>
        </div>
    </div>

    <script>
        const API_BASE = window.location.href.replace('iis-test.php', '');
        
        async function testAPI(endpoint) {
            const responseDiv = document.getElementById('apiResponse');
            responseDiv.textContent = `Testing ${endpoint} endpoint...`;
            
            try {
                // Try query parameter format first (works better with IIS)
                let url = `${API_BASE}?${endpoint}`;
                let response = await fetch(url);
                let data = await response.json();
                
                responseDiv.textContent = `✅ ${endpoint.toUpperCase()} Success:\n${JSON.stringify(data, null, 2)}`;
                
            } catch (error) {
                // Try clean URL format as fallback
                try {
                    let fallbackUrl = `${API_BASE}${endpoint}`;
                    let fallbackResponse = await fetch(fallbackUrl);
                    let fallbackData = await fallbackResponse.json();
                    
                    responseDiv.textContent = `✅ ${endpoint.toUpperCase()} Success (fallback URL):\n${JSON.stringify(fallbackData, null, 2)}`;
                } catch (fallbackError) {
                    responseDiv.textContent = `❌ ${endpoint.toUpperCase()} Failed:\n${error.message}\nFallback also failed: ${fallbackError.message}`;
                }
            }
        }
        
        async function testCreateChild() {
            const responseDiv = document.getElementById('apiResponse');
            responseDiv.textContent = 'Testing child creation...';
            
            try {
                const newChild = {
                    name: 'น้องทดสอบ IIS',
                    age: 5,
                    emoji: '🧪',
                    backgroundColor: '#bae6fd'
                };
                
                const response = await fetch(`${API_BASE}?children`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newChild)
                });
                
                const data = await response.json();
                responseDiv.textContent = `✅ CREATE CHILD Success:\n${JSON.stringify(data, null, 2)}`;
                
            } catch (error) {
                responseDiv.textContent = `❌ CREATE CHILD Failed:\n${error.message}`;
            }
        }
    </script>
</body>
</html>