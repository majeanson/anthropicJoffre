# Documentation Index

**Last Updated**: 2025-11-07

Complete index of all project documentation, organized by category.

---

## 📚 Getting Started

| Document | Description | Location |
|----------|-------------|----------|
| **README** | Project overview, setup instructions | `/README.md` |
| **QUICKSTART** | Quick setup guide for developers | `/QUICKSTART.md` |
| **CLAUDE.md** | Development guide for Claude Code | `/CLAUDE.md` |
| **Contributing Guide** | How to contribute to the project | `/CONTRIBUTING.md` |
| **User Guide** | Guide for end users | `/docs/USER_GUIDE.md` |

---

## 🚀 Deployment

| Document | Description | Location |
|----------|-------------|----------|
| **Railway Deploy** | Production deployment to Railway | `/docs/deployment/RAILWAY_DEPLOY.md` |
| **Email Setup** | Resend API email configuration | `/docs/deployment/EMAIL_SETUP.md` |
| **Local Development** | Setting up local environment | `/docs/deployment/LOCAL_DEVELOPMENT.md` |
| **Testing Locally** | Running tests locally | `/docs/deployment/TESTING_LOCAL.md` |

---

## 🏗️ Architecture & Technical

| Document | Description | Location |
|----------|-------------|----------|
| **Backend Architecture** | Backend system design | `/docs/technical/BACKEND_ARCHITECTURE.md` |
| **Testing Architecture** | Complete testing strategy | `/docs/technical/TESTING_ARCHITECTURE.md` |
| **Backend Testing** | Backend test suite (357 tests) | `/docs/technical/BACKEND_TESTING.md` |
| **Validation System** | Multi-layer validation | `/docs/technical/VALIDATION_SYSTEM.md` |
| **Bot Player System** | AI decision-making | `/docs/technical/BOT_PLAYER_SYSTEM.md` |
| **Reconnection Flow** | Session-based reconnection | `/docs/technical/RECONNECTION_FLOW.md` |
| **Features Documentation** | Complete feature list | `/docs/technical/FEATURES.md` |

---

## 🧪 Testing

| Document | Description | Location |
|----------|-------------|----------|
| **TDD Workflow** | Test-driven development guide | `/docs/technical/TDD_WORKFLOW.md` |
| **Test IDs** | Test identifier reference | `/docs/technical/TEST_IDS.md` |
| **E2E README** | E2E testing overview | `/e2e/README.md` |

---

## 🎨 Design

| Document | Description | Location |
|----------|-------------|----------|
| **Dark Mode Colors** | Dark theme palette | `/docs/design/DARK_MODE_COLORS.md` |
| **Light Mode Colors** | Light theme palette | `/docs/design/LIGHT_MODE_COLORS.md` |
| **Accessibility** | WCAG compliance | `/docs/technical/ACCESSIBILITY.md` |

---

## 📋 Sprint Planning

| Document | Description | Location |
|----------|-------------|----------|
| **Sprint History** | Sprints 1-5 archive | `/docs/sprints/SPRINT_HISTORY.md` |
| **Sprint 6-11 Plan** | Current improvement plan | `/docs/sprints/SPRINT_6_11_IMPROVEMENT_PLAN.md` |
| **Future Work** | Post-production roadmap | `/FUTURE_WORK.md` |
| **Roadmap** | Project roadmap | `/ROADMAP.md` |

---

## 🔧 Configuration

| Document | Description | Location |
|----------|-------------|----------|
| **Port Configuration** | Server port settings | `/docs/PORT_CONFIGURATION.md` |
| **CORS Policy** | CORS configuration | `/docs/security/CORS_POLICY.md` |

---

## 📊 Current Status (November 2025)

### Completion Status
- ✅ **Core Features**: 100% complete
- ✅ **Sprint 6**: Complete (Performance & Error Handling)
- ✅ **Sprint 7**: Complete (Backend Tests - 176 tests)
- ✅ **Sprint 8**: Complete (Frontend Tests - 116 tests)
- ✅ **Sprint 9**: Tasks 1 & 4 complete (TypeScript cleanup)
- 🔲 **Sprint 10**: Not started (Code Quality)
- 🔲 **Sprint 11**: Not started (Security & Production)

### Test Coverage
- **Backend**: 357 passing tests (85% coverage)
- **Frontend**: 116 tests (84 passing, 72% pass rate)
- **E2E**: 22 test files

### Production Readiness
- 🔲 Security audit pending
- 🔲 Performance profiling pending
- 🔲 Production deployment pending
- 🔲 Monitoring setup pending

---

## 🗂️ Document Organization

### Active Documents
Documents actively used and maintained:
- All "Getting Started" docs
- All "Deployment" docs
- All "Architecture & Technical" docs
- Sprint 6-11 Plan
- Future Work

### Archived Documents
Historical reference only:
- Sprint History (Sprints 1-5)

### Deprecated Documents
Removed during November 2025 cleanup:
- Old sprint progress files (consolidated into SPRINT_HISTORY.md)
- Session summaries and ephemeral notes
- Redundant refactoring plans
- Test result artifacts
- Outdated roadmaps

---

## 📝 Documentation Standards

### When to Create New Documentation
- **Technical Architecture**: Major system design decisions
- **Features**: New user-facing features
- **Testing**: New testing patterns or frameworks
- **Deployment**: Production configuration changes

### When to Update Existing Documentation
- **Feature Changes**: Modifications to existing features
- **Bug Fixes**: Significant fixes that affect documented behavior
- **Configuration**: Environment or setup changes
- **Sprint Progress**: Regular updates to sprint plans

### What NOT to Document
- ❌ Daily work summaries (use git commits)
- ❌ Debugging sessions (use inline comments)
- ❌ Temporary workarounds (fix properly or create issue)
- ❌ Personal notes (use local files)

---

## 🔍 Quick Find

**Need to...**
- Set up the project? → `README.md` or `QUICKSTART.md`
- Deploy to production? → `docs/deployment/RAILWAY_DEPLOY.md`
- Write tests? → `docs/technical/TDD_WORKFLOW.md`
- Understand architecture? → `docs/technical/BACKEND_ARCHITECTURE.md`
- See what's next? → `FUTURE_WORK.md`
- Review history? → `docs/sprints/SPRINT_HISTORY.md`

---

## 📁 File Structure

```
docs/
├── DOCUMENTATION_INDEX.md         # This file
├── PORT_CONFIGURATION.md          # Port config
├── USER_GUIDE.md                  # User guide
├── technical/                     # Technical docs (10 files)
│   ├── BACKEND_ARCHITECTURE.md
│   ├── BACKEND_TESTING.md
│   ├── TESTING_ARCHITECTURE.md
│   ├── TDD_WORKFLOW.md
│   ├── TEST_IDS.md
│   ├── VALIDATION_SYSTEM.md
│   ├── BOT_PLAYER_SYSTEM.md
│   ├── RECONNECTION_FLOW.md
│   ├── FEATURES.md
│   └── ACCESSIBILITY.md
├── design/                        # Design docs (2 files)
│   ├── DARK_MODE_COLORS.md
│   └── LIGHT_MODE_COLORS.md
├── deployment/                    # Deployment docs (4 files)
│   ├── RAILWAY_DEPLOY.md
│   ├── EMAIL_SETUP.md
│   ├── LOCAL_DEVELOPMENT.md
│   └── TESTING_LOCAL.md
├── security/                      # Security docs (1 file)
│   └── CORS_POLICY.md
└── sprints/                       # Sprint planning (2 files)
    ├── SPRINT_HISTORY.md          # Sprints 1-5 archive
    └── SPRINT_6_11_IMPROVEMENT_PLAN.md  # Current plan

e2e/
└── README.md                      # E2E test overview
```

---

## 📝 Recent Changes (2025-11-07)

### Major Documentation Cleanup
**Deleted**:
- 6 ephemeral root-level files
- 13 redundant sprint progress/summary files
- 14 redundant technical docs
- 5 E2E session notes
- Hundreds of test result artifacts
- 5 outdated docs root files

**Consolidated**:
- Sprints 1-5 → SPRINT_HISTORY.md
- Sprint documentation reduced from 14 files to 2

**Created**:
- FUTURE_WORK.md (completion-focused roadmap)
- SPRINT_HISTORY.md (consolidated archive)

**Result**: Reduced from ~200 .md files to ~30 essential documents

---

*This index is maintained as documentation evolves. Last major cleanup: November 2025*
