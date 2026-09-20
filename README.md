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
- Spotify HGC2627 is listen-along / credit only — do not rip streams into the build. See `assets/audio/README.md`.

## First-run tips

Lawn Approach shows a short onboarding overlay once. In play, **Help** opens the full controls sheet. Dismiss tips or **Don't show again** (`parting-notes-seen-tips`).
