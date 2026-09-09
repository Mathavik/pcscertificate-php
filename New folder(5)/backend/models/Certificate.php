<?php
// models/Certificate.php

require_once __DIR__ . '/../config/database.php';

class Certificate
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Helper to cast boolean fields to integer (0/1)
     */
    private function castBooleans(&$data)
    {
        $booleanFields = ['hideReportingManager', 'hidePosition', 'hideDepartment', 'hideLocation'];
        foreach ($booleanFields as $field) {
            if (isset($data[$field])) {
                $data[$field] = $data[$field] ? 1 : 0;
            } else {
                $data[$field] = 0; // default if missing
            }
        }
    }

    // Create a new certificate
    public function create($data)
    {
        // ✅ Cast boolean fields
        $this->castBooleans($data);

        // ✅ Add timestamps
        $now = date('Y-m-d H:i:s');
        $data['createdAt'] = $now;
        $data['updatedAt'] = $now;

        $sql = "INSERT INTO certificates (
                    studentName, collegeName, fromDate, toDate, date, certificateTitle,
                    projectTitle, certificateContent, signatoryTitle, attendanceTotalDays,
                    attendanceDaysAttended, attendancePercentage, internshipTitle,
                    internshipCompletionTitle, position, department, reportingManager,
                    location, hideReportingManager, hidePosition, hideDepartment,
                    hideLocation, wishMessage, signatureImage, serialNumber, qrCode,
                    createdAt, updatedAt
                ) VALUES (
                    :studentName, :collegeName, :fromDate, :toDate, :date, :certificateTitle,
                    :projectTitle, :certificateContent, :signatoryTitle, :attendanceTotalDays,
                    :attendanceDaysAttended, :attendancePercentage, :internshipTitle,
                    :internshipCompletionTitle, :position, :department, :reportingManager,
                    :location, :hideReportingManager, :hidePosition, :hideDepartment,
                    :hideLocation, :wishMessage, :signatureImage, :serialNumber, :qrCode,
                    :createdAt, :updatedAt
                )";
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($data);
        return $this->pdo->lastInsertId();
    }

    // Update certificate by id (do not allow serialNumber or qrCode update)
    public function update($id, $data)
    {
        unset($data['serialNumber'], $data['qrCode']); // prevent override

        // ✅ Cast boolean fields
        $this->castBooleans($data);

        // ✅ Update updatedAt timestamp
        $data['updatedAt'] = date('Y-m-d H:i:s');

        $fields = [];
        $params = [];
        foreach ($data as $key => $value) {
            $fields[] = "$key = :$key";
            $params[":$key"] = $value;
        }
        $params[':id'] = $id;
        $sql = "UPDATE certificates SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($params);
    }

    // Find by primary key
    public function findById($id)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM certificates WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    // Find by serial number
    public function findBySerial($serialNumber)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM certificates WHERE serialNumber = :serial");
        $stmt->execute([':serial' => $serialNumber]);
        return $stmt->fetch();
    }

    // Get all certificates ordered by createdAt DESC
    public function findAll()
    {
        $stmt = $this->pdo->query("SELECT * FROM certificates ORDER BY createdAt DESC");
        return $stmt->fetchAll();
    }

    // Get stats: count per certificateTitle (normalized)
    public function getStats()
    {
        $sql = "SELECT 
                    UPPER(TRIM(REPLACE(certificateTitle, '  ', ' '))) AS certificateTitle,
                    COUNT(id) AS count
                FROM certificates
                GROUP BY UPPER(TRIM(REPLACE(certificateTitle, '  ', ' ')))";
        $stmt = $this->pdo->query($sql);
        return $stmt->fetchAll();
    }

    // Count certificates created in a given year (for serial generation)
    public function countByYear($year)
    {
        $stmt = $this->pdo->prepare("SELECT COUNT(*) AS cnt FROM certificates WHERE YEAR(createdAt) = :year");
        $stmt->execute([':year' => $year]);
        $row = $stmt->fetch();
        return $row['cnt'] ?? 0;
    }
}
?>