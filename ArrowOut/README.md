# Arrow Escape (CIEL Games)

An original arrow-sliding puzzle built with plain HTML, CSS and JavaScript. All art is drawn on canvas and all sounds are synthesised, so there are no image or audio files.

## How to play
- Tap an arrow and it slides off the board in the direction it points.
- If another arrow is in the way, the two crash and you lose a heart (3 per level).
- Clear the whole board to win. Stars: 3 with no crashes, 2 with one crash, 1 otherwise.
- 💡 Hint lights up an arrow that can escape (1 free per level, then a rewarded ad).
- Out of hearts: retry, or watch a rewarded ad for one more heart.

## Levels
100 levels, generated from a seed, so a level is always the same puzzle. Boards grow from 4×4 to 9×9.
Each arrow is placed only where its path to the edge is clear at that moment. Removing arrows in reverse order therefore always works, and removing an arrow only ever frees space, so a board can never become unsolvable.

## Files
- `index.html`: screens and popups
- `style.css`: bright theme and 3D buttons
- `game.js`: puzzle generator, gameplay, animation, sound and saving
- `ciel-loader.js`: shared CIEL Games loading screen
- `ciel-ads.js`: CIEL Ads SDK (simulated test ads on localhost)

## Ads
Set your AdSense id in `index.html` on the `ciel-ads.js` script tag (`data-client="ca-pub-..."`). Until then, live ads are off. On localhost the SDK shows simulated test ads.

## Run locally
Serve the folder, for example `python3 -m http.server`, and open `index.html`.
