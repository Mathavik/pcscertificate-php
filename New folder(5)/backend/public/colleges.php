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

try {
    $stmt = $pdo->query("SELECT DISTINCT collegeName FROM certificates WHERE collegeName IS NOT NULL AND collegeName != '' ORDER BY collegeName ASC");
    $colleges = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode($colleges);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Unable to fetch colleges.', 'error' => $e->getMessage()]);
}
?>
