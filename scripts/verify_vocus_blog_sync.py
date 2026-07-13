#!/usr/bin/env python3
"""Read-only acceptance test for a Vocus-to-website blog replay."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


FORBIDDEN = re.compile(r"(?i)(VOCUS_(?:PASSWORD|EMAIL|TOKEN)|api[_-]?key|authorization:\s*bearer|BEGIN (?:RSA |EC )?PRIVATE KEY|/Users/|/home/)")


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify a generated personal-site article against its published Vocus record.")
    parser.add_argument("--site-root", type=Path, default=Path("."))
    parser.add_argument("--record", type=Path, required=True)
    parser.add_argument("--archive-root", type=Path, required=True)
    args = parser.parse_args()

    errors: list[str] = []
    root = args.site_root.resolve()
    record = load_json(args.record.resolve())
    slug = record["personal_site"]["slug"]
    seo = record["personal_site"]["seo"]
    expected_url = f"https://orikan347.github.io/taixin-website/blog/{slug}/"
    article_path = root / "blog" / slug / "index.html"
    index_path = root / "blog" / "index.html"
    registry_path = root / "data" / "blog" / "articles.json"
    passport_path = root / "內部工作資料" / "2026-07-13_個人網站部落格" / "artifact-passport.json"

    archive_path = args.archive_root.resolve() / record["source_snapshot"]["archive_relative_path"]
    if not archive_path.is_file() or sha256(archive_path) != record["source_snapshot"]["sha256"]:
        errors.append("source archive hash mismatch")

    for path in (article_path, index_path, registry_path, root / "rss.xml", root / "sitemap.xml", root / "robots.txt", root / "404.html", passport_path):
        if not path.is_file():
            errors.append(f"missing required file: {path.relative_to(root)}")

    if article_path.is_file():
        article_html = article_path.read_text(encoding="utf-8")
        expected_strings = (
            f"<title>{seo['title']}</title>",
            f'<link rel="canonical" href="{expected_url}">',
            f"<h1>{seo['h1']}</h1>",
            record["vocus"]["public_url"],
            'href="../../#contact"',
            '"@type":"BlogPosting"',
            '"@type":"BreadcrumbList"',
        )
        for expected in expected_strings:
            if expected not in article_html:
                errors.append(f"article missing: {expected}")
        if "PENDING_VOCUS_BODY_AND_CANONICAL" in article_html:
            errors.append("article still contains superseded mock status")
        if FORBIDDEN.search(article_html):
            errors.append("article contains forbidden secret or absolute path")

    if index_path.is_file():
        index_html = index_path.read_text(encoding="utf-8")
        if f'href="{slug}/"' not in index_html or seo["h1"] not in index_html:
            errors.append("blog index does not list generated article")
        if "why-follow-up-gets-no-reply" in index_html:
            errors.append("blog index still lists superseded mock article")

    if registry_path.is_file():
        registry = load_json(registry_path)
        matches = [item for item in registry.get("articles", []) if item.get("record_id") == record["record_id"]]
        if len(matches) != 1 or matches[0].get("site_url") != expected_url:
            errors.append("blog registry has no exact published-record match")

    if (root / "rss.xml").is_file():
        try:
            rss = ET.parse(root / "rss.xml")
            items = rss.findall("./channel/item")
            if not any(item.findtext("link") == expected_url and item.findtext("source") == "Vocus 原始發布頁" for item in items):
                errors.append("RSS lacks the generated article or Vocus source attribution")
        except ET.ParseError as exc:
            errors.append(f"RSS XML invalid: {exc}")

    if (root / "sitemap.xml").is_file():
        try:
            sitemap = ET.parse(root / "sitemap.xml")
            urls = [node.text for node in sitemap.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
            if expected_url not in urls:
                errors.append("sitemap lacks generated article")
        except ET.ParseError as exc:
            errors.append(f"sitemap XML invalid: {exc}")

    if (root / "robots.txt").is_file() and "Sitemap: https://orikan347.github.io/taixin-website/sitemap.xml" not in (root / "robots.txt").read_text(encoding="utf-8"):
        errors.append("robots.txt lacks sitemap declaration")

    if passport_path.is_file():
        passport = load_json(passport_path)
        if passport.get("source", {}).get("source_sha256") != record["source_snapshot"]["sha256"]:
            errors.append("artifact passport source hash mismatch")
        for relative_path, expected_hash in passport.get("sha256", {}).items():
            actual_path = root / relative_path
            if not actual_path.is_file() or sha256(actual_path) != expected_hash:
                errors.append(f"artifact passport output hash mismatch: {relative_path}")

    result = {
        "overall": "PASS" if not errors else "FAIL",
        "record_id": record["record_id"],
        "article_url": expected_url,
        "checks": 8,
        "errors": errors,
        "external_write_attempted": False,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
