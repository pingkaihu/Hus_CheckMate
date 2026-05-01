# Design: rembg Background Removal for image-to-sprite

**Date:** 2026-05-01
**Status:** Approved

## Context

The current `remove_bg_color()` in `image-to-sprite.py` uses Euclidean color distance + edge flood-fill to strip solid-color backgrounds. For smooth/painted AI-generated sprites, this causes semi-transparent fringe pixels to retain the background color — because the algorithm has no semantic understanding of "what is the character."

`rembg` uses neural network segmentation (U²-Net / IS-Net / BiRefNet variants) to produce a clean alpha mask without needing a known background color. For smooth-style sprites it is the correct solution.

## Scope

Two files change:

- `.claude/skills/image-to-sprite/scripts/image-to-sprite.py` — script logic
- `.claude/skills/image-to-sprite/SKILL.md` — Agent documentation

All existing `--bg-mode` options (`white`, `magenta`, `auto`, `none`) and their underlying logic are untouched.

## Script Changes (`image-to-sprite.py`)

### 1. argparse

Add `"rembg"` to `--bg-mode` choices:

```python
choices=["white", "magenta", "auto", "none", "rembg"]
```

Add new argument:

```python
parser.add_argument(
    "--rembg-model",
    type=str,
    default="isnet-anime",
    help='rembg model name. Only used with --bg-mode rembg. '
         'Options: isnet-anime, birefnet-general, u2net, u2net_human_seg, etc.',
)
```

### 2. Session initialisation (before frame loop)

```python
rembg_session = None
if bg_mode == "rembg":
    print(f"Loading rembg model '{args.rembg_model}'...")
    try:
        from rembg import new_session, remove as rembg_remove
    except ImportError:
        raise SystemExit(
            'rembg is not installed.\n'
            'Run: pip install "rembg[cpu]"\n'
            'For GPU: pip install "rembg[gpu]"'
        )
    rembg_session = new_session(args.rembg_model)
```

Session is created once and reused for all frames — required for good performance.

### 3. Frame loop removal branch

```python
if bg_mode == "rembg":
    cleaned = rembg_remove(cell_img, session=rembg_session)
elif bg_color_used:
    cleaned = remove_bg_color(cell_img, bg_color_used, args.bg_threshold, edge_threshold)
else:
    cleaned = cell_img
```

No defringe or spill suppression is applied after rembg — its alpha mask doesn't contain background color contamination.

### 4. pipeline-meta.json

Add `"rembg_model"` field to the meta dict:

```python
"rembg_model": args.rembg_model if args.bg_mode == "rembg" else None,
```

### 5. `bg_color_used` stays `None` for rembg mode

The existing `if bg_mode == "magenta"` / `elif bg_mode == "white"` / `elif bg_mode == "auto"` block already falls through for `"rembg"` — no change needed.

## SKILL.md Changes

Three additions:

1. **Parameters table** — add rows for `--bg-mode rembg` and `--rembg-model`
2. **When to use rembg** — guidance for the Agent: smooth/painted style → `rembg`; solid-color background (magenta/white) → original modes; uncertain → `rembg`
3. **Prerequisites** — note that `rembg` requires `pip install "rembg[cpu]"` and downloads the model (~170 MB) on first use

## What Does Not Change

- `remove_bg_color()`, `sample_bg_color()`, and all existing modes
- Output artifact list and structure
- GIF encoding, sheet composition, frame fitting logic
- The `rembg` import is lazy — the script remains usable without rembg installed as long as `--bg-mode rembg` is not passed

## Verification

1. Install: `pip install "rembg[cpu]"`
2. Run with a smooth-style sprite sheet:
   ```bash
   python image-to-sprite.py \
     --input test-sprite.png --output-dir out/ \
     --frames 4 --cols 2 --bg-mode rembg --rembg-model isnet-anime
   ```
3. Inspect `out/frame-1.png` – edges should have no background color fringe
4. Check `out/pipeline-meta.json` – confirm `"rembg_model": "isnet-anime"` is present
5. Rerun with `--bg-mode auto` – confirm existing behavior unchanged
6. Uninstall rembg, rerun with `--bg-mode rembg` – confirm friendly error message and non-zero exit
