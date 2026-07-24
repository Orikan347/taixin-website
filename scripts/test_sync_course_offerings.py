#!/usr/bin/env python3
"""End-to-end fake-data proof for the public course-page synchroniser."""

from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/sync_course_offerings.py"
PAGES = ["liuliang.html", "chengjiaoditu.html", "zhizhirenxin.html", "yanzhiyouwu.html", "jizhixiaolv.html"]


class CourseOfferingSyncTest(unittest.TestCase):
    def test_fake_scheduled_and_always_available_offers_replace_old_facts(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            candidate = Path(directory)
            for page in PAGES:
                shutil.copy(ROOT / page, candidate / page)
            fixture = json.loads((ROOT / "data/course-offerings.json").read_text(encoding="utf-8"))
            for offer in fixture["offerings"]:
                if offer["course_id"] == "chengjiao":
                    offer.update({"date_time": "2030-02-01T09:00:00+08:00", "price": 12345, "venue": "假資料實體場", "status": "confirmed"})
                if offer["course_id"] == "liuliang":
                    offer.update({"price": 6789, "venue": "假資料錄播", "status": "available_now"})
            fixture_path = candidate / "fake-offerings.json"
            fixture_path.write_text(json.dumps(fixture, ensure_ascii=False), encoding="utf-8")
            subprocess.run(["python3", str(SCRIPT), "--root", str(candidate), "--data", str(fixture_path)], check=True)
            scheduled = (candidate / "chengjiaoditu.html").read_text(encoding="utf-8")
            available = (candidate / "liuliang.html").read_text(encoding="utf-8")
            self.assertIn("2030 年 2 月 1 日（五）｜假資料實體場", scheduled)
            self.assertIn("NT$ 12,345", scheduled)
            self.assertNotIn("2026 年 6 月 12 日", scheduled)
            self.assertIn("立即開通", available)
            self.assertIn("NT$ 6,789", available)
            self.assertNotIn("2026 年 4 月 29 日", available)
            self.assertIn('"@type": "Course"', scheduled)
            self.assertIn("成為<span class=\"gold\">帶著地圖談成交的人</span>", scheduled)


if __name__ == "__main__":
    unittest.main(verbosity=2)
