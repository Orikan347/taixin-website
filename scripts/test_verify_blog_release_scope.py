#!/usr/bin/env python3
"""End-to-end tests for the local Blog release-scope gate."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("verify_blog_release_scope.py")


def run(command: list[str], cwd: Path) -> None:
    subprocess.run(command, cwd=cwd, check=True, text=True, capture_output=True)


class ReleaseScopeGateTests(unittest.TestCase):
    def fixture(self, root: Path, *, extra_path: str | None = None, audit_pass: bool = True, pending_canonical: bool = False) -> tuple[Path, Path]:
        run(["git", "init", "-q"], root)
        run(["git", "config", "user.email", "test@example.invalid"], root)
        run(["git", "config", "user.name", "Release Gate Test"], root)
        (root / "blog").mkdir()
        (root / "blog/index.html").write_text("base", encoding="utf-8")
        audit = root / "audit.json"
        audit.write_text(json.dumps({"overall": "PASS_FOR_PERSONAL_SITE_DEPLOY_PENDING_VOCUS_CANONICAL" if pending_canonical else ("PASS" if audit_pass else "MANUAL_REVIEW_REQUIRED"), "results": [{"decision": "PERSONAL_SITE_DEPLOY_ALLOWED_PENDING_VOCUS_CANONICAL" if pending_canonical else ("SYNC_ALLOWED_EVIDENCE_MATCHED" if audit_pass else "BLOCK_SYNC_NO_OVERWRITE")}]}), encoding="utf-8")
        run(["git", "add", "."], root)
        run(["git", "commit", "-qm", "base"], root)
        (root / "blog/index.html").write_text("candidate", encoding="utf-8")
        if extra_path:
            path = root / extra_path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text("unrelated", encoding="utf-8")
        run(["git", "add", "."], root)
        run(["git", "commit", "-qm", "blog release"], root)
        return root, audit

    def gate(self, root: Path, audit: Path, *extra: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run([sys.executable, str(SCRIPT), "--repo-root", str(root), "--base-ref", "HEAD~1", "--candidate-ref", "HEAD", "--evidence-audit", str(audit), *extra], text=True, capture_output=True, check=False)

    def test_passes_clean_blog_only_commit_with_approved_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root, audit = self.fixture(Path(temporary))
            result = self.gate(root, audit)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(json.loads(result.stdout)["overall"], "PASS")

    def test_rejects_unrelated_path(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root, audit = self.fixture(Path(temporary), extra_path="worker/index.js")
            result = self.gate(root, audit)
            report = json.loads(result.stdout)
            self.assertEqual(result.returncode, 2, result.stderr)
            self.assertIn("worker/index.js", report["disallowed_paths"])

    def test_accepts_utf8_blog_tracking_path(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root, audit = self.fixture(Path(temporary), extra_path="內部工作資料/2026-07-13_個人網站部落格/release-note.md")
            result = self.gate(root, audit)
            self.assertEqual(result.returncode, 0, result.stderr)

    def test_accepts_vocus_candidate_transition_gate_files(self) -> None:
        for path in (
            "scripts/test_sync_vocus_catalog_candidate_mode.py",
            "scripts/test_sitemap_xml_generation.py",
            "scripts/verify_vocus_catalog_transition.py",
            "scripts/test_verify_vocus_catalog_transition.py",
        ):
            with self.subTest(path=path), tempfile.TemporaryDirectory() as temporary:
                root, audit = self.fixture(Path(temporary), extra_path=path)
                result = self.gate(root, audit)
                self.assertEqual(result.returncode, 0, result.stderr)

    def test_rejects_unapproved_evidence(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root, audit = self.fixture(Path(temporary), audit_pass=False)
            result = self.gate(root, audit)
            self.assertEqual(result.returncode, 2, result.stderr)
            self.assertIn("evidence audit rejected", " ".join(json.loads(result.stdout)["errors"]))

    def test_accepts_owner_approved_personal_site_release_with_pending_vocus_canonical(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root, audit = self.fixture(Path(temporary), pending_canonical=True)
            result = self.gate(root, audit, "--allow-pending-vocus-canonical")
            self.assertEqual(result.returncode, 0, result.stderr)


if __name__ == "__main__":
    unittest.main()
