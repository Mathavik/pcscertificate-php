<?php
// public/login.php

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

$email    = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if ($email === '' || $password === '') {
    http_response_code(422);
    echo json_encode(['message' => 'Email and password are required']);
    exit;
}

$pdo = $GLOBALS['pdo'];
$userModel = new User($pdo);

// Generate a stable session token = SHA256 of (email + secret salt)
// NOTE: For production, use a proper JWT library. This is a lightweight approach.
$user = $userModel->findByEmail($email);

if (!$user || !password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Invalid email or password']);
    exit;
}

// Build token
$dotenvLogin = parse_ini_file(__DIR__ . '/../.env');
$secretKey = $dotenvLogin['AUTH_SECRET'] ?? 'pcsCertificate-secret-key';
$payload = json_encode([
    'user_id' => $user['id'],
    'email'   => $user['email'],
    'exp'     => time() + (7 * 24 * 60 * 60), // 7 days
]);
$token = base64_encode($payload) . '.' . hash_hmac('sha256', $payload, $secretKey);

http_response_code(200);
echo json_encode([
    'message' => 'Login successful',
    'token'   => $token,
    'user'    => [
        'id'    => $user['id'],
        'name'  => $user['name'],
        'email' => $user['email'],
        'role'  => $user['role'],
    ]
]);
?>
