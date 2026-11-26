# Audio assets

## Current
- **SFX:** procedural Web Audio in `js/audio.js`.
- **BGM:** enabled. The menu screens (title, Dictionary, congrats) play `repertoire/title-01.mp3` (O Come, Ye Disconsolate, Oct 21 2026 Harvard Glee Club recording). Fair Harvard (`fair-harvard.mp3`, public domain) is kept as the title-bed fallback and never plays on the map or in a stage. Map pages and stages use their own Glee Club excerpts in `map/`, `stages/` and `carol/`; if one is missing they fall back to `repertoire/` and then a soft procedural pad.
- Spotify HGC2627 is for inspiration/credits only. Do not rip streams into this folder.

## Adding repertoire tracks
Drop legally usable mp3/ogg files into `repertoire/` using prefixes:
- `title-`: title screen
- `adventure-`: adventure map
- `play-`: in-level (ducked under SFX)
- `closing-`: optional heavier/solemn bed (falls back to play/title)

See `repertoire/README.md` for HGC2627 mood mapping.

## A Christmas Carol loops
One file per stave in `carol/`, cut from the Harvard Glee Club recording of A Christmas Carol (track numbers 01 to 30). Loops follow the same format as the other stage files: 44.1 kHz stereo MP3 at 96 kbps CBR, about 1:40 to 1:50 (shorter tracks loop the whole movement), loudness matched to about -18 LUFS, with a 4 s equal-power crossfade from the end of the excerpt into its start so `<audio loop>` wraps without a gap (God Bless Us, Every One uses a shorter fade, because the documented excerpt leaves only a little tail). Where a short movement has a silent pause between sections, the pause is bridged with the same crossfade.

| Stave | File | Track | Excerpt | Loop |
|-------|------|-------|---------|------|
| 1 | `carol/carol-01-truth-from-above.mp3` | The Truth from Above | whole track (0:00 to 1:53) | 1:49 |
| 2 | `carol/carol-02-counting-house.mp3` | In the Counting-House | whole track (0:01 to 1:33) | 1:28 |
| 3 | `carol/carol-03-surplus-population.mp3` | Surplus Population | whole track (0:00 to 1:19) | 1:15 |
| 4 | `carol/carol-04-god-rest-you-merry.mp3` | God rest you merry, gentlemen | whole track (0:00 to 1:48) | 1:44 |
| 5 | `carol/carol-marley.mp3` | Marley's Ghost | 0:00 to 2:00 | 2:00 |
| 6 | `carol/carol-06-mankind-was-my-business.mp3` | Mankind was my Business | 0:37 to 2:31 | 1:50 |
| 7 | `carol/carol-07-remember.mp3` | Remember | 0:00 to 1:54 | 1:50 |
| 8 | `carol/carol-08-ghost-of-christmas-past.mp3` | The Ghost of Christmas Past | whole track, 0:00 to 0:51, 0:58 to 1:34 (silent pauses bridged) | 1:18 |
| 9 | `carol/carol-09-little-fan.mp3` | Little Fan | whole track (0:00 to 1:09) | 1:05 |
| 10 | `carol/carol-10-sussex-carol.mp3` | Sussex Carol | whole track (0:01 to 1:38) | 1:34 |
| 11 | `carol/carol-past.mp3` | Fezziwig's Ball | 0:20 to 2:20 | 2:00 |
| 12 | `carol/carol-12-gain-is-loss.mp3` | Gain is Loss | whole track, 0:00 to 0:42, 0:46 to 1:27 (silent pauses bridged) | 1:14 |
| 13 | `carol/carol-13-auld-lang-syne.mp3` | Auld Lang Syne | 1:06 to 2:50 | 1:40 |
| 14 | `carol/carol-present.mp3` | The Ghost of Christmas Present | 0:30 to 2:30 | 2:00 |
| 15 | `carol/carol-15-christmas-journey.mp3` | A Christmas Journey | 1:04 to 2:58 | 1:50 |
| 16 | `carol/carol-16-a-child-himself.mp3` | A Child Himself | whole track, 0:00 to 0:37, 0:45 to 1:16, 1:20 to 1:42 (silent pauses bridged) | 1:18 |
| 17 | `carol/carol-17-deck-the-halls.mp3` | Deck the Halls | whole track (0:00 to 1:34) | 1:30 |
| 18 | `carol/carol-18-bob-cratchits-house.mp3` | Bob Cratchit's House | whole track (0:00 to 0:40) | 0:36 |
| 19 | `carol/carol-19-silent-night.mp3` | Silent Night | 1:00 to 2:44 | 1:40 |
| 20 | `carol/carol-20-bell-struck-twelve.mp3` | The Bell Struck Twelve | whole track, 0:00 to 0:31, 0:36 to 1:12 (silent pauses bridged) | 0:59 |
| 21 | `carol/carol-future.mp3` | Ghost of the Future | 0:00 to 1:25 (whole track) | 1:25 |
| 22 | `carol/carol-22-body-of-a-man.mp3` | The Body of a Man | whole track (0:00 to 1:13) | 1:08 |
| 23 | `carol/carol-23-spirit-of-tiny-tim.mp3` | Spirit of Tiny Tim | whole track (0:00 to 0:30) | 0:26 |
| 24 | `carol/carol-24-coventry-carol.mp3` | Coventry Carol | 0:52 to 2:46 | 1:50 |
| 25 | `carol/carol-25-spirits-of-all-three.mp3` | The Spirits of All Three | whole track (0:00 to 1:24) | 1:20 |
| 26 | `carol/carol-26-poverty.mp3` | Poverty | 0:26 to 2:20 | 1:50 |
| 27 | `carol/carol-27-christmas-day.mp3` | Christmas Day | whole track (0:00 to 1:07) | 1:03 |
| 28 | `carol/carol-28-back-payments.mp3` | Back Payments | whole track (0:01 to 1:54) | 1:49 |
| 29 | `carol/carol-morning.mp3` | God Bless Us, Every One | 0:00 to 1:44 (whole track) | 1:44 |
| 30 | `carol/carol-30-midnight-clear.mp3` | It came upon the midnight clear | 2:24 to 4:18 | 1:50 |

Carol map pages:

| Page | File | Excerpt |
|------|------|---------|
| Map page 4 (Carol 1: Marley) | `map/page-4.mp3` | A Christmas Journey, 2:30 to 4:10 |
| Map page 5 (Carol 2: Christmas Past) | `map/page-5.mp3` | Marley's Ghost, 2:54 to 4:06 |
| Map page 6 (Carol 3: Past to Present) | `map/page-6.mp3` | Auld Lang Syne, 0:02 to 1:46 |
| Map page 7 (Carol 4: Christmas Present) | `map/page-7.mp3` | Silent Night, 0:02 to 1:46 |
| Map page 8 (Carol 5: Yet to Come) | `map/page-8.mp3` | Coventry Carol, 2:46 to 3:53 |
| Map page 9 (Carol 6: Christmas Morning) | `map/page-9.mp3` | It came upon the midnight clear, 0:30 to 2:24 |
