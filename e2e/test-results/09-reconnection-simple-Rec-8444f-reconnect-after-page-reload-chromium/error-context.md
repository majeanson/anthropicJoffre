# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - button "Open test panel for state manipulation" [ref=e4] [cursor=pointer]: 🧪 Test
    - button "Open debug panel to inspect game state" [ref=e5] [cursor=pointer]: 🔍 State
  - generic [ref=e7]:
    - heading "Team Selection" [level=2] [ref=e8]
    - generic [ref=e9]:
      - paragraph [ref=e10]: "Game ID:"
      - generic [ref=e11]: LXZ5X9
    - paragraph [ref=e13]: Players (1/4) - Choose your team and position
    - generic [ref=e14]:
      - generic [ref=e15]:
        - heading "Team 1" [level=3] [ref=e16]
        - generic [ref=e17]:
          - generic [ref=e20]: Player1 (You)
          - generic [ref=e22]: Empty Seat
      - generic [ref=e23]:
        - heading "Team 2" [level=3] [ref=e24]
        - generic [ref=e25]:
          - button "Join Team 2" [ref=e28] [cursor=pointer]
          - button "Join Team 2" [ref=e31] [cursor=pointer]
    - generic [ref=e33]:
      - button "Start Game" [disabled] [ref=e34]
      - paragraph [ref=e35]: Waiting for 3 more player(s) to join
    - generic [ref=e36]:
      - heading "How to Play:" [level=4] [ref=e37]
      - list [ref=e38]:
        - listitem [ref=e39]: • Teams play opposite each other (Team 1 vs Team 2)
        - listitem [ref=e40]: • You can swap positions with other players before starting
        - listitem [ref=e41]: • Position affects turn order during the game
        - listitem [ref=e42]: • The dealer rotates each round
```