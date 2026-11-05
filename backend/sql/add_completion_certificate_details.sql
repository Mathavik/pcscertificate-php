ALTER TABLE completion_certificates
    ADD COLUMN studentName VARCHAR(255) NOT NULL DEFAULT '' AFTER certificateTitle,
    ADD COLUMN courseTitle VARCHAR(255) NOT NULL DEFAULT '' AFTER studentName,
    ADD COLUMN fromDate DATE NULL AFTER courseTitle,
    ADD COLUMN toDate DATE NULL AFTER fromDate,
    ADD COLUMN dateOfIssue DATE NULL AFTER toDate,
    ADD COLUMN signatureImage LONGTEXT NULL AFTER dateOfIssue;
