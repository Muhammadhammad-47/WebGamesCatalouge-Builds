# Prism Laser

A 2D sci-fi optics puzzle game built with **HTML5, CSS, and vanilla JavaScript (Canvas 2D)**.
Zero external libraries, zero build steps, and 100% synthesized procedural audio via the Web Audio API.

---

## 🎮 How to Play

Reflect, split, and warp laser beams using precision optics. Your mission is to energize all **Energy Target Cores** simultaneously to power the reactor.

### Controls
| Input | Action |
| :--- | :--- |
| **Tap / Click Mirror** | Rotate 45° Mirror by 90° |
| **R** | Restart Current Level |
| **P / Escape** | Pause Game |
| **Sound Button** | Toggle Audio (Mute / Unmute) |
| **Fullscreen Button** | Toggle Fullscreen Mode |

---

## 🧩 Optical Elements

- **Lasers & Emitters**: High-powered beam projectors emitting pure white or spectral colored lasers.
- **Rotating Mirrors (`/` and `\`)**: 45° angle reflective pedestals that redirect laser beams perpendicular to their incoming axis. Tap or click to rotate.
- **Prisms (`💎`)**: Refracts and splits pure white light into Neon Cyan (`#00f5d4`) and Magenta (`#f72585`) beams.
- **Warp Portals (`🌀`)**: Teleports laser beams across impenetrable barriers instantly while conserving momentum and trajectory.
- **Color Filters**: Selective wavelength gates that only allow matching light frequencies to pass through.
- **Energy Cores (`🎯`)**: High-yield receptor targets that lock on and activate when illuminated with their required beam color.
- **Optic Stars (`⭐`)**: Collectibles along reflection paths for scoring a 3-star par rating.

---

## 📱 Responsive Layout
- **Desktop**: Clean 9:16 portrait cabinet frame with floating footer bar and fullscreen toggle.
- **Mobile & Touch Devices**: 100% full screen edge-to-edge gameplay with safe-area notch padding.
- **Portals & Iframes**: Includes Back button navigation and Exit Confirmation modal with parent iframe `postMessage` support.

---

## 🧪 Console Cheats & Verification
Open DevTools (`F12`) in your browser to inspect or test levels:
```javascript
// Solve current level or specific level number:
window.solveLevel(5);

// Verify all 12 levels are 100% mathematically solvable:
window.verifyAllLevels();

// Unlock all levels for instant access:
window.unlockAllLevels();
```
