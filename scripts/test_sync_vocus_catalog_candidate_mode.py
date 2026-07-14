#!/usr/bin/env python3
"""Verify that the Vocus catalogue generator refuses unsafe write targets.

The checks intentionally fail before any public Vocus request can begin, so
they use no account, no real content, and no network access.
"""

from __future__ import annotations

import subprocess
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("sync_vocus_catalog.py")
PROJECT_ROOT = SCRIPT.parents[1]


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


if __name__ == "__main__":
    unittest.main()
