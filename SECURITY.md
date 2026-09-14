# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in VitaNet, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

### How to Report

1. Email: Send details to the project maintainer (see repository contact)
2. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgement**: Within 48 hours
- **Initial assessment**: Within 7 days
- **Fix target**: Within 30 days for critical issues

### Scope

The following are in scope:
- Authentication and authorization bypasses
- Injection vulnerabilities (SQL, NoSQL, XSS, etc.)
- Insecure direct object references (IDOR)
- Information disclosure (credentials, PII leaks)
- CSRF vulnerabilities
- Rate limit bypasses
- Media access control issues
- Presigned URL security issues

### Out of Scope

- Social engineering attacks
- Denial of service (DoS) attacks against free-tier infrastructure
- Issues in third-party services (MongoDB Atlas, Cloudflare, Render, Brevo)
- Issues requiring physical access

## Security Architecture

See [docs/SECURITY.md](docs/SECURITY.md) for the full security architecture documentation.

## Responsible Disclosure

We follow responsible disclosure practices. We will credit reporters (with permission) in security advisories.
