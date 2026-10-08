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

**Boss:** Andy Clark (Closing Night) — conductor who periodically stuns all towers. Clear the stage to recruit **Choir Andy** for the shop.

## Stack

Vanilla HTML, CSS, and JS. MIT — see [LICENSE](LICENSE).

## Audio

- **SFX:** procedural Web Audio (`js/audio.js`).
- **BGM:** continuous across screens; prefers legal files in `assets/audio/repertoire/`, then `fair-harvard.mp3`, then a soft procedural pad. Same track does not restart on navigation.
- Mute persists as `parting-notes-mute`.
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

## First-run tips

Lawn Approach shows a short onboarding overlay once. In play, **Help** opens the full controls sheet. Dismiss tips or **Don't show again** (`parting-notes-seen-tips`).
