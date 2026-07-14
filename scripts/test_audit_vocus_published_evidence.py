#!/usr/bin/env python3
"""End-to-end tests for the no-overwrite published-evidence audit."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("audit_vocus_published_evidence.py")
ARTICLE_ID = "a" * 24
SITE_URL = "https://orikan347.github.io/taixin-website/blog/test-article/"


class PublishedEvidenceAuditTests(unittest.TestCase):
    def make_fixture(self, root: Path, *, registry_hash: str, canonical_verified: bool = True) -> tuple[Path, Path, Path, Path]:
        archive_root = root / "archive"
        archive = archive_root / "old/published/test.md"
        archive.parent.mkdir(parents=True)
        archive.write_text("# Test published article\n", encoding="utf-8")
        published_hash = hashlib.sha256(archive.read_bytes()).hexdigest()
        record = {
            "record_id": "ORI-TEST-EVIDENCE-001",
            "artifact": {"content_sha256": published_hash, "title": "Test published article"},
            "vocus": {"article_id": ARTICLE_ID, "public_url": f"https://vocus.cc/article/{ARTICLE_ID}", "published_status": 2},
            "source_snapshot": {"archive_relative_path": "old/published/test.md", "sha256": published_hash},
            "personal_site": {"slug": "test-article"},
        }
        record_path = root / "record.json"
        record_path.write_text(json.dumps(record), encoding="utf-8")
        registry_path = root / "site/data/blog/articles.json"
        registry_path.parent.mkdir(parents=True)
        registry_path.write_text(json.dumps({"articles": [{"vocus_article_id": ARTICLE_ID, "source_sha256": registry_hash, "site_url": SITE_URL}]}), encoding="utf-8")
        status = "READBACK_MATCHED_PERSONAL_SITE" if canonical_verified else "PENDING_LIVE_AUTHOR_SETTING_READBACK"
        ledger = {"entries": [{
            "record_id": record["record_id"], "vocus_article_id": ARTICLE_ID, "vocus_public_url": record["vocus"]["public_url"],
            "intended_primary_copy": "PERSONAL_SITE", "personal_site_article_url": SITE_URL,
            "vocus_canonical_target": SITE_URL, "vocus_setting_status": status,
            "personal_site_self_canonical_status": status,
        }]}
        ledger_path = root / "ledger.json"
        ledger_path.write_text(json.dumps(ledger), encoding="utf-8")
        return archive_root, record_path, registry_path.parents[2], ledger_path

    def run_audit(self, archive_root: Path, record_path: Path, site_root: Path, ledger_path: Path, *extra: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--record", str(record_path), "--archive-root", str(archive_root), "--site-root", str(site_root), "--canonical-ledger", str(ledger_path), *extra],
            check=False, text=True, capture_output=True,
        )

    def test_all_matching_evidence_allows_sync(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive_root, record, site_root, ledger = self.make_fixture(root, registry_hash=hashlib.sha256(b"# Test published article\n").hexdigest())
            result = self.run_audit(archive_root, record, site_root, ledger)
            report = json.loads(result.stdout)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(report["overall"], "PASS")
            self.assertEqual(report["results"][0]["decision"], "SYNC_ALLOWED_EVIDENCE_MATCHED")

    def test_registry_hash_mismatch_blocks_overwrite(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            archive_root, record, site_root, ledger = self.make_fixture(root, registry_hash="b" * 64)
            result = self.run_audit(archive_root, record, site_root, ledger)
            report = json.loads(result.stdout)
            self.assertEqual(result.returncode, 2, result.stderr)
            self.assertEqual(report["results"][0]["decision"], "BLOCK_SYNC_NO_OVERWRITE")
            self.assertIn("PUBLISHED_EVIDENCE_REGISTRY_HASH_MISMATCH", report["results"][0]["issues"])
            self.assertEqual(report["results"][0]["finding"], "PROVENANCE_HASH_MISMATCH_NOT_CONTENT_DRIFT_PROVEN")

    def test_unread_canonical_requires_manual_decision(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            good_hash = hashlib.sha256(b"# Test published article\n").hexdigest()
            archive_root, record, site_root, ledger = self.make_fixture(root, registry_hash=good_hash, canonical_verified=False)
            result = self.run_audit(archive_root, record, site_root, ledger)
            report = json.loads(result.stdout)
            self.assertEqual(result.returncode, 2, result.stderr)
            self.assertEqual(report["results"][0]["decision"], "PENDING_MANUAL_CANONICAL_DECISION")

    def test_public_snapshot_identifies_archive_prefix_without_storing_public_text(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            lexical = json.dumps({"root": {"children": [{"type": "paragraph", "children": [{"text": "Test published article"}]}, {"type": "paragraph", "children": [{"text": "Published CTA"}]}]}}, separators=(",", ":"))
            live_hash = hashlib.sha256(lexical.encode()).hexdigest()
            archive_root, record, site_root, ledger = self.make_fixture(root, registry_hash=live_hash)
            snapshot = root / "public-snapshot.json"
            snapshot.write_text(json.dumps({"article": {"status": 2, "lexicalObj": lexical}}), encoding="utf-8")
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--record", str(record), "--archive-root", str(archive_root), "--site-root", str(site_root), "--canonical-ledger", str(ledger), "--public-snapshot", str(snapshot)],
                check=False, text=True, capture_output=True,
            )
            report = json.loads(result.stdout)
            comparison = report["results"][0]["public_snapshot_comparison"]
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(comparison["archive_to_public_relationship"], "ARCHIVE_TEXT_IS_PREFIX_OF_LIVE_PUBLIC_TEXT")
            self.assertTrue(comparison["live_lexical_hash_matches_registry"])

    def test_owner_approved_site_deploy_accepts_public_lineage_but_not_vocus_canonical(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            lexical = json.dumps({"root": {"children": [{"type": "paragraph", "children": [{"text": "Test published article"}]}, {"type": "paragraph", "children": [{"text": "Published CTA"}]}]}}, separators=(",", ":"))
            live_hash = hashlib.sha256(lexical.encode()).hexdigest()
            archive_root, record, site_root, ledger = self.make_fixture(root, registry_hash=live_hash, canonical_verified=False)
            snapshot = root / "public-snapshot.json"
            snapshot.write_text(json.dumps({"article": {"status": 2, "lexicalObj": lexical}}), encoding="utf-8")
            result = self.run_audit(archive_root, record, site_root, ledger, "--public-snapshot", str(snapshot), "--allow-pending-vocus-canonical")
            report = json.loads(result.stdout)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(report["overall"], "PASS_FOR_PERSONAL_SITE_DEPLOY_PENDING_VOCUS_CANONICAL")
            self.assertEqual(report["results"][0]["decision"], "PERSONAL_SITE_DEPLOY_ALLOWED_PENDING_VOCUS_CANONICAL")


if __name__ == "__main__":
    unittest.main()
