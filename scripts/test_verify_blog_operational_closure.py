#!/usr/bin/env python3
"""De-identified end-to-end tests for the Blog operating-closure audit."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("verify_blog_operational_closure.py")
INTERNAL = Path("內部工作資料/2026-07-13_個人網站部落格")


class OperationalClosureTests(unittest.TestCase):
    def fixture(self, root: Path, *, ready: bool) -> None:
        internal = root / INTERNAL
        internal.mkdir(parents=True)
        (internal / "public-discovery-readback.json").write_text(json.dumps({"overall": "PASS", "article_count": 2, "googlebot_sitemap_http": 200, "googlebot_sitemap_url_count": 15}), encoding="utf-8")
        (internal / "vocus-catalog-transition-readback.json").write_text(json.dumps({"overall": "PASS", "baseline_articles": 2, "candidate_articles": 2}), encoding="utf-8")
        canonical = "READBACK_MATCHED_PERSONAL_SITE_FOR_ALL_PUBLIC_ARTICLES" if ready else "PENDING_OWNER_VOCUS_SETTING_FOR_ALL_PUBLIC_ARTICLES"
        (internal / "vocus-canonical-readback.json").write_text(json.dumps({"decision": canonical}), encoding="utf-8")
        google = "SUCCESS" if ready else "FETCH_FAILED"
        bing = "SUCCESS" if ready else "PENDING_EXISTING_OWNER_ACCOUNT"
        (internal / "search-owner-readback.json").write_text(json.dumps({"google_search_console": {"property_ownership": "VERIFIED", "sitemap_status": google}, "bing_webmaster": {"status": bing}}), encoding="utf-8")
        if ready:
            (internal / "search-performance.report.json").write_text(json.dumps({"overall": "PASS"}), encoding="utf-8")

    def run_audit(self, root: Path) -> subprocess.CompletedProcess[str]:
        return subprocess.run([sys.executable, str(SCRIPT), "--site-root", str(root), "--expected-public-count", "2"], text=True, capture_output=True, check=False)

    def test_reports_external_pending_without_claiming_release_ready(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.fixture(root, ready=False)
            result = self.run_audit(root)
            report = json.loads(result.stdout)
            self.assertEqual(result.returncode, 2, result.stderr)
            self.assertEqual(report["phase"], "PENDING_RELEASE_SECURITY")
            self.assertIn("Google Search Console sitemap is not owner-readback successful", report["pending"])
            self.assertTrue((root / INTERNAL / "operational-closure-status.json").is_file())

    def test_requires_every_owner_and_metrics_signal_for_release_ready(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.fixture(root, ready=True)
            result = self.run_audit(root)
            report = json.loads(result.stdout)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(report["phase"], "RELEASE_READY")


if __name__ == "__main__":
    unittest.main()
