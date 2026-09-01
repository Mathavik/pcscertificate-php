<?php
// public/list.php

// ✅ CORS Headers – MUST BE AT THE TOP BEFORE ANY OUTPUT
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

// ✅ Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}


require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Certificate.php';

$pdo = $GLOBALS['pdo'];
$certModel = new Certificate($pdo);

try {
    $certificates = $certModel->findAll();
    echo json_encode($certificates);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Unable to fetch certificates.', 'error' => $e->getMessage()]);
}
?>