<?php
// api/config.php
return [
  'db' => [
    // ใส่ค่าให้ตรงกับ SQL Server ของพี่
    'host' => '127.0.0.1',
    'port' => 1433,
    'database' => 'MyKidsDB',
    'username' => 'sa',
    'password' => 'password',
    'encrypt'  => false, // ถ้าต้องการ TLS ให้ตั้ง true และ config certificate
  ],
  // ปรับ origin ให้ตรง domain/frontend ของพี่
  'cors' => [
    'allow_origin' => 'https://apps4.coop.ku.ac.th', // หรือ * ถ้าไม่ใช้ credential
    'allow_credentials' => 'true',
    'allow_headers' => 'Content-Type, Authorization',
    'allow_methods' => 'GET, POST, PUT, DELETE, OPTIONS',
  ],
];
