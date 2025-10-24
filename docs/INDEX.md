# Documentation Index

Welcome to the Trick Card Game documentation. This index provides quick navigation to all documentation resources.

## 📖 Core Documentation

### Getting Started
- [**README**](../README.md) - Project overview and setup instructions
- [**QUICKSTART**](../QUICKSTART.md) - Quick setup guide for developers
- [**CONTRIBUTING**](../CONTRIBUTING.md) - Contribution guidelines

### Development
- [**CLAUDE**](../CLAUDE.md) - AI development guide with architecture patterns
- [**ROADMAP**](../ROADMAP.md) - Current project status and future plans

## 🔧 Technical Documentation

### Features & Systems
- [**Features**](technical/FEATURES.md) - Complete feature documentation with code examples
- [**Validation System**](technical/VALIDATION_SYSTEM.md) - 4-layer validation architecture
- [**Bot Player System**](technical/BOT_PLAYER_SYSTEM.md) - AI decision-making and bot strategies

### Testing
- [**TDD Workflow**](technical/TDD_WORKFLOW.md) - Test-driven development methodology
- [**Test IDs**](technical/TEST_IDS.md) - Test identifier reference for E2E tests
- [**Accessibility**](technical/ACCESSIBILITY.md) - WCAG compliance and accessibility features

## 🎨 Design Documentation

### Theme & Colors
- [**Dark Mode Colors**](design/DARK_MODE_COLORS.md) - Dark theme color palette
- [**Light Mode Colors**](design/LIGHT_MODE_COLORS.md) - Light theme color palette

## 🚀 Deployment

### Production Deployment
- [**Railway Deploy**](deployment/RAILWAY_DEPLOY.md) - Step-by-step Railway deployment guide

## 📊 Project Status

### Current State (October 2025)
- ✅ **Core Gameplay**: Complete
- ✅ **Multiplayer**: WebSocket real-time gameplay
- ✅ **Database**: PostgreSQL persistence
- ✅ **Bot AI**: 3 difficulty levels
- ✅ **Social Features**: Chat, spectator mode, leaderboard
- ✅ **UI/UX**: Dark mode, mobile responsive, animations
- ✅ **Testing**: 89 unit tests, E2E suite

### Recent Updates
- Fixed stats tracking bug (socket.id → player names)
- Redesigned lobby browser with tabs
- Integrated game replay system
- Cleaned up documentation structure

## 🗂️ Documentation Organization

```
project-root/
├── README.md           # Main project overview
├── CLAUDE.md          # AI development guide
├── ROADMAP.md         # Project roadmap
├── QUICKSTART.md      # Quick start guide
├── CONTRIBUTING.md    # Contribution guidelines
└── docs/
    ├── INDEX.md       # This file
    ├── technical/     # Technical implementation
    ├── design/        # UI/UX documentation
    └── deployment/    # Deployment guides
```

## 🔍 Quick Reference

### WebSocket Events
See [CLAUDE.md WebSocket Events](../CLAUDE.md#-websocket-event-system)

### REST API Endpoints
See [CLAUDE.md REST API](../CLAUDE.md#rest-api-endpoints)

### Game Rules
See [README.md Game Rules](../README.md#-game-rules)

### Bot Strategies
See [Bot Player System](technical/BOT_PLAYER_SYSTEM.md#bot-strategies)

### Validation Layers
See [Validation System](technical/VALIDATION_SYSTEM.md#validation-layers)

## 💡 Need Help?

- **Bug Reports**: Open an issue on [GitHub](https://github.com/majeanson/anthropicJoffre)
- **Questions**: Check the README troubleshooting section
- **Contributing**: Read [CONTRIBUTING.md](../CONTRIBUTING.md)
- **Development**: Follow [CLAUDE.md](../CLAUDE.md) for best practices

---

*Last updated: October 24, 2025*