#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Mirror every PUBLISHED Vocus queue item into the static personal blog.

The Vocus public API is read-only here.  Images are copied byte-for-byte into
``blog/media`` so the website does not silently replace an author's Vocus
image with a generic house cover.  Articles without a Vocus image stay
image-free; no placeholder is invented.
"""

from __future__ import annotations

import argparse
import hashlib
import html
import json
import mimetypes
import re
import sys
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen


BASE = "https://orikan347.github.io/taixin-website"
API = "https://api.vocus.cc/api/article/"
UA = "Orikan-Vocus-Catalog-Mirror/1.0 (public-read-only)"
STATIC_PATHS = (
    ("/", "2026-07-13"),
    ("/ai-student-qa.html", "2026-07-10"),
    ("/chengjiaoditu.html", "2026-04-16"),
    ("/consultant-guide.html", "2026-07-13"),
    ("/jizhixiaolv.html", "2026-04-16"),
    ("/liuliang.html", "2026-04-16"),
    ("/shangtan.html", "2026-07-13"),
    ("/yanzhiyouwu.html", "2026-04-16"),
    ("/zhizhirenxin.html", "2026-04-16"),
)

# These are editorial search summaries, not generated keyword stuffing.  They
# are deliberately kept here so a later Vocus sync does not overwrite them
# with a first paragraph or an EDM subject line.
TOPICS = {
    "client-conversations": {
        "name": "客戶溝通與成交",
        "description": "客戶說再考慮、只是看看、想回去商量時，如何聽懂訊號並推進下一步。",
    },
    "sales-growth": {
        "name": "業務成長與工作方法",
        "description": "從客戶經營、成交節奏到長期業績，建立能重複使用的工作方法。",
    },
    "thinking-practice": {
        "name": "思考、修身與學習",
        "description": "把思考、學習與自我修煉，轉成能用在工作與人際關係的判斷力。",
    },
}

SEO_OVERRIDES = {
    "6a5439ecfd8978000133a2d3": {"description": "想提升業績與影響力，不只靠技巧；用德性、能力與結果金字塔，重新建立可被看見的價值。", "topics": ["sales-growth"]},
    "6a5196d6fd8978000180e87e": {"slug": "expand-mind-understand-others", "description": "如何不被自己的見聞與情緒困住？從張載的觀點，練習把心放大，理解人與世界。", "topics": ["thinking-practice"]},
    "6a5045e6fd89780001283436": {"slug": "client-says-ask-spouse", "description": "客戶說「我要回去跟老婆商量」怎麼回？辨識延遲成交背後的三種訊號，讓對話有下一步。", "topics": ["client-conversations"]},
    "6a4ef4d1fd89780001467bb3": {"slug": "client-just-looking-response", "description": "客戶說「我只是看看」怎麼回？這不一定是不買，而是信任尚未建立；用六種軟拒絕判斷下一步。", "topics": ["client-conversations"]},
    "6a4da391fd89780001e54adf": {"slug": "reactivate-old-customers", "description": "舊客戶怎麼重新聯絡？找回手機裡被放棄的客戶，補上跟進節奏與關係經營的業績缺口。", "topics": ["sales-growth", "client-conversations"]},
    "6a4c57dffd897800014ebc2c": {"slug": "consultative-selling", "description": "業務如何不靠強迫說服而成交？讓客戶自己說出需求與理由，建立更有信任感的成交對話。", "topics": ["client-conversations"]},
    "6a4aff70fd89780001de8c8c": {"slug": "slow-steady-sales-performance", "description": "業績想做快，為什麼要先慢下來？頂尖業務用穩定節奏，累積更快也更長久的成果。", "topics": ["sales-growth"]},
    "6a49adf9fd89780001f19689": {"slug": "personal-branding-and-self-cultivation", "description": "自媒體經營不是打造人設；比起害怕被看破，更重要的是讓修身與真實價值被看見。", "topics": ["thinking-practice"]},
    "6a485cbffd8978000198f744": {"description": "學習焦慮怎麼辦？問題不只在學得不夠，而在沒有把知識消化、練習並變成自己的能力。", "topics": ["thinking-practice"]},
    "6a470c60fd8978000130c875": {"description": "學而時習之不是反覆背誦；把知識練成能力，才能真正用在工作、銷售與人生選擇。", "topics": ["thinking-practice"]},
    "6a45b9acfd89780001d2e4c0": {"description": "成交需要進取，但長久合作需要底線。用中庸思維，找到業務推進與信任關係的平衡。", "topics": ["sales-growth", "client-conversations"]},
    "6a44680efd89780001c806fc": {"description": "中庸不是沒有態度；理解狂、狷與底線，才能在銷售與工作中知道何時前進、何時守住原則。", "topics": ["sales-growth", "thinking-practice"]},
    "6a4316d5fd897800014c8468": {"description": "做決定時常缺的不是答案，而是重要訊息。用訊息地圖整理盲點，讓判斷更完整、更不容易後悔。", "topics": ["thinking-practice"]},
    "6a41de51fd89780001e6a934": {"description": "科學知識與人生智慧如何互補？從看見世界的不同方法，練習更完整的思考與判斷。", "topics": ["thinking-practice"]},
    "6a3a1f56fd89780001c17443": {"description": "和而不同不是討好或反對。保有獨立判斷，同時能與人合作，是成熟溝通的重要能力。", "topics": ["thinking-practice"]},
    "6a38ad7efd8978000197cb3c": {"description": "說話要有羞恥心，做事才有責任感。從承諾與行動一致，建立別人願意信任的長期關係。", "topics": ["thinking-practice", "client-conversations"]},
    "6a365b68fd89780001bbe4dd": {"description": "認知失調為何讓人抗拒改變？理解進步與怨恨的拉扯，才能面對不想承認的矛盾並真正成長。", "topics": ["thinking-practice"]},
}


def sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def fetch(url: str) -> tuple[bytes, str]:
    request = Request(url, headers={"User-Agent": UA, "Accept": "application/json,image/*;q=0.9,*/*;q=0.1"})
    with urlopen(request, timeout=30) as response:  # nosec B310: explicit public Vocus URLs only
        return response.read(), response.headers.get_content_type()


def date_of(value: str | None) -> str:
    if not value:
        return "2026-01-01"
    return value[:10]


def rss_date(value: str) -> str:
    return format_datetime(datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=timezone.utc), usegmt=True)


def slug_for(item: dict, article_id: str) -> str:
    if article_id in SEO_OVERRIDES and SEO_OVERRIDES[article_id].get("slug"):
        return SEO_OVERRIDES[article_id]["slug"]
    if article_id == "6a5439ecfd8978000133a2d3":
        return "virtue-capability-results-pyramid"
    raw = re.sub(r"^\d{4}(?:-unknown)?-\d{2}(?:-\d{2})?_", "", item.get("id", ""))
    raw = raw.replace("_", "-")
    raw = re.sub(r"[^a-zA-Z0-9-]+", "-", raw).strip("-").lower()
    return raw if len(raw) >= 4 else f"vocus-{article_id}"


def text_of(node: dict) -> str:
    if node.get("type") == "linebreak":
        return "\n"
    if "text" in node:
        return str(node["text"])
    return "".join(text_of(child) for child in node.get("children", []) if isinstance(child, dict))


def image_nodes(root: dict) -> list[dict]:
    found: list[dict] = []
    stack = [root.get("root", root)]
    while stack:
        node = stack.pop()
        if not isinstance(node, dict):
            continue
        if node.get("type") == "image" and str(node.get("src", "")).startswith("https://images.vocus.cc/"):
            found.append(node)
        stack.extend(reversed(node.get("children", [])))
    return found


def extension(url: str, content_type: str) -> str:
    suffix = Path(url.split("?", 1)[0]).suffix.lower()
    if suffix in {".png", ".jpg", ".jpeg", ".webp", ".gif"}:
        return suffix
    return mimetypes.guess_extension(content_type) or ".img"


def render_body(nodes: list[dict], media: dict[str, dict], title: str) -> str:
    blocks: list[str] = []
    first_image_seen = False
    for node in nodes:
        kind = node.get("type")
        if kind == "image":
            if not first_image_seen:
                first_image_seen = True
                continue
            image = media.get(node.get("src", ""))
            if not image:
                raise ValueError(f"published Vocus image was not mirrored: {node.get('src', '')}")
            caption = str(node.get("caption") or "").strip()
            caption_html = f"<figcaption>{html.escape(caption)}</figcaption>" if caption else ""
            blocks.append(f'<figure><img src="../media/{image["filename"]}" alt="{html.escape(image["alt"])}" loading="lazy">{caption_html}</figure>')
            continue
        content = text_of(node).strip()
        if not content:
            continue
        safe = html.escape(content).replace("\n", "<br>")
        if kind == "heading":
            level = str(node.get("tag", "h2")).lower()
            level = level if level in {"h2", "h3"} else "h2"
            blocks.append(f"<{level}>{safe}</{level}>")
        elif kind == "quote":
            blocks.append(f"<blockquote>{safe}</blockquote>")
        else:
            blocks.append(f"<p>{safe}</p>")
    if not blocks:
        raise ValueError(f"{title}: public Vocus article has no readable content")
    return "\n      ".join(blocks)


def article_html(article: dict) -> str:
    url = article["site_url"]
    image_urls = [image["site_url"] for image in article["images"]]
    graph = {"@context": "https://schema.org", "@graph": [
        {"@type": "BlogPosting", "@id": url + "#article", "headline": article["title"], "description": article["description"], "keywords": article["keywords"], "datePublished": article["published_at"], "dateModified": article["updated_at"], "inLanguage": "zh-Hant-TW", "mainEntityOfPage": {"@type": "WebPage", "@id": url}, "url": url, "image": image_urls, "author": {"@type": "Person", "name": "Orikan 李泰欣", "url": BASE + "/#person", "sameAs": ["https://www.instagram.com/eintaixin/"]}, "publisher": {"@type": "Person", "name": "Orikan 李泰欣", "url": BASE + "/#person"}, "isBasedOn": {"@type": "CreativeWork", "name": "Vocus 原始發布頁", "url": article["vocus_url"]}},
        {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "首頁", "item": BASE + "/"}, {"@type": "ListItem", "position": 2, "name": "文章", "item": BASE + "/blog/"}, {"@type": "ListItem", "position": 3, "name": article["title"], "item": url}]}
    ]}
    first_image = article["images"][0]["site_url"] if article["images"] else ""
    cover = f'<figure class="cover"><img src="../media/{article["images"][0]["filename"]}" alt="{html.escape(article["images"][0]["alt"])}"></figure>' if article["images"] else ""
    og = f'<meta property="og:image" content="{first_image}">' if first_image else ""
    topic_links = " ".join(f'<a href="../topics/{topic}/">{html.escape(TOPICS[topic]["name"])}</a>' for topic in article["topics"])
    return f'''<!doctype html>
<html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{html.escape(article["seo_title"])}</title><meta name="description" content="{html.escape(article["description"])}"><meta name="robots" content="index,follow"><link rel="canonical" href="{url}"><meta property="og:title" content="{html.escape(article["title"])}"><meta property="og:description" content="{html.escape(article["description"])}"><meta property="og:type" content="article"><meta property="og:url" content="{url}">{og}<meta property="article:published_time" content="{article["published_at"]}"><link rel="alternate" type="application/rss+xml" title="Orikan 李泰欣文章 RSS" href="../../rss.xml"><link rel="stylesheet" href="../styles.css"><script type="application/ld+json">{json.dumps(graph, ensure_ascii=False, separators=(",", ":"))}</script></head>
<body><header class="site-header"><nav class="site-nav" aria-label="主要導覽"><a class="brand" href="../../">ORIKAN</a><div class="nav-links"><a href="../../">首頁</a><a href="../../#courses">課程</a><a href="../">文章</a><a href="../../#contact">聯繫我</a></div></nav></header><main class="wrap article-shell"><nav class="breadcrumbs" aria-label="麵包屑"><a href="../../">首頁</a><span aria-hidden="true">/</span><a href="../">文章</a><span aria-hidden="true">/</span><span>{html.escape(article["title"])}</span></nav><div class="eyebrow">Vocus 同步文章</div><h1>{html.escape(article["title"])}</h1><div class="article-meta">作者：Orikan 李泰欣　·　發布：{article["published_at"].replace("-", "/")}　·　<a href="{article["vocus_url"]}" rel="noopener noreferrer">查看 Vocus 原始發布頁 ↗</a></div><nav class="article-topics" aria-label="文章主題">主題：{topic_links}</nav>{cover}<article class="article-body">{article["body"]}</article><aside class="citation"><strong>同步來源</strong><p>本文與圖片均來自已公開的 Vocus 文章；官網保留原始發布頁連結。</p></aside><aside class="cta"><h2>想把這套思考用在銷售與團隊？</h2><p>從客戶開發、需求診斷到成交，先找到你現在真正卡住的那一段。</p><a class="button" href="../../#contact">和我聊聊</a></aside></main><footer>© 2026 Orikan 李泰欣 · <a href="../">回到文章列表</a> · <a href="../../rss.xml">RSS</a></footer></body></html>\n'''


def blog_index(articles: list[dict]) -> str:
    cards = []
    for article in articles:
        visual = f'<a class="card-image" href="{article["slug"]}/"><img src="media/{article["images"][0]["filename"]}" alt="{html.escape(article["images"][0]["alt"])}" loading="lazy"></a>' if article["images"] else '<div class="card-image card-image-empty" aria-label="此篇 Vocus 原文沒有圖片">Vocus 文章</div>'
        topics = " ".join(f'<a class="topic-chip" href="topics/{topic}/">{html.escape(TOPICS[topic]["name"])}</a>' for topic in article["topics"])
        cards.append(f'<article class="card">{visual}<div class="meta">{article["published_at"].replace("-", "/")}・Vocus 同步</div><h2><a href="{article["slug"]}/">{html.escape(article["title"])}</a></h2><p>{html.escape(article["description"])}</p><div class="card-topics">{topics}</div><a href="{article["slug"]}/">閱讀文章 →</a></article>')
    graph = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "文章｜Orikan 李泰欣", "url": BASE + "/blog/", "inLanguage": "zh-Hant-TW", "author": {"@type": "Person", "name": "Orikan 李泰欣", "url": BASE + "/#person"}}
    topic_nav = "".join(f'<a class="topic-chip" href="topics/{slug}/">{html.escape(topic["name"])}</a>' for slug, topic in TOPICS.items())
    return f'''<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>銷售、客戶溝通與工作方法文章｜Orikan 李泰欣</title><meta name="description" content="Orikan 李泰欣的銷售、客戶溝通、業務成長與思考學習文章；所有已公開 Vocus 原文與原圖均同步於此。"><meta name="robots" content="index,follow"><link rel="canonical" href="{BASE}/blog/"><meta property="og:title" content="銷售、客戶溝通與工作方法文章｜Orikan 李泰欣"><meta property="og:description" content="銷售、客戶經營、成交與工作方法文章。"><meta property="og:type" content="website"><meta property="og:url" content="{BASE}/blog/"><link rel="alternate" type="application/rss+xml" title="Orikan 李泰欣文章 RSS" href="../rss.xml"><link rel="stylesheet" href="styles.css"><script type="application/ld+json">{json.dumps(graph, ensure_ascii=False, separators=(",", ":"))}</script></head><body><header class="site-header"><nav class="site-nav" aria-label="主要導覽"><a class="brand" href="../">ORIKAN</a><div class="nav-links"><a href="../">首頁</a><a href="../#courses">課程</a><a href="./" aria-current="page">文章</a><a href="../#contact">聯繫我</a></div></nav></header><main><section class="hero"><div class="wrap"><div class="eyebrow">Vocus / Journal</div><h1>把銷售與工作，想得更清楚。</h1><p class="lead">銷售、客戶溝通、業務成長與思考學習；所有已公開 Vocus 文章與原圖同步在這裡。</p><nav class="topic-nav" aria-label="文章主題">{topic_nav}</nav></div></section><section class="wrap grid" aria-label="文章列表">{''.join(cards)}</section></main><footer>© 2026 Orikan 李泰欣 · <a href="../rss.xml">訂閱 RSS</a></footer></body></html>\n'''


def topic_html(topic_slug: str, topic: dict, articles: list[dict]) -> str:
    cards = "".join(f'<article class="card"><div class="meta">{article["published_at"].replace("-", "/")}・Vocus 同步</div><h2><a href="../../{article["slug"]}/">{html.escape(article["title"])}</a></h2><p>{html.escape(article["description"])}</p><a href="../../{article["slug"]}/">閱讀文章 →</a></article>' for article in articles)
    url = f"{BASE}/blog/topics/{topic_slug}/"
    graph = {"@context": "https://schema.org", "@type": "CollectionPage", "name": topic["name"], "description": topic["description"], "url": url, "inLanguage": "zh-Hant-TW", "isPartOf": {"@type": "Blog", "name": "Orikan 李泰欣文章", "url": BASE + "/blog/"}}
    return f'''<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{html.escape(topic["name"])}｜Orikan 李泰欣文章</title><meta name="description" content="{html.escape(topic["description"])}"><meta name="robots" content="index,follow"><link rel="canonical" href="{url}"><meta property="og:title" content="{html.escape(topic["name"])}｜Orikan 李泰欣文章"><meta property="og:description" content="{html.escape(topic["description"])}"><meta property="og:type" content="website"><meta property="og:url" content="{url}"><link rel="stylesheet" href="../../styles.css"><script type="application/ld+json">{json.dumps(graph, ensure_ascii=False, separators=(",", ":"))}</script></head><body><header class="site-header"><nav class="site-nav" aria-label="主要導覽"><a class="brand" href="../../../">ORIKAN</a><div class="nav-links"><a href="../../../">首頁</a><a href="../../">文章</a><a href="../../../#contact">聯繫我</a></div></nav></header><main><section class="hero"><div class="wrap"><div class="eyebrow">文章主題</div><h1>{html.escape(topic["name"])}</h1><p class="lead">{html.escape(topic["description"])}</p></div></section><section class="wrap grid" aria-label="{html.escape(topic["name"])}文章">{cards}</section></main><footer>© 2026 Orikan 李泰欣 · <a href="../../">回到全部文章</a></footer></body></html>\n'''


def redirect_html(old_slug: str, article: dict) -> str:
    destination = f"../{article['slug']}/"
    return f'''<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0; url={destination}"><link rel="canonical" href="{article['site_url']}"><title>文章網址已更新｜Orikan 李泰欣</title></head><body><p>文章網址已更新，正在前往 <a href="{destination}">{html.escape(article['title'])}</a>。</p></body></html>\n'''


def llms_text(articles: list[dict]) -> str:
    topic_lines = "\n".join(f"- {topic['name']}: {topic['description']}" for topic in TOPICS.values())
    article_lines = "\n".join(f"- [{article['title']}]({article['site_url']}): {article['description']}" for article in articles)
    return f'''# Orikan 李泰欣\n\n> Orikan 李泰欣的個人官方網站，提供銷售、客戶溝通、業務成長與思考學習文章。文章保留原始 Vocus 發布頁連結，官網同步已公開原文與原圖。\n\n## 主要主題\n{topic_lines}\n\n## 作者與網站\n- 官方網站: {BASE}/\n- 文章首頁: {BASE}/blog/\n- RSS: {BASE}/rss.xml\n- Sitemap: {BASE}/sitemap.xml\n- 作者: Orikan 李泰欣\n- Instagram: https://www.instagram.com/eintaixin/\n\n## 文章\n{article_lines}\n'''


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--queue", type=Path, required=True)
    parser.add_argument("--site-root", type=Path, default=Path("."))
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    queue = json.loads(args.queue.read_text(encoding="utf-8"))
    items = [item for item in queue["items"] if item.get("status") == "PUBLISHED" and str(item.get("last_url", "")).startswith("https://vocus.cc/article/")]
    if not items:
        raise ValueError("no PUBLISHED Vocus queue items")
    root = args.site_root.resolve(); media_root = root / "blog/media"
    articles: list[dict] = []; binary: dict[Path, bytes] = {}
    for item in items:
        article_id = item["last_url"].rstrip("/").split("/")[-1]
        raw, _ = fetch(API + article_id); payload = json.loads(raw); source = payload.get("article", {})
        if source.get("status") != 2 or not source.get("title") or not source.get("lexicalObj"):
            raise ValueError(f"{article_id}: not a readable public Vocus article")
        lexical = json.loads(source["lexicalObj"]); nodes = lexical.get("root", {}).get("children", [])
        media: dict[str, dict] = {}
        for position, node in enumerate(image_nodes(lexical), start=1):
            image_raw, content_type = fetch(node["src"]); filename = f"{article_id}-{position}{extension(node['src'], content_type)}"; target = media_root / filename
            image = {"source_url": node["src"], "site_url": f"{BASE}/blog/media/{filename}", "filename": filename, "sha256": sha(image_raw), "alt": f"{source['title']}｜Vocus 原圖 {position}"}
            media[node["src"]] = image; binary[target] = image_raw
        title = str(source["title"]).strip(); published = date_of(source.get("lastPublishAt") or source.get("createdAt")); fallback_description = str(source.get("abstract") or text_of({"children": nodes})).replace("\n", " ").strip()[:150]
        seo = SEO_OVERRIDES.get(article_id, {})
        description = str(seo.get("description") or fallback_description or title)
        topics = list(seo.get("topics") or ["thinking-practice"])
        if any(topic not in TOPICS for topic in topics):
            raise ValueError(f"{article_id}: invalid topic assignment")
        keywords = [title, *[TOPICS[topic]["name"] for topic in topics]]
        article = {"record_id": f"ORI-VOCUS-{article_id.upper()}", "vocus_article_id": article_id, "slug": slug_for(item, article_id), "title": title, "seo_title": f"{title}｜Orikan 李泰欣", "description": description, "topics": topics, "keywords": keywords, "published_at": published, "updated_at": date_of(source.get("updatedAt") or source.get("lastPublishAt")), "vocus_url": item["last_url"], "site_url": "", "source_sha256": sha(source["lexicalObj"].encode()), "images": list(media.values())}
        article["site_url"] = f"{BASE}/blog/{article['slug']}/"; article["body"] = render_body(nodes, media, title); articles.append(article)
    articles.sort(key=lambda article: (article["published_at"], article["vocus_article_id"]), reverse=True)
    latest = articles[0]
    registry = {"schema_version": "2.0", "site_base_url": BASE, "generated_at": datetime.now(timezone.utc).date().isoformat(), "source": "Vocus public API read-only", "articles": [{key: value for key, value in article.items() if key != "body"} for article in articles]}
    sitemap_rows = [("/blog/", latest["updated_at"]), *[(f"/blog/topics/{topic_slug}/", latest["updated_at"]) for topic_slug in TOPICS], *[(f"/blog/{article['slug']}/", article["updated_at"]) for article in articles], *STATIC_PATHS]
    rss = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\"><channel><title>Orikan 李泰欣文章</title><link>" + BASE + "/blog/</link><description>Orikan 李泰欣的公開 Vocus 同步文章。</description><language>zh-TW</language>" + "".join(f"<item><title>{html.escape(article['title'])}</title><link>{article['site_url']}</link><guid>{article['site_url']}</guid><pubDate>{rss_date(article['published_at'])}</pubDate><description>{html.escape(article['description'])}</description><source url=\"{article['vocus_url']}\">Vocus 原始發布頁</source></item>" for article in articles) + "</channel></rss>\n"
    sitemap = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">" + "".join(f"<url><loc>{BASE}{path}</loc><lastmod>{stamp}</lastmod></url>" for path, stamp in sitemap_rows) + "</urlset>\n"
    outputs: dict[Path, bytes] = {root / "data/blog/articles.json": (json.dumps(registry, ensure_ascii=False, indent=2) + "\n").encode(), root / "blog/index.html": blog_index(articles).encode(), root / "rss.xml": rss.encode(), root / "sitemap.xml": sitemap.encode(), root / "llms.txt": llms_text(articles).encode()}
    for article in articles:
        outputs[root / "blog" / article["slug"] / "index.html"] = article_html(article).encode()
        old_slug = re.sub(r"^\d{4}(?:-unknown)?-\d{2}(?:-\d{2})?_", "", next(item["id"] for item in items if item["last_url"].endswith(article["vocus_article_id"]))).replace("_", "-")
        old_slug = re.sub(r"[^a-zA-Z0-9-]+", "-", old_slug).strip("-").lower()
        old_slug = old_slug if len(old_slug) >= 4 else f"vocus-{article['vocus_article_id']}"
        if old_slug != article["slug"]:
            outputs[root / "blog" / old_slug / "index.html"] = redirect_html(old_slug, article).encode()
    for topic_slug, topic in TOPICS.items():
        topic_articles = [article for article in articles if topic_slug in article["topics"]]
        outputs[root / "blog" / "topics" / topic_slug / "index.html"] = topic_html(topic_slug, topic, topic_articles).encode()
    outputs.update(binary)
    if args.write:
        for path, content in outputs.items(): path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(content)
    print(json.dumps({"overall": "PASS_LOCAL_WRITE" if args.write else "PASS_DRY_RUN", "published_count": len(articles), "image_count": sum(len(a['images']) for a in articles), "latest": {"title": latest['title'], "slug": latest['slug'], "cover": latest['images'][0]['site_url'] if latest['images'] else None}, "external_write_attempted": False}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try: raise SystemExit(main())
    except (ValueError, URLError, json.JSONDecodeError) as error: print(f"FAIL: {error}", file=sys.stderr); raise SystemExit(1)
