<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/Certificate.php';
require_once __DIR__ . '/../helpers/helpers.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON input']);
    exit;
}

// Validate required fields
$requiredFields = ['studentName', 'collegeName', 'fromDate', 'toDate', 'date', 'certificateTitle'];
$missing = [];
foreach ($requiredFields as $field) {
    if (empty($input[$field])) {
        $missing[] = $field;
    }
}
if (!empty($missing)) {
    http_response_code(422);
    echo json_encode([
        'message' => 'Missing required fields',
        'missing' => $missing
    ]);
    exit;
}

$pdo = $GLOBALS['pdo'];
$certModel = new Certificate($pdo);

try {
    // ✅ CORRECT function names (matches helpers.php)
    $serialNumber = generateCertificateSerialNumber($pdo);
    $qrCode = generateCertificateQRCode($serialNumber);

    if ($qrCode === null) {
        error_log("QR generation failed for serial: $serialNumber");
    }

    // Merge input with generated fields
    $data = array_merge($input, [
        'serialNumber' => $serialNumber,
        'qrCode'       => $qrCode
    ]);

    // Insert into database
    $id = $certModel->create($data);

    // Fetch the newly created certificate
    $newCert = $certModel->findById($id);

    http_response_code(201);
    echo json_encode($newCert);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'message' => 'Database error while creating certificate.',
        'error'   => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'message' => 'Unable to create certificate.',
        'error'   => $e->getMessage()
    ]);
}
?>