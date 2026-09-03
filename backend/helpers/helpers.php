<?php
// helpers/helpers.php

require_once __DIR__ . '/../models/Certificate.php';
require_once __DIR__ . '/../config/database.php';

// ✅ Include phpqrcode library (now restored to original)
require_once __DIR__ . '/../libs/phpqrcode/qrlib.php';
/**
 * Generate unique serial number
 */
function generateCertificateSerialNumber($pdo)
{
    $year = date('Y');
    $certModel = new Certificate($pdo);
    $count = $certModel->countByYear($year);
    $sequence = str_pad($count + 1, 3, '0', STR_PAD_LEFT);
    return "PCS-{$year}-{$sequence}";
}

/**
 * Generate QR code as base64 data URL
 */
function generateCertificateQRCode($serialNumber)
{
    $dotenv = parse_ini_file(__DIR__ . '/../.env');
    $frontendUrl = $dotenv['FRONTEND_URL'] ?? 'http://192.168.1.7:3002';
    $verifyUrl = "{$frontendUrl}/verify/{$serialNumber}";

    try {
        $tempFile = tempnam(sys_get_temp_dir(), 'qr') . '.png';
        QRcode::png($verifyUrl, $tempFile, QR_ECLEVEL_L, 10, 2);

        $imageData = base64_encode(file_get_contents($tempFile));
        unlink($tempFile);

        return 'data:image/png;base64,' . $imageData;
    } catch (Exception $e) {
        error_log("QR generation failed: " . $e->getMessage());
        return null;
    }
}
?>