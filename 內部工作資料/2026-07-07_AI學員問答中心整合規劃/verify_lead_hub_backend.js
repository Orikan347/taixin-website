const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const workerPath = 'worker/lead-hub-worker.js';
const schemaPath = 'worker/schema.sql';

class FakeStatement {
  constructor(db, sql) {
    this.db = db;
    this.sql = sql;
    this.args = [];
  }
  bind(...args) {
    this.args = args;
    return this;
  }
  async run() {
    if (/INSERT INTO leads/i.test(this.sql)) {
      const [
        id, email, name, phone, birthdate, region, role, industry, consentVersion, source, sourcePage,
        discType, lifeNumber, primaryDisc, problemsJson, goalsJson, reportJson, coursePathJson,
        conversationJson, lastEventType, createdAt, updatedAt
      ] = this.args;
      const existing = this.db.leads.get(id) || {};
      this.db.leads.set(id, Object.assign({}, existing, {
        id,
        email,
        name,
        phone,
        birthdate,
        region,
        role,
        industry,
        consent_version: consentVersion,
        source,
        source_page: sourcePage,
        disc_type: discType || existing.disc_type,
        life_number: lifeNumber || existing.life_number,
        primary_disc: primaryDisc || existing.primary_disc,
        problems_json: problemsJson,
        goals_json: goalsJson,
        report_json: reportJson || existing.report_json,
        course_path_json: coursePathJson || existing.course_path_json,
        conversation_json: conversationJson,
        last_event_type: lastEventType,
        created_at: existing.created_at || createdAt,
        updated_at: updatedAt
      }));
    } else if (/INSERT INTO lead_events/i.test(this.sql)) {
      this.db.events.push({
        lead_id: this.args[0],
        event_type: this.args[1],
        source: this.args[2],
        source_page: this.args[3],
        payload_json: this.args[4],
        created_at: this.args[5]
      });
    }
    return { success: true };
  }
  async all() {
    if (/FROM leads/i.test(this.sql)) {
      return { results: Array.from(this.db.leads.values()).sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))) };
    }
    return { results: [] };
  }
}

class FakeD1 {
  constructor() {
    this.leads = new Map();
    this.events = [];
  }
  prepare(sql) {
    return new FakeStatement(this, sql);
  }
}

function loadWorker() {
  const code = fs.readFileSync(workerPath, 'utf8').replace(/export default worker;\s*$/, 'module.exports = worker;');
  const context = {
    module: { exports: {} },
    exports: {},
    Response,
    Request,
    URL,
    Set,
    console,
    JSON,
    Date,
    String,
    Number,
    RegExp,
    Array,
    Object,
    Math
  };
  vm.runInNewContext(code, context, { filename: workerPath });
  return context.module.exports;
}

(async () => {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  assert(schema.includes('CREATE TABLE IF NOT EXISTS leads'));
  assert(schema.includes('CREATE TABLE IF NOT EXISTS lead_events'));
  assert(schema.includes('idx_leads_email'));

  const workerSource = fs.readFileSync(workerPath, 'utf8');
  assert(workerSource.includes('ADMIN_TOKEN'));
  assert(!/Bearer\s+[A-Za-z0-9_-]{20,}/.test(workerSource), 'admin token must not be hard-coded');
  assert(workerSource.includes('https://orikan347.github.io'));

  const worker = loadWorker();
  const env = { DB: new FakeD1(), ADMIN_TOKEN: '0123456789abcdef0123456789abcdef' };

  const bad = await worker.fetch(new Request('https://lead.example/lead-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://orikan347.github.io' },
    body: JSON.stringify({ event_type: 'intake_started', profile: { email: 'amy@example.com', consent: false } })
  }), env);
  assert.strictEqual(bad.status, 400);

  const payload = {
    event_type: 'report_ready',
    source: 'taixin-website-ai-student-qa',
    source_page: 'https://orikan347.github.io/taixin-website/ai-student-qa.html',
    consent_version: '2026-07-08-ai-course-advisor-v4',
    profile: {
      name: 'Amy',
      email: 'AMY@example.com',
      phone: 'LINE-amy',
      birthdate: '1990-03-21',
      region: 'tw',
      role: 'sales_consultant',
      industry: '高端汽車',
      consent: true
    },
    intake: {
      problems: ['成交不了', '每天很忙但不知道忙什麼'],
      goals: ['提升成交']
    },
    report: {
      disc_type: 'I',
      life_number: '7',
      primary_disc: 'I',
      practical_advice: '先整理追蹤，再推進成交。'
    },
    course_path: [{ id: 'xiaolu', name: '極致效率' }],
    conversation: [{ role: 'user', content: '保時捷' }]
  };

  const saved = await worker.fetch(new Request('https://lead.example/lead-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://orikan347.github.io' },
    body: JSON.stringify(payload)
  }), env);
  assert.strictEqual(saved.status, 200);
  const savedJson = await saved.json();
  assert.strictEqual(savedJson.lead_id, 'amy@example.com');
  assert.strictEqual(env.DB.events.length, 1);

  const unauthorized = await worker.fetch(new Request('https://lead.example/admin/leads'), env);
  assert.strictEqual(unauthorized.status, 401);

  const leads = await worker.fetch(new Request('https://lead.example/admin/leads?limit=20', {
    headers: { Authorization: `Bearer ${env.ADMIN_TOKEN}` }
  }), env);
  assert.strictEqual(leads.status, 200);
  const leadJson = await leads.json();
  assert.strictEqual(leadJson.leads.length, 1);
  assert.strictEqual(leadJson.leads[0].email, 'amy@example.com');
  assert.strictEqual(leadJson.leads[0].disc_type, 'I');

  const csv = await worker.fetch(new Request('https://lead.example/admin/leads.csv', {
    headers: { Authorization: `Bearer ${env.ADMIN_TOKEN}` }
  }), env);
  assert.strictEqual(csv.status, 200);
  const csvText = await csv.text();
  assert(csvText.includes('amy@example.com'));
  assert(csvText.includes('極致效率'));

  console.log('PASS\nLEAD-HUB-SCHEMA: PASS\nLEAD-EVENT-POST: PASS\nADMIN-AUTH: PASS\nADMIN-LIST: PASS\nCSV-EXPORT: PASS\nNO-HARDCODED-ADMIN-TOKEN: PASS');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
