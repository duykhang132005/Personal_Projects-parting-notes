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
| Soprano | Solo (chain via Damage upgrades) |
| Alto | Chip + damage aura; +5 gold per kill (stacks per Alto) |
| Tenor | AoE splash |
| Bass | Infinite-range sniper |

Per-tower targeting: Front / Back / Closest / Highest HP.

## Note styles

| Style | Effect |
|-------|--------|
| Normal | Standard black/colored notes |
| Jazz | Glittery; each hit capped (~10 dmg) |
| Folk | Brown; immune to hits below ~20 dmg |

**Boss:** Andy Clark (Closing Night) — conductor who periodically stuns all towers.

## Stack

Vanilla HTML, CSS, and JS. MIT — see [LICENSE](LICENSE).

## Audio

- **SFX:** procedural Web Audio (`js/audio.js`) — place, sell, wave start, hits (pitched by voice part), kills, jazz CAP shimmer, folk BLOCK thud, life leak, win/lose, Andy conductor cue, UI clicks.
- **BGM:** optional public-domain file in `assets/audio/` (e.g. `fair-harvard.mp3`) for the title screen; otherwise a soft procedural choral-ish pad / arpeggio (college-song atmosphere, not a rip). Play bed is the same pad, ducked.
- Mute toggles persist as `parting-notes-mute`.
- We do **not** redistribute modern Harvard Glee Club / Spotify / YouTube recordings. For listening, visit [harvardgleeclub.org](https://harvardgleeclub.org). See `assets/audio/README.md` for attribution if you add a PD track.

## First-run tips

Lawn Approach shows a short onboarding overlay once. Dismiss or **Don’t show again** (`parting-notes-seen-tips`).

