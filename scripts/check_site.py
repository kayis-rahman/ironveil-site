#!/usr/bin/env python3
"""Portable checks for Ironveil's generated, base-path-independent Pages site."""
from __future__ import annotations

import html.parser
import os
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
PAGES = [
    "index.html",
    "404.html",
    "how-to-play/index.html",
    "release/index.html",
    "demo/index.html",
    "privacy/index.html",
    "support/index.html",
]
PAGE_BUDGET = 800 * 1024
IMAGE_BUDGET = 500 * 1024
MEDIA_BUDGET = 750 * 1024
SITE_BUDGET = 3 * 1024 * 1024
SITE_URL = os.environ.get("SITE_URL", "https://ironvei-game.online/")
if not SITE_URL.endswith("/"):
    SITE_URL += "/"
ERRORS: list[str] = []


def error(message: str) -> None:
    ERRORS.append(message)


def srcset_urls(srcset: str) -> list[tuple[str, int]]:
    results: list[tuple[str, int]] = []
    for item in srcset.split(","):
        parts = item.strip().split()
        if not parts:
            continue
        width = 1
        if len(parts) > 1 and parts[1].endswith("w"):
            try:
                width = int(parts[1][:-1])
            except ValueError:
                width = 1
        results.append((parts[0], width))
    return results


class PageParser(html.parser.HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[tuple[str, str]] = []
        self.ids: set[str] = set()
        self.stylesheets: list[str] = []
        self.scripts: list[str] = []
        self.resources: list[str] = []
        self.picture_stack: list[dict[str, object]] = []
        self.picture_costs: list[list[tuple[str, int]]] = []
        self.image_sources: list[str] = []
        self.candidate_urls: list[str] = []
        self.image_sizes: list[tuple[str, int]] = []
        self.image_count = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.add(values["id"] or "")
        if tag == "a" and values.get("href"):
            self.links.append((values["href"] or "", "link"))
        if tag == "link" and values.get("href"):
            rel = (values.get("rel") or "").lower()
            if rel in {"stylesheet", "icon", "apple-touch-icon"}:
                self.links.append((values["href"] or "", rel))
                if rel == "stylesheet":
                    self.stylesheets.append(values["href"] or "")
        if tag == "script" and values.get("src"):
            self.scripts.append(values["src"] or "")
        if tag == "picture":
            self.picture_stack.append({"formats": set(), "candidates": []})
        if tag == "source":
            if self.picture_stack:
                record = self.picture_stack[-1]
                formats = record["formats"]
                if values.get("type"):
                    formats.add((values["type"] or "").lower())
                candidates = record["candidates"]
                if values.get("srcset"):
                    parsed = srcset_urls(values["srcset"] or "")
                    candidates.extend(parsed)
                    self.candidate_urls.extend(url for url, _ in parsed)
            elif values.get("src"):
                self.resources.append(values["src"] or "")
        if tag == "img":
            self.image_count += 1
            src = values.get("src") or ""
            if values.get("alt") is None:
                error("An image is missing alt text")
            if src:
                self.image_sources.append(src)
                if self.picture_stack:
                    record = self.picture_stack[-1]
                    candidates = record["candidates"]
                    parsed = srcset_urls(values.get("srcset") or "")
                    candidates.extend(parsed)
                    self.candidate_urls.extend(url for url, _ in parsed)
                    if not values.get("srcset"):
                        candidates.append((src, 1))
                else:
                    self.image_sizes.append((src, 1))
                    if values.get("srcset"):
                        self.image_sizes.extend(srcset_urls(values["srcset"] or ""))
        if tag == "video":
            if "autoplay" in values:
                error("Video must not autoplay")
            if "controls" not in values:
                error("Video must expose playback controls")
            if (values.get("preload") or "").lower() not in {"none", "metadata"}:
                error("Video must use preload=none or metadata")
        if tag == "video" and values.get("src"):
            self.resources.append(values["src"] or "")
        if tag == "video" and values.get("poster"):
            self.image_sources.append(values["poster"] or "")
            self.image_sizes.append((values["poster"] or "", 1))
    def handle_endtag(self, tag: str) -> None:
        if tag == "picture" and self.picture_stack:
            record = self.picture_stack.pop()
            formats = record["formats"]
            if "image/avif" not in formats or "image/webp" not in formats:
                error("Every picture must provide both AVIF and WebP sources")
            candidates = record["candidates"]
            if candidates:
                highest_width = max(width for _, width in candidates)
                self.picture_costs.append([(url, width) for url, width in candidates if width == highest_width])


def resolve_local(page: Path, url: str) -> tuple[Path | None, str]:
    parsed = urlsplit(url)
    if parsed.scheme or parsed.netloc or url.startswith("//"):
        return None, parsed.fragment
    target = (page.parent / unquote(parsed.path)).resolve() if parsed.path else page.resolve()
    fragment = unquote(parsed.fragment)
    try:
        target.relative_to(DIST.resolve())
    except ValueError:
        error(f"Local URL escapes dist/: {page.relative_to(DIST)}: {url}")
        return None, fragment
    if target.is_dir():
        target = target / "index.html"
    if not target.is_file():
        error(f"Broken local link or asset: {page.relative_to(DIST)}: {url}")
        return None, fragment
    return target, fragment


def checked_file_size(page: Path, url: str) -> int:
    target, _ = resolve_local(page, url)
    if target is None:
        return 0
    return target.stat().st_size


def main() -> int:
    if not DIST.is_dir():
        error("dist/ is missing; run `npm run build` first")
        return 1

    total_site = sum(path.stat().st_size for path in DIST.rglob("*") if path.is_file())
    if total_site > SITE_BUDGET:
        error(f"Site artifact is {total_site / 1024:.0f} KiB, over {SITE_BUDGET / 1024:.0f} KiB")

    all_video_bytes = 0
    for relative in PAGES:
        page = DIST / relative
        if not page.is_file():
            error(f"Missing page: {relative}")
            continue
        parser = PageParser()
        try:
            parser.feed(page.read_text(encoding="utf-8"))
            parser.close()
        except (OSError, UnicodeError) as exc:
            error(f"Cannot parse {relative}: {exc}")
            continue

        page_weight = page.stat().st_size
        for url, kind in parser.links:
            target, fragment = resolve_local(page, url)
            if target is None:
                if urlsplit(url).scheme and kind != "link":
                    error(f"External resource not allowed ({kind}): {relative}: {url}")
                continue
            if kind == "stylesheet":
                page_weight += target.stat().st_size
            if fragment and target.suffix.lower() in {".html", ".htm"}:
                target_parser = PageParser()
                target_parser.feed(target.read_text(encoding="utf-8"))
                if fragment not in target_parser.ids:
                    error(f"Missing fragment #{fragment}: {relative}: {url}")

        for url in parser.scripts:
            if urlsplit(url).scheme or url.startswith("//"):
                error(f"External script not allowed: {relative}: {url}")
            page_weight += checked_file_size(page, url)
        for url in [*parser.image_sources, *parser.candidate_urls]:
            if urlsplit(url).scheme or url.startswith("//"):
                error(f"External image not allowed: {relative}: {url}")
            else:
                resolve_local(page, url)
        for group in parser.picture_costs:
            best = max((checked_file_size(page, url) for url, _ in group), default=0)
            page_weight += best
        for url, width in parser.image_sizes:
            if urlsplit(url).scheme or url.startswith("//"):
                error(f"External image not allowed: {relative}: {url}")
            page_weight += checked_file_size(page, url)
        for url in parser.resources:
            if urlsplit(url).scheme or url.startswith("//"):
                error(f"External media resource not allowed: {relative}: {url}")
            size = checked_file_size(page, url)
            all_video_bytes += size
            if size > MEDIA_BUDGET:
                error(f"Media resource exceeds {MEDIA_BUDGET / 1024:.0f} KiB: {relative}: {url}")
        if page_weight > PAGE_BUDGET:
            error(f"Initial page weight {page_weight / 1024:.0f} KiB exceeds {PAGE_BUDGET / 1024:.0f} KiB: {relative}")
        if parser.picture_stack:
            error(f"Unclosed <picture> in {relative}")
        print(f"OK {relative}: {page_weight / 1024:.0f} KiB initial, {parser.image_count} images")

    for image in DIST.rglob("*"):
        if not image.is_file() or image.suffix.lower() not in {".avif", ".webp", ".png", ".jpg", ".jpeg"}:
            continue
        if image.stat().st_size > IMAGE_BUDGET:
            error(f"Image exceeds {IMAGE_BUDGET / 1024:.0f} KiB: {image.relative_to(DIST)}")
        if not re.search(r"-[0-9a-f]{12}\.(?:avif|webp|png|jpe?g)$", image.name):
            error(f"Image asset is not content-hashed: {image.relative_to(DIST)}")

    for rel in ["assets/css", "assets/js", "assets/media"]:
        for asset in (DIST / rel).glob("*"):
            if not re.search(r"-[0-9a-f]{12}\.", asset.name):
                error(f"Built asset is not content-hashed: {asset.relative_to(DIST)}")

    cname = (DIST / "CNAME").read_text(encoding="utf-8").strip()
    if cname != "ironvei-game.online":
        error("CNAME must contain ironvei-game.online")

    robots = (DIST / "robots.txt").read_text(encoding="utf-8")
    if f"Sitemap: {SITE_URL}sitemap.xml" not in robots:
        error("robots.txt sitemap URL does not match SITE_URL")
    try:
        tree = ET.parse(DIST / "sitemap.xml")
        locations = [node.text or "" for node in tree.findall(".//{*}loc")]
        if len(locations) != 6 or any(not location.startswith(SITE_URL) for location in locations):
            error("sitemap.xml must list the six routes under SITE_URL")
    except (ET.ParseError, OSError) as exc:
        error(f"Invalid sitemap.xml: {exc}")

    if all_video_bytes > MEDIA_BUDGET:
        error(f"Total embedded media is {all_video_bytes / 1024:.0f} KiB, over {MEDIA_BUDGET / 1024:.0f} KiB")
    if ERRORS:
        print("Site checks failed:", file=sys.stderr)
        for item in ERRORS:
            print(f"- {item}", file=sys.stderr)
        return 1
    print(f"All checks passed: {len(PAGES)} pages, {total_site / 1024:.0f} KiB artifact, {all_video_bytes / 1024:.0f} KiB self-hosted video bytes (0 is the current production target).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
