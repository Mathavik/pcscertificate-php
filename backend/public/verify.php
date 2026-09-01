<?php
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

$serialNumber = $_GET['serialNumber'] ?? null;
if (!$serialNumber) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing serialNumber']);
    exit;
}

$pdo = $GLOBALS['pdo'];
$certModel = new Certificate($pdo);

try {
    $certificate = $certModel->findBySerial($serialNumber);
    if (!$certificate) {
        http_response_code(404);
        echo json_encode(['message' => 'Certificate not found.']);
        exit;
    }
    echo json_encode($certificate);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Unable to fetch certificate.', 'error' => $e->getMessage()]);
}
?>