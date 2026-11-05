# Tile Trio

An original triple-match tile puzzle built with plain HTML, CSS and JavaScript.
All tile art is drawn procedurally on canvas and all sound and music is synthesised
with the Web Audio API, so there are no image or audio files.

## How to play
- Tap an uncovered tile to move it into the 7-slot tray. Darker tiles are covered by tiles above them.
- Three matching tiles in the tray clear automatically. Quick consecutive matches build a combo.
- Clear every tile to win. If the tray fills with 7 tiles and no match, the level is lost.
- Boosters: **Undo** returns the last tile to the board, **Magnet** pulls out a full set, and **Shuffle** remixes the board.
  An empty booster can be bought for 60 coins.
- Levels are generated from a fixed seed, get bigger and deeper as you go, and are always solvable.
- Progress, coins, boosters and sound settings are saved in the browser.

## Files
- `index.html`: page layout
- `style.css`: visuals
- `art.js`: procedural tile icons
- `audio.js`: synthesised sound effects and background music
- `game.js`: level generator, gameplay, boosters and UI

## Run locally
Open `index.html` in a browser. No build step or server is needed.
