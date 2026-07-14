#!/usr/bin/env python3
"""End-to-end tests for aggregate Blog search-metrics validation."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("verify_blog_search_metrics_snapshot.py")


class SearchMetricsSnapshotTests(unittest.TestCase):
    def fixture(self, root: Path) -> tuple[Path, Path]:
        (root / "data/blog").mkdir(parents=True)
        url = "https://example.invalid/blog/test-article/"
        (root / "data/blog/articles.json").write_text(json.dumps({"articles": [{"site_url": url}]}), encoding="utf-8")
        snapshot = root / "snapshot.csv"
        snapshot.write_text("source,period_start,period_end,page_url,impressions,clicks,average_position,conversions\ngoogle_search_console,2026-07-01,2026-07-07," + url + ",100,12,8.5,1\nbing_webmaster,2026-07-01,2026-07-07," + url + ",40,4,9.0,0\n", encoding="utf-8")
        return root, snapshot

    def run_check(self, root: Path, snapshot: Path) -> subprocess.CompletedProcess[str]:
        return subprocess.run([sys.executable, str(SCRIPT), "--site-root", str(root), "--snapshot", str(snapshot), "--report", "report.json"], text=True, capture_output=True, check=False)

    def test_aggregate_snapshot_passes_and_calculates_totals(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root, snapshot = self.fixture(Path(temporary))
            result = self.run_check(root, snapshot)
            report = json.loads(result.stdout)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(report["totals"], {"rows": 2, "impressions": 140, "clicks": 16, "conversions": 1})
            self.assertTrue((root / "report.json").is_file())

    def test_rejects_a_noncanonical_page_url(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root, snapshot = self.fixture(Path(temporary))
            snapshot.write_text(snapshot.read_text(encoding="utf-8").replace("https://example.invalid/blog/test-article/", "https://example.invalid/other/"), encoding="utf-8")
            result = self.run_check(root, snapshot)
            self.assertEqual(result.returncode, 2, result.stderr)
            self.assertIn("not a Blog canonical URL", result.stdout)


if __name__ == "__main__":
    unittest.main()
