<Logging>
> Application and security audit logging strategies.

---

## Purpose
To track application behavior, debug issues, and maintain a strict security audit trail for sensitive business operations.

---

## Overview
- **Application Logs**: General info, debug, and error logs using SLF4J and Logback.
- **Security Audit Logs**: Dedicated logger for tracking sensitive actions.

---

## Business Context
In insurance, it is critical to know *who* approved a claim or *who* issued a policy. Audit logs ensure compliance and non-repudiation.

---

## Security Audit Events
| Event | Trigger | Data Logged |
|---|---|---|
| `LOGIN_SUCCESS` | User authenticates | Email, IP, Timestamp |
| `LOGIN_FAILED` | Bad credentials | Email, IP, Attempt count |
| `CLAIM_APPROVED` | Staff approves claim | Claim ID, Staff ID, Amount |
| `POLICY_ISSUED` | Payment successful | Policy ID, User ID, Premium |

---

## Application Logging Levels
- **ERROR**: System failures, unhandled exceptions. Triggers alerts.
- **WARN**: Handled exceptions, retries, suspicious activity.
- **INFO**: Standard lifecycle events (startup, graceful shutdown).
- **DEBUG**: (Dev only) SQL queries, detailed execution steps.

---

## Design Decisions
- **Why separate SECURITY_AUDIT logger?** We route standard app logs to `app.log` and security events to `audit.log`. This allows security teams to monitor access and modifications without sifting through standard application noise, and ensures audit logs can be backed up or forwarded to a SIEM system separately.

---

## Related Documents
- [../06_Backend/Security.md](Security.md)
- [../06_Backend/Exception_Handling.md](Exception_Handling.md)
