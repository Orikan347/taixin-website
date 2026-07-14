#!/usr/bin/env python3
"""Verify that the Vocus catalogue generator refuses unsafe write targets.

The checks intentionally fail before any public Vocus request can begin, so
they use no account, no real content, and no network access.
"""

from __future__ import annotations

import subprocess
import tempfile
import unittest
from pathlib import Path
import importlib.util


SCRIPT = Path(__file__).with_name("sync_vocus_catalog.py")
PROJECT_ROOT = SCRIPT.parents[1]
SPEC = importlib.util.spec_from_file_location("sync_vocus_catalog", SCRIPT)
assert SPEC and SPEC.loader
SYNC = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SYNC)


class CandidateModeTests(unittest.TestCase):
    def run_generator(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(["python3", str(SCRIPT), "--creator-id", "deidentified", *args], text=True, capture_output=True, check=False)

    def test_write_requires_an_explicit_candidate_root_before_network_access(self) -> None:
        result = self.run_generator("--write")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("--candidate-site-root", result.stderr)
        self.assertNotIn("api.vocus", result.stderr.lower())

    def test_write_rejects_the_production_checkout_before_network_access(self) -> None:
        result = self.run_generator("--write", "--candidate-site-root", str(PROJECT_ROOT))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("production checkout", result.stderr)
        self.assertNotIn("api.vocus", result.stderr.lower())

    def test_candidate_shell_copies_only_the_explicit_public_files(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            baseline = root / "baseline"
            candidate = root / "candidate"
            for relative_path in SYNC.CANDIDATE_SHELL_FILES:
                source = baseline / relative_path
                source.parent.mkdir(parents=True, exist_ok=True)
                source.write_text(relative_path.as_posix(), encoding="utf-8")
            (baseline / "secrets.env").write_text("must-not-copy", encoding="utf-8")
            SYNC.seed_candidate_shell(baseline, candidate)
            copied = sorted(path.relative_to(candidate) for path in candidate.rglob("*") if path.is_file())
            self.assertEqual(copied, sorted(SYNC.CANDIDATE_SHELL_FILES))
            self.assertFalse((candidate / "secrets.env").exists())

    def test_candidate_shell_rejects_a_nonempty_target(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            baseline = root / "baseline"
            candidate = root / "candidate"
            for relative_path in SYNC.CANDIDATE_SHELL_FILES:
                source = baseline / relative_path
                source.parent.mkdir(parents=True, exist_ok=True)
                source.write_text(relative_path.as_posix(), encoding="utf-8")
            candidate.mkdir()
            (candidate / "stale.txt").write_text("stale", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "empty isolated"):
                SYNC.seed_candidate_shell(baseline, candidate)


if __name__ == "__main__":
    unittest.main()
