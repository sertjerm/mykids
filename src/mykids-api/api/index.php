<?php
// api/index.php
require __DIR__.'/startup.php';   // ← เดิมเป็น bootstrap.php
require __DIR__.'/db.php';
require __DIR__.'/helpers.php';

$pdo   = get_pdo();
$parts = path_parts();
$method = $_SERVER['REQUEST_METHOD'];

// ... โค้ด router/endpoint เดิมของพี่วางต่อจากนี้ได้เลย ...
