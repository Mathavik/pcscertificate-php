<?php
// public/register.php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/User.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON input']);
    exit;
}

$name  = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

// Validate input
if ($name === '' || $email === '' || $password === '') {
    http_response_code(422);
    echo json_encode(['message' => 'Name, email and password are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['message' => 'Please enter a valid email address']);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(422);
    echo json_encode(['message' => 'Password must be at least 6 characters']);
    exit;
}

$pdo = $GLOBALS['pdo'];
$userModel = new User($pdo);

// Check if email already exists
if ($userModel->findByEmail($email)) {
    http_response_code(409);
    echo json_encode(['message' => 'An account with this email already exists']);
    exit;
}

try {
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $id = $userModel->create($name, $email, $passwordHash, 'user');
    $user = $userModel->findById($id);

    http_response_code(201);
    echo json_encode([
        'message' => 'Account created successfully',
        'user'    => $user
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Unable to create account.', 'error' => $e->getMessage()]);
}
?>
