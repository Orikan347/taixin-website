#!/usr/bin/env python3
"""Static acceptance checks for the public course conversion path."""

from __future__ import annotations

import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PAGES = {
    "liuliang": "liuliang.html",
    "chengjiao": "chengjiaoditu.html",
    "zhizhi": "zhizhirenxin.html",
    "yanzhi": "yanzhiyouwu.html",
    "xiaolu": "jizhixiaolv.html",
}


class PublicCourseConversionTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.offerings = {item["course_id"]: item for item in json.loads((ROOT / "data/course-offerings.json").read_text(encoding="utf-8"))["offerings"]}

    def test_each_course_page_exposes_current_offer_and_machine_readable_course(self) -> None:
        for course_id, filename in PAGES.items():
            with self.subTest(course_id=course_id):
                offer = self.offerings[course_id]
                text = (ROOT / filename).read_text(encoding="utf-8")
                self.assertIn(f'COURSE_OFFER:START {course_id}', text)
                self.assertIn(f'COURSE_IDENTITY:START {course_id}', text)
                self.assertIn(f'COURSE_SEO:START {course_id}', text)
                self.assertIn(f'"name": "{offer["course_name"]}"', text)
                self.assertIn(f'"price": "{offer["price"]}"', text)
                self.assertIn(f'"priceCurrency": "{offer["currency"]}"', text)
                self.assertIn(f'<link rel="canonical" href="https://orikan347.github.io/taixin-website/{filename}">', text)
                self.assertIn('"@type": "Course"', text)
                self.assertIn('"@type": "FAQPage"', text)
                self.assertIn('"mainEntity"', text)
                self.assertIn('無條件全額退費', text)
                if offer["status"] == "available_now":
                    self.assertIn('立即開通', text)
                    self.assertNotIn('"startDate"', text)
                else:
                    self.assertIn(offer["date_time"], text)
                    self.assertIn(offer["venue"], text)

    def test_home_hero_uses_responsive_line_breaks_without_changing_copy(self) -> None:
        home = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("max-width: 1040px;", home)
        self.assertIn(".hero-mobile-break { display: block; }", home)
        self.assertIn(".hero-desktop-break { display: none; }", home)
        self.assertIn(".hero h1 { font-size: 1.7rem; }", home)
        self.assertIn(
            '你每天拼命跑客戶，<br>為什麼業績還是輸給<br class="hero-mobile-break">那個'
            '<br class="hero-desktop-break">「<span>看起來沒你努力</span>」'
            '<br class="hero-mobile-break">的同事？',
            home,
        )

    def test_chengjiao_first_screen_makes_outcome_date_price_and_next_action_visible(self) -> None:
        text = (ROOT / "chengjiaoditu.html").read_text(encoding="utf-8")
        self.assertIn('class="hero-result-grid"', text)
        self.assertIn("01 問得出需求", text)
        self.assertIn("02 說得出價值", text)
        self.assertIn("03 接得住異議", text)
        self.assertIn("10/16 台灣實體課｜NT$ 11,000", text)
        self.assertIn("我要學會成交地圖 →", text)

    def test_every_course_has_a_first_screen_result_and_home_has_live_status(self) -> None:
        home = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn('href="#start-here" class="btn btn-gold">我現在卡在哪一關 ↓</a>', home)
        for course_id, filename in PAGES.items():
            with self.subTest(course_id=course_id):
                text = (ROOT / filename).read_text(encoding="utf-8")
                self.assertIn(f"COURSE_HERO_RESULT:START {course_id}", text)
                self.assertEqual(text.count(f"COURSE_HERO_RESULT:START {course_id}"), 1)
                self.assertIn('aria-label=', text)
                self.assertNotIn('<style><style>', text)
                self.assertIn(f"COURSE_CARD_STATUS:{course_id}", home)

    def test_course_sitemap_dates_are_current(self) -> None:
        sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
        for filename in PAGES.values():
            expected = f"<loc>https://orikan347.github.io/taixin-website/{filename}</loc>\n    <lastmod>2026-07-24</lastmod>"
            self.assertIn(expected, sitemap)

    def test_llms_index_names_every_public_course(self) -> None:
        text = (ROOT / "llms.txt").read_text(encoding="utf-8")
        self.assertIn("## 課程", text)
        for filename in PAGES.values():
            self.assertIn(f"https://orikan347.github.io/taixin-website/{filename}", text)

    def test_all_synced_articles_have_a_non_destructive_course_choice_cta(self) -> None:
        articles = json.loads((ROOT / "data/blog/articles.json").read_text(encoding="utf-8"))["articles"]
        for article in articles:
            with self.subTest(slug=article["slug"]):
                text = (ROOT / "blog" / article["slug"] / "index.html").read_text(encoding="utf-8")
                self.assertIn('href="../../#start-here"', text)
                self.assertIn(article["vocus_url"], text)
                self.assertIn('本文作者：', text)
                self.assertEqual(len(re.findall(r'<aside class="cta">', text)), 1)

    def test_article_cta_routes_match_reader_problem(self) -> None:
        expected = {
            "client-just-looking-response": "../../zhizhirenxin.html",
            "client-says-ask-spouse": "../../chengjiaoditu.html",
            "calendar-travel-time-for-sales": "../../jizhixiaolv.html",
            "personal-branding-and-self-cultivation": "../../liuliang.html",
            "harmony-without-uniformity": "../../#start-here",
        }
        for slug, href in expected.items():
            with self.subTest(slug=slug):
                text = (ROOT / "blog" / slug / "index.html").read_text(encoding="utf-8")
                self.assertIn(f'href="{href}"', text)


if __name__ == "__main__":
    unittest.main(verbosity=2)
