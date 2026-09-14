# Contributing to VitaNet

Thank you for your interest in contributing to VitaNet! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Follow the setup instructions in [README.md](README.md)
4. Create a feature branch from `main`

## Development Workflow

1. **Branch naming**: `feature/description`, `fix/description`, `docs/description`
2. **Commits**: Use clear, descriptive commit messages
3. **Pull Requests**: Open a PR against `main` with a description of changes

## Code Standards

- **Server**: JavaScript with JSDoc type annotations
- **Client**: React with functional components and hooks
- **Validation**: All input validated with Zod
- **Testing**: Write unit tests for new logic
- **Linting**: Run `npm run lint` before committing

## Security

- Never commit secrets, API keys, or credentials
- Never log sensitive data (passwords, tokens, request bodies)
- Report security vulnerabilities privately — see [SECURITY.md](SECURITY.md)

## Code of Conduct

All contributors must follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Questions?

Open a GitHub Discussion or reach out to the maintainers.
