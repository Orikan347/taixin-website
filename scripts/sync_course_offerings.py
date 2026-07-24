#!/usr/bin/env python3
"""Keep the five public course pages aligned with data/course-offerings.json.

This is intentionally a small static-site generator: it changes only marked
course-offer, course-identity and SEO blocks, leaving approved sales copy,
guarantees, testimonials and registration form untouched.
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime
from html import escape, unescape
from pathlib import Path

SITE_URL = "https://orikan347.github.io/taixin-website/"

PAGES = {
    "liuliang": "liuliang.html",
    "chengjiao": "chengjiaoditu.html",
    "zhizhi": "zhizhirenxin.html",
    "yanzhi": "yanzhiyouwu.html",
    "xiaolu": "jizhixiaolv.html",
}

IDENTITY = {
    "liuliang": ("不再等客戶上門，成為<span class=\"gold\">自己能開發名單的人</span>", "你會知道下一批客戶從哪裡來，並把每一個接觸機會留下來。"),
    "chengjiao": ("不再靠感覺硬撐，成為<span class=\"gold\">帶著地圖談成交的人</span>", "客戶說什麼，你知道現在在哪一關，也知道下一句要怎麼接。"),
    "zhizhi": ("不再對每個人講同一套，成為<span class=\"gold\">看得懂人、說得進心的人</span>", "先看懂客戶真正重視什麼，再用他聽得進去的方式成交。"),
    "yanzhi": ("不只會做，還要成為<span class=\"gold\">讓人願意跟著你的人</span>", "把你的專業講得簡單、有感，讓客戶、同事和團隊願意行動。"),
    "xiaolu": ("不是再逼自己更拼，而是成為<span class=\"gold\">有系統、拿得回時間的人</span>", "把資料、追蹤與重複工作交給系統，把時間留給成交、家人和自己。"),
}

DESCRIPTIONS = {
    "liuliang": "流量磁鐵教你建立名單與開發系統，讓客戶來源不再只靠運氣或介紹。",
    "chengjiao": "成交地圖把從第一印象、需求提問到成交處理，變成能照著走的實戰路徑。",
    "zhizhi": "直指人心以 DISC 與觀人術協助你看懂客戶，用對方聽得進去的方式溝通。",
    "yanzhi": "言之有物把專業轉成清楚、有感、能帶動行動的表達與影響力。",
    "xiaolu": "極致效率整理客戶資料、追蹤與時間系統，讓你把無效工時拿回來。",
}


def format_date(value: str | None) -> str:
    if not value:
        return ""
    dt = datetime.fromisoformat(value)
    weekday = "一二三四五六日"[dt.weekday()]
    return f"{dt.year} 年 {dt.month} 月 {dt.day} 日（{weekday}）"


def format_price(offer: dict) -> str:
    amount = f"{offer['price']:,}"
    return f"NT$ {amount}" if offer["currency"] == "TWD" else f"RM {amount}"


def offer_copy(offer: dict) -> tuple[str, str, str]:
    if offer["status"] == "available_now":
        return ("立即開通", "線上錄播課｜完成報名後安排開通", "現在就開始")
    return ("NEXT CLASS", f"{format_date(offer['date_time'])}｜{offer['venue']}", "保留席次")


def offer_block(course_id: str, offer: dict) -> str:
    label, date_and_format, button = offer_copy(offer)
    extra = "<p style=\"color:var(--text-dim);font-size:0.9rem;margin-bottom:4px;\">請帶上你的 Mac 與 iPad</p>" if course_id == "xiaolu" else ""
    extra_line = f"\n      {extra}" if extra else ""
    return f'''<!-- COURSE_OFFER:START {course_id} -->
    <div style="max-width:480px;margin:0 auto 30px;background:linear-gradient(145deg,var(--navy-mid),var(--navy-deep));border:1px solid rgba(201,168,76,0.15);border-radius:16px;padding:28px;text-align:center;">
      <div style="font-size:0.85rem;color:var(--gold);letter-spacing:2px;font-weight:600;margin-bottom:12px;">{label}</div>
      <h3 style="color:var(--white);margin-bottom:8px;">{escape(offer['course_name'])}</h3>
      <p style="color:var(--text);font-size:1.1rem;margin-bottom:4px;">{date_and_format}</p>{extra_line}
      <p style="color:var(--gold);font-size:1.4rem;font-weight:700;margin-bottom:16px;">{format_price(offer)}</p>
      <p style="color:var(--text-dim);font-size:0.85rem;line-height:1.8;">填寫報名表單後，我們會有專人與你聯繫，<br>傳送刷卡連結給你，完款後即報名成功。</p>
      <p style="color:var(--gold-light);font-size:0.9rem;font-weight:600;margin:16px 0 0;">{button}，把現在的卡關變成下一個結果。</p>
    </div>
    <!-- COURSE_OFFER:END {course_id} -->'''


def identity_block(course_id: str) -> str:
    title, body = IDENTITY[course_id]
    return f'''<!-- COURSE_IDENTITY:START {course_id} -->
<section class="section" style="background:var(--navy-mid);">
  <div class="container fade-in">
    <div class="vision-box">
      <div class="tag-line">這堂課不是多聽一套理論</div>
      <h2 style="margin-bottom:16px;">{title}</h2>
      <p style="font-size:1.1rem;color:var(--text);line-height:2;max-width:640px;margin:0 auto;">{body}</p>
    </div>
  </div>
</section>
<!-- COURSE_IDENTITY:END {course_id} -->'''


def plain_html(value: str) -> str:
    """Return visible FAQ text for structured data without copying markup."""
    return unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", value))).strip()


def faq_entities(text: str) -> list[dict]:
    pairs = re.findall(
        r'<div class="faq-item">\s*<h4>(.*?)</h4>\s*<p>(.*?)</p>\s*</div>',
        text,
        flags=re.DOTALL,
    )
    return [
        {
            "@type": "Question",
            "name": re.sub(r"^Q：", "", plain_html(question)),
            "acceptedAnswer": {"@type": "Answer", "text": plain_html(answer)},
        }
        for question, answer in pairs
    ]


def seo_block(course_id: str, offer: dict, faqs: list[dict]) -> str:
    page = PAGES[course_id]
    url = f"{SITE_URL}{page}"
    start = f',\n  "startDate": "{offer["date_time"]}"' if offer["date_time"] else ""
    mode = "online" if offer["region"] == "online" else "offline"
    availability = "https://schema.org/InStock"
    course = {
        "@type": "Course",
        "@id": f"{url}#course",
        "name": offer["course_name"],
        "description": DESCRIPTIONS[course_id],
        "url": url,
        "inLanguage": "zh-Hant-TW",
        "courseMode": mode,
        "provider": {"@type": "Person", "name": "Orikan 李泰欣", "url": SITE_URL},
        "offers": {"@type": "Offer", "price": str(offer["price"]), "priceCurrency": offer["currency"], "availability": availability, "url": offer["signup_url"]},
    }
    if offer["date_time"]:
        course["startDate"] = offer["date_time"]
    graph = [course]
    if faqs:
        graph.append({
            "@type": "FAQPage",
            "@id": f"{url}#faq",
            "inLanguage": "zh-Hant-TW",
            "mainEntity": faqs,
        })
    payload = {"@context": "https://schema.org", "@graph": graph}
    return "\n".join([
        f"<!-- COURSE_SEO:START {course_id} -->",
        '<meta property="og:type" content="website">',
        f'<link rel="canonical" href="{url}">',
        f'<meta property="og:url" content="{url}">',
        '<script type="application/ld+json">',
        json.dumps(payload, ensure_ascii=False, indent=2),
        "</script>",
        f"<!-- COURSE_SEO:END {course_id} -->",
    ])


def replace_marked_or_legacy(text: str, start: str, end: str, replacement: str, legacy_pattern: str) -> str:
    marked = re.compile(re.escape(start) + r".*?" + re.escape(end), re.DOTALL)
    if marked.search(text):
        return marked.sub(replacement, text)
    legacy = re.compile(legacy_pattern, re.DOTALL)
    if not legacy.search(text):
        raise ValueError(f"could not find target for {start}")
    return legacy.sub(replacement, text, count=1)


def sync_page(path: Path, course_id: str, offer: dict) -> None:
    text = path.read_text(encoding="utf-8")
    text = replace_marked_or_legacy(
        text,
        f"<!-- COURSE_SEO:START {course_id} -->",
        f"<!-- COURSE_SEO:END {course_id} -->",
        seo_block(course_id, offer, faq_entities(text)),
        r'<meta property="og:type" content="website">',
    )
    identity_start = f"<!-- COURSE_IDENTITY:START {course_id} -->"
    identity_end = f"<!-- COURSE_IDENTITY:END {course_id} -->"
    marked_identity = re.compile(re.escape(identity_start) + r".*?" + re.escape(identity_end), re.DOTALL)
    if marked_identity.search(text):
        text = marked_identity.sub(identity_block(course_id), text)
    else:
        legacy_identity = "</section>\n\n<!-- PAIN POINTS -->"
        if legacy_identity not in text:
            raise ValueError(f"could not find identity insertion point in {path}")
        text = text.replace(legacy_identity, f"</section>\n\n{identity_block(course_id)}\n\n<!-- PAIN POINTS -->", 1)
    text = replace_marked_or_legacy(
        text,
        f"<!-- COURSE_OFFER:START {course_id} -->",
        f"<!-- COURSE_OFFER:END {course_id} -->",
        offer_block(course_id, offer),
        r'<!-- Course Info Box -->\n(?:(?!\n    <div class="text-center">\n      <div style="display:flex).)*',
    )
    path.write_text(text, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--data", type=Path)
    args = parser.parse_args()
    data_path = args.data or args.root / "data/course-offerings.json"
    offerings = json.loads(data_path.read_text(encoding="utf-8"))["offerings"]
    by_id = {item["course_id"]: item for item in offerings}
    for course_id, page in PAGES.items():
        if course_id not in by_id:
            raise ValueError(f"course-offerings.json lacks {course_id}")
        sync_page(args.root / page, course_id, by_id[course_id])


if __name__ == "__main__":
    main()
