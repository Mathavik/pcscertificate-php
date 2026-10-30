ALTER TABLE completion_certificates
    ADD COLUMN certificateID TINYINT UNSIGNED NOT NULL DEFAULT 1;

UPDATE completion_certificates
SET certificateID = MOD(id - 1, 100) + 1;
