# Audio assets

## Current
- **SFX:** procedural Web Audio in `js/audio.js`.
- **BGM:** enabled. Fair Harvard (`fair-harvard.mp3`, public domain) plays on the menu screens only. Map pages and stages use their own Glee Club excerpts in `map/`, `stages/` and `carol/`; if one is missing they fall back to `repertoire/` and then a soft procedural pad.
- Spotify HGC2627 is for inspiration/credits only. Do not rip streams into this folder.

## Adding repertoire tracks
Drop legally usable mp3/ogg files into `repertoire/` using prefixes:
- `title-`: title screen
- `adventure-`: adventure map
- `play-`: in-level (ducked under SFX)
- `closing-`: optional heavier/solemn bed (falls back to play/title)

See `repertoire/README.md` for HGC2627 mood mapping.
