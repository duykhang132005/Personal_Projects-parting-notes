# Parting Notes

A music-themed tower defense. Notes march from the lawn outside the hall to the stage curtain. Seat singers (voice parts) to break the phrase before it reaches the finale.

## Play

Open `index.html` or:

```bash
npx --yes serve .
```

**Adventure** has ten stages from the lawn to closing night. Clear a stage to unlock the next (saved in this browser as `parting-notes-progress`). Clearing Closing Night also opens **A Christmas Carol**, a five-stave act on the last map page.

## Towers

| Part | Role |
|------|------|
| Soprano | Solo lead; Tone path unlocks chain (Echo → Cascade → Vibrato). Breath path ends in Melody (prefers chaining to a different note type). |
| Alto | Chip + damage aura; **+1g per kill** base, **+2g** with Articulate. Support path ends in Harmony (Jazz/Folk assist in aura). |
| Tenor | AoE splash; Line path ends in Crescendo. |
| Bass | Infinite-range sniper; Tempo path (On Beat → Steady Tempo) + Weight path (Downbeat → Fermata). |
| Andy | Cue support sniper, **unlocks after clearing Closing Night**. Hotkey 5. |

Each singer has two upgrade paths (crosspath max **3/2**). Column labels are voice-specific (e.g. Soprano Breath / Tone, Bass Tempo / Weight).

Per-tower targeting: Front / Back / Closest / Highest HP.

**Dictionary:** each singer card lists every upgrade tier on both paths with a short line and its exact numbers (cost, damage, range, rate, chain, splash, aura and so on). The numbers are built from `js/towers.js` at runtime by `js/skills.js`, so they cannot drift from the game.

**Status badges:** click a placed singer to see small badges above every singer or note it affects or is affected by: Aura (Alto damage buff), Blend (Alto assist on Jazz and Folk), Harmony, Tempo (Bass slow), Cue (Andy freezes notes) and Stunned. Each badge has a text line in the selected-singer panel ("Aura: +25% damage (from 1 Alto)") and is announced to screen readers when the selection changes.

## Layout

The board fills most of the window and keeps its shape (scaled to fit, clicks map to the right cell at any size). The shop, targeting, upgrades and status list sit in a drawer. Above 720px wide the open drawer gets its own column beside the board, and the board shrinks to fit the space that is left, so nothing is covered; closing the drawer gives the width back. At 720px and below it is a bottom sheet over the lower part of the screen. **Hide shop** / **Show shop** or **B** toggles it. On phones the sheet tucks away when you pick a singer to place (by tapping the shop or pressing 1 to 5) and opens again when you select a placed one. Controls and sound sliders live in **Help**. The drawer animation is skipped with reduced motion.

The game works down to 320px wide with no sideways scrolling; on very narrow phones the map header stacks and the map nodes sit closer together.

## Note styles

| Style | Effect |
|-------|--------|
| Normal | Standard black/colored notes |
| Jazz | Glittery; each hit capped (~10 dmg) |
| Folk | Brown; immune to hits below ~20 dmg |

**Encore (endless):** unlocks with Choir Andy (clear Closing Night, or `?debug`). It sits after Closing Night on the third map page and replays that map with waves that grow forever: more notes, more HP and a little more gold each wave, with Andy Clark every 10th wave. The run ends at 0 lives and shows waves survived and your best (saved as `pn_encore_best_v1`). It never changes stage progress.

**Stage stats:** each map node shows a short readout (e.g. "Best 18 lives") and the detail panel lists clears, losses, best lives left and the last losing wave. Saved separately from progress as `pn_stage_stats_v1`. Retrying or quitting to the map counts as neither a clear nor a loss.

**Boss:** Andy Clark (Closing Night): conductor who periodically stuns all towers. Clear the stage to recruit **Choir Andy** for the shop.

## A Christmas Carol

A five-stave act on the fourth map page, following Dickens' story. It opens when Closing Night is cleared, and each stave opens when the one before it is cleared. It reuses the existing singers, notes and backdrops, with light snow on every stage.

| Stave | Stage | Music |
|-------|-------|-------|
| 1 | Marley's Ghost | Marley's Ghost |
| 2 | Christmas Past | Fezziwig's Ball |
| 3 | Christmas Present | The Ghost of Christmas Present |
| 4 | Yet to Come | Ghost of the Future (Andy Clark returns) |
| 5 | Christmas Morning | God Bless Us, Every One (Andy Clark again) |

Christmas Past and Christmas Present are tuned tougher than their base wave sets: Past notes have x1.15 HP, Present notes x1.3 HP, and both stages bring slightly more notes, spaced closer together. Kill gold is unchanged.

Carol progress is read from the cleared list in `parting-notes-progress`, so older saves keep every stage and nothing new is added to the save. Carol stages have their own stats and Records rows.

Music: A Christmas Carol, Harvard Glee Club course recordings. Each stave loads its own excerpt from `assets/audio/carol/` (MP3, 96 kbps) only when that stage starts. A missing file falls back to the usual play music without an error. The act's map page uses its own track too (see Audio).

## Records and stats

**Records:** the **Records** button on the title screen opens a dialog (Esc or Close closes it and returns focus to the button). It has one row per stage plus Encore, with these columns:

- **Stage:** the stage name.
- **Best:** most lives left on a win, e.g. "18 lives left". A stage you can play but have not won shows **Not cleared**; a stage you have not reached shows **Locked**.
- **Best time:** fastest win as m:ss, or "-" when there is none.
- **Clears** and **Losses:** counts, or "-" for a stage with no recorded runs.
- **Encore (endless):** Best shows "Best: wave N", "No best yet" or Locked; the other columns show "-".

**Best time** is game time, not wall-clock time. The clock starts when the first wave starts, stops while paused (and while the Restart confirm is open; Help does not pause) and runs twice as fast at Speed x2, so the same run scores the same time at either speed. The map detail panel shows it next to the other stats ("-" if none). A win that beats the stage's best lives left or best time (compared with your records from before that run, so a first clear counts) shows a **New record!** badge on the win screen saying which record improved.

**Reset stats:** in the Help dialog during play. Press **Reset stats**, then **Confirm reset** (or **Cancel**, or Esc). It clears stage stats and the Encore best only, then shows "Stats cleared". Progress, unlocked stages and singers, mute, volume and first-run tips are kept.

**Restart:** the **Restart** button next to Speed asks first during a run (**Confirm restart** or **Cancel**; focus starts on Cancel, Esc cancels, and the game is paused while it asks). On the defeat or Encore-over screen, **Retry** restarts straight away. A restart counts as neither a win nor a loss.

**Keyboard shortcuts** (also listed in Help):

- **1** to **5**: pick Soprano, Alto, Tenor, Bass or Andy (5 once Andy is unlocked); press again to cancel.
- **S**: sell the selected singer (50% refund).
- **,** and **.**: buy the selected singer's next left or right path upgrade (same rules as the buttons; only while playing). The result is announced.
- **B**: show or hide the shop drawer.
- **Space**: start the next wave; during a wave, toggle speed.
- **Esc**: pause or resume; closes Help and cancels a confirm.
- **N** (debug only): on the map, jump to the next uncleared stage.

Shortcuts are paused while Help or the Restart confirm is open, and while a volume slider has focus (except Esc).

**Switching tabs:** hiding the tab or window during a wave pauses the game (which also stops the best-time clock). It does not resume on its own when you come back; press **Resume** or Esc. Nothing happens before the first wave or when already paused.

**Dialogs and screen readers:** while Help, Records, the Restart confirm or the first-run tips are open, Tab and Shift+Tab stay inside the dialog. Screen readers hear "Lives: N" when you lose lives (one message per burst of leaks), and the Speed button reports pressed at Speed x2.

**Debug never writes stats:** with `?debug`, wins, losses, best times and the Encore best are read but not saved, and no New record! badge is shown.

**Storage keys** (localStorage):

- `parting-notes-progress`: cleared and unlocked stages and singers.
- `pn_stage_stats_v1`: per-stage clears, losses, best lives left, best time (seconds) and losing waves.
- `pn_encore_best_v1`: best Encore wave count.
- `parting-notes-mute`, `pn_music_volume_v1`, `pn_sfx_volume_v1`: sound settings.
- `parting-notes-seen-tips`: first-run tips seen.

Music files found missing are remembered for 10 minutes in sessionStorage as `pn_bgm_missing_v1` (ignored with `?debug`).

## Stack

Vanilla HTML, CSS, and JS. MIT, see [LICENSE](LICENSE).
Tests: run `npm test` (or `node --test`). No extra install is required.

## Audio

- **SFX:** procedural Web Audio (`js/audio.js`).
- **BGM:** continuous across screens. **Fair Harvard plays only on the menu screens** (title, Dictionary, congrats). Each map page and each stage has its own Glee Club excerpt (96 kbps MP3 loops of 100 to 120 s, about 18 MB in all), loaded only when that screen opens. The same track does not restart on navigation, and switching tracks keeps the playback position in the loop.
- Mute persists as `parting-notes-mute`.
- **Effects volume** slider (0 to 100) sits under Music and scales every sound effect, with a short preview click. Saved as `pn_sfx_volume_v1`.
- **Music volume** slider (0 to 100) sits next to Mute on the title screen and in Help during play and only changes music, not SFX. Saved as `pn_music_volume_v1`. Mute still silences everything; unmute returns to the slider level. Game hotkeys (except Esc) are ignored while the slider has focus.
- Spotify HGC2627 is listen-along / credit only. Do not rip streams into the build. See `assets/audio/README.md`.

### Screen and stage music

| Screen | File | Source (Harvard Glee Club) |
|--------|------|----------------------------|
| Title, Dictionary, congrats | `fair-harvard.mp3` | Fair Harvard |
| Map page 1 (Outside to Lobby) | `map/page-1.mp3` | Shen khar venakhi (K-K), 0:04 to 1:44 |
| Map page 2 (Hall to Encore) | `map/page-2.mp3` | Poulenc, 1:52 to 3:32 |
| Map page 3 (Backstage to Closing Night) | `map/page-3.mp3` | O Come Ye Disconsolate, 0:04 to 1:44 |
| Map page 4 (A Christmas Carol) | `map/page-4.mp3` | A Christmas Journey, 2:30 to 4:10 |
| Lawn Approach | `stages/approach.mp3` | Harvard Football Songs, 0:04 to 1:54 |
| Lobby Threshold | `stages/entrance.mp3` | Harvard Football Medley, 0:04 to 1:44 |
| Backstage Hall | `stages/hallway.mp3` | Drunken Sailor, 0:40 to 2:30 |
| Elevator Bank | `stages/elevator.mp3` | Tskhenosnuri (02), 0:03 to 1:45 |
| Stage Curtain | `stages/finale.mp3` | Rossini, 1:48 to 3:38 |
| Encore Call | `stages/encore.mp3` | Harvard Football Medley, 2:20 to 4:10 |
| Green Room Crush | `stages/greenroom.mp3` | Shen khar venakhi (Gurian), 0:04 to 2:04 |
| Loading Dock | `stages/dock.mp3` | Tskhenosnuri (04), 0:03 to 1:51 |
| Midnight Tour Bus | `stages/tourbus.mp3` | Poulenc, 0:04 to 1:44 |
| Closing Night | `stages/closing.mp3` | O Come Ye Disconsolate, 2:20 to 4:05 |
| Encore (endless) | `stages/endless.mp3` | Rossini, 4:50 to 6:32 |

Files live under `assets/audio/map/` and `assets/audio/stages/` (Carol staves under `assets/audio/carol/`). They are local files and are not committed. If a stage file is missing the stage falls back to the shared beds below and then to the procedural pad, never to Fair Harvard.

### Adding music

Only legal tracks (public domain or your own recordings) go in `assets/audio/repertoire/`. Browsers cannot list folders, so `js/audio.js` tries a fixed list (`BGM_CANDIDATES`) in order and plays the first file that loads. Only these exact names are tried; anything else (e.g. `title-02.mp3`) is ignored until it is added to that list.

| Bed | Files tried in `repertoire/` |
|-----|------------------------------|
| `title-` (title, Dictionary, congrats) | `title-01.mp3`, `title-01.ogg`, `glorious-apollo.mp3` |
| `adventure-` (map) | `adventure-01.mp3`, `adventure-01.ogg`, `abendlied.mp3`, `o-vos-omnes.mp3` |
| `play-` (stages 1 to 9, and Carol staves without their file) | `play-01.mp3`, `play-01.ogg`, `football-songs.mp3` |
| `closing-` (Closing Night) | `closing-01.mp3`, `closing-01.ogg`, `come-ye-disconsolate.mp3` |

If none load, Play falls back to the adventure files and Closing Night tries play, then adventure. Only the title bed goes on to `assets/audio/fair-harvard.mp3` (or `.ogg`). Anything left over gets the procedural pad.

A file that fails to load is remembered as missing for 10 minutes per tab (sessionStorage `pn_bgm_missing_v1`), so it is not requested again on every screen change or reload. The first visit in a tab still logs a few 404s in the console for names that are not there. After adding a track, open a new tab or use `?debug`, which skips this memory.

## Debug mode

Add `?debug` to the URL (`index.html?debug` or `?debug=1`). `?debug=0`, `?debug=false` or `?debug=off` keep it off, and so does a plain `index.html`.

- **Choir Andy** shows as unlocked (shop, hotkey 5, Dictionary) without writing saved progress.
- **Adventure** map gets a **Debug: next stage** button, and **N** does the same: both jump to the page with the first uncleared stage and focus its node.
- **Music** skips the remembered missing-file list, so new tracks are picked up right away.
- **Encore (endless)** is open without clearing Closing Night.
- **Stats** and the Encore best are read but never written, so test runs do not skew them. A **Debug: reset stats** button clears both (progress is kept).

## First-run tips

Lawn Approach shows a short onboarding overlay once. In play, **Help** opens the full controls sheet. Dismiss tips or **Don't show again** (`parting-notes-seen-tips`).
