# Alistair's Wildlands starter sprite pack

Original woodland pixel art generated with the built-in imagegen tool. Exact prompts are in `PROMPTS.txt`. Source art is retained in `atlas-source.png` and `player-animation-source.png` (both 1254 x 1254). These source layouts are visually arranged, not regular runtime grids: consume the normalized PNGs below.

## Asset index

| File | Pixels | Purpose |
|---|---|---|
| player-idle.png | 40 x 56 | Explorer, facing right |
| slime.png | 48 x 32 | Green ground enemy |
| bat.png | 64 x 40 | Violet flying enemy |
| training-dummy.png | 48 x 64 | Straw target on wooden stand |
| sword.png | 64 x 24 | Sword / hotbar slot 1 |
| pistol.png | 48 x 32 | Pistol / slot 2 |
| hammer.png | 64 x 40 | Crystal hammer / slot 3 |
| axe.png | 64 x 40 | Axe / slot 4 |
| machine-gun.png | 64 x 32 | Machine gun / slot 5 |
| shotgun.png | 64 x 24 | Shotgun / slot 6 |
| single-shot.png | 72 x 24 | Ranger rifle / slot 7 |
| potion.png | 24 x 32 | Health pickup |
| ammo.png | 32 x 32 | Ammo pickup |
| grass-dirt.png | 48 x 48 | Grass-topped dirt platform block |
| woodland-tree.png | 128 x 144 | Foreground tree |
| background-pine.png | 112 x 144 | Distant parallax tree |
| player-animations.png | 384 x 320 | 16-frame animation atlas |

All runtime assets are RGBA PNGs with real transparency. Static sprite anchors and measured source crop rectangles are in `assets.json`. `contact-sheet.png` is an opaque labeled preview, not a runtime atlas.

## Animation integration

The normalized player sheet has four columns and four rows. Each frame is **96 x 80**, with a bottom/foot anchor at **(48,70)**. Frames are numbered from zero, left to right, top to bottom. All face right. Use nearest-neighbor rendering (`ctx.imageSmoothingEnabled = false`) and integer screen positions. Native character height is about 45 pixels, matching the existing 42-pixel player collision box with a little visual overhang.

| Animation | Frames | Timing | Loop |
|---|---|---|---|
| idle | 0, 1 | 3 fps | yes |
| run | 2, 3 | 9 fps | yes |
| sword | 4, 5, 6, 7 | 65, 65, 75, 65 ms | no |
| axe | 8, 9, 10, 11 | 120, 85, 100, 125 ms | no |
| hammer | 12, 13, 14, 15 | 120, 180, 150, 200 ms | no |

`animations.json` contains the machine-readable map. Draw a frame at `(player.x + player.w/2 - 48, player.y + player.h - 70)` at native size. Mirror around the foot anchor for left-facing motion. The weapon is baked into every attack frame; suppress the separately drawn held weapon during those sequences. The sword uses a forward thrust and low follow-through, the axe uses a diagonal chop, and the hammer raises overhead before a low impact. Timing is suggested visual timing; the gameplay owner should synchronize damage and cooldowns.

The idle breathing and two-frame run are intentionally small starter loops. Enemy sprites are single poses. The grass tile is a decorative block with transparent outer padding, not a seamless terrain texture; overlap blocks or place over an opaque dirt fill. The originals preserve higher-resolution art for future refinement.

## Verification and reproduction

Visually inspected both the contact sheet and normalized animation sheet. `validation.json` records dimensions, 32-bit RGBA format, and sampled transparent/visible pixel counts for every PNG. Every runtime sprite contains visible artwork and transparent pixels. Alpha is preserved during nearest-neighbor resizing.

On Windows, `build-assets.ps1` rebuilds static cutouts, metadata, and contact sheet; `build-animation.ps1` rebuilds the aligned animation sheet and metadata using System.Drawing. No gameplay, HTML, or CSS files were changed by this asset task.
