<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

$pdo = $GLOBALS['pdo'];
$collegeName = $_GET['collegeName'] ?? null;

if (!$collegeName) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing collegeName parameter']);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT id, studentName, collegeName, certificateTitle, internshipTitle, department, fromDate, toDate, date, serialNumber FROM certificates WHERE collegeName = :collegeName ORDER BY studentName ASC");
    $stmt->execute([':collegeName' => $collegeName]);
    $certificates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($certificates);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Unable to fetch certificates.', 'error' => $e->getMessage()]);
}
?>
