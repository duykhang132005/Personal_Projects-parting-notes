# Parting Notes

A music-themed tower defense. Notes march from the lawn outside the hall to the stage curtain — seat singers (voice parts) to break the phrase before it reaches the finale.

## Play

Open `index.html` or:

```bash
npx --yes serve .
```

**Adventure** has ten stages from the lawn to closing night. Clear a stage to unlock the next (saved in this browser as `parting-notes-progress`).

## Towers

| Part | Role |
|------|------|
| Soprano | Solo lead; Tone path unlocks chain (Echo → Cascade → Vibrato). Breath path ends in Melody (prefers chaining to a different note type). |
| Alto | Chip + damage aura; **+1g per kill** base, **+2g** with Articulate. Support path ends in Harmony (Jazz/Folk assist in aura). |
| Tenor | AoE splash; Line path ends in Crescendo. |
| Bass | Infinite-range sniper; Tempo path (On Beat → Steady Tempo) + Weight path (Downbeat → Fermata). |
| Andy | Cue support sniper — **unlocks after clearing Closing Night**. Hotkey 5. |

Each singer has two upgrade paths (crosspath max **3/2**). Column labels are voice-specific (e.g. Soprano Breath / Tone, Bass Tempo / Weight).

Per-tower targeting: Front / Back / Closest / Highest HP.

## Note styles

| Style | Effect |
|-------|--------|
| Normal | Standard black/colored notes |
| Jazz | Glittery; each hit capped (~10 dmg) |
| Folk | Brown; immune to hits below ~20 dmg |

**Encore (endless):** unlocks with Choir Andy (clear Closing Night, or `?debug`). It sits after Closing Night on the last map page and replays that map with waves that grow forever: more notes, more HP and a little more gold each wave, with Andy Clark every 10th wave. The run ends at 0 lives and shows waves survived and your best (saved as `pn_encore_best_v1`). It never changes stage progress.

**Stage stats:** each map node shows a short readout (e.g. "Best 18 lives") and the detail panel lists clears, losses, best lives left and the last losing wave. Saved separately from progress as `pn_stage_stats_v1`. Retrying or quitting to the map counts as neither a clear nor a loss.

**Boss:** Andy Clark (Closing Night) — conductor who periodically stuns all towers. Clear the stage to recruit **Choir Andy** for the shop.

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
- **Space**: start the next wave; during a wave, toggle speed.
- **Esc**: pause or resume; closes Help and cancels a confirm.
- **N** (debug only): on the map, jump to the next uncleared stage.

Shortcuts are paused while Help or the Restart confirm is open, and while a volume slider has focus (except Esc).

**Debug never writes stats:** with `?debug`, wins, losses, best times and the Encore best are read but not saved, and no New record! badge is shown.

**Storage keys** (localStorage):

- `parting-notes-progress`: cleared and unlocked stages and singers.
- `pn_stage_stats_v1`: per-stage clears, losses, best lives left, best time (seconds) and losing waves.
- `pn_encore_best_v1`: best Encore wave count.
- `parting-notes-mute`, `pn_music_volume_v1`, `pn_sfx_volume_v1`: sound settings.
- `parting-notes-seen-tips`: first-run tips seen.

Music files found missing are remembered for 10 minutes in sessionStorage as `pn_bgm_missing_v1` (ignored with `?debug`).

## Stack

Vanilla HTML, CSS, and JS. MIT — see [LICENSE](LICENSE).

## Audio

- **SFX:** procedural Web Audio (`js/audio.js`).
- **BGM:** continuous across screens; prefers legal files in `assets/audio/repertoire/`, then `fair-harvard.mp3`, then a soft procedural pad. Same track does not restart on navigation.
- Mute persists as `parting-notes-mute`.
- **Effects volume** slider (0 to 100) sits under Music and scales every sound effect, with a short preview click. Saved as `pn_sfx_volume_v1`.
- **Music volume** slider (0 to 100) sits next to Mute on the title and play screens and only changes music, not SFX. Saved as `pn_music_volume_v1`. Mute still silences everything; unmute returns to the slider level. Game hotkeys (except Esc) are ignored while the slider has focus.
- Spotify HGC2627 is listen-along / credit only — do not rip streams into the build. See `assets/audio/README.md`.

### Adding music

Only legal tracks (public domain or your own recordings) go in `assets/audio/repertoire/`. Browsers cannot list folders, so `js/audio.js` tries a fixed list (`BGM_CANDIDATES`) in order and plays the first file that loads. Only these exact names are tried; anything else (e.g. `title-02.mp3`) is ignored until it is added to that list.

| Bed | Files tried in `repertoire/` |
|-----|------------------------------|
| `title-` (title, Dictionary, congrats) | `title-01.mp3`, `title-01.ogg`, `glorious-apollo.mp3` |
| `adventure-` (map) | `adventure-01.mp3`, `adventure-01.ogg`, `abendlied.mp3`, `o-vos-omnes.mp3` |
| `play-` (stages 1 to 9) | `play-01.mp3`, `play-01.ogg`, `football-songs.mp3` |
| `closing-` (Closing Night) | `closing-01.mp3`, `closing-01.ogg`, `come-ye-disconsolate.mp3` |

If none load, Adventure and Play fall back to the title files, Closing Night tries play, adventure, then title. After that comes `assets/audio/fair-harvard.mp3` (or `.ogg`), then the procedural pad.

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
