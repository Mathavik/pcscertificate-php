<?php
// models/User.php

require_once __DIR__ . '/../config/database.php';

class User
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function findByEmail($email)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM users WHERE email = :email");
        $stmt->execute([':email' => $email]);
        return $stmt->fetch();
    }

    public function findById($id)
    {
        $stmt = $this->pdo->prepare("SELECT id, name, email, role, created_at FROM users WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    public function create($name, $email, $passwordHash, $role = 'user')
    {
        $stmt = $this->pdo->prepare(
            "INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, :role)"
        );
        $stmt->execute([
            ':name'     => $name,
            ':email'    => $email,
            ':password' => $passwordHash,
            ':role'     => $role,
        ]);
        return $this->pdo->lastInsertId();
    }

    // ---- Password reset helpers ----

    public function createPasswordReset($email, $token, $expiresAt)
    {
        $stmt = $this->pdo->prepare(
            "INSERT INTO password_resets (email, token, expires_at) VALUES (:email, :token, :expires_at)
             ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at), created_at = CURRENT_TIMESTAMP"
        );
        return $stmt->execute([
            ':email'     => $email,
            ':token'     => $token,
            ':expires_at' => $expiresAt,
        ]);
    }

    public function findPasswordReset($email, $token)
    {
        $stmt = $this->pdo->prepare(
            "SELECT * FROM password_resets WHERE email = :email AND token = :token"
        );
        $stmt->execute([':email' => $email, ':token' => $token]);
        return $stmt->fetch();
    }

    public function deletePasswordReset($email)
    {
        $stmt = $this->pdo->prepare("DELETE FROM password_resets WHERE email = :email");
        return $stmt->execute([':email' => $email]);
    }

    public function updatePassword($email, $passwordHash)
    {
        $stmt = $this->pdo->prepare("UPDATE users SET password = :password WHERE email = :email");
        return $stmt->execute([':password' => $passwordHash, ':email' => $email]);
    }
}
?>
