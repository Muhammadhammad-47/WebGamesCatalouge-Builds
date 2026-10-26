# Maze Rotator

A 2D gravity-puzzle browser game built with **HTML5, CSS, and vanilla JavaScript (Canvas 2D)**.
Zero dependencies, zero build steps, and 100% synthesized audio via the Web Audio API.

---

## 🎮 How to Play

You do not control the ball directly. **You rotate the maze**, and gravity (always pointing straight down your screen) pulls the ball through corridors.

Your goal is to guide the ball into the glowing **Exit Portal** while collecting optional gems and avoiding deadly hazards.

### Controls
| Input | Action |
| :--- | :--- |
| **Arrow Left / A / Q** | Rotate Maze 90° Counter-Clockwise |
| **Arrow Right / D / E** | Rotate Maze 90° Clockwise |
| **Touch / Mouse Drag** | Swipe or Drag Left/Right to rotate |
| **On-Screen Buttons** | Large Left (`⟲`) & Right (`⟳`) buttons |
| **R** | Restart Current Level |
| **P / Escape** | Pause Game |
| **M** | Toggle Sound On/Off |

---

## 🧩 Game Elements

- **Exit Portal (`E`)**: Swirling cosmic vortex that completes the level.
- **Stars / Gems (`*`)**: 3 optional collectibles per level for bonus score and stars.
- **Spikes (`X`)**: Dangerous hazards that shatter the ball and reset you to the start.
- **Ice Tiles (`I`)**: Slick, low-friction floor.
- **Teleporters (`T`)**: Cosmic warp pairs that transport the ball across barriers.
- **Keys (`K`) & Doors (`D`)**: Collect the golden key to unlock matching energy barriers.
- **Sticky Tiles (`Z`)**: Stops momentum immediately upon landing.
- **One-Way Gates (`v`, `^`, `>`, `<`)**: Allow passage only in the arrow direction.
- **Crumbling Floors (`C`)**: Tiles that collapse into bottomless pits after crossing once.
- **Patrol Hazards**: Drones that patrol corridors back and forth.

---

## 🚀 How to Add New Levels

Levels are defined in `game.js` in the `LEVELS` array:

```javascript
{
  id: 11,
  name: "Your Level Name",
  tutorial: "Helpful tip for the player!",
  parMoves: 6,
  requireKey: false,
  theme: {
    wall: "#00f5d4",
    wallGlow: "rgba(0, 245, 212, 0.5)",
    floor: "#0f172a",
    accent: "#00bbf9"
  },
  grid: [
    "########",
    "#S..*..#",
    "#.####.#",
    "#..*#..#",
    "#...#E.#",
    "########"
  ]
}
```

### Legend of Grid Characters
- `#`: Wall
- `.`: Open floor
- `S`: Starting ball position
- `E`: Exit portal
- `*`: Optional gem (3 per level)
- `X`: Spikes hazard
- `I`: Ice tile
- `Z`: Sticky tile
- `T`: Teleporter pair
- `K`: Key
- `D`: Locked door
- `v`, `^`, `>`, `<`: One-way directional gates
- `C`: Crumbling floor

### Testing Solvability
Open your browser's developer console (`F12`) and run:
```javascript
window.solveLevel(11);
// or to verify all levels:
window.verifyAllLevels();
```
The built-in BFS solver checks every rotation and guarantees the puzzle is 100% solvable before shipping!
