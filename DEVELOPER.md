# Developer Guide

This document contains information for developers working on the `@nmeierpolys/mcp-structured-memory` package.

## Development Setup

### Prerequisites
- Node.js >= 20.0.0
- npm

### Installation
```bash
npm install
```

### Development Commands

```bash
# Build the project
npm run build

# Build in watch mode
npm run build:watch

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Clean build directory
npm run clean

# Start the built package
npm start

# Development mode (build + start)
npm run dev

# Pre-release checks (tests + linting)
npm run pre-release
```

## Release Process

Versions, tags, and GitHub releases are handled by [release-please](https://github.com/googleapis/release-please-action). npm publishing is manual.

### How a release happens

1. Merge PRs to `main` with conventional commit titles. Squash merges use the PR title.
   - `feat:` gives a minor bump, `fix:` a patch, and `feat!:` or a `BREAKING CHANGE:` footer a major bump.
2. Every push to `main` runs the `release-please` job in `.github/workflows/ci.yml`. It opens or updates a **Release PR** titled `chore(main): release X.Y.Z`. That PR bumps `package.json` and `package-lock.json` and updates `CHANGELOG.md`.
3. When you want to ship, merge the Release PR. The job then creates the `vX.Y.Z` tag and the GitHub release.
4. Publish to npm manually from the tagged commit:

```bash
git pull origin main
npm run pre-release
npm publish
```

`prepublishOnly` rebuilds `dist/` before publishing.

Don't edit the version in `package.json` by hand. The Release PR owns it.

### One-time setup

- **Repo setting:** Settings → Actions → General → enable "Allow GitHub Actions to create and approve pull requests".
- **Secret:** add `RELEASE_PLEASE_TOKEN`, a fine-grained PAT for this repo with Contents: read/write and Pull requests: read/write. It's required because PRs opened with the default `GITHUB_TOKEN` don't trigger CI, so the Release PR's required checks would never report.
- **npm:** `npm whoami` must succeed locally. Publishing uses your local npm login, not a CI token.
