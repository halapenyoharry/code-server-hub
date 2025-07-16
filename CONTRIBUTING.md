# Contributing to Code Server Hub

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/halapenyoharry/code-server-hub.git
   cd code-server-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   npm run setup
   # or
   ./setup.sh
   ```

4. **Start development server**
   ```bash
   npm run dev
   # or
   ./start-dev.sh
   ```

## Making Changes

### Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Commit Messages
Follow conventional commits format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Example: `feat: add Docker container discovery`

### Pull Request Process
1. Create feature branch from `develop`
2. Make your changes
3. Test thoroughly
4. Update documentation if needed
5. Submit PR to `develop` branch
6. Wait for review

## Code Style

### JavaScript
- Use ES6+ features
- Async/await over callbacks
- Meaningful variable names
- Comment complex logic

### File Structure
- Keep files focused and single-purpose
- Group related functionality in lib/
- Frontend code in public/

## Testing
Currently, testing is manual. Future plans include:
- Jest for unit tests
- Supertest for API testing
- Puppeteer for E2E testing

## Adding New Features

### New Service Types
1. Update discovery logic in `lib/discovery.js`
2. Add service-specific handling if needed
3. Update frontend for custom UI
4. Document the service type

### API Endpoints
1. Add route in `lib/routes.js`
2. Implement handler logic
3. Update frontend to use new endpoint
4. Document in CLAUDE.md

## Release Process

We use semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

To release:
1. Update version in package.json
2. Update CHANGELOG.md
3. Commit with message: `chore: release v{version}`
4. Tag the release: `git tag v{version}`
5. Push tags: `git push origin --tags`

## Getting Help

- Create an issue for bugs or features
- Use discussions for questions
- Check existing issues before creating new ones