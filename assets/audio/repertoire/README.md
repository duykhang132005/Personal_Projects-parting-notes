# Repertoire BGM (drop legal tracks here)

In-game music only uses files you place in this folder (or `../fair-harvard.mp3`).
Do **not** rip Spotify. The HGC2627 playlist is inspiration / listen-along only:
https://open.spotify.com/playlist/5OHBPowItjFTRPLPkUUiMk

## Suggested mapping (when you have rights to a recording)

| Mood / screen | Playlist pieces (inspiration) | Suggested filename |
|---|---|---|
| Title / warm | Fair Harvard (already at `../fair-harvard.mp3`), Glorious Apollo | `title-*.mp3` or `glorious-apollo.mp3` |
| Adventure map | Abendlied, O vos omnes, Holy Holy, Shen Khar Venakhi | `adventure-*.mp3` |
| Play (ducked) | Harvard Football Songs, Drunken Sailor (arr.), Chanson à boire | `play-*.mp3` |
| Closing / solemn | Come Ye Disconsolate, O quam mirabilis, Gesang der Mönche | `closing-*.mp3` |

Modern commercial recordings (e.g. Billie Eilish cover) need explicit license — skip those for a shippable build.

## How loading works
`js/audio.js` probes:
1. `assets/audio/repertoire/*.mp3` (and `.ogg`) matching prefixes `title-`, `adventure-`, `play-`, `closing-`
2. Falls back to `assets/audio/fair-harvard.mp3`
3. Falls back to procedural pad

Mute still silences BGM + SFX.
