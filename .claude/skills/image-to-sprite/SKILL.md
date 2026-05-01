---
name: image-to-sprite
description: "Convert an existing static illustration into an animated sprite sheet via AI image-to-image generation. The agent builds a prompt, uses an AI generator to create a multi-frame raw-sheet based on the user's source image, and then slices the raw-sheet into individual frames, handling background removal and GIF export."
---

# image-to-sprite

Use this skill when the user provides an existing image and wants to animate it (e.g. walk cycle, attack) into a game-ready sprite sheet bundle.

If the user does NOT have a starting image and just has a text description, use `generate2dsprite` instead.

## Parameters

Infer or ask for these from the user request:

- `input`: path to the AI-generated raw sheet (required — ask if not provided)
- `frames`: total number of animation frames (default: 4)
- `cols`: columns in the grid (default: 2; rows = ceil(frames/cols))
- `duration`: ms per frame (default: 200)
- `bg_mode`: `white` | `magenta` | `auto` | `none` | `rembg` (default: `auto`)
  - `rembg`: neural-network background removal — best for smooth/painted style sprites
  - `auto`: corner-sample color distance — best for solid-color backgrounds (magenta/white)
- `rembg_model`: model used when `bg_mode=rembg` (default: `isnet-anime`)
  - `isnet-anime`: anime/painted character style (recommended)
  - `birefnet-general`: photorealistic or complex backgrounds
  - Requires: `pip install "rembg[cpu]"` (downloads ~170 MB model on first use)
- `bg_threshold`: tolerance for background color removal (default: 30)
- `cell_size`: output size per frame cell in pixels (default: 128)
- `fit_scale`: how much of the cell the sprite fills (default: 0.85)
- `align`: `center` | `bottom` | `feet` (default: `center`; prefer `bottom` for grounded characters)
- `shared_scale`: normalize scale across all frames — use for character sprites
- `name`: optional output slug for the output folder name

## Agent Rules

- If the user does not provide a source image path, ask for it before proceeding.
- Verify the image path exists before running the script.
- Determine `bg_mode` from context:
  - If user says "white background" → use `white`
  - If user says "transparent" → use `none`
  - If the sprite is smooth/painted style (AI-generated, realistic, anime) → use `rembg`
  - Otherwise → default to `auto`
- When `bg_mode=rembg`, use `--rembg-model isnet-anime` by default. Switch to `birefnet-general` only if the user reports the character is photorealistic.
- For character sprites (warriors, heroes, NPCs) default `align` to `bottom` and use `--shared-scale`.
- For effects, icons, or items default `align` to `center`.
- Choose `cols` to make a roughly square grid: 8 frames → `cols=4` (2×4), 4 frames → `cols=2` (2×2), 6 frames → `cols=3` (2×3).
- Compute `rows = ceil(frames / cols)`.
- Do not ask the user for `cell_size`, `fit_scale`, or `bg_threshold` unless they report quality issues.
- After the script runs, read `pipeline-meta.json` to verify the run succeeded.

## Workflow

### 1. Collect the source image

If the user has not provided the character image path:
> "Which image file would you like to convert into a sprite sheet? Please provide the file path."

Once you have the path, confirm it exists before proceeding.

### 2. Determine parameters

From context, decide:
- `frames` and `cols` (compute `rows = ceil(frames / cols)`)
- `duration` in ms per frame (e.g., 2-second loop at 8 frames → 250ms each)
- `bg_mode` (use `rembg` for smooth/painted style; prefer `auto` for solid-color backgrounds; otherwise follow Agent Rules)
- `align` (prefer `bottom` for grounded characters)
- `shared_scale` (use for character sprites)

Choose an `output_dir`. Convention: `material/sprites/<slug>/` where slug is derived from the input filename or the user-provided name.

### 3. Generate Prompt

Write the following prompt for the user to use in their AI image-to-image tool (ComfyUI, Leonardo, etc.), filling in the placeholders:

```
A {rows}×{cols} pixel art animation sprite sheet.
ACTION: {action — e.g. walk, attack, idle}.
CHARACTER DETAILS: {describe the character's style, colors, and design from the source image}.
Use the provided image as a strict character reference for style, colors, and design.
Grid rules: EXACTLY {frames} cells arranged in {rows} rows of {cols} columns.
Use an absolutely fixed orthographic camera distance with zero perspective distortion.
The character's body MUST maintain absolutely identical head-to-toe proportions, height, and volume across all cells.
All frames must be perfectly registered. The character's head and feet must remain at the exact same vertical level in every cell.
Ensure strict geometric consistency: NO zooming, NO resizing, NO breathing effect, NO morphing between cells.
NO borders, NO lines between cells.
Background MUST be 100% solid flat magenta (#FF00FF). NO gradients, NO shadows.
```

### 4. AI Image Generation

Use your environment's built-in tool (`generate_image` for Antigravity, `image_gen` for Codex) to perform Image-to-Image generation:
1. Supply the prompt generated in step 3.
2. Supply the source image path provided by the user as the reference image.
3. Wait for the AI to return the path to the newly generated raw-sheet.

### 5. Process the Raw-Sheet

Once the AI returns the generated raw sheet path, run the processor:

**Windows / PowerShell:**
```powershell
python .claude/skills/image-to-sprite/scripts/image-to-sprite.py `
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

**bash:**
```bash
python .claude/skills/image-to-sprite/scripts/image-to-sprite.py \
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

> For smooth/painted-style sprites, replace `--bg-mode magenta --bg-threshold 100` with `--bg-mode rembg` (no threshold needed).

### 6. QC the result

Read `pipeline-meta.json` from the output directory. Check:

- `frames_written` matches the requested frame count
- `bg_color_sampled` (if auto mode) is a reasonable background color (close to white, black, or magenta)
- `sprite_bbox` is significantly smaller than the full source image size (background removal worked)
- `edge_touch_frames` is empty (if non-empty, the sprite clips the cell edge)

If the sprite is too small (fill ratio below 50%), suggest re-running with `--fit-scale 0.90`.
If edge touch is detected, suggest `--fit-scale 0.75`.
If `sprite_bbox` ≈ full source size, background removal likely failed — suggest `--bg-mode white --bg-threshold 40`.

### 7. Return the bundle

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

User: "Convert `./material/test/warrior.png` into an 8-frame walk cycle for a 2-second loop."

Agent decides:
- `frames=8`, `cols=4`, `rows=2`, `duration=250`
- `bg_mode=magenta`, `align=bottom`, `shared_scale=true`
- `output_dir=material/sprites/warrior/`

Command:
```powershell
python .claude/skills/image-to-sprite/scripts/image-to-sprite.py `
  --input ./material/sprites/warrior/raw-sheet.png `
  --output-dir ./material/sprites/warrior `
  --frames 8 `
  --cols 4 `
  --duration 250 `
  --bg-mode magenta `
  --align bottom `
  --shared-scale
```

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
| `rembg_model` | `isnet-anime` | model used when `bg_mode=rembg` |

## Background Threshold Guide

| Background type | `--bg-threshold` |
|---|---|
| Pure white | 20–30 |
| Off-white / cream | 30–50 |
| Pure magenta | 80–120 |
| Auto-detected | 25–35 |

White threshold is lower than magenta because white is closer to typical sprite colors (eyes, armor highlights). The flood-fill-from-corners approach protects interior white pixels.
