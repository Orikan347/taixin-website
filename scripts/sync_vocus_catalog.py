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
import shutil
import sys
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path
from urllib.parse import urlencode
from urllib.error import URLError
from urllib.request import Request, urlopen


BASE = "https://orikan347.github.io/taixin-website"
API = "https://api.vocus.cc/api/article/"
CONTENTS_API = "https://api.vocus.cc/api/contents"
UA = "Orikan-Vocus-Catalog-Mirror/1.0 (public-read-only)"
PROJECT_ROOT = Path(__file__).resolve().parents[1]
AUTHOR_IMAGE_SOURCE = PROJECT_ROOT / "img/portrait.jpg"
# A candidate needs enough of the public shell to exercise the Blog like the
# live site. Keep this deliberately small and explicit: it must never copy
# secrets, internal working files, deployment configuration, or arbitrary
# files from the accepted checkout into a generated candidate.
CANDIDATE_SHELL_FILES = (
    Path("index.html"),
    Path("404.html"),
    Path("robots.txt"),
    Path("blog/styles.css"),
    Path("img/portrait.jpg"),
)
AUTHOR = {
    "name": "Orikan 李泰欣",
    "url": BASE + "/#person",
    "image": BASE + "/img/portrait.jpg",
    "job_title": "亞洲銷冠系統架構導師",
    "description": "前保時捷全台銷售第一名、全球百大銷售顧問；以 14 年一線銷售實戰，將心理學、哲學與商業思維轉成可複製的成交系統。",
    "same_as": ["https://www.instagram.com/eintaixin/"],
}
STATIC_PATHS = (
    ("/", "2026-07-13"),
    ("/ai-student-qa.html", "2026-07-10"),
    ("/chengjiaoditu.html", "2026-07-24"),
    ("/consultant-guide.html", "2026-07-13"),
    ("/jizhixiaolv.html", "2026-07-24"),
    ("/liuliang.html", "2026-07-24"),
    ("/shangtan.html", "2026-07-13"),
    ("/yanzhiyouwu.html", "2026-07-24"),
    ("/zhizhirenxin.html", "2026-07-24"),
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
    # Historical public articles are given readable, stable URLs and editorial
    # summaries. The Vocus text and images remain the canonical sync source.
    "6a364f77fd89780001b8b5c2": {"slug": "true-leadership-xiang-yu-liu-bang", "description": "項羽比劉邦更會打仗，為何仍輸掉天下？從楚漢相爭看真正領導者如何用人、分利與整合團隊。", "topics": ["thinking-practice", "sales-growth"]},
    "69ad830ffd897800013d6406": {"slug": "client-follow-up-no-reply", "description": "客戶跟進已讀不回怎麼辦？問題往往不在客戶，而在訊息只催答案、沒有提供下一步價值。", "topics": ["client-conversations"]},
    "69aaea69fd8978000199e3ac": {"slug": "sales-skills-blank-mind", "description": "學很多銷售技巧，面對客戶卻斷片？這不是記憶力差，而是還沒把知識練成能在現場使用的能力。", "topics": ["sales-growth", "thinking-practice"]},
    "69a931dbfd8978000128e399": {"slug": "real-estate-cold-market-sales", "description": "房市冷、市場量縮時，如何提高每位買方的掌握度？用三個銷售系統把冷市場變成追上業績的機會。", "topics": ["sales-growth", "client-conversations"]},
    "69a58610fd89780001ced6df": {"slug": "insurance-sales-system", "description": "保險業務人數下降時，留下來的超業做對了什麼？用名單管理、成交 SOP 與效率工具建立可複製的銷售系統。", "topics": ["sales-growth"]},
    "69a3e172fd897800016022d1": {"slug": "ai-prompting-starts-with-the-question", "description": "AI 不好用，常常不是工具問題，而是問題沒有定義清楚。先建立思考架構，才能讓 AI 放大你的工作成果。", "topics": ["thinking-practice"]},
    "69a19987fd89780001c0ff1e": {"slug": "mental-overthinking-illusion-of-control", "description": "為什麼會在工作與生活中不斷內耗？從大腦與控制感的角度，重新理解那些讓人陷住的受控幻覺。", "topics": ["thinking-practice"]},
    "6984392dfd89780001ee9da4": {"slug": "manifestation-needs-action", "description": "別把顯化當成許願魔法。從大腦科學、刻意練習與身份認同出發，用行動塑造真正想要的未來。", "topics": ["thinking-practice"]},
    "697f5a3dfd89780001addc92": {"slug": "confidence-self-esteem-growth-mindset", "description": "你以為自己沒自信，可能是自尊系統出了問題。理解自信、自尊與成長思維，找回穩定而非逞強的力量。", "topics": ["thinking-practice"]},
    "6979b9b6fd89780001e87882": {"slug": "why-hard-working-still-stuck", "description": "很努力卻依然卡關，未必是努力不夠，而是還沒看見真正要解的問題。從學習與認知模型找回方向。", "topics": ["thinking-practice"]},
    "69772bf4fd897800018fdc2a": {"slug": "stress-management-challenge-and-ability", "description": "壓力不是意志力不足，而是挑戰與能力失衡。從生理、心理與認知三個層次，練習把壓力變成成長動力。", "topics": ["thinking-practice"]},
    "6971df33fd897800010c1617": {"slug": "introverts-can-succeed-in-sales", "description": "內向的 I 人、DISC C 型能不能做好業務？理解自己的特質，建立不必硬撐外向也能成交的銷售方法。", "topics": ["sales-growth", "thinking-practice"]},
    "696999cdfd89780001026054": {"slug": "everyone-is-selling", "description": "不想當業務，也每天都在推銷自己。理解銷售的本質，讓專業、價值與溝通能力真正為你創造機會。", "topics": ["sales-growth"]},
    "6964c22dfd89780001334b93": {"slug": "calendar-travel-time-for-sales", "description": "業務如何用行事曆自動計算通勤時間、減少趕場與漏約？一個隱藏設定，讓每天行程更可靠。", "topics": ["sales-growth"]},
    "695d4963fd89780001e06f34": {"slug": "stop-wasting-time-on-data-entry", "description": "整理資料與慢速打字，正在吃掉本來能拿去成交的時間。從語音輸入與客戶紀錄，改善業務日常效率。", "topics": ["sales-growth"]},
    "6959e83dfd897800013977b5": {"slug": "sales-mediocrity-trap", "description": "眼中只有錢，反而賺不到錢？看見業務員容易落入的四個平庸陷阱，重新建立價值、執行與學習節奏。", "topics": ["sales-growth", "thinking-practice"]},
    "695771ecfd89780001a9cdcf": {"slug": "2025-year-of-admitting-ignorance", "description": "2025 年，我用閱讀、聽書與教學實驗重新認識無知。把知識變成能分享、能實踐的判斷力，才是學習的開始。", "topics": ["thinking-practice"]},
    "695188cbfd89780001967a80": {"slug": "sales-should-earn-the-right-money", "description": "業務不是什麼錢都賺，也不是不敢賺錢。用中庸與價值交換，找到專業、收入與長期信任的平衡。", "topics": ["sales-growth", "client-conversations"]},
    "694cdcd0fd8978000152da85": {"slug": "stop-begging-clients-to-reply", "description": "你越拜託客戶，客戶越想封鎖。避開四個常見聯絡錯誤，用三個做法把銷售接觸從打擾變成期待。", "topics": ["client-conversations"]},
    "6a56dd79fd8978000134b701": {"slug": "inner-strength-bigger-world", "description": "內心有多強大，能看見的世界就有多大；先穩住心，才有能力承接更大的選擇與責任。", "topics": ["thinking-practice"]},
    "6a5439ecfd8978000133a2d3": {"description": "想提升業績與影響力，不只靠技巧；用德性、能力與結果金字塔，重新建立可被看見的價值。", "topics": ["sales-growth"]},
    "6a558c04fd8978000186f2eb": {"slug": "ability-for-family", "description": "從童年不敢開口的願望，到送母親休旅車的故事；李泰欣談能力、選擇與把努力用來照顧家人的意義。", "topics": ["thinking-practice"]},
    "6a5196d6fd8978000180e87e": {"slug": "expand-mind-understand-others", "description": "如何不被自己的見聞與情緒困住？從張載的觀點，練習把心放大，理解人與世界。", "topics": ["thinking-practice"]},
    "6a5045e6fd89780001283436": {"slug": "client-says-ask-spouse", "description": "客戶說「我要回去跟老婆商量」怎麼回？辨識延遲成交背後的三種訊號，讓對話有下一步。", "topics": ["client-conversations"]},
    "6a4ef4d1fd89780001467bb3": {"slug": "client-just-looking-response", "description": "客戶說「我只是看看」怎麼回？這不一定是不買，而是信任尚未建立；用六種軟拒絕判斷下一步。", "topics": ["client-conversations"]},
    "6a4da391fd89780001e54adf": {"slug": "reactivate-old-customers", "description": "舊客戶怎麼重新聯絡？找回手機裡被放棄的客戶，補上跟進節奏與關係經營的業績缺口。", "topics": ["sales-growth", "client-conversations"]},
    "6a4c57dffd897800014ebc2c": {"slug": "consultative-selling", "description": "業務如何不靠強迫說服而成交？讓客戶自己說出需求與理由，建立更有信任感的成交對話。", "topics": ["client-conversations"]},
    "6a4aff70fd89780001de8c8c": {"slug": "slow-steady-sales-performance", "description": "業績想做快，為什麼要先慢下來？頂尖業務用穩定節奏，累積更快也更長久的成果。", "topics": ["sales-growth"]},
    "6a49adf9fd89780001f19689": {"slug": "personal-branding-and-self-cultivation", "description": "自媒體經營不是打造人設；比起害怕被看破，更重要的是讓修身與真實價值被看見。", "topics": ["thinking-practice"]},
    "6a485cbffd8978000198f744": {"slug": "learning-anxiety", "description": "學習焦慮怎麼辦？問題不只在學得不夠，而在沒有把知識消化、練習並變成自己的能力。", "topics": ["thinking-practice"]},
    "6a470c60fd8978000130c875": {"slug": "learning-knowledge-into-ability", "description": "學而時習之不是反覆背誦；把知識練成能力，才能真正用在工作、銷售與人生選擇。", "topics": ["thinking-practice"]},
    "6a45b9acfd89780001d2e4c0": {"slug": "sales-drive-and-boundaries", "description": "成交需要進取，但長久合作需要底線。用中庸思維，找到業務推進與信任關係的平衡。", "topics": ["sales-growth", "client-conversations"]},
    "6a44680efd89780001c806fc": {"slug": "sales-moderation-and-principles", "description": "中庸不是沒有態度；理解狂、狷與底線，才能在銷售與工作中知道何時前進、何時守住原則。", "topics": ["sales-growth", "thinking-practice"]},
    "6a4316d5fd897800014c8468": {"slug": "important-information-map", "description": "做決定時常缺的不是答案，而是重要訊息。用訊息地圖整理盲點，讓判斷更完整、更不容易後悔。", "topics": ["thinking-practice"]},
    "6a41de51fd89780001e6a934": {"slug": "science-and-wisdom", "description": "科學知識與人生智慧如何互補？從看見世界的不同方法，練習更完整的思考與判斷。", "topics": ["thinking-practice"]},
    "6a3a1f56fd89780001c17443": {"slug": "harmony-without-uniformity", "description": "和而不同不是討好或反對。保有獨立判斷，同時能與人合作，是成熟溝通的重要能力。", "topics": ["thinking-practice"]},
    "6a38ad7efd8978000197cb3c": {"slug": "integrity-in-words-and-actions", "description": "說話要有羞恥心，做事才有責任感。從承諾與行動一致，建立別人願意信任的長期關係。", "topics": ["thinking-practice", "client-conversations"]},
    "6a365b68fd89780001bbe4dd": {"slug": "cognitive-dissonance-and-growth", "description": "認知失調為何讓人抗拒改變？理解進步與怨恨的拉扯，才能面對不想承認的矛盾並真正成長。", "topics": ["thinking-practice"]},
}


def sha(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def fetch(url: str) -> tuple[bytes, str]:
    request = Request(url, headers={"User-Agent": UA, "Accept": "application/json,image/*;q=0.9,*/*;q=0.1"})
    with urlopen(request, timeout=30) as response:  # nosec B310: explicit public Vocus URLs only
        return response.read(), response.headers.get_content_type()


def published_items_from_queue(queue_path: Path) -> tuple[list[dict], int | None, str]:
    queue = json.loads(queue_path.read_text(encoding="utf-8"))
    items = [item for item in queue["items"] if item.get("status") == "PUBLISHED" and str(item.get("last_url", "")).startswith("https://vocus.cc/article/")]
    if not items:
        raise ValueError("no PUBLISHED Vocus queue items")
    return items, len(items), "local published queue"


def published_items_from_creator(creator_id: str) -> tuple[list[dict], int, str]:
    """Read the author's public article catalogue, with no login or write path."""
    reported_count: int | None = None
    items: list[dict] = []
    seen: set[str] = set()
    for page in range(1, 51):
        query = urlencode({"creatorId": creator_id, "sort": "publishAt", "type": "article", "order": "desc", "status": "public", "num": 10, "page": page})
        raw, _ = fetch(f"{CONTENTS_API}?{query}")
        payload = json.loads(raw)
        if reported_count is None:
            reported_count = int(payload.get("count", -1))
            if reported_count < 0:
                raise ValueError("Vocus public catalogue did not report a count")
        batch = payload.get("contents", [])
        if not isinstance(batch, list):
            raise ValueError("Vocus public catalogue has invalid contents")
        for content in batch:
            article = content.get("article", {}) if isinstance(content, dict) else {}
            article_id = str(article.get("_id", ""))
            if content.get("type") != "article" or article.get("status") != 2 or not re.fullmatch(r"[a-f0-9]{24}", article_id):
                raise ValueError("Vocus public catalogue contained a non-public or invalid article")
            if article_id in seen:
                raise ValueError(f"Vocus public catalogue repeated article: {article_id}")
            seen.add(article_id)
            items.append({"id": f"vocus-{article_id}", "last_url": f"https://vocus.cc/article/{article_id}"})
        if len(batch) < 10:
            break
    else:
        raise ValueError("Vocus public catalogue exceeded pagination safety limit")
    if reported_count != len(items):
        raise ValueError(f"Vocus public catalogue count mismatch: reported {reported_count}, retrieved {len(items)}")
    return items, reported_count, "Vocus public creator catalogue"


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
    if len(raw) >= 4 and not raw.startswith("vocus-"):
        return raw
    return f"article-{article_id[:8]}"


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


def author_card(image_path: str, about_path: str) -> str:
    """Reader-facing authorship, reused on the blog index and every article."""
    return f'''<aside class="author-card" aria-label="作者介紹"><img src="{image_path}" alt="Orikan 李泰欣"><div><div class="eyebrow">About the author</div><h2>我是李泰欣</h2><p>{html.escape(AUTHOR["description"])}</p><a class="author-link" href="{about_path}">認識 Orikan 李泰欣 →</a></div></aside>'''


def article_cta(article: dict) -> str:
    """Give readers one relevant next step without changing the Vocus article."""
    signal = " ".join([article["title"], *article.get("tags", []), *article.get("topics", [])]).lower()
    efficiency = ("跟進", "追蹤", "資料", "行事曆", "時間", "舊客", "效率", "工具", "行政", "已讀不回")
    people = ("信任", "人性", "溝通", "性格", "disc", "看懂")
    leads = ("名單", "客戶不夠", "流量", "自媒體", "開發")
    expression = ("表達", "影響", "說話", "說得")
    if any(word in signal for word in efficiency):
        return '<aside class="cta"><h2>跟進不是靠記憶，是靠系統。</h2><p>如果你常常漏追、資料找不到，或時間都花在雜事上，先把工作系統搭起來。</p><a class="button" href="../../jizhixiaolv.html">看《極致效率》→</a><a class="secondary" href="../../#start-here">我想先選卡關點</a></aside>'
    if any(word in signal for word in people):
        return '<aside class="cta"><h2>客戶不買，先看懂他到底在怕什麼。</h2><p>先分清楚他在意結果、感覺、安全還是資料，再用他聽得進去的方式說。</p><a class="button" href="../../zhizhirenxin.html">看《直指人心》→</a><a class="secondary" href="../../#start-here">我想先選卡關點</a></aside>'
    if any(word in signal for word in leads):
        return '<aside class="cta"><h2>客戶不夠，先把你的網張開。</h2><p>別只等介紹；先建立你下一批客戶從哪裡來的開發系統。</p><a class="button" href="../../liuliang.html">看《流量磁鐵》→</a><a class="secondary" href="../../#start-here">我想先選卡關點</a></aside>'
    if any(word in signal for word in expression):
        return '<aside class="cta"><h2>專業做得到，也要說到別人願意跟。</h2><p>把你的想法講得清楚、有感，才能讓客戶和團隊願意行動。</p><a class="button" href="../../yanzhiyouwu.html">看《言之有物》→</a><a class="secondary" href="../../#start-here">我想先選卡關點</a></aside>'
    if "client-conversations" in article.get("topics", []):
        return '<aside class="cta"><h2>客戶卡住，別再硬猜下一句。</h2><p>把需求、異議與下一步變成一張地圖，才能穩穩把對話帶往成交。</p><a class="button" href="../../chengjiaoditu.html">看《成交地圖》→</a><a class="secondary" href="../../#start-here">我想先選卡關點</a></aside>'
    return '<aside class="cta"><h2>你現在最想突破哪一關？</h2><p>客戶不夠、成交卡住、看不懂客戶、講不清楚，還是忙到沒有時間？先找出你現在最該補的那一段。</p><a class="button" href="../../#start-here">先選我的卡關點</a></aside>'


def article_html(article: dict) -> str:
    url = article["site_url"]
    image_urls = [image["site_url"] for image in article["images"]]
    graph = {"@context": "https://schema.org", "@graph": [
        {"@type": "BlogPosting", "@id": url + "#article", "headline": article["title"], "description": article["description"], "keywords": article["keywords"], "datePublished": article["published_at"], "dateModified": article["updated_at"], "inLanguage": "zh-Hant-TW", "mainEntityOfPage": {"@type": "WebPage", "@id": url}, "url": url, "image": image_urls, "author": {"@type": "Person", "name": AUTHOR["name"], "url": AUTHOR["url"], "image": AUTHOR["image"], "jobTitle": AUTHOR["job_title"], "description": AUTHOR["description"], "sameAs": AUTHOR["same_as"]}, "publisher": {"@type": "Person", "name": AUTHOR["name"], "url": AUTHOR["url"]}, "isBasedOn": {"@type": "CreativeWork", "name": "Vocus 原始發布頁", "url": article["vocus_url"]}},
        {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "首頁", "item": BASE + "/"}, {"@type": "ListItem", "position": 2, "name": "文章", "item": BASE + "/blog/"}, {"@type": "ListItem", "position": 3, "name": article["title"], "item": url}]}
    ]}
    first_image = article["images"][0]["site_url"] if article["images"] else ""
    cover = f'<figure class="cover"><img src="../media/{article["images"][0]["filename"]}" alt="{html.escape(article["images"][0]["alt"])}"></figure>' if article["images"] else ""
    og = f'<meta property="og:image" content="{first_image}">' if first_image else ""
    topic_links = " ".join(f'<a href="../topics/{topic}/">{html.escape(TOPICS[topic]["name"])}</a>' for topic in article["topics"])
    tag_chips = " ".join(f'<span class="topic-chip">#{html.escape(tag)}</span>' for tag in article["tags"])
    return f'''<!doctype html>
<html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{html.escape(article["seo_title"])}</title><meta name="description" content="{html.escape(article["description"])}"><meta name="robots" content="index,follow"><link rel="canonical" href="{url}"><meta property="og:title" content="{html.escape(article["title"])}"><meta property="og:description" content="{html.escape(article["description"])}"><meta property="og:type" content="article"><meta property="og:url" content="{url}">{og}<meta property="article:published_time" content="{article["published_at"]}"><link rel="alternate" type="application/rss+xml" title="Orikan 李泰欣文章 RSS" href="../../rss.xml"><link rel="stylesheet" href="../styles.css"><script type="application/ld+json">{json.dumps(graph, ensure_ascii=False, separators=(",", ":"))}</script></head>
<body><header class="site-header"><nav class="site-nav" aria-label="主要導覽"><a class="brand" href="../../">ORIKAN</a><div class="nav-links"><a href="../../">首頁</a><a href="../../#courses">課程</a><a href="../">文章</a><a href="../../#contact">聯繫我</a></div></nav></header><main class="wrap article-shell"><nav class="breadcrumbs" aria-label="麵包屑"><a href="../../">首頁</a><span aria-hidden="true">/</span><a href="../">文章</a><span aria-hidden="true">/</span><span>{html.escape(article["title"])}</span></nav><div class="eyebrow">Orikan 李泰欣／Vocus 同步文章</div><h1>{html.escape(article["title"])}</h1><div class="article-meta"><strong>本文作者：</strong><a href="../../#about">Orikan 李泰欣</a>　·　發布：{article["published_at"].replace("-", "/")}　·　<a href="{article["vocus_url"]}" rel="noopener noreferrer">查看 Vocus 原始發布頁 ↗</a></div><nav class="article-topics" aria-label="文章主題">主題：{topic_links}</nav><div class="card-topics" aria-label="文章標籤">{tag_chips}</div>{cover}<article class="article-body">{article["body"]}</article>{author_card("../../img/portrait.jpg", "../../#about")}<aside class="citation"><strong>同步來源</strong><p>本文與圖片均來自已公開的 Vocus 文章；官網保留原始發布頁連結。</p></aside>{article_cta(article)}</main><footer>© 2026 Orikan 李泰欣 · <a href="../">回到文章列表</a> · <a href="../../rss.xml">RSS</a></footer></body></html>\n'''


def blog_index(articles: list[dict]) -> str:
    cards = []
    for article in articles:
        visual = f'<a class="card-image" href="{article["slug"]}/"><img src="media/{article["images"][0]["filename"]}" alt="{html.escape(article["images"][0]["alt"])}" loading="lazy"></a>' if article["images"] else '<div class="card-image card-image-empty" aria-label="此篇 Vocus 原文沒有圖片">Vocus 文章</div>'
        topics = " ".join(f'<a class="topic-chip" href="topics/{topic}/">{html.escape(TOPICS[topic]["name"])}</a>' for topic in article["topics"])
        tags = " ".join(f'<span class="topic-chip">#{html.escape(tag)}</span>' for tag in article["tags"])
        cards.append(f'<article class="card">{visual}<div class="meta">{article["published_at"].replace("-", "/")}・Vocus 同步</div><h2><a href="{article["slug"]}/">{html.escape(article["title"])}</a></h2><p>{html.escape(article["description"])}</p><div class="card-topics">{topics}</div><div class="card-topics" aria-label="文章標籤">{tags}</div><a href="{article["slug"]}/">閱讀文章 →</a></article>')
    graph = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "文章｜Orikan 李泰欣", "url": BASE + "/blog/", "inLanguage": "zh-Hant-TW", "author": {"@type": "Person", "name": AUTHOR["name"], "url": AUTHOR["url"], "image": AUTHOR["image"], "jobTitle": AUTHOR["job_title"], "description": AUTHOR["description"], "sameAs": AUTHOR["same_as"]}}
    topic_nav = "".join(f'<a class="topic-chip" href="topics/{slug}/">{html.escape(topic["name"])}</a>' for slug, topic in TOPICS.items())
    return f'''<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>銷售、客戶溝通與工作方法文章｜Orikan 李泰欣</title><meta name="description" content="Orikan 李泰欣的銷售、客戶溝通、業務成長與思考學習文章；所有已公開 Vocus 原文與原圖均同步於此。"><meta name="robots" content="index,follow"><link rel="canonical" href="{BASE}/blog/"><meta property="og:title" content="銷售、客戶溝通與工作方法文章｜Orikan 李泰欣"><meta property="og:description" content="前保時捷全台銷售第一名李泰欣，分享客戶經營、成交與工作方法。"><meta property="og:type" content="website"><meta property="og:url" content="{BASE}/blog/"><link rel="alternate" type="application/rss+xml" title="Orikan 李泰欣文章 RSS" href="../rss.xml"><link rel="stylesheet" href="styles.css"><script type="application/ld+json">{json.dumps(graph, ensure_ascii=False, separators=(",", ":"))}</script></head><body><header class="site-header"><nav class="site-nav" aria-label="主要導覽"><a class="brand" href="../">ORIKAN</a><div class="nav-links"><a href="../">首頁</a><a href="../#about">關於我</a><a href="../#courses">課程</a><a href="./" aria-current="page">文章</a><a href="../#contact">聯繫我</a></div></nav></header><main><section class="hero"><div class="wrap"><div class="eyebrow">Orikan 李泰欣／Vocus 同步文章</div><h1>把銷售與工作，想得更清楚。</h1><p class="lead">由 Orikan 李泰欣撰寫：銷售、客戶溝通、業務成長與思考學習；所有已公開 Vocus 原文與原圖同步在這裡。</p><nav class="topic-nav" aria-label="文章主題">{topic_nav}</nav></div></section><section class="wrap author-intro">{author_card("../img/portrait.jpg", "../#about")}</section><section class="wrap grid" aria-label="文章列表">{''.join(cards)}</section></main><footer>© 2026 Orikan 李泰欣 · <a href="../#about">關於我</a> · <a href="../rss.xml">訂閱 RSS</a></footer></body></html>\n'''


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
    courses = json.loads((PROJECT_ROOT / "data/course-catalog.json").read_text(encoding="utf-8"))["courses"]
    course_lines = "\n".join(f"- [{course['name']}]({BASE}/{course['page']}): {course['overview']}" for course in courses)
    article_lines = "\n".join(f"- [{article['title'].strip()}]({article['site_url']}): {article['description'].strip()}" for article in articles)
    return f'''# Orikan 李泰欣\n\n> Orikan 李泰欣的個人官方網站，提供銷售、客戶溝通、業務成長與思考學習文章。文章保留原始 Vocus 發布頁連結，官網同步已公開原文與原圖。\n\n## 主要主題\n{topic_lines}\n\n## 課程\n{course_lines}\n\n## 作者與網站\n- 官方網站: {BASE}/\n- 文章首頁: {BASE}/blog/\n- RSS: {BASE}/rss.xml\n- Sitemap: {BASE}/sitemap.xml\n- 作者: Orikan 李泰欣\n- Instagram: https://www.instagram.com/eintaixin/\n\n## 文章\n{article_lines}\n'''


def sitemap_xml(rows: list[tuple[str, str]]) -> str:
    """Render a crawler-readable sitemap with stable, standards-compliant layout.

    Whitespace is technically optional in XML, but keeping one element per
    line makes the generated file auditable and avoids relying on a crawler's
    tolerance for a single long XML token stream.
    """
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for path, stamp in rows:
        lines.extend((
            "  <url>",
            f"    <loc>{html.escape(BASE + path)}</loc>",
            f"    <lastmod>{html.escape(stamp)}</lastmod>",
            "  </url>",
        ))
    lines.append("</urlset>")
    return "\n".join(lines) + "\n"


def seed_candidate_shell(baseline_root: Path, candidate_root: Path) -> None:
    """Copy the minimum public shell into an *empty* isolated candidate.

    The catalogue generator owns generated articles, feeds and image files,
    while these shared files make the candidate renderable and allow the
    crawler-facing verifier to test it end to end. A non-empty target is
    rejected so a stale or manually-added file cannot silently join a release.
    """
    baseline = baseline_root.resolve()
    candidate = candidate_root.resolve()
    if baseline == candidate:
        raise ValueError("--candidate-site-root cannot equal --baseline-site-root")
    if candidate.exists() and any(candidate.iterdir()):
        raise ValueError("--candidate-site-root must be an empty isolated directory")
    candidate.mkdir(parents=True, exist_ok=True)
    for relative_path in CANDIDATE_SHELL_FILES:
        source = baseline / relative_path
        if not source.is_file():
            raise ValueError(f"missing required candidate shell file: {relative_path}")
        destination = candidate / relative_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)


def main() -> int:
    parser = argparse.ArgumentParser()
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--queue", type=Path, help="Local Vocus publisher queue; only PUBLISHED rows are read.")
    source.add_argument("--creator-id", help="Vocus creator ID; reads only the public article catalogue.")
    parser.add_argument("--site-root", type=Path, default=Path("."), help="Read-only/dry-run output root. Cannot be used for --write.")
    parser.add_argument("--candidate-site-root", type=Path, help="Required isolated output root for --write; never point this at the production checkout.")
    parser.add_argument("--baseline-site-root", type=Path, default=PROJECT_ROOT, help="Accepted public site used only to seed the candidate's explicit public shell.")
    parser.add_argument("--write", action="store_true", help="Write only to --candidate-site-root after fetching public Vocus content.")
    args = parser.parse_args()
    if args.write and not args.candidate_site_root:
        raise ValueError("--write requires --candidate-site-root; direct writes to --site-root are blocked")
    if args.write and args.candidate_site_root.resolve() == PROJECT_ROOT.resolve():
        raise ValueError("--candidate-site-root cannot be this production checkout")
    if args.write:
        seed_candidate_shell(args.baseline_site_root, args.candidate_site_root)
    if args.queue:
        items, reported_public_count, source_label = published_items_from_queue(args.queue)
    else:
        items, reported_public_count, source_label = published_items_from_creator(args.creator_id)
    root = (args.candidate_site_root if args.write else args.site_root).resolve(); media_root = root / "blog/media"
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
        tags = [str(tag.get("title") if isinstance(tag, dict) else tag).strip() for tag in source.get("tags") or []]
        tags = list(dict.fromkeys(tag for tag in tags if tag))
        keywords = [title, *tags, *[TOPICS[topic]["name"] for topic in topics]]
        article = {"record_id": f"ORI-VOCUS-{article_id.upper()}", "vocus_article_id": article_id, "slug": slug_for(item, article_id), "title": title, "seo_title": f"{title}｜Orikan 李泰欣", "description": description, "topics": topics, "tags": tags, "keywords": keywords, "published_at": published, "updated_at": date_of(source.get("updatedAt") or source.get("lastPublishAt")), "vocus_url": item["last_url"], "site_url": "", "source_sha256": sha(source["lexicalObj"].encode()), "images": list(media.values())}
        article["site_url"] = f"{BASE}/blog/{article['slug']}/"; article["body"] = render_body(nodes, media, title); articles.append(article)
    articles.sort(key=lambda article: (article["published_at"], article["vocus_article_id"]), reverse=True)
    latest = articles[0]
    registry = {"schema_version": "2.0", "site_base_url": BASE, "generated_at": datetime.now(timezone.utc).date().isoformat(), "source": source_label, "reported_public_article_count": reported_public_count, "articles": [{key: value for key, value in article.items() if key != "body"} for article in articles]}
    sitemap_rows = [("/blog/", latest["updated_at"]), *[(f"/blog/topics/{topic_slug}/", latest["updated_at"]) for topic_slug in TOPICS], *[(f"/blog/{article['slug']}/", article["updated_at"]) for article in articles], *STATIC_PATHS]
    rss = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\"><channel><title>Orikan 李泰欣文章</title><link>" + BASE + "/blog/</link><description>Orikan 李泰欣的公開 Vocus 同步文章。</description><language>zh-TW</language>" + "".join(f"<item><title>{html.escape(article['title'])}</title><link>{article['site_url']}</link><guid>{article['site_url']}</guid><pubDate>{rss_date(article['published_at'])}</pubDate><description>{html.escape(article['description'])}</description><source url=\"{article['vocus_url']}\">Vocus 原始發布頁</source></item>" for article in articles) + "</channel></rss>\n"
    sitemap = sitemap_xml(sitemap_rows)
    outputs: dict[Path, bytes] = {root / "data/blog/articles.json": (json.dumps(registry, ensure_ascii=False, indent=2) + "\n").encode(), root / "blog/index.html": blog_index(articles).encode(), root / "rss.xml": rss.encode(), root / "sitemap.xml": sitemap.encode(), root / "llms.txt": llms_text(articles).encode()}
    for article in articles:
        outputs[root / "blog" / article["slug"] / "index.html"] = article_html(article).encode()
        old_slug = re.sub(r"^\d{4}(?:-unknown)?-\d{2}(?:-\d{2})?_", "", next(item["id"] for item in items if item["last_url"].endswith(article["vocus_article_id"]))).replace("_", "-")
        old_slug = re.sub(r"[^a-zA-Z0-9-]+", "-", old_slug).strip("-").lower()
        old_slug = old_slug if len(old_slug) >= 4 else f"vocus-{article['vocus_article_id']}"
        legacy_slugs = {old_slug, f"vocus-{article['vocus_article_id']}"}
        for legacy_slug in sorted(legacy_slugs):
            if legacy_slug != article["slug"]:
                outputs[root / "blog" / legacy_slug / "index.html"] = redirect_html(legacy_slug, article).encode()
    for topic_slug, topic in TOPICS.items():
        topic_articles = [article for article in articles if topic_slug in article["topics"]]
        outputs[root / "blog" / "topics" / topic_slug / "index.html"] = topic_html(topic_slug, topic, topic_articles).encode()
    outputs.update(binary)
    # A generated preview root must be self-contained. The production repo
    # already has this file, but without adding it here a temporary test site
    # renders the author card as a broken image even though the page markup is
    # correct. This is the existing official portrait, never a replacement.
    if not AUTHOR_IMAGE_SOURCE.is_file():
        raise ValueError(f"missing official author portrait: {AUTHOR_IMAGE_SOURCE}")
    outputs[root / "img/portrait.jpg"] = AUTHOR_IMAGE_SOURCE.read_bytes()
    if args.write:
        for path, content in outputs.items(): path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(content)
    print(json.dumps({"overall": "PASS_LOCAL_WRITE" if args.write else "PASS_DRY_RUN", "source": source_label, "reported_public_article_count": reported_public_count, "published_count": len(articles), "image_count": sum(len(a['images']) for a in articles), "latest": {"title": latest['title'], "slug": latest['slug'], "cover": latest['images'][0]['site_url'] if latest['images'] else None}, "external_write_attempted": False}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    try: raise SystemExit(main())
    except (ValueError, URLError, json.JSONDecodeError) as error: print(f"FAIL: {error}", file=sys.stderr); raise SystemExit(1)
