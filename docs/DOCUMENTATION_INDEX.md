# Documentation Index

**Last Updated**: 2025-10-30

This index provides a comprehensive overview of all documentation in the project.

---

## 📚 Core Documentation (Root)

### Main Guides
- **[README.md](../README.md)** - Project overview, setup instructions, features
- **[CLAUDE.md](../CLAUDE.md)** - AI development guide, core principles, patterns
- **[ROADMAP.md](../ROADMAP.md)** - Project status, feature completion tracking
- **[QUICKSTART.md](../QUICKSTART.md)** - Quick setup guide for new developers
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines

---

## 🔧 Technical Documentation

### Testing & Quality
- **[technical/TESTING_ARCHITECTURE.md](./technical/TESTING_ARCHITECTURE.md)** - Complete testing strategy overview
- **[technical/BACKEND_TESTING.md](./technical/BACKEND_TESTING.md)** - Backend test suite (113 tests)
- **[technical/TDD_WORKFLOW.md](./technical/TDD_WORKFLOW.md)** - Test-driven development workflow
- **[technical/TEST_IDS.md](./technical/TEST_IDS.md)** - Test identifier reference
- **[technical/VALIDATION_SYSTEM.md](./technical/VALIDATION_SYSTEM.md)** - 4-layer validation architecture

### Features & Systems
- **[technical/FEATURES.md](./technical/FEATURES.md)** - Complete feature documentation
- **[technical/BOT_PLAYER_SYSTEM.md](./technical/BOT_PLAYER_SYSTEM.md)** - AI bot decision-making
- **[technical/ACCESSIBILITY.md](./technical/ACCESSIBILITY.md)** - WCAG compliance guide
- **[technical/IMPROVEMENTS_2025_10.md](./technical/IMPROVEMENTS_2025_10.md)** - Recent improvements log
- **[technical/IMPROVEMENT_PLAN.md](./technical/IMPROVEMENT_PLAN.md)** - Future improvement roadmap

### Configuration
- **[PORT_CONFIGURATION.md](./PORT_CONFIGURATION.md)** - All port configurations centralized

---

## 🎨 Design Documentation

- **[design/DARK_MODE_COLORS.md](./design/DARK_MODE_COLORS.md)** - Dark theme color palette
- **[design/LIGHT_MODE_COLORS.md](./design/LIGHT_MODE_COLORS.md)** - Light theme color palette

---

## 🚀 Deployment Documentation

- **[deployment/RAILWAY_DEPLOY.md](./deployment/RAILWAY_DEPLOY.md)** - Production deployment guide
- **[deployment/LOCAL_DEVELOPMENT.md](./deployment/LOCAL_DEVELOPMENT.md)** - Local development without Neon
- **[deployment/TESTING_LOCAL.md](./deployment/TESTING_LOCAL.md)** - Testing with local database

---

## 🧪 E2E Test Documentation

### Test Guides
- **[e2e/README.md](../e2e/README.md)** - E2E test suite overview
- **[e2e/TEST_RESULTS_GUIDE.md](../e2e/TEST_RESULTS_GUIDE.md)** - Running and tracking test results

### Test History
- **[e2e/E2E_TEST_FIX_HISTORY.md](../e2e/E2E_TEST_FIX_HISTORY.md)** - Complete test fix session history
  - Sessions 1-7 breakdown
  - 124 tests fixed (3.9% → 83.9% pass rate)
  - CI optimization (65% reduction in runtime)

---

## 📁 Documentation Organization

```
docs/
├── DOCUMENTATION_INDEX.md      # This file
├── PORT_CONFIGURATION.md       # Port config
├── technical/                  # Technical documentation
│   ├── TESTING_ARCHITECTURE.md
│   ├── BACKEND_TESTING.md
│   ├── TDD_WORKFLOW.md
│   ├── TEST_IDS.md
│   ├── VALIDATION_SYSTEM.md
│   ├── FEATURES.md
│   ├── BOT_PLAYER_SYSTEM.md
│   ├── ACCESSIBILITY.md
│   ├── IMPROVEMENTS_2025_10.md
│   └── IMPROVEMENT_PLAN.md
├── design/                     # Design documentation
│   ├── DARK_MODE_COLORS.md
│   └── LIGHT_MODE_COLORS.md
└── deployment/                 # Deployment guides
    ├── RAILWAY_DEPLOY.md
    ├── LOCAL_DEVELOPMENT.md
    └── TESTING_LOCAL.md

e2e/
├── README.md                   # E2E overview
├── TEST_RESULTS_GUIDE.md       # Test running guide
└── E2E_TEST_FIX_HISTORY.md     # Historical test fixes
```

---

## 🔍 Quick Reference

### For New Developers
1. Start with [README.md](../README.md)
2. Follow [QUICKSTART.md](../QUICKSTART.md)
3. Read [CLAUDE.md](../CLAUDE.md) for development patterns

### For Testing
1. **Unit Tests**: See [technical/BACKEND_TESTING.md](./technical/BACKEND_TESTING.md)
2. **E2E Tests**: See [e2e/TEST_RESULTS_GUIDE.md](../e2e/TEST_RESULTS_GUIDE.md)
3. **TDD Workflow**: See [technical/TDD_WORKFLOW.md](./technical/TDD_WORKFLOW.md)

### For Deployment
1. **Production**: See [deployment/RAILWAY_DEPLOY.md](./deployment/RAILWAY_DEPLOY.md)
2. **Local**: See [deployment/LOCAL_DEVELOPMENT.md](./deployment/LOCAL_DEVELOPMENT.md)

### For Features
1. **Complete List**: See [technical/FEATURES.md](./technical/FEATURES.md)
2. **Roadmap**: See [ROADMAP.md](../ROADMAP.md)

---

## 📝 Recent Changes (2025-10-30)

### Consolidated Documentation
- Removed 10 obsolete session tracking files from e2e/
- Consolidated test fix history into `e2e/E2E_TEST_FIX_HISTORY.md`
- Moved `IMPROVEMENT_PLAN.md` to `docs/technical/`
- Moved `LOCAL_DEVELOPMENT.md` and `TESTING_LOCAL.md` to `docs/deployment/`
- Created this index for easy navigation

### New Documentation
- Added REST API endpoints to CLAUDE.md (`/api/stats/:playerName`, `/api/leaderboard`)
- Updated `e2e/TEST_RESULTS_GUIDE.md` with npm script references

---

**Navigation Tip**: Use Ctrl+F / Cmd+F to search this index for specific topics.
