#!/usr/bin/env python3
"""Read back the public Blog discovery surface without using owner accounts.

This verifier proves that the deployed pages remain fetchable and internally
consistent for crawlers.  It deliberately does *not* claim Search Console or
Bing inclusion: only an owner-account readback can prove that.
"""

from __future__ import annotations

import argparse
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit, urlunsplit
from urllib.request import Request, urlopen


USER_AGENT = "Orikan-Public-Blog-Discovery-Check/1.0 (read-only)"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def with_cache_bust(url: str, token: str | None) -> str:
    if not token:
        return url
    parsed = urlsplit(url)
    query = parsed.query + ("&" if parsed.query else "") + urlencode({"discovery_check": token})
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, query, parsed.fragment))


def fetch(url: str, *, cache_bust: str | None) -> tuple[int, str]:
    request = Request(with_cache_bust(url, cache_bust), headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xml,text/plain;q=0.9,*/*;q=0.1"})
    try:
        with urlopen(request, timeout=20) as response:  # nosec B310: caller supplies public URL for readback
            return response.status, response.read().decode("utf-8", errors="replace")
    except HTTPError as exc:
        return exc.code, exc.read().decode("utf-8", errors="replace")
    except URLError as exc:
        return 0, str(exc)


def require(errors: list[str], condition: bool, message: str) -> None:
    if not condition:
        errors.append(message)


def main() -> int:
    parser = argparse.ArgumentParser(description="Read back the public Blog's crawler-facing surface.")
    parser.add_argument("--site-root", type=Path, default=Path("."))
    parser.add_argument("--base-url", required=True, help="Published site root, e.g. https://orikan347.github.io/taixin-website")
    parser.add_argument("--cache-bust", help="Optional harmless query value used only for public CDN readback.")
    parser.add_argument("--report", type=Path, help="Optional JSON report under --site-root.")
    args = parser.parse_args()

    root = args.site_root.resolve()
    registry = load_json(root / "data/blog/articles.json")
    articles = registry.get("articles", [])
    base = args.base_url.rstrip("/")
    errors: list[str] = []

    robots_status, robots = fetch(base + "/robots.txt", cache_bust=args.cache_bust)
    require(errors, robots_status == 200, f"robots HTTP {robots_status}")
    require(errors, "User-agent: OAI-SearchBot\nAllow: /" in robots, "robots blocks or omits OAI-SearchBot")
    require(errors, "User-agent: ChatGPT-User\nAllow: /" in robots, "robots blocks or omits ChatGPT-User")
    require(errors, f"Sitemap: {base}/sitemap.xml" in robots, "robots sitemap URL mismatch")

    sitemap_status, sitemap = fetch(base + "/sitemap.xml", cache_bust=args.cache_bust)
    sitemap_urls: set[str] = set()
    if sitemap_status != 200:
        errors.append(f"sitemap HTTP {sitemap_status}")
    else:
        try:
            root_xml = ET.fromstring(sitemap)
            namespace = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
            sitemap_urls = {node.text or "" for node in root_xml.findall(namespace + "url/" + namespace + "loc")}
        except ET.ParseError as exc:
            errors.append(f"invalid sitemap XML: {exc}")

    rss_status, rss = fetch(base + "/rss.xml", cache_bust=args.cache_bust)
    rss_urls: set[str] = set()
    if rss_status != 200:
        errors.append(f"RSS HTTP {rss_status}")
    else:
        try:
            rss_urls = {item.findtext("link") or "" for item in ET.fromstring(rss).findall("./channel/item")}
        except ET.ParseError as exc:
            errors.append(f"invalid RSS XML: {exc}")

    index_status, index_html = fetch(base + "/blog/", cache_bust=args.cache_bust)
    require(errors, index_status == 200, f"blog index HTTP {index_status}")
    require(errors, "我是李泰欣" in index_html and "author-card" in index_html, "blog index lacks visible author identity")
    require(errors, '<link rel="canonical" href="' + base + '/blog/">' in index_html, "blog index canonical mismatch")

    article_results: list[dict[str, object]] = []
    for article in articles:
        url = str(article.get("site_url", ""))
        slug = str(article.get("slug", ""))
        status, html = fetch(url, cache_bust=args.cache_bust)
        article_errors: list[str] = []
        if status != 200:
            article_errors.append(f"HTTP {status}")
        for required in (
            '<meta name="robots" content="index,follow">',
            f'<link rel="canonical" href="{url}">',
            '"@type":"BlogPosting"',
            '本文作者：',
            str(article.get("vocus_url", "")),
        ):
            if required not in html:
                article_errors.append(f"missing {required}")
        if "noindex" in html.lower():
            article_errors.append("unexpected noindex")
        if url not in sitemap_urls:
            article_errors.append("missing from sitemap")
        if url not in rss_urls:
            article_errors.append("missing from RSS")
        if article_errors:
            errors.append(f"article {slug}: " + "; ".join(article_errors))
        article_results.append({"slug": slug, "status": status, "errors": article_errors})

    report = {
        "audit": "public-blog-discovery-readback",
        "overall": "PASS" if not errors else "FAIL",
        "base_url": base,
        "article_count": len(articles),
        "robots_http": robots_status,
        "sitemap_http": sitemap_status,
        "rss_http": rss_status,
        "blog_index_http": index_status,
        "articles": article_results,
        "errors": errors,
        "search_console_and_bing": "PENDING_OWNER_ACCOUNT_READBACK",
        "external_write_attempted": False,
    }
    if args.report:
        report_path = args.report.resolve() if args.report.is_absolute() else (root / args.report).resolve()
        try:
            report_path.relative_to(root)
        except ValueError as exc:
            raise ValueError("--report must be under --site-root") from exc
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if not errors else 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(json.dumps({"overall": "FAIL", "errors": [str(error)], "external_write_attempted": False}, ensure_ascii=False))
        raise SystemExit(2)
