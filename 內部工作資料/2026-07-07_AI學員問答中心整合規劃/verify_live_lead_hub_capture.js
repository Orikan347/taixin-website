const assert = require('assert');

const baseUrl = String(process.env.LEAD_HUB_URL || '').replace(/\/+$/, '');
const adminToken = process.env.ADMIN_TOKEN || '';

if (!baseUrl || !adminToken) {
  console.error('Missing LEAD_HUB_URL or ADMIN_TOKEN.');
  console.error('Usage: LEAD_HUB_URL=https://<worker>.workers.dev ADMIN_TOKEN=<token> node verify_live_lead_hub_capture.js');
  process.exit(2);
}

const testEmail = `codex-test+${Date.now()}@example.com`;

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(`Expected JSON from ${url}, got: ${text.slice(0, 120)}`);
  }
  return { response, data };
}

(async () => {
  const health = await requestJson(`${baseUrl}/health`);
  assert.strictEqual(health.response.status, 200, 'health status');
  assert.strictEqual(health.data.ok, true, 'health ok');

  const payload = {
    event_type: 'codex_live_capture_test',
    source: 'taixin-website-ai-student-qa',
    source_page: 'https://orikan347.github.io/taixin-website/ai-student-qa.html',
    consent_version: 'codex-live-test',
    profile: {
      name: 'Codex 測試名單',
      email: testEmail,
      phone: 'LINE-codex-test',
      birthdate: '1990-03-21',
      region: 'tw',
      role: 'sales_consultant',
      industry: '測試產業',
      consent: true
    },
    intake: {
      problems: ['成交不了', '每天很忙但不知道忙什麼'],
      goals: ['提升成交', '讓每天工作更有效率']
    },
    report: {
      disc_type: 'I',
      life_number: '7',
      primary_disc: 'I',
      practical_advice: '這是一筆部署後端到端測試資料。'
    },
    course_path: [{ id: 'xiaolu', name: '極致效率' }],
    conversation: [
      { role: 'user', content: '我賣測試服務' },
      { role: 'assistant', content: '這是部署驗證，不是真實學生資料。' }
    ]
  };

  const saved = await requestJson(`${baseUrl}/lead-events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://orikan347.github.io'
    },
    body: JSON.stringify(payload)
  });
  assert.strictEqual(saved.response.status, 200, 'lead-events status');
  assert.strictEqual(saved.data.ok, true, 'lead-events ok');
  assert.strictEqual(saved.data.lead_id, testEmail, 'lead id');

  const queryUrl = new URL(`${baseUrl}/admin/leads`);
  queryUrl.searchParams.set('q', testEmail);
  const leads = await requestJson(queryUrl, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(leads.response.status, 200, 'admin leads status');
  assert.strictEqual(leads.data.ok, true, 'admin leads ok');
  assert(Array.isArray(leads.data.leads), 'admin leads array');
  assert(leads.data.leads.some((lead) => lead.email === testEmail && lead.disc_type === 'I'), 'saved lead visible in admin list');

  const csv = await fetch(`${baseUrl}/admin/leads.csv`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert.strictEqual(csv.status, 200, 'csv status');
  const csvText = await csv.text();
  assert(csvText.includes(testEmail), 'csv contains test email');
  assert(csvText.includes('極致效率'), 'csv contains course path');

  console.log('PASS');
  console.log('LIVE-HEALTH: PASS');
  console.log('LIVE-LEAD-EVENT-POST: PASS');
  console.log('LIVE-ADMIN-LIST: PASS');
  console.log('LIVE-CSV-EXPORT: PASS');
  console.log(`TEST-LEAD: ${testEmail}`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
