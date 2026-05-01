# rembg Background Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `--bg-mode rembg` to `image-to-sprite.py` for neural-network background removal, solving edge fringe leakage on smooth/painted AI-generated sprites, and update `SKILL.md` so Agents know when to use it.

**Architecture:** Two files change. The script gains a new `--bg-mode rembg` branch and a `--rembg-model` parameter; all existing modes are untouched. `rembg` is lazily imported so the script remains usable without it installed. `SKILL.md` gains documentation so Agents can select the right mode.

**Tech Stack:** Python 3, Pillow, `rembg` (`pip install "rembg[cpu]"`), onnxruntime

---

## File Map

| File | Change |
|---|---|
| `.claude/skills/image-to-sprite/scripts/image-to-sprite.py` | Modify: argparse, session init, frame loop, meta JSON |
| `.claude/skills/image-to-sprite/SKILL.md` | Modify: parameters table, agent rules, defaults table |

---

## Task 1: Add `--rembg-model` argument and `"rembg"` to `--bg-mode` choices

**Files:**
- Modify: `.claude/skills/image-to-sprite/scripts/image-to-sprite.py:376-394`

- [ ] **Step 1: Add `"rembg"` to `--bg-mode` choices**

In `main()`, find the `--bg-mode` argument (line 375). Change:

```python
    parser.add_argument(
        "--bg-mode",
        choices=["white", "magenta", "auto", "none"],
        default="auto",
        help="Background removal mode",
    )
```

to:

```python
    parser.add_argument(
        "--bg-mode",
        choices=["white", "magenta", "auto", "none", "rembg"],
        default="auto",
        help="Background removal mode",
    )
```

- [ ] **Step 2: Add `--rembg-model` argument**

Immediately after the `--bg-edge-threshold` argument (line 382), insert:

```python
    parser.add_argument(
        "--rembg-model",
        type=str,
        default="isnet-anime",
        help=(
            "rembg model name. Only used with --bg-mode rembg. "
            "Options: isnet-anime, birefnet-general, u2net, u2net_human_seg. "
            "Default: isnet-anime"
        ),
    )
```

- [ ] **Step 3: Verify argparse help text**

Run:
```bash
python .claude/skills/image-to-sprite/scripts/image-to-sprite.py --help
```

Expected: output shows `rembg` in `--bg-mode` choices and a `--rembg-model` argument with default `isnet-anime`.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/image-to-sprite/scripts/image-to-sprite.py
git commit -m "feat(image-to-sprite): add --bg-mode rembg and --rembg-model args"
```

---

## Task 2: Add rembg session initialisation before the frame loop

**Files:**
- Modify: `.claude/skills/image-to-sprite/scripts/image-to-sprite.py:263-265`

- [ ] **Step 1: Insert session creation block**

In `cmd_process()`, before the `raw_frames = []` line (currently line 265), insert:

```python
    # rembg session (created once, reused for all frames)
    rembg_session = None
    rembg_remove = None
    if bg_mode == "rembg":
        print(f"Loading rembg model '{args.rembg_model}'...")
        try:
            from rembg import new_session
            from rembg import remove as rembg_remove
        except ImportError:
            raise SystemExit(
                "rembg is not installed.\n"
                'Run: pip install "rembg[cpu]"\n'
                'For GPU: pip install "rembg[gpu]"'
            )
        rembg_session = new_session(args.rembg_model)

```

- [ ] **Step 2: Verify missing-rembg error (if rembg not yet installed)**

If rembg is not installed on your machine, run:
```bash
python .claude/skills/image-to-sprite/scripts/image-to-sprite.py \
  --input any.png --output-dir /tmp/out --bg-mode rembg
```

Expected output:
```
Loading rembg model 'isnet-anime'...
rembg is not installed.
Run: pip install "rembg[cpu]"
For GPU: pip install "rembg[gpu]"
```
Expected exit code: non-zero.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/image-to-sprite/scripts/image-to-sprite.py
git commit -m "feat(image-to-sprite): add rembg session init with friendly error"
```

---

## Task 3: Add rembg removal branch inside the frame loop

**Files:**
- Modify: `.claude/skills/image-to-sprite/scripts/image-to-sprite.py:282-285`

- [ ] **Step 1: Replace the removal branch in the frame loop**

Find the existing removal block inside the `for row in range(rows)` loop (around line 282):

```python
            if bg_color_used:
                cleaned = remove_bg_color(cell_img, bg_color_used, args.bg_threshold, edge_threshold)
            else:
                cleaned = cell_img
```

Replace with:

```python
            if bg_mode == "rembg":
                cleaned = rembg_remove(cell_img, session=rembg_session)
            elif bg_color_used:
                cleaned = remove_bg_color(cell_img, bg_color_used, args.bg_threshold, edge_threshold)
            else:
                cleaned = cell_img
```

- [ ] **Step 2: Install rembg**

```bash
pip install "rembg[cpu]"
```

First run will download the model to `~/.u2net/` (approximately 170 MB for `isnet-anime`).

- [ ] **Step 3: Run end-to-end with a real sprite sheet**

```bash
python .claude/skills/image-to-sprite/scripts/image-to-sprite.py \
  --input <path_to_a_smooth_sprite_sheet.png> \
  --output-dir ./test-rembg-out \
  --frames 4 \
  --cols 2 \
  --bg-mode rembg \
  --rembg-model isnet-anime
```

Expected:
- Terminal prints `Loading rembg model 'isnet-anime'...`
- Script completes without error
- `test-rembg-out/frame-1.png` through `frame-4.png` exist and have transparent backgrounds
- Edge pixels have no background color fringe

- [ ] **Step 4: Verify existing modes are unbroken**

```bash
python .claude/skills/image-to-sprite/scripts/image-to-sprite.py \
  --input <same_sprite_sheet.png> \
  --output-dir ./test-auto-out \
  --frames 4 \
  --cols 2 \
  --bg-mode auto
```

Expected: runs successfully, output matches previous behavior.

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/image-to-sprite/scripts/image-to-sprite.py
git commit -m "feat(image-to-sprite): apply rembg removal per frame in bg-mode rembg"
```

---

## Task 4: Add `rembg_model` field to pipeline-meta.json

**Files:**
- Modify: `.claude/skills/image-to-sprite/scripts/image-to-sprite.py:346-364`

- [ ] **Step 1: Add field to meta dict**

Find the `meta = { ... }` dict in `cmd_process()` (around line 346). After the `"bg_threshold"` line, insert:

```python
        "rembg_model": args.rembg_model if args.bg_mode == "rembg" else None,
```

So the relevant section looks like:

```python
    meta = {
        "input": str(args.input.resolve()),
        "frames": len(frames),
        "cols": cols,
        "rows": rows,
        "duration": args.duration,
        "bg_mode": args.bg_mode,
        "bg_color_sampled": list(bg_color_used) if bg_color_used else None,
        "bg_threshold": args.bg_threshold,
        "rembg_model": args.rembg_model if args.bg_mode == "rembg" else None,
        "cell_size": args.cell_size,
        ...
    }
```

- [ ] **Step 2: Verify meta JSON**

Re-run Task 3 Step 3 command and then:

```bash
python -c "import json; d=json.load(open('test-rembg-out/pipeline-meta.json')); print(d['bg_mode'], d['rembg_model'])"
```

Expected output:
```
rembg isnet-anime
```

Re-run with `--bg-mode auto` and check:
```bash
python -c "import json; d=json.load(open('test-auto-out/pipeline-meta.json')); print(d['bg_mode'], d.get('rembg_model'))"
```

Expected output:
```
auto None
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/image-to-sprite/scripts/image-to-sprite.py
git commit -m "feat(image-to-sprite): record rembg_model in pipeline-meta.json"
```

---

## Task 5: Update SKILL.md

**Files:**
- Modify: `.claude/skills/image-to-sprite/SKILL.md`

- [ ] **Step 1: Update the Parameters section**

Find the `bg_mode` line in the Parameters section (line 20):

```markdown
- `bg_mode`: `white` | `magenta` | `auto` | `none` (default: `auto`)
```

Replace with:

```markdown
- `bg_mode`: `white` | `magenta` | `auto` | `none` | `rembg` (default: `auto`)
  - `rembg`: neural-network background removal — best for smooth/painted style sprites
  - `auto`: corner-sample color distance — best for solid-color backgrounds (magenta/white)
- `rembg_model`: model used when `bg_mode=rembg` (default: `isnet-anime`)
  - `isnet-anime`: anime/painted character style (recommended)
  - `birefnet-general`: photorealistic or complex backgrounds
  - Requires: `pip install "rembg[cpu]"` (downloads ~170 MB model on first use)
```

- [ ] **Step 2: Update Agent Rules section**

Find the line (line 32):

```markdown
- Determine `bg_mode` from context: if user says "white background" use `white`; if they say "transparent" use `none`; otherwise default to `auto`.
```

Replace with:

```markdown
- Determine `bg_mode` from context:
  - If user says "white background" → use `white`
  - If user says "transparent" → use `none`
  - If the sprite is smooth/painted style (AI-generated, realistic, anime) → use `rembg`
  - Otherwise → default to `auto`
- When `bg_mode=rembg`, use `--rembg-model isnet-anime` by default. Switch to `birefnet-general` only if the user reports the character is photorealistic.
```

- [ ] **Step 3: Update Defaults table**

Find the Defaults table (line 165). Add a row after `shared_scale`:

```markdown
| `rembg_model` | `isnet-anime` | model used when `bg_mode=rembg` |
```

- [ ] **Step 4: Update the example command in Workflow Step 5**

The Workflow Step 5 currently hardcodes `--bg-mode magenta`. Update the Agent Rules note (not the example command itself — the example is intentional for magenta). Instead add a note below the commands:

After the bash command block in Workflow Step 5, add:

```markdown
> For smooth/painted-style sprites, replace `--bg-mode magenta --bg-threshold 100` with `--bg-mode rembg` (no threshold needed).
```

- [ ] **Step 5: Verify SKILL.md renders correctly**

Open `.claude/skills/image-to-sprite/SKILL.md` and visually confirm:
- Parameters section lists `rembg` and `rembg_model`
- Agent Rules describe when to choose `rembg`
- Defaults table has `rembg_model` row

- [ ] **Step 6: Commit**

```bash
git add .claude/skills/image-to-sprite/SKILL.md
git commit -m "docs(image-to-sprite): document rembg bg-mode and rembg-model in SKILL.md"
```

---

## Verification Checklist

After all tasks are complete:

- [ ] `--help` shows `rembg` in `--bg-mode` choices and `--rembg-model` argument
- [ ] Running with `--bg-mode rembg` on a smooth sprite produces clean transparent frames
- [ ] Running with `--bg-mode auto` still works identically to before
- [ ] Running with `--bg-mode rembg` without rembg installed prints a friendly error and exits non-zero
- [ ] `pipeline-meta.json` contains `"rembg_model": "isnet-anime"` in rembg mode, `null` in other modes
- [ ] SKILL.md documents the new option and guides Agents to choose `rembg` for smooth/painted style
