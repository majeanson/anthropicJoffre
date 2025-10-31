# Page snapshot

```yaml
- generic [ref=e3]:
  - generic:
    - generic: 🃏
    - generic: 🎴
    - generic: 🂡
    - generic: 🂱
  - generic [ref=e4]:
    - heading "Join Game" [level=2] [ref=e9]
    - generic [ref=e10]:
      - generic [ref=e11]:
        - generic [ref=e12]: "Join as:"
        - generic [ref=e13]:
          - generic [ref=e14] [cursor=pointer]:
            - radio "Player" [checked] [ref=e15]
            - generic [ref=e16]: Player
          - generic [ref=e17] [cursor=pointer]:
            - radio "Guest (Spectator)" [ref=e18]
            - generic [ref=e19]: Guest (Spectator)
      - generic [ref=e20]:
        - generic [ref=e21]: Game ID
        - textbox "Enter game ID" [ref=e22]: invalid123
      - generic [ref=e23]:
        - generic [ref=e24]: Your Name
        - textbox "Enter your name" [ref=e25]: Player 1
      - generic [ref=e26]:
        - button "Back" [ref=e27] [cursor=pointer]
        - button "Join as Player" [active] [ref=e28] [cursor=pointer]
```