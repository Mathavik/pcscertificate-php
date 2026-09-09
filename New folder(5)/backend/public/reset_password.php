<?php
// public/reset_password.php

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

$email = trim($input['email'] ?? '');
$token = trim($input['token'] ?? '');
$password = $input['password'] ?? '';

if ($email === '' || $token === '' || $password === '') {
    http_response_code(422);
    echo json_encode(['message' => 'Email, token and new password are required']);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(422);
    echo json_encode(['message' => 'Password must be at least 6 characters']);
    exit;
}

$pdo = $GLOBALS['pdo'];
$userModel = new User($pdo);

try {
    $reset = $userModel->findPasswordReset($email, $token);
    if (!$reset) {
        http_response_code(400);
        echo json_encode(['message' => 'Invalid or expired reset link']);
        exit;
    }

    if (strtotime($reset['expires_at']) < time()) {
        $userModel->deletePasswordReset($email);
        http_response_code(400);
        echo json_encode(['message' => 'This reset link has expired. Please request a new one.']);
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $userModel->updatePassword($email, $passwordHash);
    $userModel->deletePasswordReset($email);

    http_response_code(200);
    echo json_encode(['message' => 'Password reset successfully. You can now login.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Unable to reset password.', 'error' => $e->getMessage()]);
}
?>
