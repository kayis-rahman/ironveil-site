#!/usr/bin/env python3
"""Dependency-light static-site checks for Ironveil (macOS Python 3 + tidy + sips)."""
from __future__ import annotations

import html.parser
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PAGES = sorted([*ROOT.glob("*.html"), *ROOT.glob("*/index.html")])
PAGE_BUDGET = 700 * 1024
IMAGE_BUDGET = 500 * 1024
ERRORS: list[str] = []


def error(message: str) -> None:
    ERRORS.append(message)


class PageParser(html.parser.HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[str] = []
        self.images: list[tuple[str, str | None]] = []
        self.ids: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if values.get("id"):
            self.ids.add(values["id"] or "")
        if tag == "a" and values.get("href"):
            self.links.append(values["href"] or "")
        if tag == "link" and values.get("href") and values.get("rel") in {"stylesheet", "icon"}:
            self.links.append(values["href"] or "")
        if tag == "img":
            self.images.append((values.get("src") or "", values.get("alt")))


def local_target(page: Path, url: str) -> tuple[Path, str]:
    parsed = urlsplit(url)
    target = (page.parent / unquote(parsed.path)).resolve() if parsed.path else page.resolve()
    fragment = unquote(parsed.fragment)
    return target, fragment


def main() -> int:
    if not PAGES:
        error("No HTML pages found")
    tidy = subprocess.run(["which", "tidy"], capture_output=True, text=True)
    sips = subprocess.run(["which", "sips"], capture_output=True, text=True)
    if tidy.returncode:
        error("HTML validation requires macOS tidy (`brew install tidy-html5` if needed)")
    if sips.returncode:
        error("Image dimension checks require macOS sips")

    for page in PAGES:
        rel = page.relative_to(ROOT)
        result = subprocess.run(["tidy", "-config", str(ROOT / "scripts/tidy.conf"), "-quiet", "-errors", "-utf8", str(page)], capture_output=True, text=True)
        diagnostics = result.stderr + result.stdout
        if "Error:" in diagnostics or "Unable to" in diagnostics:
            error(f"HTML validity: {rel}: {diagnostics.strip()}")
        parser = PageParser()
        try:
            parser.feed(page.read_text(encoding="utf-8"))
        except (OSError, UnicodeError) as exc:
            error(f"Cannot read {rel}: {exc}")
            continue
        for src, alt in parser.images:
            if alt is None:
                error(f"Missing alt attribute: {rel} <img src={src!r}>")
            if not src:
                error(f"Empty image source: {rel}")
        weight = page.stat().st_size
        for url in [*parser.links, *(src for src, _ in parser.images)]:
            parsed = urlsplit(url)
            if parsed.scheme or parsed.netloc or url.startswith("//"):
                continue
            target, fragment = local_target(page, url)
            try:
                target.relative_to(ROOT)
            except ValueError:
                error(f"Link escapes site root: {rel}: {url}")
                continue
            if target.is_dir():
                target = target / "index.html"
            if not target.is_file():
                error(f"Broken internal link/asset: {rel}: {url}")
                continue
            weight += target.stat().st_size
            if fragment and target.suffix.lower() in {".html", ".htm"}:
                target_parser = PageParser()
                target_parser.feed(target.read_text(encoding="utf-8"))
                if fragment not in target_parser.ids:
                    error(f"Missing fragment #{fragment}: {rel}: {url}")
        if weight > PAGE_BUDGET:
            error(f"Page weight {weight / 1024:.0f} KiB exceeds {PAGE_BUDGET / 1024:.0f} KiB budget: {rel}")

    for image in sorted([*ROOT.rglob("*.webp"), *ROOT.rglob("*.png"), *ROOT.rglob("*.jpg"), *ROOT.rglob("*.jpeg")]):
        size = image.stat().st_size
        if size > IMAGE_BUDGET:
            error(f"Image size {size / 1024:.0f} KiB exceeds {IMAGE_BUDGET / 1024:.0f} KiB: {image.relative_to(ROOT)}")
        result = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(image)], capture_output=True, text=True)
        match = re.search(r"pixelWidth:\s*(\d+)\s+pixelHeight:\s*(\d+)", result.stdout, re.S)
        if result.returncode or not match or int(match.group(1)) < 1 or int(match.group(2)) < 1:
            error(f"Cannot read image dimensions: {image.relative_to(ROOT)}")

    try:
        ET.parse(ROOT / "sitemap.xml")
    except (ET.ParseError, OSError) as exc:
        error(f"Invalid sitemap.xml: {exc}")
    for page in PAGES:
        print(f"HTML + links + page weight OK: {page.relative_to(ROOT)}") if not ERRORS else None
    if ERRORS:
        print("Site checks failed:", file=sys.stderr)
        for item in ERRORS:
            print(f"- {item}", file=sys.stderr)
        return 1
    print(f"All checks passed: {len(PAGES)} HTML pages; page budget {PAGE_BUDGET // 1024} KiB; image budget {IMAGE_BUDGET // 1024} KiB.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
