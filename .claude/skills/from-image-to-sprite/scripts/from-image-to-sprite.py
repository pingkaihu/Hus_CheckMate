#!/usr/bin/env python3
"""Convert a single static image into a tiled sprite sheet bundle.

Unlike generate2dsprite.py, this script takes an existing image rather than
an AI-generated sheet. It tiles the cleaned sprite N times in a grid, removes
the background, and exports the standard artifact bundle:
  source.png, raw-sheet.png, raw-sheet-clean.png, sheet-transparent.png,
  frame-1..N.png, animation.gif, pipeline-meta.json
"""

from __future__ import annotations

import argparse
import json
import math
import re
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


# ---------------------------------------------------------------------------
# Ported utilities (from generate2dsprite.py — no import dependency)
# ---------------------------------------------------------------------------

def sanitize_slug(text: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower()).strip("-")
    return slug or "sprite"


def trim_border(img: Image.Image, px: int = 4) -> Image.Image:
    width, height = img.size
    if width > px * 2 and height > px * 2:
        return img.crop((px, px, width - px, height - px))
    return img


def clean_edges(img: Image.Image, depth: int = 3) -> Image.Image:
    pixels = img.load()
    width, height = img.size
    for d in range(depth):
        for x in range(width):
            for y in (d, height - 1 - d):
                if y < 0 or y >= height:
                    continue
                r, g, b, a = pixels[x, y]
                if a == 0:
                    continue
                if (r < 40 and g < 40 and b < 40) or math.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2) < 150:
                    pixels[x, y] = (0, 0, 0, 0)
        for y in range(height):
            for x in (d, width - 1 - d):
                if x < 0 or x >= width:
                    continue
                r, g, b, a = pixels[x, y]
                if a == 0:
                    continue
                if (r < 40 and g < 40 and b < 40) or math.sqrt((r - 255) ** 2 + g ** 2 + (b - 255) ** 2) < 150:
                    pixels[x, y] = (0, 0, 0, 0)
    return img


def connected_components(img: Image.Image, min_area: int = 1) -> list[dict[str, object]]:
    alpha = img.getchannel("A")
    pixels = alpha.load()
    width, height = img.size
    visited = [[False] * width for _ in range(height)]
    components: list[dict[str, object]] = []

    for y in range(height):
        for x in range(width):
            if pixels[x, y] == 0 or visited[y][x]:
                continue
            queue: deque[tuple[int, int]] = deque([(x, y)])
            visited[y][x] = True
            area = 0
            min_x = max_x = x
            min_y = max_y = y
            touches_edge = x == 0 or y == 0 or x == width - 1 or y == height - 1

            while queue:
                cx, cy = queue.popleft()
                area += 1
                min_x = min(min_x, cx)
                min_y = min(min_y, cy)
                max_x = max(max_x, cx)
                max_y = max(max_y, cy)
                if cx == 0 or cy == 0 or cx == width - 1 or cy == height - 1:
                    touches_edge = True
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < width and 0 <= ny < height and pixels[nx, ny] > 0 and not visited[ny][nx]:
                        visited[ny][nx] = True
                        queue.append((nx, ny))

            if area >= min_area:
                components.append(
                    {
                        "area": area,
                        "bbox": (min_x, min_y, max_x + 1, max_y + 1),
                        "touches_edge": touches_edge,
                    }
                )

    components.sort(key=lambda item: int(item["area"]), reverse=True)
    return components


def pad_bbox(
    bbox: tuple[int, int, int, int], padding: int, width: int, height: int
) -> tuple[int, int, int, int]:
    x0, y0, x1, y1 = bbox
    return (
        max(0, x0 - padding),
        max(0, y0 - padding),
        min(width, x1 + padding),
        min(height, y1 + padding),
    )


def bbox_touches_edge(
    bbox: tuple[int, int, int, int] | None, width: int, height: int, margin: int = 0
) -> bool:
    if not bbox:
        return False
    x0, y0, x1, y1 = bbox
    return x0 <= margin or y0 <= margin or x1 >= width - margin or y1 >= height - margin


def compose_sheet(frames: list[Image.Image], rows: int, cols: int, cell_size: int) -> Image.Image:
    canvas = Image.new("RGBA", (cols * cell_size, rows * cell_size), (0, 0, 0, 0))
    for index, frame in enumerate(frames):
        row, col = divmod(index, cols)
        canvas.paste(frame, (col * cell_size, row * cell_size), frame)
    return canvas


def save_transparent_gif(frames: list[Image.Image], out_path: Path, duration: int) -> None:
    if not frames:
        raise ValueError("No frames to encode.")

    key = (255, 0, 254)
    width, height = frames[0].size
    stacked = Image.new("RGB", (width, height * len(frames)), key)

    for index, frame in enumerate(frames):
        r, g, b, a = frame.split()
        hard_mask = a.point(lambda value: 255 if value >= 128 else 0)
        rgb = Image.merge("RGB", (r, g, b))
        stacked.paste(rgb, (0, index * height), hard_mask)

    paletted = stacked.convert("P", palette=Image.Palette.ADAPTIVE, colors=256, dither=Image.Dither.NONE)
    palette = list(paletted.getpalette() or [])
    while len(palette) < 256 * 3:
        palette.append(0)

    key_index = None
    for index in range(256):
        if palette[index * 3: index * 3 + 3] == list(key):
            key_index = index
            break
    if key_index is None:
        best_distance = None
        best_index = 0
        for index in range(256):
            r, g, b = palette[index * 3], palette[index * 3 + 1], palette[index * 3 + 2]
            distance = (r - key[0]) ** 2 + (g - key[1]) ** 2 + (b - key[2]) ** 2
            if best_distance is None or distance < best_distance:
                best_distance = distance
                best_index = index
        key_index = best_index

    if key_index != 0:
        lut = np.arange(256, dtype=np.uint8)
        lut[0], lut[key_index] = key_index, 0
        arr = np.array(paletted)
        arr = lut[arr]
        paletted = Image.fromarray(arr, mode="P")
        for channel in range(3):
            zero_idx = channel
            key_idx = key_index * 3 + channel
            palette[zero_idx], palette[key_idx] = palette[key_idx], palette[zero_idx]
        paletted.putpalette(palette)

    out_frames = [
        paletted.crop((0, index * height, width, (index + 1) * height))
        for index in range(len(frames))
    ]
    out_frames[0].save(
        out_path,
        format="GIF",
        save_all=True,
        append_images=out_frames[1:],
        duration=duration,
        loop=0,
        disposal=2,
        transparency=0,
        background=0,
    )


# ---------------------------------------------------------------------------
# New functions
# ---------------------------------------------------------------------------

def remove_bg_color(
    img: Image.Image,
    target_color: tuple[int, int, int],
    threshold: int = 30,
    edge_threshold: int | None = None,
) -> Image.Image:
    """Remove a solid background color using global scan + edge-connected flood fill."""
    if edge_threshold is None:
        edge_threshold = int(threshold * 1.5)
    img = img.convert("RGBA")
    pixels = img.load()
    width, height = img.size
    tr, tg, tb = target_color

    def dist(r: int, g: int, b: int) -> float:
        return math.sqrt((r - tr) ** 2 + (g - tg) ** 2 + (b - tb) ** 2)

    # Pass 1: global threshold removal
    for x in range(width):
        for y in range(height):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if dist(r, g, b) < threshold:
                pixels[x, y] = (0, 0, 0, 0)

    # Pass 2: edge-connected flood fill at wider threshold
    visited: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or not (0 <= x < width) or not (0 <= y < height):
            continue
        visited.add((x, y))
        r, g, b, a = pixels[x, y]
        if a == 0:
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    nb = (x + dx, y + dy)
                    if nb not in visited:
                        queue.append(nb)
        elif dist(r, g, b) < edge_threshold:
            pixels[x, y] = (0, 0, 0, 0)
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    if dx == 0 and dy == 0:
                        continue
                    nb = (x + dx, y + dy)
                    if nb not in visited:
                        queue.append(nb)
    return img


def sample_bg_color(img: Image.Image, sample_radius: int = 5) -> tuple[int, int, int]:
    """Sample corner regions to detect the dominant background color."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    samples: list[tuple[int, int, int]] = []
    for x in range(min(sample_radius, w)):
        for y in range(min(sample_radius, h)):
            samples.append(rgb.getpixel((x, y)))
            samples.append(rgb.getpixel((w - 1 - x, y)))
            samples.append(rgb.getpixel((x, h - 1 - y)))
            samples.append(rgb.getpixel((w - 1 - x, h - 1 - y)))
    r_vals = sorted(s[0] for s in samples)
    g_vals = sorted(s[1] for s in samples)
    b_vals = sorted(s[2] for s in samples)
    mid = len(r_vals) // 2
    return (r_vals[mid], g_vals[mid], b_vals[mid])


def prepare_sprite(
    img: Image.Image,
    bg_mode: str,
    bg_threshold: int,
    edge_threshold: int | None = None,
) -> tuple[Image.Image, tuple[int, int, int] | None]:
    """Remove background from source image. Returns (cleaned RGBA, color used or None)."""
    img = img.convert("RGBA")
    if bg_mode == "none":
        return img, None
    elif bg_mode == "magenta":
        color: tuple[int, int, int] = (255, 0, 255)
    elif bg_mode == "white":
        color = (255, 255, 255)
    elif bg_mode == "auto":
        color = sample_bg_color(img)
    else:
        raise ValueError(f"Unknown bg_mode {bg_mode!r}. Use white, magenta, auto, or none.")
    cleaned = remove_bg_color(img, color, bg_threshold, edge_threshold)
    return cleaned, color


def fit_sprite_to_cell(
    sprite: Image.Image,
    cell_size: int,
    fit_scale: float,
    align: str,
) -> Image.Image:
    """Scale and center a cleaned RGBA sprite into a square transparent canvas."""
    bbox = sprite.getbbox()
    if bbox:
        sprite = sprite.crop(bbox)
    w, h = sprite.size
    canvas = Image.new("RGBA", (cell_size, cell_size), (0, 0, 0, 0))
    if w == 0 or h == 0:
        return canvas
    scale = min(cell_size / w, cell_size / h) * fit_scale
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    resized = sprite.resize((new_w, new_h), Image.Resampling.LANCZOS)
    paste_x = (cell_size - new_w) // 2
    if align in {"bottom", "feet"}:
        pad = max(0, int(cell_size * (1 - fit_scale) * 0.5))
        paste_y = cell_size - new_h - pad
    else:
        paste_y = (cell_size - new_h) // 2
    canvas.paste(resized, (paste_x, paste_y), resized)
    return canvas


def build_idle_frames(
    sprite_cell: Image.Image,
    frames: int,
    cell_size: int,
    bob_px: int = 3,
) -> list[Image.Image]:
    """Animate a static sprite with a sine-wave vertical bob for a looping idle."""
    result = []
    for i in range(frames):
        # Negative offset = move sprite upward (image Y axis is inverted)
        offset_y = -int(round(bob_px * math.sin(2 * math.pi * i / frames)))
        canvas = Image.new("RGBA", (cell_size, cell_size), (0, 0, 0, 0))
        canvas.paste(sprite_cell, (0, offset_y), sprite_cell)
        result.append(canvas)
    return result


def build_walk_frames(
    sprite_cell: Image.Image,
    frames: int,
    cell_size: int,
    bob_px: int = 3,
    rock_deg: float = 5.0,
) -> list[Image.Image]:
    """Animate a static sprite with a rocking rotation and vertical bob for a fake walk cycle."""
    result = []
    # For a grounded character, rotate around the feet (bottom center)
    center = (cell_size // 2, cell_size)
    for i in range(frames):
        t = i / frames
        # Walk cycle has 2 steps per loop, so 2 full bobs.
        # Use abs(sin) so it bobs upwards twice per cycle.
        offset_y = -int(round(bob_px * abs(math.sin(2 * math.pi * t))))
        
        # Rocking motion: one full swing left and right per loop
        angle = rock_deg * math.sin(2 * math.pi * t)
        
        rotated = sprite_cell.rotate(angle, resample=Image.Resampling.BICUBIC, center=center)
        canvas = Image.new("RGBA", (cell_size, cell_size), (0, 0, 0, 0))
        canvas.paste(rotated, (0, offset_y), rotated)
        result.append(canvas)
    return result


def compose_on_magenta(
    frames: list[Image.Image],
    rows: int,
    cols: int,
    cell_size: int,
) -> Image.Image:
    """Tile frames onto a solid magenta canvas (raw-sheet.png convention)."""
    canvas = Image.new("RGB", (cols * cell_size, rows * cell_size), (255, 0, 255))
    for idx, frame in enumerate(frames):
        row, col = divmod(idx, cols)
        x, y = col * cell_size, row * cell_size
        if frame.mode == "RGBA":
            r, g, b, a = frame.split()
            rgb = Image.merge("RGB", (r, g, b))
            canvas.paste(rgb, (x, y), a)
        else:
            canvas.paste(frame.convert("RGB"), (x, y))
    return canvas


# ---------------------------------------------------------------------------
# Command
# ---------------------------------------------------------------------------

def cmd_process(args: argparse.Namespace) -> None:
    out_dir: Path = args.output_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    frames_count: int = args.frames
    cols: int = args.cols
    rows: int = math.ceil(frames_count / cols)

    # 1. Load source
    src = Image.open(args.input).convert("RGBA")
    src.save(out_dir / "source.png")

    # 2. raw-sheet.png — un-cleaned sprite tiled on magenta (re-processing compatible)
    raw_cell = fit_sprite_to_cell(src, args.cell_size, args.fit_scale, args.align)
    raw_frames = [raw_cell.copy() for _ in range(frames_count)]
    compose_on_magenta(raw_frames, rows, cols, args.cell_size).save(out_dir / "raw-sheet.png")

    # 3. Remove background
    edge_threshold = args.bg_edge_threshold  # None → computed inside prepare_sprite
    cleaned_src, bg_color_used = prepare_sprite(src, args.bg_mode, args.bg_threshold, edge_threshold)

    # 4. Fit cleaned sprite into cell
    sprite_cell = fit_sprite_to_cell(cleaned_src, args.cell_size, args.fit_scale, args.align)

    # 5. Build animation frames
    if args.anim_mode == "walk":
        frames: list[Image.Image] = build_walk_frames(sprite_cell, frames_count, args.cell_size, args.bob_px, args.rock_deg)
    elif args.anim_mode == "idle":
        frames: list[Image.Image] = build_idle_frames(sprite_cell, frames_count, args.cell_size, args.bob_px)
    else:
        frames: list[Image.Image] = [sprite_cell.copy() for _ in range(frames_count)]

    # 6. Transparent sheets
    transparent_sheet = compose_sheet(frames, rows, cols, args.cell_size)
    transparent_sheet.save(out_dir / "raw-sheet-clean.png")
    transparent_sheet.save(out_dir / "sheet-transparent.png")

    # 7. Per-frame PNGs
    for i, frame in enumerate(frames, start=1):
        frame.save(out_dir / f"frame-{i}.png")

    # 8. GIF
    save_transparent_gif(frames, out_dir / "animation.gif", args.duration)

    # 9. QC metadata
    sprite_bbox = list(cleaned_src.getbbox() or [0, 0, 0, 0])
    cell_bbox = sprite_cell.getbbox()
    edge_touch = bbox_touches_edge(cell_bbox, args.cell_size, args.cell_size, margin=2)

    artifacts = (
        ["source.png", "raw-sheet.png", "raw-sheet-clean.png", "sheet-transparent.png",
         "animation.gif", "pipeline-meta.json"]
        + [f"frame-{i}.png" for i in range(1, frames_count + 1)]
    )

    meta = {
        "input": str(args.input.resolve()),
        "frames": frames_count,
        "cols": cols,
        "rows": rows,
        "duration": args.duration,
        "bg_mode": args.bg_mode,
        "bg_color_sampled": list(bg_color_used) if bg_color_used else None,
        "bg_threshold": args.bg_threshold,
        "cell_size": args.cell_size,
        "fit_scale": args.fit_scale,
        "align": args.align,
        "shared_scale": args.shared_scale,
        "anim_mode": args.anim_mode,
        "bob_px": args.bob_px,
        "rock_deg": getattr(args, "rock_deg", 5.0),
        "source_size": list(src.size),
        "sprite_bbox": sprite_bbox,
        "frames_written": frames_count,
        "edge_touch_frames": [i for i in range(1, frames_count + 1)] if edge_touch else [],
        "output_dir": str(out_dir.resolve()),
        "artifacts": artifacts,
    }
    (out_dir / "pipeline-meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(str(out_dir.resolve()))


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="Source image path")
    parser.add_argument("--output-dir", required=True, type=Path, help="Output directory")
    parser.add_argument("--frames", type=int, default=4, help="Total frame count")
    parser.add_argument("--cols", type=int, default=2, help="Grid columns (rows = ceil(frames/cols))")
    parser.add_argument("--duration", type=int, default=200, help="ms per frame")
    parser.add_argument(
        "--bg-mode",
        choices=["white", "magenta", "auto", "none"],
        default="auto",
        help="Background removal mode",
    )
    parser.add_argument("--bg-threshold", type=int, default=30, help="Background color distance threshold")
    parser.add_argument(
        "--bg-edge-threshold",
        type=int,
        default=None,
        help="Edge flood-fill threshold (default: 1.5 × bg-threshold)",
    )
    parser.add_argument("--cell-size", type=int, default=128, help="Output cell size in px")
    parser.add_argument("--fit-scale", type=float, default=0.85, help="Sprite fill fraction of cell")
    parser.add_argument(
        "--align",
        choices=["center", "bottom", "feet"],
        default="center",
        help="Sprite alignment within cell",
    )
    parser.add_argument(
        "--shared-scale",
        action="store_true",
        help="Reserved for future multi-source mode; no-op for static tiling",
    )
    parser.add_argument(
        "--anim-mode",
        choices=["static", "idle", "walk"],
        default="idle",
        help="Procedural animation mode to apply",
    )
    parser.add_argument(
        "--bob-px",
        type=int,
        default=3,
        help="Vertical bob amplitude in pixels (0 = no bob)",
    )
    parser.add_argument(
        "--rock-deg",
        type=float,
        default=5.0,
        help="Rocking rotation angle for walk cycle",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    cmd_process(args)


if __name__ == "__main__":
    main()
