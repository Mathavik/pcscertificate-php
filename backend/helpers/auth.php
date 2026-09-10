<?php

function getBearerToken()
{
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = $headers['Authorization'] ?? '';
    if ($authHeader === '' && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }
    if ($authHeader === '' && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    if (preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
        return trim($matches[1]);
    }
    return null;
}

function validateAuthToken($token)
{
    $config = parse_ini_file(__DIR__ . '/../.env');
    $secretKey = $config['AUTH_SECRET'] ?? 'pcsCertificate-secret-key';

    $parts = explode('.', $token);
    if (count($parts) !== 2) return null;

    $payloadRaw = base64_decode($parts[0], true);
    if ($payloadRaw === false) return null;

    $expectedSignature = hash_hmac('sha256', $payloadRaw, $secretKey);
    if (!hash_equals($expectedSignature, $parts[1])) return null;

    $payload = json_decode($payloadRaw, true);
    if (!is_array($payload) || !isset($payload['exp'])) return null;

    if (time() > (int) $payload['exp']) return null;

    return $payload;
}

function require_admin_auth()
{
    $token = getBearerToken();
    $authUser = $token ? validateAuthToken($token) : null;
    if ($authUser === null) {
        http_response_code(401);
        echo json_encode(['message' => 'Unauthorized. Please login again.']);
        exit;
    }
    return $authUser;
}