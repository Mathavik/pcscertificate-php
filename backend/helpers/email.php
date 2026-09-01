<?php
// helpers/email.php
// Pure PHP SMTP sender (no external libraries / composer).
// Works with Gmail SMTP (and most providers) via STARTTLS or SSL.

function smtpReadLine($socket)
{
    $line = fgets($socket, 512);
    if ($line === false) {
        throw new RuntimeException('SMTP connection lost');
    }
    return rtrim($line, "\r\n");
}

function smtpExpect($socket, $code)
{
    $line = smtpReadLine($socket);
    if (substr($line, 0, 3) !== (string)$code) {
        throw new RuntimeException("SMTP expected $code, got: $line");
    }
    // Some responses are multi-line (e.g. EHLO). Skip continuation lines.
    while (isset($line[3]) && $line[3] === '-') {
        $line = smtpReadLine($socket);
    }
    return $line;
}

function smtpCommand($socket, $command, $expected)
{
    fwrite($socket, $command . "\r\n");
    return smtpExpect($socket, $expected);
}

/**
 * Send email via SMTP using pure PHP sockets.
 * Returns true on success, false on failure (error logged).
 */
function sendPasswordResetEmail($toEmail, $toName, $resetLink)
{
    $dotenv = parse_ini_file(__DIR__ . '/../.env');

    $host     = $dotenv['SMTP_HOST'] ?? 'smtp.gmail.com';
    $port     = $dotenv['SMTP_PORT'] ?? 587;
    $user     = $dotenv['SMTP_USER'] ?? '';
    $pass     = $dotenv['SMTP_PASS'] ?? '';
    $secure   = $dotenv['SMTP_SECURE'] ?? 'tls';
    $fromName = $dotenv['MAIL_FROM_NAME'] ?? 'PCS Certificate';

    // Not configured yet -> fail gracefully, don't send
    if (empty($user) || $user === 'your.email@gmail.com' || empty($pass) || $pass === 'your-16-digit-app-password') {
        error_log("SMTP not configured in .env");
        return false;
    }

    $socket = false;
    try {
        $errno  = 0;
        $errstr = '';
        $remote = "tcp://$host:$port";
        $socket = @stream_socket_client($remote, $errno, $errstr, 15);

        if (!$socket) {
            throw new RuntimeException("Failed to connect to $host:$port -> $errstr ($errno)");
        }

        // 220 greeting
        smtpExpect($socket, 220);

        // EHLO
        smtpCommand($socket, 'EHLO localhost', 250);

        // Upgrade to TLS (STARTTLS) unless already using implicit SSL port
        if ($secure === 'tls' && $port != 465) {
            smtpCommand($socket, 'STARTTLS', 220);
            $crypto = stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            if (!$crypto) {
                throw new RuntimeException('TLS handshake failed');
            }
            smtpCommand($socket, 'EHLO localhost', 250);
        }

        // Authenticate
        smtpCommand($socket, 'AUTH LOGIN', 334);
        smtpCommand($socket, base64_encode($user), 334);
        smtpCommand($socket, base64_encode($pass), 235);

        // Envelope
        smtpCommand($socket, "MAIL FROM:<$user>", 250);
        smtpCommand($socket, "RCPT TO:<$toEmail>", 250);

        // Message
        smtpCommand($socket, 'DATA', 354);

        $subject = 'Password Reset - PCS Certificate';
        $bodyHtml = <<<HTML
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
          <div style="background:#0C0C0C;color:#DCCA87;text-align:center;padding:24px;font-size:18px;font-weight:bold">
            PCS Certificate
          </div>
          <div style="padding:28px">
            <h2 style="color:#111">Hi {$toName},</h2>
            <p style="color:#333;line-height:1.6">We received a request to reset your password. Click the button below to choose a new password.</p>
            <p style="text-align:center;margin:28px 0">
              <a href="{$resetLink}" style="background:#DCCA87;color:#000;text-decoration:none;padding:13px 28px;border-radius:8px;font-weight:bold">Reset Password</a>
            </p>
            <p style="color:#666;font-size:13px;line-height:1.6">Or copy this link:<br><a href="{$resetLink}" style="color:#2563eb;word-break:break-all">{$resetLink}</a></p>
            <p style="color:#999;font-size:12px;margin-top:24px">This link is valid for 30 minutes. If you didn't request this, you can safely ignore this email.</p>
          </div>
        </div>
        HTML;
        $bodyText = "Reset your PCS Certificate password: {$resetLink}\n\nThis link is valid for 30 minutes.";

        $message = "Subject: $subject\r\n"
            . "From: " . mb_encode_mimeheader($fromName) . " <$user>\r\n"
            . "To: " . mb_encode_mimeheader($toName) . " <$toEmail>\r\n"
            . "MIME-Version: 1.0\r\n"
            . "Content-Type: text/html; charset=UTF-8\r\n"
            . "Content-Transfer-Encoding: 8bit\r\n"
            . "\r\n"
            . $bodyHtml
            . "\r\n.\r\n";

        fwrite($socket, $message);
        smtpExpect($socket, 250);

        smtpCommand($socket, 'QUIT', 221);
        fclose($socket);
        return true;

    } catch (Exception $e) {
        error_log("Password reset email failed: " . $e->getMessage());
        if ($socket) {
            fclose($socket);
        }
        return false;
    }
}
?>