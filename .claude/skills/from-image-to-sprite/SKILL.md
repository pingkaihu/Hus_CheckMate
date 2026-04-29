---
name: from-image-to-sprite
description: "Convert an existing static illustration into an animated sprite sheet via AI image-to-image generation. The agent builds a prompt, uses an AI generator to create a multi-frame raw-sheet based on the user's source image, and then slices the raw-sheet into individual frames, handling background removal and GIF export."
---

# From-Image-to-Sprite

Use this skill when the user provides an existing image and wants to animate it (e.g. walk cycle, attack) into a game-ready sprite sheet bundle.

If the user does NOT have a starting image and just has a text description, use `generate2dsprite` instead.

## Parameters

Infer or ask for these from the user request:

- `input`: path to the source image (required — ask if not provided)
- `frames`: total number of animation frames (default: 4)
- `cols`: columns in the grid (default: 2; rows = ceil(frames/cols))
- `duration`: ms per frame (default: 200)
- `bg_mode`: `white` | `magenta` | `auto` | `none` (default: `auto`)
- `bg_threshold`: tolerance for background color removal (default: 30)
- `cell_size`: output size per frame cell in pixels (default: 128)
- `fit_scale`: how much of the cell the sprite fills (default: 0.85)
- `align`: `center` | `bottom` | `feet` (default: `center`; prefer `bottom` for grounded characters)
- `shared_scale`: normalize scale across all frames — use for character sprites
- `name`: optional output slug for the output folder name

## Agent Rules

- If the user does not provide a source image path, ask for it before proceeding.
- Verify the image path exists before running the script.
- Determine `bg_mode` from context: if user says "white background" use `white`; if they say "transparent" use `none`; otherwise default to `auto`.
- For character sprites (warriors, heroes, NPCs) default `align` to `bottom` and use `--shared-scale`.
- For effects, icons, or items default `align` to `center`.
- Choose `cols` to make a roughly square grid: 8 frames → `cols=4` (2×4), 4 frames → `cols=2` (2×2), 6 frames → `cols=3` (2×3).
- Compute `rows = ceil(frames / cols)`.
- Do not ask the user for `cell_size`, `fit_scale`, or `bg_threshold` unless they report quality issues.
- After the script runs, read `pipeline-meta.json` to verify the run succeeded.

## Workflow

### 1. Collect the source image

If the user has not provided an image path:
> "Which image file would you like to convert into a sprite sheet? Please provide the file path."

Once you have the path, confirm it exists before proceeding.

### 2. Determine parameters

From context, decide:
- `frames` and `cols` (compute `rows = ceil(frames / cols)`)
- `duration` in ms per frame (e.g., 2-second loop at 8 frames → 250ms each)
- `bg_mode` (prefer `auto` unless user specifies)
- `align` (prefer `bottom` for grounded characters)
- `shared_scale` (use for character sprites)

Choose an `output_dir`. Convention: `material/sprites/<slug>/` where slug is derived from the input filename or the user-provided name.

### 3. Generate Prompt

Run the prompt builder to get a standardized prompt for the AI generator:

```powershell
python .claude/skills/from-image-to-sprite/scripts/from-image-to-sprite.py build-prompt `
  --mode <action> `
  --frames <N> `
  --cols <C> `
  --prompt "<character_description>"
```

### 4. AI Image Generation

Use your environment's built-in tool (`generate_image` for Antigravity, `image_gen` for Codex) to perform Image-to-Image generation:
1. Supply the prompt generated in step 3.
2. Supply the source image path provided by the user as the reference image.
3. Wait for the AI to return the path to the newly generated raw-sheet.

### 5. Process the Raw-Sheet

Run the processor to split the generated grid into frames and remove the background:

**For Antigravity (Windows / PowerShell):**
```powershell
python .claude/skills/from-image-to-sprite/scripts/from-image-to-sprite.py process `
  --input <path_to_AI_generated_raw_sheet> `
  --output-dir <output_dir> `
  --frames <N> `
  --cols <C> `
  --duration <ms> `
  --bg-mode magenta `
  --bg-threshold 100 `
  --align <align> `
  --shared-scale
```

**For Codex (bash):**
```bash
python .claude/skills/from-image-to-sprite/scripts/from-image-to-sprite.py process \
  --input <path_to_AI_generated_raw_sheet> \
  --output-dir <output_dir> \
  --frames <N> \
  --cols <C> \
  --duration <ms> \
  --bg-mode magenta \
  --bg-threshold 100 \
  --align <align> \
  --shared-scale
```

### 6. QC the result

Read `pipeline-meta.json` from the output directory. Check:

- `frames_written` matches the requested frame count
- `bg_color_sampled` (if auto mode) is a reasonable background color (close to white, black, or magenta)
- `sprite_bbox` is significantly smaller than the full source image size (background removal worked)
- `edge_touch_frames` is empty (if non-empty, the sprite clips the cell edge)

If the sprite is too small (fill ratio below 50%), suggest re-running with `--fit-scale 0.90`.
If edge touch is detected, suggest `--fit-scale 0.75`.
If `sprite_bbox` ≈ full source size, background removal likely failed — suggest `--bg-mode white --bg-threshold 40`.

### 5. Return the bundle

Report the output directory and confirm these files exist:
- `source.png`
- `raw-sheet.png`
- `raw-sheet-clean.png`
- `sheet-transparent.png`
- `frame-1.png` … `frame-N.png`
- `animation.gif`
- `pipeline-meta.json`

Show the `animation.gif` or `sheet-transparent.png` to the user.

## Example

User: "Convert `./material/test/teat_warrior.png` into an 8-frame sprite sheet for a 2-second loop."

Agent decides:
- `frames=8`, `cols=4`, `rows=2`, `duration=250`
- `bg_mode=auto` (image has white background, auto will detect it)
- `align=bottom` (warrior is a grounded character)
- `shared_scale=true`
- `output_dir=material/sprites/teat-warrior/`

Command:
```powershell
python .claude/skills/from-image-to-sprite/scripts/from-image-to-sprite.py `
  --input ./material/test/teat_warrior.png `
  --output-dir ./material/sprites/teat-warrior `
  --frames 8 `
  --cols 4 `
  --duration 250 `
  --bg-mode auto `
  --align bottom `
  --shared-scale
```

Expected output: `material/sprites/teat-warrior/` with a 512×256 `raw-sheet.png`, `sheet-transparent.png`, 8 frame PNGs, a 2-second looping `animation.gif`, and `pipeline-meta.json`.

## Defaults

| Parameter | Default | Notes |
|---|---|---|
| `frames` | 4 | |
| `cols` | 2 | rows = ceil(frames/cols) |
| `duration` | 200ms | |
| `bg_mode` | `auto` | corner-sample to detect background |
| `bg_threshold` | 30 | lower = tighter removal |
| `cell_size` | 128 | px per frame cell |
| `fit_scale` | 0.85 | sprite fills 85% of cell |
| `align` | `center` | use `bottom` for characters |
| `shared_scale` | false | pass `--shared-scale` for characters |

## Background Threshold Guide

| Background type | `--bg-threshold` |
|---|---|
| Pure white | 20–30 |
| Off-white / cream | 30–50 |
| Pure magenta | 80–120 |
| Auto-detected | 25–35 |

White threshold is lower than magenta because white is closer to typical sprite colors (eyes, armor highlights). The flood-fill-from-corners approach protects interior white pixels.
