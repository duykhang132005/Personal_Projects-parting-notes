# Repertoire BGM (drop legal tracks here)

In-game music only uses files you place in this folder (or `../fair-harvard.mp3`). Only public-domain tracks or your own recordings belong here.
Do **not** rip Spotify. The HGC2627 playlist is inspiration / listen-along only:
https://open.spotify.com/playlist/5OHBPowItjFTRPLPkUUiMk

Modern commercial recordings (e.g. Billie Eilish cover) need explicit license, so skip those for a shippable build.

## Exact filenames

Browsers cannot list folders, so `js/audio.js` tries a fixed list (`BGM_CANDIDATES`) in order and plays the first file that loads. Only these names are tried. Any other file (e.g. `title-02.mp3` or `title-intro.mp3`) is ignored until it is added to that list.

| Bed (screen) | Files tried, in order | Playlist inspiration |
|---|---|---|
| Title (title, Dictionary, congrats) | `title-01.mp3`, `title-01.ogg`, `glorious-apollo.mp3` | Fair Harvard (already at `../fair-harvard.mp3`), Glorious Apollo |
| Adventure map | `adventure-01.mp3`, `adventure-01.ogg`, `abendlied.mp3`, `o-vos-omnes.mp3` | Abendlied, O vos omnes |
| Play (stages 1 to 9, ducked) | `play-01.mp3`, `play-01.ogg`, `football-songs.mp3` | Harvard Football Songs |
| Closing Night | `closing-01.mp3`, `closing-01.ogg`, `come-ye-disconsolate.mp3` | Come Ye Disconsolate |

## Fallback order

1. The bed's own files above.
2. Adventure and Play: the Title files. Closing Night: the Play, Adventure, then Title files.
3. `../fair-harvard.mp3`, then `../fair-harvard.ogg`.
4. The procedural pad.

A file that fails to load is remembered as missing for 10 minutes per tab (sessionStorage `pn_bgm_missing_v1`). After adding a track, open a new tab or add `?debug` to the URL, which skips this memory. Mute still silences BGM + SFX.
