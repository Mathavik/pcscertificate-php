<?php
// public/update.php

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

$id = $_GET['id'] ?? null;
if (!$id) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing certificate ID']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON input']);
    exit;
}

$pdo = $GLOBALS['pdo'];
$certModel = new Certificate($pdo);

$existing = $certModel->findById($id);
if (!$existing) {
    http_response_code(404);
    echo json_encode(['message' => 'Certificate not found.']);
    exit;
}

try {
    unset($input['serialNumber'], $input['qrCode']); // prevent override
    $certModel->update($id, $input);
    $updated = $certModel->findById($id);
    echo json_encode($updated);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Unable to update certificate.', 'error' => $e->getMessage()]);
}
?>