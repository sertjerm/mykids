<?php
// api/db.php
function get_pdo(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;

  $cfg = require __DIR__.'/config.php';
  $db  = $cfg['db'];

  $dsn = "sqlsrv:Server={$db['host']},{$db['port']};Database={$db['database']}";
  $opts = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::SQLSRV_ATTR_ENCODING => PDO::SQLSRV_ENCODING_UTF8,
  ];
  if (!empty($db['encrypt'])) {
    $opts[PDO::SQLSRV_ATTR_ENCRYPT] = true;
  }
  $pdo = new PDO($dsn, $db['username'], $db['password'], $opts);
  return $pdo;
}
