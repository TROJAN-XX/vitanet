# VitaNet — Legal & Regulatory Compliance Framework

VitaNet is architected with complete legal readiness under the Digital Personal Data Protection (DPDP) Act 2023 (India), the Information Technology (Intermediary Guidelines) Rules 2021, and GDPR standards.

---

## 1. Statutory Compliance Matrix

### DPDP Act 2023 (India)
- **Notice & Consent**: Clear, itemized consent on registration regarding personal data storage.
- **Data Minimization**: Only username, email, and password hash are stored; telemetry tracking and ad pixels are banned.
- **Right to Access & Portability**: Fully satisfied via `GET /api/v1/users/me/export` producing machine-readable JSON.
- **Right to Erasure**: Implemented via `DELETE /api/v1/users/me` with media soft-deletion and orphan cleanup.

### IT (Intermediary Guidelines) Rules 2021
- **Grievance Officer**: Contact details and resolution timelines published in `GRIEVANCE.md` and `/legal?tab=grievance`.
- **Content Moderation Mechanism**: Users can flag violative content with categorized reasons via `ReportModal`.
- **Traceability**: Unique `X-Request-Id` and `AuditEvent` immutable audit records maintain complete administrative accountability.

### GDPR (EU)
- **Article 17 (Right to Erasure / 'Forgotten')**: Full account decommissioning and automated purging of stored assets.
- **Article 20 (Right to Data Portability)**: Exportable personal data archives.
- **Article 25 (Data Protection by Design)**: In-browser EXIF stripping removes geolocation data prior to storage.
