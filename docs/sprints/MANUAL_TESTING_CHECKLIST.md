# Manual Testing Checklist

**Sprint 18 Phase 3 Task 3.2**
**Purpose**: Comprehensive end-to-end validation of all features before production

---

## Test Environment Setup

### Prerequisites
- [ ] Backend running (`cd backend && npm run dev`)
- [ ] Frontend running (`cd frontend && npm run dev`)
- [ ] Database accessible (Railway/Neon connection working)
- [ ] Browser DevTools open (Console, Network tabs)
- [ ] Test with Chrome, Firefox, and Safari

---

## 1. Authentication & User Management (Sprint 3)

### Registration
- [ ] Open homepage → Click "Register"
- [ ] Fill form with valid data
- [ ] Submit → Should see success message
- [ ] Check email → Verification email received
- [ ] Click verification link → Account activated
- [ ] Login with new credentials → Success

### Login
- [ ] Open homepage → Click "Login"
- [ ] Enter invalid credentials → See error message
- [ ] Enter valid credentials → Successfully logged in
- [ ] JWT token set in localStorage
- [ ] ✨ NEW: Refresh token set in httpOnly cookie (Sprint 18)
- [ ] User info displayed in header

### Password Reset
- [ ] Click "Forgot Password"
- [ ] Enter registered email
- [ ] Check email → Reset link received
- [ ] Click reset link → Opens password reset form
- [ ] Set new password → Success
- [ ] Login with new password → Success

### Session Management (Sprint 18)
- [ ] Login and wait 5 minutes → Token auto-refreshes before expiration
- [ ] Check DevTools Network → No 401 errors
- [ ] Logout → Session cleared
- [ ] Logout All Devices → All tokens revoked
- [ ] Try to use old token → Rejected

---

## 2. Game Creation & Lobby (Core)

### Create Game
- [ ] Click "Create Game" or "Quick Play"
- [ ] Enter player name
- [ ] Game created successfully
- [ ] Game ID visible
- [ ] Share button copies game ID to clipboard

### Join Game
- [ ] Open new tab/browser
- [ ] Enter game ID
- [ ] Join as Player 2
- [ ] Both players see each other in lobby
- [ ] Repeat for Players 3 and 4

### Lobby Browser (Sprint 16)
- [ ] Navigate to "Browse Games"
- [ ] See tabs: "Active Games" and "Recent Games"
- [ ] Active games tab shows games in progress
- [ ] Recent games tab shows completed games
- [ ] Click game card → Join or spectate
- [ ] Refresh button updates game list

---

## 3. Team Selection

### Basic Team Selection
- [ ] 4 players joined → Team selection phase begins
- [ ] Each player assigned to team (alternating 1-2-1-2)
- [ ] Team colors visible (Orange Team 1, Purple Team 2)
- [ ] Player can click team panel to switch teams
- [ ] Teams must be balanced (2v2)
- [ ] Start Game button disabled until balanced

### Position Swapping (Sprint 9)
- [ ] Player 1 clicks swap button next to Player 2
- [ ] Positions swap immediately
- [ ] Turn order updated (check dealer indicator)
- [ ] Teams recalculated based on new positions
- [ ] Swap across teams changes player's team

### Team Chat (Sprint 16)
- [ ] Type message in team chat
- [ ] Message visible only to teammates
- [ ] Opponent messages not visible
- [ ] Emoji/text formatting works
- [ ] Timestamps displayed

---

## 4. Betting Phase

### Placing Bets
- [ ] Betting phase begins (player after dealer first)
- [ ] Slider shows range 7-12
- [ ] "Without Trump" checkbox available
- [ ] Place bet → Shows "Waiting for other players"
- [ ] All 4 players bet → Transitions to playing phase
- [ ] Highest bidder determined correctly

### Skip Bet
- [ ] Non-dealer player clicks "Skip Bet"
- [ ] Bet skipped successfully
- [ ] Dealer CANNOT skip if bets exist
- [ ] If all skip → Dealer forced to bet minimum (7)

### Bet Validation
- [ ] Try to bet lower than current highest → Disabled with message
- [ ] Dealer can match or raise → Allowed
- [ ] "Without Trump" beats same amount with trump

---

## 5. Playing Phase

### Card Playing
- [ ] First player plays card → Sets trump suit
- [ ] Trump suit indicator appears
- [ ] Next player must follow suit if possible
- [ ] Cards grayed out if unplayable
- [ ] Validation message shows: "You must follow suit (red)"
- [ ] Play card → Appears in trick area
- [ ] 4 cards played → Trick resolves automatically

### Trick Resolution
- [ ] Trick winner determined correctly
- [ ] Winner takes trick (moves to their side)
- [ ] Points awarded:
  - [ ] Normal cards: 1 point
  - [ ] Red 0: +5 points (6 total)
  - [ ] Brown 0: -2 points (-1 total)
- [ ] Team score updates
- [ ] Winner plays first in next trick

### Special Features
- [ ] Swap player positions mid-game → Swap works, hand preserved
- [ ] Trump icon displayed on trump cards
- [ ] Special card indicators (+5, -2) visible
- [ ] Hand count decreases as cards played

---

## 6. Scoring & Game End

### Round End
- [ ] All 8 tricks complete → Round ends
- [ ] Scoring phase shows results
- [ ] Team scores calculated correctly
- [ ] Bid winner bonus/penalty applied
- [ ] Ready button appears for each player
- [ ] All players ready → Next round begins

### Game End
- [ ] Team reaches 41 points → Game over
- [ ] Winning team announced
- [ ] Final scores displayed
- [ ] "Play Again" button visible
- [ ] Game stats saved to database

### Rematch
- [ ] Click "Rematch"
- [ ] All players vote
- [ ] Majority vote → New game created
- [ ] Same players, new game ID
- [ ] Scores reset

---

## 7. Bot Players (Sprint 6)

### Adding Bots
- [ ] Click "Add Bot" button
- [ ] Bot added to game
- [ ] Bot appears in player list
- [ ] Bot selects team automatically
- [ ] Bot places bets automatically

### Bot Difficulty
- [ ] Select "Easy" → Bot makes simple decisions
- [ ] Select "Medium" → Bot uses basic strategy
- [ ] Select "Hard" → Bot uses advanced strategy
- [ ] Bots play cards within timeout period

### Bot Replacement
- [ ] Human player disconnects
- [ ] Bot takes over (if configured)
- [ ] Bot continues playing
- [ ] Human reconnects → Takes back control

---

## 8. Social Features (Sprint 16-17)

### Direct Messaging
- [ ] Navigate to "Messages"
- [ ] Click "New Message"
- [ ] Select recipient
- [ ] Send message → Appears in conversation
- [ ] Recipient sees notification
- [ ] Unread count updates
- [ ] Delete message → Removed for sender only

### Friend System
- [ ] Send friend request
- [ ] Recipient receives notification
- [ ] Accept/Reject friend request
- [ ] Friends list updates
- [ ] Remove friend → Removed from list

### Social Hub
- [ ] Navigate to "Social Hub"
- [ ] See 5 tabs: Friends, Messages, Recent Players, Suggestions, Profile
- [ ] Recent players tab shows last 20 players
- [ ] Friend suggestions based on mutual friends
- [ ] Quick actions (message, add friend) work

### Player Profiles
- [ ] Click player name/avatar
- [ ] Profile modal opens
- [ ] See stats: games played, win rate, avg score
- [ ] See recent games
- [ ] Quick actions available (message, add friend, block)

---

## 9. Game Replay (Sprint 15)

### Viewing Replays
- [ ] Navigate to "Browse Games" → "Recent Games"
- [ ] Click "View Replay" on finished game
- [ ] Replay player loads
- [ ] Initial state shown (team selection)
- [ ] Play/Pause controls work
- [ ] Speed controls work (1x, 2x, 4x)
- [ ] Skip to trick controls work
- [ ] Full-screen mode works

### Replay Features
- [ ] See all moves in order
- [ ] Trump suit indicator appears
- [ ] Scores update correctly
- [ ] Share replay link → Other users can view

---

## 10. Spectator Mode (Sprint 10)

### Spectating
- [ ] Join game as spectator (full lobby or spectator link)
- [ ] See all 4 players
- [ ] See current game state
- [ ] See cards played (but not player hands)
- [ ] Cannot interact with game
- [ ] Real-time updates as game progresses

### Spectator Chat
- [ ] Spectators can chat with each other
- [ ] Spectator chat not visible to players
- [ ] Player chat not visible to spectators

---

## 11. CSRF Protection (Sprint 18)

### CSRF Token Validation
- [ ] Login → CSRF token set in cookie
- [ ] Open DevTools → Application → Cookies → See `csrf-token`
- [ ] Make state-changing request (update profile, send message)
- [ ] Request succeeds (token auto-included)
- [ ] Remove CSRF cookie → Next request fails with 403
- [ ] Refresh page → New CSRF token generated

### CSRF Error Handling
- [ ] Trigger CSRF error (delete csrf-token cookie)
- [ ] Make POST request
- [ ] See user-friendly error: "Invalid CSRF token. Please refresh the page."
- [ ] Refresh page → CSRF token restored
- [ ] Retry action → Succeeds

---

## 12. Performance & UX

### Page Load
- [ ] Homepage loads < 3 seconds
- [ ] No console errors
- [ ] No 404 errors for assets
- [ ] Images load properly
- [ ] Fonts render correctly

### Responsiveness
- [ ] Test on mobile device (or DevTools mobile view)
- [ ] UI adapts to screen size
- [ ] Touch controls work
- [ ] No horizontal scrolling
- [ ] Text readable without zooming

### Real-time Updates
- [ ] Player joins → All players see update immediately
- [ ] Card played → All players see card appear
- [ ] Scores update → Reflected in real-time
- [ ] No lag > 500ms for critical actions

---

## 13. Security & Error Handling

### Input Validation
- [ ] Try SQL injection in username → Sanitized
- [ ] Try XSS in chat message → Escaped
- [ ] Try invalid game ID → Error message shown
- [ ] Try joining full game → Rejected with message

### Authentication Bypass Attempts
- [ ] Access /api/protected without token → 401 Unauthorized
- [ ] Use expired JWT token → 401 Unauthorized
- [ ] Use token from different user → 403 Forbidden
- [ ] CSRF protection blocks unauthorized requests

### Error Messages
- [ ] Network error → User-friendly message
- [ ] Server error → Generic error (not stack trace)
- [ ] Validation error → Specific feedback
- [ ] No sensitive data in error messages

---

## 14. Cross-Browser Testing

### Chrome
- [ ] All features work
- [ ] No console errors
- [ ] Performance acceptable

### Firefox
- [ ] All features work
- [ ] No console errors
- [ ] WebSocket connections stable

### Safari
- [ ] All features work
- [ ] httpOnly cookies work
- [ ] Audio/sounds work (if implemented)

---

## 15. Regression Testing

### After Each Bug Fix
- [ ] Original bug fixed
- [ ] No new bugs introduced
- [ ] Related features still work
- [ ] Performance not degraded

### After Deployment
- [ ] Run smoke test (create game, play 1 round)
- [ ] Check Sentry for new errors
- [ ] Verify environment variables set
- [ ] Test authentication flow

---

## Test Results Template

```markdown
## Manual Testing Results - [Date]

**Tester**: [Name]
**Environment**: [localhost/staging/production]
**Browser**: [Chrome/Firefox/Safari] [Version]

### Summary
- Total Tests: ___
- Passed: ___
- Failed: ___
- Blocked: ___

### Failed Tests
1. [Test Name] - [Brief Description]
   - Steps to Reproduce:
   - Expected: ...
   - Actual: ...
   - Severity: Critical/High/Medium/Low
   - GitHub Issue: #___

2. ...

### Notes
- [Any observations, performance issues, UX feedback]

### Recommendations
- [Suggestions for improvements]
```

---

## Critical Path (Must Pass Before Production)

1. ✅ **Authentication** - Users can register, login, logout
2. ✅ **Game Creation** - Players can create and join games
3. ✅ **Team Selection** - Teams can be balanced and game started
4. ✅ **Betting** - All players can place valid bets
5. ✅ **Card Playing** - Suit-following rules enforced
6. ✅ **Scoring** - Points calculated correctly
7. ✅ **CSRF Protection** - State-changing requests protected
8. ✅ **Token Refresh** - Sessions don't expire during gameplay

**All critical path tests must pass with 0 failures before production deployment.**

---

*Last Updated: 2025-11-18*
*Sprint 18 Phase 3 Task 3.2*
