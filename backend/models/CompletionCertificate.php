<?php

class CompletionCertificate
{
    private $pdo;

    public function __construct($pdo)
    {
        $this->pdo = $pdo;
    }

    public function create($data)
    {
        $startTransaction = !$this->pdo->inTransaction();
        if ($startTransaction) {
            $this->pdo->beginTransaction();
        }

        try {
            $stmt = $this->pdo->prepare(
                "INSERT INTO completion_certificates (serialNumber, completionType, certificateTitle)
                 VALUES (:serialNumber, :completionType, :certificateTitle)"
            );
            $stmt->execute([
                ':serialNumber' => $data['serialNumber'],
                ':completionType' => $data['completionType'],
                ':certificateTitle' => $data['certificateTitle'],
            ]);

            $id = (int)$this->pdo->lastInsertId();
            $certificateId = (($id - 1) % 100) + 1;
            $stmt = $this->pdo->prepare(
                "UPDATE completion_certificates SET certificateID = :certificateID WHERE id = :id"
            );
            $stmt->execute([
                ':certificateID' => $certificateId,
                ':id' => $id,
            ]);

            if ($startTransaction) {
                $this->pdo->commit();
            }

            return $id;
        } catch (Throwable $e) {
            if ($startTransaction && $this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        }
    }

    public function update($id, $data)
    {
        $stmt = $this->pdo->prepare(
            "UPDATE completion_certificates
             SET serialNumber = :serialNumber,
                 completionType = :completionType,
                 certificateTitle = :certificateTitle
             WHERE id = :id"
        );
        $stmt->execute([
            ':serialNumber' => $data['serialNumber'],
            ':completionType' => $data['completionType'],
            ':certificateTitle' => $data['certificateTitle'],
            ':id' => $id,
        ]);

        return $stmt->rowCount() > 0;
    }

    public function findById($id)
    {
        $stmt = $this->pdo->prepare("SELECT * FROM completion_certificates WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    public function findAll()
    {
        $stmt = $this->pdo->query(
            "SELECT * FROM completion_certificates ORDER BY createdAt DESC, id DESC"
        );
        return $stmt->fetchAll();
    }
}
?>
