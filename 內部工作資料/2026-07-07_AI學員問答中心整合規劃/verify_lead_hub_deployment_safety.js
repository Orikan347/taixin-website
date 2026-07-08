const assert = require('assert');
const fs = require('fs');
const { execSync } = require('child_process');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function assertNoSecretLikeValue(path, text) {
  const realSecretPatterns = [
    /AIza[0-9A-Za-z_-]{20,}/,
    /sk-[0-9A-Za-z_-]{20,}/,
    /Bearer\s+[0-9A-Za-z_-]{24,}/,
    /ADMIN_TOKEN\s*=\s*["']?[0-9A-Za-z_-]{24,}/,
    /database_id\s*=\s*["'][0-9a-fA-F-]{24,}["']/
  ];
  for (const pattern of realSecretPatterns) {
    assert(!pattern.test(text), `${path} contains a secret-like value matching ${pattern}`);
  }
}

const config = JSON.parse(read('data/lead-hub-config.json'));
if (process.env.EXPECT_CAPTURE_DISABLED === '1') {
  assert.strictEqual(config.enabled, false, 'capture must remain disabled before approved deployment');
  assert.strictEqual(config.capture_url, '', 'capture_url must remain empty before approved deployment');
} else {
  assert.strictEqual(config.enabled, true, 'capture must be enabled after approved deployment');
  assert(/^https:\/\/[^/]+\.workers\.dev\/lead-events$/.test(config.capture_url), 'capture_url must be an HTTPS workers.dev /lead-events endpoint');
}
assert.strictEqual(config.admin_url, 'admin/lead-hub-admin.html', 'admin url should be present');

const workerGitignore = read('worker/.gitignore');
assert(workerGitignore.includes('wrangler.toml'), 'worker/.gitignore must ignore wrangler.toml');
assert(workerGitignore.includes('.dev.vars'), 'worker/.gitignore must ignore .dev.vars');

const trackedFiles = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean);
assert(!trackedFiles.includes('worker/wrangler.toml'), 'worker/wrangler.toml must not be tracked');

for (const path of [
  'worker/lead-hub-worker.js',
  'worker/wrangler.toml.example',
  'worker/DEPLOYMENT.md',
  'admin/lead-hub-admin.html',
  'data/lead-hub-config.json',
  '內部工作資料/2026-07-07_AI學員問答中心整合規劃/verify_live_lead_hub_capture.js'
]) {
  assertNoSecretLikeValue(path, read(path));
}

const worker = read('worker/lead-hub-worker.js');
assert(worker.includes('env.ADMIN_TOKEN'), 'worker must read ADMIN_TOKEN from env');
assert(!worker.includes('localStorage'), 'worker must not depend on browser localStorage');

const admin = read('admin/lead-hub-admin.html');
assert(admin.includes('sessionStorage'), 'admin token should stay session-scoped in browser');
assert(!admin.includes('ADMIN_TOKEN='), 'admin page must not contain a real token assignment');

console.log('PASS');
console.log(process.env.EXPECT_CAPTURE_DISABLED === '1' ? 'CAPTURE-DISABLED-BEFORE-APPROVAL: PASS' : 'CAPTURE-ENABLED-AFTER-APPROVAL: PASS');
console.log('WRANGLER-TOML-IGNORED: PASS');
console.log('NO-TRACKED-WRANGLER-TOML: PASS');
console.log('NO-HARDCODED-SECRETS: PASS');
console.log('ADMIN-TOKEN-ENV-ONLY: PASS');
