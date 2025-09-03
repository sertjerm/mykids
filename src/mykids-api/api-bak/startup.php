<?php
// api/startup.php
$cfg = require __DIR__.'/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: '.$cfg['cors']['allow_origin']);
header('Access-Control-Allow-Credentials: '.$cfg['cors']['allow_credentials']);
header('Access-Control-Allow-Headers: '.$cfg['cors']['allow_headers']);
header('Access-Control-Allow-Methods: '.$cfg['cors']['allow_methods']);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204); exit;
}

function json_ok($data = [], int $code = 200) {
  http_response_code($code);
  echo json_encode(['ok'=>true,'data'=>$data], JSON_UNESCAPED_UNICODE);
  exit;
}
function json_err($message, int $code = 400, $extra = null) {
  http_response_code($code);
  echo json_encode(['ok'=>false,'error'=>$message,'extra'=>$extra], JSON_UNESCAPED_UNICODE);
  exit;
}
function read_json() {
  $raw = file_get_contents('php://input');
  if ($raw === '' || $raw === false) return [];
  $j = json_decode($raw, true);
  return is_array($j) ? $j : [];
}
