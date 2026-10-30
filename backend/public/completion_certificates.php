<?php

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/CompletionCertificate.php';
require_once __DIR__ . '/../helpers/auth.php';

require_admin_auth();

$pdo = $GLOBALS['pdo'];
$completionCertificateModel = new CompletionCertificate($pdo);
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        echo json_encode($completionCertificateModel->findAll());
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'message' => 'Unable to fetch completion certificates.',
            'error' => $e->getMessage(),
        ]);
    }
    exit;
}

if ($method !== 'POST' && $method !== 'PUT') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON input']);
    exit;
}

$serialNumberInput = $input['serialNumber'] ?? null;
$certificateTitleInput = $input['certificateTitle'] ?? null;
$completionTypes = $input['completionType'] ?? null;
$allowedTypes = ['Internship', 'Course', 'Project'];

if (
    !is_string($serialNumberInput) ||
    !is_string($certificateTitleInput) ||
    !is_array($completionTypes)
) {
    http_response_code(422);
    echo json_encode([
        'message' => 'serialNumber, completionType, and certificateTitle are required.',
    ]);
    exit;
}

foreach ($completionTypes as $type) {
    if (!is_string($type) || !in_array($type, $allowedTypes, true)) {
        http_response_code(422);
        echo json_encode(['message' => 'completionType contains an invalid value.']);
        exit;
    }
}

$serialNumber = trim($serialNumberInput);
$certificateTitle = trim(preg_replace('/\s+/', ' ', $certificateTitleInput));
if ($serialNumber === '' || $certificateTitle === '') {
    http_response_code(422);
    echo json_encode([
        'message' => 'serialNumber and certificateTitle cannot be empty.',
    ]);
    exit;
}

$completionTypes = array_values(array_unique($completionTypes));
if (count($completionTypes) === 0) {
    http_response_code(422);
    echo json_encode([
        'message' => 'Select at least one completion type before saving.',
    ]);
    exit;
}

$data = [
    'serialNumber' => $serialNumber,
    'completionType' => implode(', ', $completionTypes),
    'certificateTitle' => $certificateTitle,
];

try {
    if ($method === 'POST') {
        $id = $completionCertificateModel->create($data);
        http_response_code(201);
    } else {
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
        if (!$id || !$completionCertificateModel->findById($id)) {
            http_response_code(404);
            echo json_encode(['message' => 'Completion certificate not found.']);
            exit;
        }

        $completionCertificateModel->update($id, $data);
    }

    echo json_encode($completionCertificateModel->findById($id));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'message' => 'Unable to save completion certificate.',
        'error' => $e->getMessage(),
    ]);
}
?>
