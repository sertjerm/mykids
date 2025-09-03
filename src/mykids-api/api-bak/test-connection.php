<?php
// กำหนด charset สำหรับการแสดงผล
header('Content-Type: text/html; charset=utf-8');

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$config = require 'config.php';
$db = $config['db'];

$connectionInfo = [
    "Database" => $db['database'],
    "UID" => $db['username'],
    "PWD" => $db['password'],
    "MultipleActiveResultSets" => true,
    "CharacterSet" => "UTF-8"  // เพิ่ม charset สำหรับการเชื่อมต่อ
];
$conn = sqlsrv_connect($db['host'], $connectionInfo);

if ($conn) {
    echo "✅ Connected successfully!<br><br>";
    
    // ทดสอบอ่านข้อมูลจากตาราง Children
    $sql = "SELECT * FROM Children";
    $stmt = sqlsrv_query($conn, $sql);
    
    if ($stmt === false) {
        echo "❌ Query failed!<br>";
        print_r(sqlsrv_errors());
    } else {
        echo "📋 <strong>Children Table Data:</strong><br>";
        echo "<table border='1' style='border-collapse: collapse; margin: 10px 0;'>";
        
        // แสดงหัวตาราง
        $hasRows = false;
        while ($row = sqlsrv_fetch_array($stmt, SQLSRV_FETCH_ASSOC)) {
            if (!$hasRows) {
                echo "<tr style='background-color: #f0f0f0;'>";
                foreach (array_keys($row) as $column) {
                    echo "<th style='padding: 8px; border: 1px solid #ddd;'>$column</th>";
                }
                echo "</tr>";
                $hasRows = true;
            }
            
            // แสดงข้อมูล
            echo "<tr>";
            foreach ($row as $value) {
                // แปลงค่าให้เป็น string ก่อนส่งไปยัง htmlspecialchars
                if ($value instanceof DateTime) {
                    $displayValue = $value->format('Y-m-d H:i:s');
                } elseif (is_null($value)) {
                    $displayValue = '';
                } else {
                    $displayValue = (string)$value;
                }
                
                echo "<td style='padding: 8px; border: 1px solid #ddd;'>" . htmlspecialchars($displayValue, ENT_QUOTES, 'UTF-8') . "</td>";
            }
            echo "</tr>";
        }
        
        if (!$hasRows) {
            echo "<tr><td colspan='100%' style='padding: 8px; text-align: center;'>No data found</td></tr>";
        }
        
        echo "</table>";
        sqlsrv_free_stmt($stmt);
    }
    
    sqlsrv_close($conn);
} else {
    echo "❌ Connection failed!<br>";
    print_r(sqlsrv_errors());
}