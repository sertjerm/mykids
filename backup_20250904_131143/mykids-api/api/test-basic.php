<?php
// /mykids/api/test-basic.php - Basic PHP Test
header('Content-Type: application/json; charset=utf-8');

try {
    $response = [
        'status' => 'PHP_WORKS',
        'php_version' => PHP_VERSION,
        'timestamp' => date('Y-m-d H:i:s'),
        'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'method' => $_SERVER['REQUEST_METHOD'],
        'request_uri' => $_SERVER['REQUEST_URI'],
        'script_name' => $_SERVER['SCRIPT_NAME'],
        'query_string' => $_SERVER['QUERY_STRING'] ?? '',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? '',
        'current_dir' => __DIR__,
        'files_in_dir' => array_values(array_diff(scandir(__DIR__), ['.', '..'])),
        'get_params' => $_GET,
        'post_params' => $_POST
    ];
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'error' => 'PHP_ERROR', 
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>