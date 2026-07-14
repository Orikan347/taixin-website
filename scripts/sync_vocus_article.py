#!/usr/bin/env python3
"""Build a static Taixin website article from an already-published Vocus record.

This is deliberately offline and one-way: it reads a verified publication
record plus its immutable source archive, then writes only inside this website
repository.  It never calls Vocus, deploys the site, or reads credentials.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import re
import sys
from datetime import date, datetime, timezone
from email.utils import format_datetime
from pathlib import Path
from urllib.parse import urlparse


SITE_BASE_URL = "https://orikan347.github.io/taixin-website"
FALLBACK_COVER_URL = f"{SITE_BASE_URL}/img/og-cover.jpg"
BLOG_DIR = Path("blog")
INTERNAL_DIR = Path("內部工作資料/2026-07-13_個人網站部落格")
REGISTRY_PATH = Path("data/blog/articles.json")
STATIC_SITEMAP_PATHS = (
    ("/", "2026-07-13"),
    ("/ai-student-qa.html", "2026-07-10"),
    ("/liuliang.html", "2026-04-16"),
    ("/chengjiaoditu.html", "2026-04-16"),
    ("/jizhixiaolv.html", "2026-04-16"),
    ("/yanzhiyouwu.html", "2026-04-16"),
    ("/zhizhirenxin.html", "2026-04-16"),
)
SHA256 = re.compile(r"^[a-f0-9]{64}$")
FORBIDDEN_PUBLIC = re.compile(
    r"(?i)(VOCUS_(?:PASSWORD|EMAIL|TOKEN)|api[_-]?key|authorization:\s*bearer|BEGIN (?:RSA |EC )?PRIVATE KEY|/Users/|/home/)"
)


def fail(message: str) -> None:
    raise ValueError(message)


def load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        fail(f"missing file: {path}")
    except json.JSONDecodeError as exc:
        fail(f"invalid JSON: {path}: {exc}")


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_path(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def strip_front_matter_and_h1(source: str, title: str) -> str:
    if source.startswith("---\n"):
        closing = source.find("\n---\n", 4)
        if closing != -1:
            source = source[closing + 5 :]
    lines = source.lstrip().splitlines()
    if lines and lines[0].strip() == f"# {title}":
        lines = lines[1:]
    return "\n".join(lines).strip()


def validate_record(record: dict, archive_root: Path) -> tuple[Path, str]:
    required = ("record_id", "artifact", "vocus", "source_snapshot", "personal_site", "canonical", "images")
    for field in required:
        if not record.get(field):
            fail(f"record missing {field}")

    artifact = record["artifact"]
    vocus = record["vocus"]
    snapshot = record["source_snapshot"]
    site = record["personal_site"]
    canonical = record["canonical"]
    title = str(artifact.get("title", "")).strip()
    slug = str(site.get("slug", "")).strip()
    if not title or not re.fullmatch(r"[a-z0-9-]+", slug):
        fail("record title or slug is invalid")
    if vocus.get("published_status") != 2:
        fail("Vocus record is not publicly published (status must be 2)")
    parsed = urlparse(str(vocus.get("public_url", "")))
    if parsed.scheme != "https" or parsed.netloc != "vocus.cc" or not re.fullmatch(r"/article/[a-f0-9]+", parsed.path):
        fail("Vocus public_url is invalid")
    expected_hash = str(snapshot.get("sha256", ""))
    if not SHA256.fullmatch(expected_hash) or artifact.get("content_sha256") != expected_hash:
        fail("source hash is missing or does not match the artifact hash")
    if canonical.get("primary_copy") != "PERSONAL_SITE_INTENDED_PRIMARY":
        fail("record is not approved for personal-site primary copy")
    relative_source = Path(str(snapshot.get("archive_relative_path", "")))
    source_path = (archive_root / relative_source).resolve()
    try:
        source_path.relative_to(archive_root.resolve())
    except ValueError:
        fail("source archive path escapes archive root")
    if not source_path.is_file():
        fail(f"source archive does not exist: {relative_source}")
    actual_hash = sha256_path(source_path)
    if actual_hash != expected_hash:
        fail("source archive hash does not match published record")
    if title not in source_path.read_text(encoding="utf-8"):
        fail("record title is not present in the source archive")
    if not all(len(str(image.get("alt", "")).strip()) >= 4 for image in record["images"]):
        fail("every source image needs a non-empty alt text")
    return source_path, actual_hash


def format_local_date(value: str) -> str:
    return datetime.strptime(value, "%Y-%m-%d").strftime("%Y/%m/%d")


def format_rss_date(value: str) -> str:
    parsed = datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    return format_datetime(parsed, usegmt=True)


def render_body(markdown: str) -> str:
    blocks: list[str] = []
    for raw in re.split(r"\n\s*\n", markdown.strip()):
        text = raw.strip()
        if not text:
            continue
        if text.startswith("### "):
            blocks.append(f"<h3>{html.escape(text[4:].strip())}</h3>")
        elif text.startswith("## "):
            blocks.append(f"<h2>{html.escape(text[3:].strip())}</h2>")
        elif text.startswith("> "):
            blocks.append(f"<blockquote>{html.escape(text[2:].strip())}</blockquote>")
        else:
            blocks.append(f"<p>{html.escape(text).replace(chr(10), '<br>')}</p>")
    return "\n      ".join(blocks)


def article_from_record(record: dict, source_hash: str) -> dict:
    site = record["personal_site"]
    seo = site["seo"]
    vocus = record["vocus"]
    images = record["images"]
    cover = next((image for image in images if image.get("role") == "cover"), images[0])
    inline = next((image for image in images if image.get("role") == "inline"), None)
    slug = site["slug"]
    return {
        "record_id": record["record_id"],
        "slug": slug,
        "title": seo["h1"],
        "seo_title": seo["title"],
        "description": seo["description"],
        "author": seo["author_name"],
        "published_at": vocus["published_at"],
        "updated_at": vocus["published_at"],
        "site_url": f"{SITE_BASE_URL}/blog/{slug}/",
        "vocus_url": vocus["public_url"],
        "source_sha256": source_hash,
        "source_label": seo["source_link_label"],
        "cover": {"url": cover["source_url"], "alt": cover["alt"], "status": cover.get("status")},
        "inline": ({"url": inline["source_url"], "alt": inline["alt"], "status": inline.get("status")} if inline else None),
        "canonical_status": "PERSONAL_SITE_RENDERED_VOCUS_LIVE_READBACK_PENDING",
        "vocus_canonical_readback": record["canonical"].get("vocus_setting_status"),
        "cta": {
            "label": "想把這套思考用在銷售與團隊？和我聊聊",
            "url": f"{SITE_BASE_URL}/#contact",
        },
    }


def render_article_html(article: dict, source_body: str) -> str:
    title = html.escape(article["title"])
    description = html.escape(article["description"])
    site_url = article["site_url"]
    vocus_url = article["vocus_url"]
    graph = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "BlogPosting",
                "@id": site_url + "#article",
                "headline": article["title"],
                "description": article["description"],
                "datePublished": article["published_at"],
                "dateModified": article["updated_at"],
                "inLanguage": "zh-Hant-TW",
                "mainEntityOfPage": {"@type": "WebPage", "@id": site_url},
                "url": site_url,
                "image": [FALLBACK_COVER_URL, article["cover"]["url"]],
                "author": {"@type": "Person", "name": article["author"], "url": SITE_BASE_URL + "/", "sameAs": ["https://www.instagram.com/eintaixin/"]},
                "publisher": {"@type": "Person", "name": article["author"], "url": SITE_BASE_URL + "/"},
                "isBasedOn": {"@type": "CreativeWork", "name": "Vocus 原始發布頁", "url": vocus_url},
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "首頁", "item": SITE_BASE_URL + "/"},
                    {"@type": "ListItem", "position": 2, "name": "文章", "item": SITE_BASE_URL + "/blog/"},
                    {"@type": "ListItem", "position": 3, "name": article["title"], "item": site_url},
                ],
            },
        ],
    }
    paragraphs = render_body(source_body)
    inline_image = ""
    if article.get("inline"):
        inline_image = f'\n      <figure><img src="{html.escape(article["inline"]["url"])}" alt="{html.escape(article["inline"]["alt"])}" loading="lazy" onerror="this.onerror=null;this.src=\'../../img/og-cover.jpg\';this.alt=\'Orikan 李泰欣文章圖解備援封面\';"><figcaption>本文觀點圖解。</figcaption></figure>'
    return f'''<!doctype html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html.escape(article["seo_title"])}</title>
  <meta name="description" content="{description}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="{site_url}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="{site_url}">
  <meta property="og:image" content="{FALLBACK_COVER_URL}">
  <meta property="article:published_time" content="{article["published_at"]}">
  <meta property="article:modified_time" content="{article["updated_at"]}">
  <link rel="alternate" type="application/rss+xml" title="Orikan 李泰欣文章 RSS" href="../../rss.xml">
  <link rel="stylesheet" href="../styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;800&display=swap" rel="stylesheet">
  <script type="application/ld+json">{json.dumps(graph, ensure_ascii=False, separators=(",", ":"))}</script>
</head>
<body>
  <header class="site-header"><nav class="site-nav" aria-label="主要導覽"><a class="brand" href="../../">ORIKAN</a><div class="nav-links"><a href="../../">首頁</a><a href="../../#courses">課程</a><a href="../">文章</a><a href="../../#contact">聯繫我</a></div></nav></header>
  <main class="wrap article-shell">
    <nav class="breadcrumbs" aria-label="麵包屑"><a href="../../">首頁</a><span aria-hidden="true">/</span><a href="../">文章</a><span aria-hidden="true">/</span><span>{title}</span></nav>
    <div class="eyebrow">思考 · 成長 · 銷售</div>
    <h1>{title}</h1>
    <div class="article-meta">作者：{html.escape(article["author"])}　·　發布：{format_local_date(article["published_at"])}　·　<a href="{html.escape(vocus_url)}" rel="noopener noreferrer">查看 Vocus 原始發布頁 ↗</a></div>
    <figure class="cover"><img src="{html.escape(article["cover"]["url"])}" alt="{html.escape(article["cover"]["alt"])}" onerror="this.onerror=null;this.src='../../img/og-cover.jpg';this.alt='Orikan 李泰欣文章封面';"><figcaption>文章封面。</figcaption></figure>
    <aside class="source-note"><strong>網站版導讀</strong><p>結果會讓人看見你，但能不能被長期信任，取決於你用什麼德性承接能力。這篇文章把這個判斷放回銷售與合作關係：先看一個人是否值得同行，再談他能走多快。</p></aside>
    <article class="article-body">
      {paragraphs}{inline_image}
    </article>
    <aside class="citation"><strong>原始發布與同步說明</strong><p>本文依據已公開的 Vocus 原文同步至官網；保留原始發布頁，方便讀者追溯來源。</p><p><a href="{html.escape(vocus_url)}" rel="noopener noreferrer">{html.escape(article["source_label"])} ↗</a></p></aside>
    <aside class="cta"><h2>想把這套思考用在銷售與團隊？</h2><p>從客戶開發、需求診斷到成交，先找到你現在真正卡住的那一段。</p><a class="button" href="../../#contact">和我聊聊</a></aside>
  </main>
  <footer>© 2026 Orikan 李泰欣 · <a href="../">回到文章列表</a> · <a href="../../rss.xml">RSS</a></footer>
</body>
</html>
'''


def render_index_html(articles: list[dict]) -> str:
    cards = []
    for article in articles:
        cards.append(
            f'''      <article class="card"><a class="card-image" href="{html.escape(article["slug"])}/"><img src="{html.escape(article["cover"]["url"])}" alt="{html.escape(article["cover"]["alt"])}" loading="lazy" onerror="this.onerror=null;this.src='../img/og-cover.jpg';this.alt='Orikan 李泰欣文章封面';"></a><div class="meta">{format_local_date(article["published_at"])}・思考與成長</div><h2><a href="{html.escape(article["slug"])}/">{html.escape(article["title"])}</a></h2><p>{html.escape(article["description"])}</p><a href="{html.escape(article["slug"])}/">閱讀文章 →</a></article>'''
        )
    graph = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": "文章｜Orikan 李泰欣",
        "url": SITE_BASE_URL + "/blog/",
        "inLanguage": "zh-Hant-TW",
        "isPartOf": {"@type": "WebSite", "name": "Orikan 李泰欣", "url": SITE_BASE_URL + "/"},
        "author": {"@type": "Person", "name": "Orikan 李泰欣", "url": SITE_BASE_URL + "/", "sameAs": ["https://www.instagram.com/eintaixin/"]},
    }
    return f'''<!doctype html>
<html lang="zh-Hant-TW">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>文章｜Orikan 李泰欣</title>
  <meta name="description" content="Orikan 李泰欣的銷售、客戶經營、成交與工作方法文章。先回答問題，再拆解可執行的下一步。">
  <link rel="canonical" href="{SITE_BASE_URL}/blog/">
  <meta property="og:title" content="文章｜Orikan 李泰欣">
  <meta property="og:description" content="銷售、客戶經營、成交與工作方法文章。">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{SITE_BASE_URL}/blog/">
  <meta property="og:image" content="{SITE_BASE_URL}/img/og-cover.jpg">
  <link rel="alternate" type="application/rss+xml" title="Orikan 李泰欣文章 RSS" href="../rss.xml">
  <link rel="stylesheet" href="styles.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;800&display=swap" rel="stylesheet">
  <script type="application/ld+json">{json.dumps(graph, ensure_ascii=False, separators=(",", ":"))}</script>
</head>
<body>
  <header class="site-header"><nav class="site-nav" aria-label="主要導覽"><a class="brand" href="../">ORIKAN</a><div class="nav-links"><a href="../">首頁</a><a href="../#courses">課程</a><a href="./" aria-current="page">文章</a><a href="../#contact">聯繫我</a></div></nav></header>
  <main>
    <section class="hero"><div class="wrap"><div class="eyebrow">Journal / Ideas / Practice</div><h1>把銷售與工作，想得更清楚。</h1><p class="lead">這裡整理李泰欣對客戶經營、成交、表達與工作方法的公開文章。每篇文章先給能用的答案，再補上脈絡與下一步。</p></div></section>
    <section class="wrap grid" aria-label="文章列表">
{chr(10).join(cards)}
    </section>
  </main>
  <footer>© 2026 Orikan 李泰欣 · <a href="../rss.xml">訂閱 RSS</a></footer>
</body>
</html>
'''


def render_rss(articles: list[dict], synced_at: str) -> str:
    items = []
    for article in articles:
        title = html.escape(article["title"])
        url = article["site_url"]
        description = html.escape(article["description"])
        items.append(f'''    <item>
      <title>{title}</title>
      <link>{url}</link>
      <guid isPermaLink="true">{url}</guid>
      <pubDate>{format_rss_date(article["published_at"])}</pubDate>
      <description>{description}</description>
      <source url="{html.escape(article["vocus_url"])}">Vocus 原始發布頁</source>
    </item>''')
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Orikan 李泰欣文章</title>
    <link>{SITE_BASE_URL}/blog/</link>
    <description>Orikan 李泰欣的銷售、客戶經營、成交與工作方法文章。</description>
    <language>zh-TW</language>
    <lastBuildDate>{format_rss_date(synced_at)}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="{SITE_BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
{chr(10).join(items)}
  </channel>
</rss>
'''


def render_sitemap(articles: list[dict], synced_at: str) -> str:
    urls = [("/blog/", synced_at)] + [(f"/blog/{article['slug']}/", article["updated_at"]) for article in articles] + list(STATIC_SITEMAP_PATHS)
    rows = "\n".join(f"  <url><loc>{SITE_BASE_URL}{path}</loc><lastmod>{lastmod}</lastmod></url>" for path, lastmod in urls)
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{rows}
</urlset>
'''


def load_registry(path: Path) -> list[dict]:
    if not path.exists():
        return []
    content = load_json(path)
    articles = content.get("articles", [])
    if not isinstance(articles, list):
        fail("existing blog registry has invalid articles")
    return articles


def assert_no_conflicting_published_evidence(site_root: Path, article: dict) -> None:
    """Refuse to replace an existing article whose published evidence differs.

    The two hashes may be based on different serializations, so a mismatch is
    not proof that Vocus content changed. It is, however, enough to make an
    automatic overwrite unsafe. The operator must run the evidence audit and
    resolve the canonical/source decision before a new version is recorded.
    """
    registry_path = site_root / REGISTRY_PATH
    matches = [
        existing for existing in load_registry(registry_path)
        if existing.get("vocus_url") == article["vocus_url"] or existing.get("slug") == article["slug"]
    ]
    if len(matches) > 1:
        fail("existing blog registry has multiple entries for this Vocus article; refusing overwrite")
    if not matches:
        return
    existing_hash = str(matches[0].get("source_sha256", ""))
    if not SHA256.fullmatch(existing_hash):
        fail("existing blog article has no valid provenance hash; refusing overwrite until manually reviewed")
    if existing_hash != article["source_sha256"]:
        fail("published evidence conflicts with the existing blog registry; refusing overwrite. Run audit_vocus_published_evidence.py and resolve the source/canonical decision first")


def build_outputs(site_root: Path, article: dict, source_body: str, synced_at: str) -> dict[Path, str]:
    registry_path = site_root / REGISTRY_PATH
    existing = [item for item in load_registry(registry_path) if item.get("record_id") != article["record_id"] and item.get("slug") != article["slug"]]
    articles = sorted([article, *existing], key=lambda item: (item["published_at"], item["slug"]), reverse=True)
    registry = {
        "schema_version": "1.0",
        "site_base_url": SITE_BASE_URL,
        "generated_at": synced_at,
        "canonical_policy": "官網已輸出 canonical；Vocus canonical 設定與公開 HTML 讀回仍需另行驗證。",
        "articles": articles,
    }
    outputs = {
        site_root / BLOG_DIR / article["slug"] / "index.html": render_article_html(article, source_body),
        site_root / BLOG_DIR / "index.html": render_index_html(articles),
        site_root / "rss.xml": render_rss(articles, synced_at),
        site_root / "sitemap.xml": render_sitemap(articles, synced_at),
        registry_path: json.dumps(registry, ensure_ascii=False, indent=2) + "\n",
    }
    return outputs


def build_internal_outputs(site_root: Path, article: dict, outputs: dict[Path, str], synced_at: str) -> dict[Path, str]:
    internal_root = site_root / INTERNAL_DIR
    source_status = "PUBLISHED_STATUS_2_ARCHIVE_HASH_MATCH"
    ledger_rows = [
        ["record_id", "source_url", "site_url", "title", "author", "published_at", "source_fetch_status", "content_hash", "canonical_decision", "cta_status", "last_checked", "notes"],
        [article["record_id"], article["vocus_url"], article["site_url"], article["title"], article["author"], article["published_at"], source_status, article["source_sha256"], article["canonical_status"], "SITE_CONTACT_CTA_RENDERED", synced_at, "Vocus canonical account setting and public HTML readback remain pending; this run made no external write."],
    ]
    ledger = []
    for row in ledger_rows:
        ledger.append(",".join('"' + str(value).replace('"', '""') + '"' for value in row))
    public_hashes = {str(path.relative_to(site_root)): sha256_bytes(content.encode("utf-8")) for path, content in outputs.items()}
    for relative_path in (Path("index.html"), Path("blog/styles.css"), Path("robots.txt"), Path("404.html")):
        existing_path = site_root / relative_path
        if existing_path.is_file():
            public_hashes[str(relative_path)] = sha256_path(existing_path)
    passport = {
        "artifact_id": "ORI-WEBSITE-VOCUS-SYNC-20260713-V2",
        "creator": "Orikan 李泰欣",
        "created_at": synced_at,
        "version": "local-replay-v2",
        "classification": "published-vocus-to-personal-site-local-replay",
        "record_id": article["record_id"],
        "source": {"vocus_url": article["vocus_url"], "published_status": 2, "source_sha256": article["source_sha256"]},
        "publication_or_delivery_record": "NO_EXTERNAL_PUBLICATION",
        "verification_status": "LOCAL_BUILD_READY_FOR_BROWSER_E2E",
        "privacy_status": "PASS_NO_CUSTOMER_DATA_OR_SECRETS_IN_GENERATED_OUTPUTS",
        "canonical_status": article["canonical_status"],
        "sha256": public_hashes,
    }
    report = {
        "record_id": article["record_id"],
        "checked_at": synced_at,
        "mode": "OFFLINE_READ_ONLY_SOURCE_TO_LOCAL_STATIC_SITE",
        "external_write_attempted": False,
        "vocus_status": 2,
        "source_sha256": article["source_sha256"],
        "generated_article_url": article["site_url"],
        "canonical_status": article["canonical_status"],
        "pending_live_readback": ["Vocus canonical account setting", "Vocus public HTML canonical", "GitHub Pages deployed DOM", "Search Console index state", "image visual-alt review"],
        "outputs": sorted(public_hashes),
    }
    return {
        internal_root / "vocus-sync-ledger.csv": "\n".join(ledger) + "\n",
        internal_root / "artifact-passport.json": json.dumps(passport, ensure_ascii=False, indent=2) + "\n",
        internal_root / "sync-run-report.json": json.dumps(report, ensure_ascii=False, indent=2) + "\n",
    }


def assert_safe_outputs(outputs: dict[Path, str]) -> None:
    for path, content in outputs.items():
        if FORBIDDEN_PUBLIC.search(content):
            fail(f"generated output contains a secret or absolute path: {path}")
        if path.suffix == ".html" and content.count("<title>") != 1:
            fail(f"generated HTML must have one title: {path}")


def write_outputs(outputs: dict[Path, str]) -> None:
    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate a local personal-site replay from one published Vocus record.")
    parser.add_argument("--record", type=Path, required=True, help="Published Vocus sync record JSON; no credentials allowed.")
    parser.add_argument("--archive-root", type=Path, required=True, help="Vocus project root containing the immutable archive.")
    parser.add_argument("--site-root", type=Path, default=Path("."), help="This website repository root.")
    parser.add_argument("--synced-at", default=date.today().isoformat(), help="YYYY-MM-DD date stored in local generated files.")
    parser.add_argument("--write", action="store_true", help="Write local static-site outputs. Without this flag the command is a no-write preflight.")
    args = parser.parse_args()

    try:
        datetime.strptime(args.synced_at, "%Y-%m-%d")
        site_root = args.site_root.resolve()
        record = load_json(args.record.resolve())
        source_path, source_hash = validate_record(record, args.archive_root.resolve())
        source_body = strip_front_matter_and_h1(source_path.read_text(encoding="utf-8"), record["artifact"]["title"])
        if not source_body:
            fail("source archive has no article body after metadata removal")
        article = article_from_record(record, source_hash)
        assert_no_conflicting_published_evidence(site_root, article)
        public_outputs = build_outputs(site_root, article, source_body, args.synced_at)
        internal_outputs = build_internal_outputs(site_root, article, public_outputs, args.synced_at)
        all_outputs = {**public_outputs, **internal_outputs}
        assert_safe_outputs(all_outputs)
        if args.write:
            write_outputs(all_outputs)
        result = {
            "overall": "PASS_LOCAL_WRITE" if args.write else "PASS_DRY_RUN_NO_WRITE",
            "record_id": article["record_id"],
            "title": article["title"],
            "source_sha256": source_hash,
            "generated_article_url": article["site_url"],
            "output_count": len(all_outputs),
            "external_write_attempted": False,
            "canonical_status": article["canonical_status"],
        }
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0
    except ValueError as exc:
        print(json.dumps({"overall": "FAIL", "error": str(exc), "external_write_attempted": False}, ensure_ascii=False), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
