const ALLOWED_ORIGINS = new Set([
  'https://orikan347.github.io',
  'http://127.0.0.1:8765',
  'http://localhost:8765'
]);

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true, service: 'deal-alliance-lead-hub' }, 200, cors);
    if (request.method === 'POST' && url.pathname === '/lead-events') return handleLeadEvent(request, env, cors);
    if (request.method === 'GET' && url.pathname === '/admin/leads') return handleAdminLeads(request, env, cors);
    if (request.method === 'GET' && url.pathname === '/admin/leads.csv') return handleAdminCsv(request, env, cors);

    return json({ ok: false, error: 'not_found' }, 404, cors);
  }
};

async function handleLeadEvent(request, env, cors) {
  if (!env.DB) return json({ ok: false, error: 'database_not_configured' }, 500, cors);
  const payload = await readJson(request);
  const profile = payload.profile || {};
  if (!profile.consent) return json({ ok: false, error: 'consent_required' }, 400, cors);
  if (!profile.email || !isEmail(profile.email)) return json({ ok: false, error: 'valid_email_required' }, 400, cors);
  if (!payload.event_type || !/^[a-z0-9_:-]{2,80}$/i.test(payload.event_type)) return json({ ok: false, error: 'invalid_event_type' }, 400, cors);

  const now = new Date().toISOString();
  const leadId = normalizeLeadId(profile.email);
  await upsertLead(env.DB, leadId, payload, now);
  await env.DB.prepare(`
    INSERT INTO lead_events (lead_id, event_type, source, source_page, payload_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    leadId,
    String(payload.event_type),
    clean(payload.source),
    clean(payload.source_page),
    JSON.stringify(redactPayload(payload)),
    now
  ).run();
  return json({ ok: true, lead_id: leadId }, 200, cors);
}

async function upsertLead(db, leadId, payload, now) {
  const profile = payload.profile || {};
  const intake = payload.intake || {};
  const report = payload.report || {};
  const coursePath = Array.isArray(payload.course_path) ? payload.course_path : [];
  const conversation = Array.isArray(payload.conversation) ? payload.conversation.slice(-20) : [];
  await db.prepare(`
    INSERT INTO leads (
      id, email, name, phone, birthdate, region, role, industry, consent_version, source, source_page,
      disc_type, life_number, primary_disc, problems_json, goals_json, report_json, course_path_json,
      conversation_json, last_event_type, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      phone=excluded.phone,
      birthdate=excluded.birthdate,
      region=excluded.region,
      role=excluded.role,
      industry=excluded.industry,
      consent_version=excluded.consent_version,
      source=excluded.source,
      source_page=excluded.source_page,
      disc_type=COALESCE(excluded.disc_type, leads.disc_type),
      life_number=COALESCE(excluded.life_number, leads.life_number),
      primary_disc=COALESCE(excluded.primary_disc, leads.primary_disc),
      problems_json=excluded.problems_json,
      goals_json=excluded.goals_json,
      report_json=COALESCE(excluded.report_json, leads.report_json),
      course_path_json=COALESCE(excluded.course_path_json, leads.course_path_json),
      conversation_json=excluded.conversation_json,
      last_event_type=excluded.last_event_type,
      updated_at=excluded.updated_at
  `).bind(
    leadId,
    normalizeEmail(profile.email),
    clean(profile.name),
    clean(profile.phone),
    clean(profile.birthdate),
    clean(profile.region),
    clean(profile.role),
    clean(profile.industry),
    clean(payload.consent_version),
    clean(payload.source),
    clean(payload.source_page),
    clean(report.disc_type),
    clean(report.life_number),
    clean(report.primary_disc),
    JSON.stringify(toArray(intake.problems)),
    JSON.stringify(toArray(intake.goals)),
    report && Object.keys(report).length ? JSON.stringify(report) : null,
    coursePath.length ? JSON.stringify(coursePath) : null,
    JSON.stringify(conversation),
    clean(payload.event_type),
    now,
    now
  ).run();
}

async function handleAdminLeads(request, env, cors) {
  const auth = requireAdmin(request, env);
  if (auth) return json(auth, 401, cors);
  const url = new URL(request.url);
  const limit = clamp(Number(url.searchParams.get('limit') || 100), 1, 500);
  const q = String(url.searchParams.get('q') || '').trim();
  const bindings = [];
  let where = '';
  if (q) {
    where = `WHERE email LIKE ? OR name LIKE ? OR industry LIKE ? OR disc_type LIKE ?`;
    const like = `%${q}%`;
    bindings.push(like, like, like, like);
  }
  bindings.push(limit);
  const result = await env.DB.prepare(`
    SELECT id, email, name, phone, birthdate, region, role, industry, consent_version, source,
      disc_type, life_number, primary_disc, problems_json, goals_json, report_json, course_path_json,
      last_event_type, created_at, updated_at
    FROM leads
    ${where}
    ORDER BY updated_at DESC
    LIMIT ?
  `).bind(...bindings).all();
  return json({ ok: true, leads: result.results || [] }, 200, cors);
}

async function handleAdminCsv(request, env, cors) {
  const auth = requireAdmin(request, env);
  if (auth) return json(auth, 401, cors);
  const result = await env.DB.prepare(`
    SELECT email, name, phone, birthdate, region, role, industry, disc_type, life_number,
      problems_json, goals_json, course_path_json, last_event_type, created_at, updated_at
    FROM leads
    ORDER BY updated_at DESC
    LIMIT 5000
  `).all();
  const rows = result.results || [];
  const header = ['email', 'name', 'phone', 'birthdate', 'region', 'role', 'industry', 'disc_type', 'life_number', 'problems', 'goals', 'course_path', 'last_event_type', 'created_at', 'updated_at'];
  const csv = [header.join(',')].concat(rows.map((lead) => [
    lead.email,
    lead.name,
    lead.phone,
    lead.birthdate,
    lead.region,
    lead.role,
    lead.industry,
    lead.disc_type,
    lead.life_number,
    parseJsonArray(lead.problems_json).join(' / '),
    parseJsonArray(lead.goals_json).join(' / '),
    parseJsonArray(lead.course_path_json).map((item) => item.name || item.id || item).join(' > '),
    lead.last_event_type,
    lead.created_at,
    lead.updated_at
  ].map(csvCell).join(','))).join('\n');
  return new Response(csv, {
    status: 200,
    headers: Object.assign({}, cors, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="orikan-leads.csv"'
    })
  });
}

function requireAdmin(request, env) {
  const token = env.ADMIN_TOKEN;
  if (!token || token.length < 24) return { ok: false, error: 'admin_token_not_configured' };
  const header = request.headers.get('Authorization') || '';
  if (header !== `Bearer ${token}`) return { ok: false, error: 'unauthorized' };
  return null;
}

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://orikan347.github.io';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Vary': 'Origin'
  };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (error) {
    return {};
  }
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign({}, headers, { 'Content-Type': 'application/json; charset=utf-8' })
  });
}

function normalizeLeadId(email) {
  return normalizeEmail(email);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function clean(value) {
  const text = String(value || '').replace(/[\u0000-\u001f]/g, ' ').trim();
  return text ? text.slice(0, 1000) : null;
}

function toArray(value) {
  return Array.isArray(value) ? value.map(clean).filter(Boolean) : [];
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function redactPayload(payload) {
  const copy = JSON.parse(JSON.stringify(payload || {}));
  if (copy.browser && copy.browser.user_agent) copy.browser.user_agent = String(copy.browser.user_agent).slice(0, 180);
  return copy;
}

function parseJsonArray(value) {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function csvCell(value) {
  const text = String(value == null ? '' : value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default worker;
