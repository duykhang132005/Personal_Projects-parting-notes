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
| Soprano | Chain |
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
