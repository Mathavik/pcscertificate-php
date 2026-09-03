<?php
// public/forgot_password.php

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
require_once __DIR__ . '/../helpers/email.php';

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['message' => 'Invalid JSON input']);
    exit;
}

$email = trim($input['email'] ?? '');
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['message' => 'Please enter a valid email address']);
    exit;
}

$pdo = $GLOBALS['pdo'];
$userModel = new User($pdo);

// Always respond the same regardless of whether the email exists (avoid user enumeration)
$user = $userModel->findByEmail($email);
if (!$user) {
    http_response_code(200);
    echo json_encode(['message' => 'If an account exists for this email, a reset link has been sent.']);
    exit;
}

try {
    $token = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', time() + (60 * 30)); // 30 minutes
    $userModel->createPasswordReset($email, $token, $expiresAt);

    $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://192.168.1.7:3002';
    $resetLink = "{$frontendUrl}/reset-password?token={$token}&email=" . urlencode($email);

    // Send reset link email via SMTP
    $mailSent = sendPasswordResetEmail($user['email'], $user['name'], $resetLink);

    http_response_code(200);
    echo json_encode([
        'message' => 'If an account exists for this email, a reset link has been sent.',
        'devResetLink' => $resetLink, // Helps local testing
        'emailSent' => $mailSent
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Unable to process request.', 'error' => $e->getMessage()]);
}
?>
