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

The package includes manual release scripts that handle version bumping, git tagging, and npm publishing. All release commands automatically run pre-release checks to ensure code quality.

### Release Commands

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

### What Happens During Release

Each release command automatically:

1. **Pre-Release Checks**: Runs `npm run test` and `npm run lint` to ensure code quality
2. **Version Bump**: Updates `package.json` version using `npm version`
3. **Git Commit**: Creates a commit with the version bump
4. **Git Tag**: Creates a version tag (e.g., `v0.1.3`)
5. **Push to GitHub**: Pushes both the commit and tag to the remote repository
6. **Build**: Runs `npm run clean && npm run build` (via `prepublishOnly` script)
7. **Publish**: Publishes the package to npm registry

### Pre-Release Checklist

Before running a release command, ensure:

- [ ] Changes are committed to git
- [ ] You're on the main branch
- [ ] You have push access to the GitHub repository
- [ ] You're logged into npm (`npm whoami`)

**Note**: Tests and linting are automatically run by the release commands, so you don't need to run them manually. If they fail, the release will be aborted.

## GitHub Release Workflow

The project includes a GitHub Actions workflow that handles the publishing process:

### Release Workflow

**Trigger**: When you push a git tag (via `npm run release:*` commands)

**What it does**:
- Runs tests, linting, and builds
- Publishes the tagged version to npm
- Creates GitHub releases

**When it runs**: When you manually create releases using:
```bash
npm run release:patch   # Creates v0.1.3, triggers release workflow
npm run release:minor    # Creates v0.2.0, triggers release workflow
npm run release:major    # Creates v1.0.0, triggers release workflow
```

### Workflow Setup

To enable releases, you need to:

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

