#!/usr/bin/env python3
"""Read-only release gate for the complete public Vocus article catalogue.

It verifies generated website files only. It never signs in to Vocus, deploys,
or accesses credentials/customer data.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


BASE = "https://orikan347.github.io/taixin-website"
TOPICS = {"client-conversations", "sales-growth", "thinking-practice"}
FORBIDDEN = re.compile(r"(?i)(VOCUS_(?:PASSWORD|EMAIL|TOKEN)|api[_-]?key|authorization:\s*bearer|BEGIN (?:RSA |EC )?PRIVATE KEY|/Users/|/home/)")
AUTHOR_NAME = "Orikan 李泰欣"
AUTHOR_JOB_TITLE = "亞洲銷冠系統架構導師"


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def require_text(errors: list[str], *, page: str, text: str, required: tuple[str, ...]) -> None:
    """Record missing reader-visible or crawler-visible signals for one page."""
    for token in required:
        if token not in text:
            errors.append(f"missing SEO/GEO signal in {page}: {token}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify a full generated Vocus-to-website article catalogue.")
    parser.add_argument("--site-root", type=Path, default=Path("."))
    parser.add_argument("--expected-public-count", type=int, required=True)
    args = parser.parse_args()

    root = args.site_root.resolve()
    errors: list[str] = []
    registry_path = root / "data/blog/articles.json"
    required = (registry_path, root / "blog/index.html", root / "rss.xml", root / "sitemap.xml", root / "robots.txt", root / "llms.txt")
    for path in required:
        if not path.is_file():
            errors.append(f"missing required file: {path.relative_to(root)}")
    if not registry_path.is_file():
        print(json.dumps({"overall": "FAIL", "errors": errors, "external_write_attempted": False}, ensure_ascii=False))
        return 1

    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    articles = registry.get("articles", [])
    if not isinstance(articles, list):
        errors.append("registry articles is not a list")
        articles = []
    if len(articles) != args.expected_public_count:
        errors.append(f"article count mismatch: expected {args.expected_public_count}, got {len(articles)}")
    if registry.get("reported_public_article_count") != args.expected_public_count:
        errors.append("public catalogue count does not match the expected count")

    ids = [str(article.get("vocus_article_id", "")) for article in articles]
    slugs = [str(article.get("slug", "")) for article in articles]
    urls = [str(article.get("site_url", "")) for article in articles]
    if len(ids) != len(set(ids)) or not all(re.fullmatch(r"[a-f0-9]{24}", article_id) for article_id in ids):
        errors.append("Vocus article IDs are missing, invalid, or duplicated")
    if len(slugs) != len(set(slugs)) or not all(re.fullmatch(r"[a-z0-9-]+", slug) and not slug.startswith("vocus-") for slug in slugs):
        errors.append("canonical slugs are missing, non-semantic, or duplicated")

    rss_links: set[str] = set()
    sitemap_urls: set[str] = set()
    if (root / "rss.xml").is_file():
        try:
            rss = ET.parse(root / "rss.xml")
            rss_items = rss.findall("./channel/item")
            rss_links = {item.findtext("link") or "" for item in rss_items}
            if len(rss_items) != len(articles):
                errors.append("RSS item count does not match the article catalogue")
            if any((item.findtext("source") or "") != "Vocus 原始發布頁" for item in rss_items):
                errors.append("RSS contains an item without Vocus source attribution")
        except ET.ParseError as exc:
            errors.append(f"RSS XML invalid: {exc}")
    if (root / "sitemap.xml").is_file():
        try:
            sitemap = ET.parse(root / "sitemap.xml")
            sitemap_urls = {node.text or "" for node in sitemap.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")}
        except ET.ParseError as exc:
            errors.append(f"sitemap XML invalid: {exc}")
    llms = (root / "llms.txt").read_text(encoding="utf-8") if (root / "llms.txt").is_file() else ""

    # These signals are intentionally verified in generated HTML instead of
    # assuming that a successful file write means a search engine or reader can
    # identify the author, content type, or indexability. They are all public,
    # visible facts; this check does not access analytics, credentials, or any
    # external account.
    blog_index_path = root / "blog/index.html"
    if blog_index_path.is_file():
        require_text(errors, page="blog index", text=blog_index_path.read_text(encoding="utf-8"), required=(
            '<html lang="zh-Hant-TW">',
            '<meta name="robots" content="index,follow">',
            f'<link rel="canonical" href="{BASE}/blog/">',
            '"@type":"CollectionPage"',
            '<h1>',
            'author-card',
            '我是李泰欣',
            AUTHOR_NAME,
            AUTHOR_JOB_TITLE,
        ))
    if (root / "index.html").is_file():
        homepage = (root / "index.html").read_text(encoding="utf-8")
        if not re.search(r'"@type"\s*:\s*"Person"', homepage):
            errors.append("homepage lacks Person JSON-LD")
        if AUTHOR_NAME not in homepage:
            errors.append("homepage lacks author identity")

    for topic_slug in TOPICS:
        topic_path = root / "blog/topics" / topic_slug / "index.html"
        if not topic_path.is_file():
            errors.append(f"missing topic page: {topic_slug}")
            continue
        topic_html = topic_path.read_text(encoding="utf-8")
        require_text(errors, page=f"topic page {topic_slug}", text=topic_html, required=(
            '<html lang="zh-Hant-TW">',
            '<meta name="robots" content="index,follow">',
            f'<link rel="canonical" href="{BASE}/blog/topics/{topic_slug}/">',
            '"@type":"CollectionPage"',
            '<h1>',
        ))

    if "User-agent: OAI-SearchBot\nAllow: /" not in (root / "robots.txt").read_text(encoding="utf-8"):
        errors.append("robots.txt does not allow OAI-SearchBot on public pages")
    if "User-agent: ChatGPT-User\nAllow: /" not in (root / "robots.txt").read_text(encoding="utf-8"):
        errors.append("robots.txt does not allow ChatGPT-User on public pages")
    require_text(errors, page="llms.txt", text=llms, required=(AUTHOR_NAME, BASE + "/blog/", BASE + "/rss.xml", BASE + "/sitemap.xml"))

    for article in articles:
        article_id = str(article.get("vocus_article_id", ""))
        slug = str(article.get("slug", ""))
        url = str(article.get("site_url", ""))
        description = str(article.get("description", ""))
        topics = article.get("topics", [])
        page = root / "blog" / slug / "index.html"
        legacy = root / "blog" / f"vocus-{article_id}" / "index.html"
        if url != f"{BASE}/blog/{slug}/":
            errors.append(f"canonical URL mismatch: {slug}")
        if not description or len(description) > 160:
            errors.append(f"invalid meta description: {slug}")
        if not isinstance(topics, list) or not topics or any(topic not in TOPICS for topic in topics):
            errors.append(f"invalid topic assignment: {slug}")
        if not page.is_file():
            errors.append(f"missing article page: {slug}")
        else:
            html = page.read_text(encoding="utf-8")
            for required_text in (
                '<html lang="zh-Hant-TW">',
                '<meta name="robots" content="index,follow">',
                f'<link rel="canonical" href="{url}">',
                '"@type":"BlogPosting"',
                '"@type":"Person"',
                f'"jobTitle":"{AUTHOR_JOB_TITLE}"',
                '<h1>',
                '本文作者：',
                'author-card',
                AUTHOR_NAME,
                str(article.get("vocus_url", "")),
            ):
                if required_text not in html:
                    errors.append(f"article SEO/source missing: {slug}")
                    break
            if 'noindex' in html.lower():
                errors.append(f"article is unexpectedly noindex: {slug}")
            if article.get("images") and '<meta property="og:image"' not in html:
                errors.append(f"article with original image lacks og:image: {slug}")
            if FORBIDDEN.search(html):
                errors.append(f"forbidden data in article page: {slug}")
        if not legacy.is_file():
            errors.append(f"missing legacy redirect: {slug}")
        for image in article.get("images", []):
            path = root / "blog/media" / str(image.get("filename", ""))
            if not path.is_file() or sha256(path) != image.get("sha256"):
                errors.append(f"original image hash mismatch: {slug}")
            if not str(image.get("alt", "")).strip():
                errors.append(f"missing image alt text: {slug}")
        if url not in rss_links:
            errors.append(f"RSS missing article: {slug}")
        if url not in sitemap_urls:
            errors.append(f"sitemap missing article: {slug}")
        if url not in llms:
            errors.append(f"llms.txt missing article: {slug}")

    if (root / "robots.txt").is_file() and f"Sitemap: {BASE}/sitemap.xml" not in (root / "robots.txt").read_text(encoding="utf-8"):
        errors.append("robots.txt lacks sitemap declaration")

    result = {
        "overall": "PASS" if not errors else "FAIL",
        "public_articles": len(articles),
        "expected_public_articles": args.expected_public_count,
        "original_images": sum(len(article.get("images", [])) for article in articles),
        "rss_articles": len(rss_links),
        "sitemap_urls": len(sitemap_urls),
        "errors": errors,
        "external_write_attempted": False,
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
