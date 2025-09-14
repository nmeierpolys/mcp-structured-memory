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

The package includes both manual release scripts and automated GitHub workflows for releases. All release processes automatically run pre-release checks to ensure code quality.

### Manual Release Commands

These commands create tags that trigger the manual release workflow:

#### Patch Release (Bug Fixes)
```bash
npm run release:patch
```
- Runs tests and linting checks
- Bumps patch version (e.g., 0.1.2 → 0.1.3)
- Creates git commit and tag
- Pushes to GitHub
- Publishes to npm

#### Minor Release (New Features)
```bash
npm run release:minor
```
- Runs tests and linting checks
- Bumps minor version (e.g., 0.1.2 → 0.2.0)
- Creates git commit and tag
- Pushes to GitHub
- Publishes to npm

#### Major Release (Breaking Changes)
```bash
npm run release:major
```
- Runs tests and linting checks
- Bumps major version (e.g., 0.1.2 → 1.0.0)
- Creates git commit and tag
- Pushes to GitHub
- Publishes to npm


## Automated Release Workflows

The project includes GitHub Actions workflows that automate the release process:

### Auto-Release Workflow

**Trigger**: Every push to `main` branch (ignores documentation-only changes)

**What it does**:
- Runs tests, linting, and type checking
- Automatically creates patch releases (e.g., 0.1.2 → 0.1.3)
- Publishes to npm
- Creates GitHub releases with changelog links

**When it runs**: Automatically on every code change pushed to main

### Manual Release Workflow

**Trigger**: When you push a git tag (via `npm run release:*` commands)

**What it does**:
- Runs tests, linting, and builds
- Publishes the tagged version to npm
- Creates GitHub releases

**When it runs**: When you manually create releases using:
```bash
npm run release:patch   # Creates v0.1.3, triggers manual workflow
npm run release:minor    # Creates v0.2.0, triggers manual workflow
npm run release:major    # Creates v1.0.0, triggers manual workflow
```

### Workflow Setup

To enable automated releases, you need to:

1. **Add NPM Token to GitHub Secrets**:
   - Go to repo → Settings → Secrets and variables → Actions
   - Add repository secret named `NPM_TOKEN`
   - Value: Your npm automation token

2. **Create NPM Token**:
   ```bash
   npm token create --read-only=false
   ```

### Manual Release Process

If you need to perform a manual release (not recommended), follow these steps:

```bash
# 1. Update version in package.json
# 2. Commit the change
git add package.json
git commit -m "Bump version to X.Y.Z"

# 3. Create and push tag
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z

# 4. Build and publish
npm run build
npm publish
```

