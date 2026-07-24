#!/usr/bin/env python3
"""Apply the visible conversion layer without rewriting approved course copy."""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
UPDATED = "2026-07-24"
PAGES = {"liuliang": "liuliang.html", "chengjiao": "chengjiaoditu.html", "zhizhi": "zhizhirenxin.html", "yanzhi": "yanzhiyouwu.html", "xiaolu": "jizhixiaolv.html"}
HERO = {
    "liuliang": [("找到下一批客戶", "不只等介紹，知道名單從哪裡來。"), ("名單留下來", "每一次接觸，都不再白白流失。"), ("開發有方法", "線上線下都有下一步。")],
    "chengjiao": [("問得出需求", "先讓客戶說出真正想解決的事。"), ("說得出價值", "把規格講成客戶願意買單的理由。"), ("接得住異議", "客戶說再想想，你知道下一句。")],
    "zhizhi": [("看得懂人", "先知道他在意結果、感覺、安全還是資料。"), ("換對說法", "不再對每個客戶講同一套。"), ("建立信任", "縮短從陌生到願意談的距離。")],
    "yanzhi": [("說得清楚", "把專業講成對方聽得懂的價值。"), ("讓人記得", "30 秒讓別人知道你是誰、能幫什麼。"), ("帶動行動", "讓客戶與團隊願意往下一步走。")],
    "xiaolu": [("資料找得到", "客戶紀錄不再散在各個地方。"), ("跟進不漏掉", "把每一位客戶放進可執行的節奏。"), ("時間拿回來", "把重複工作交給系統，留時間給成交。")],
}
CTA = {"liuliang": "我要把客戶找回來", "chengjiao": "我要學會成交地圖", "zhizhi": "我要看懂客戶", "yanzhi": "我要把專業講清楚", "xiaolu": "我要把時間拿回來"}
CSS = '''/* COURSE_HERO_RESULT_CSS */
.hero-result-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;max-width:620px;margin:0 auto 20px;text-align:left}.hero-result-grid div{padding:12px 14px;border-radius:12px;background:rgba(6,13,24,.72);border:1px solid rgba(201,168,76,.22);color:var(--white-dim);font-size:.9rem;line-height:1.55}.hero-result-grid strong{display:block;color:var(--gold-light);margin-bottom:2px}.hero-offer-now{color:var(--gold-light);font-weight:700;margin:0 0 16px}@media(max-width:640px){.hero-result-grid{grid-template-columns:1fr;max-width:330px}.hero-result-grid div{padding:10px 14px}}
/* COURSE_HERO_RESULT_CSS_END */'''


def price(offer: dict) -> str:
    return ("NT$ " if offer["currency"] == "TWD" else "RM ") + f"{offer['price']:,}"


def date(value: str) -> str:
    d = datetime.fromisoformat(value)
    return f"{d.month}/{d.day}"


def status(offer: dict) -> str:
    return f"線上錄播｜立即開通｜{price(offer)}" if offer["status"] == "available_now" else f"{date(offer['date_time'])} 台灣實體課｜{price(offer)}"


def hero_block(course_id: str, offer: dict) -> str:
    cards = "".join(f'<div><strong>{i:02d} {title}</strong>{body}</div>' for i, (title, body) in enumerate(HERO[course_id], 1))
    return f'''<!-- COURSE_HERO_RESULT:START {course_id} -->
    <div class="hero-result-grid" aria-label="{offer['course_name']}上完後能做到什麼">{cards}</div>
    <p class="hero-offer-now">{status(offer)}</p>
    <a href="#register-form" class="btn btn-gold btn-large">{CTA[course_id]} →</a>
    <!-- COURSE_HERO_RESULT:END {course_id} -->'''


def replace_marked(text: str, start: str, end: str, value: str) -> str:
    return re.sub(re.escape(start) + r".*?" + re.escape(end), value, text, flags=re.DOTALL)


def sync_hero(path: Path, course_id: str, offer: dict) -> None:
    text = path.read_text(encoding="utf-8")
    if "/* COURSE_HERO_RESULT_CSS */" in text:
        text = replace_marked(text, "/* COURSE_HERO_RESULT_CSS */", "/* COURSE_HERO_RESULT_CSS_END */", CSS)
    elif "<!-- COURSE_HERO_RESULT_CSS -->" in text:
        text = replace_marked(text, "<!-- COURSE_HERO_RESULT_CSS -->", "<!-- COURSE_HERO_RESULT_CSS_END -->", CSS)
    else:
        text = text.replace("/* Buttons */", CSS + "\n\n/* Buttons */", 1)
    start, end = f"<!-- COURSE_HERO_RESULT:START {course_id} -->", f"<!-- COURSE_HERO_RESULT:END {course_id} -->"
    if start in text:
        text = replace_marked(text, start, end, hero_block(course_id, offer))
    elif 'class="hero-result-grid"' in text:
        text = re.sub(r'<div class="hero-result-grid".*?<a href="#register-form" class="btn btn-gold btn-large">.*?</a>', hero_block(course_id, offer), text, count=1, flags=re.DOTALL)
    else:
        text = re.sub(r'(<p class="subtitle">.*?</p>)\s*<a href="#register-form" class="btn btn-gold btn-large">.*?</a>', r'\1\n' + hero_block(course_id, offer), text, count=1, flags=re.DOTALL)
    path.write_text(text, encoding="utf-8")


def sync_home(offers: dict[str, dict]) -> None:
    path = ROOT / "index.html"; text = path.read_text(encoding="utf-8")
    text = text.replace('href="#courses" class="btn btn-gold">了解課程 ↓</a>', 'href="#start-here" class="btn btn-gold">我現在卡在哪一關 ↓</a>', 1)
    text = text.replace('href="#courses">課程</a>', 'href="#start-here">課程</a>')
    text = text.replace('href="#courses" onclick="closeMobileMenu()">課程</a>', 'href="#start-here" onclick="closeMobileMenu()">課程</a>')
    for course_id, page in PAGES.items():
        name = offers[course_id]["course_name"]; marker = f'<!-- COURSE_CARD_STATUS:{course_id} -->'
        block = marker + f'<div class="course-live-status">{status(offers[course_id])}</div><!-- COURSE_CARD_STATUS_END:{course_id} -->'
        pattern = re.compile(re.escape(marker) + r".*?" + re.escape(f"<!-- COURSE_CARD_STATUS_END:{course_id} -->"), re.DOTALL)
        if pattern.search(text): text = pattern.sub(block, text)
        else: text = re.sub(rf'(<a href="{re.escape(page)}"[^>]*class="course-card"[^>]*>.*?<h3>{re.escape(name)}</h3>)', r'\1' + block, text, count=1, flags=re.DOTALL)
    if ".course-live-status" not in text:
        text = text.replace("/* === SUBTLE BG PATTERN === */", ".course-live-status { margin:10px 0; color:var(--gold-light); font-size:.86rem; font-weight:700; }\n\n/* === SUBTLE BG PATTERN === */", 1)
    path.write_text(text, encoding="utf-8")


def sync_sitemap() -> None:
    path = ROOT / "sitemap.xml"; text = path.read_text(encoding="utf-8")
    for page in PAGES.values():
        loc = f"https://orikan347.github.io/taixin-website/{page}"
        text = re.sub(rf'(<loc>{re.escape(loc)}</loc>\s*<lastmod>)[^<]+(</lastmod>)', rf'\g<1>{UPDATED}\2', text)
    path.write_text(text, encoding="utf-8")


def main() -> None:
    offers = {item["course_id"]: item for item in json.loads((ROOT / "data/course-offerings.json").read_text(encoding="utf-8"))["offerings"]}
    for course_id, page in PAGES.items(): sync_hero(ROOT / page, course_id, offers[course_id])
    sync_home(offers); sync_sitemap()


if __name__ == "__main__": main()
