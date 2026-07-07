const ALLOWED_ORIGINS = new Set([
  'https://orikan347.github.io',
  'http://127.0.0.1:8765',
  'http://localhost:8765'
]);

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = buildCors(origin);
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(request.url);
    if (request.method === 'POST' && url.pathname === '/lead-events') {
      return handleLeadEvent(request, env, cors);
    }
    if (request.method === 'GET' && url.pathname === '/admin/leads') {
      return handleAdminLeads(request, env, cors);
    }
    return json({ error: 'not_found' }, 404, cors);
  }
};

async function handleLeadEvent(request, env, cors) {
  const payload = await request.json().catch(() => null);
  if (!payload || !payload.profile || !payload.profile.consent || !payload.profile.email) {
    return json({ error: 'missing_required_consent_or_email' }, 400, cors);
  }
  const now = new Date().toISOString();
  const leadId = await upsertLead(env.DB, payload, now);
  await env.DB.prepare(`
    INSERT INTO lead_events (
      lead_id, event_type, source, source_page, payload_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    leadId,
    payload.event_type || 'unknown',
    payload.source || 'unknown',
    payload.source_page || '',
    JSON.stringify(payload),
    now
  ).run();
  return json({ ok: true, lead_id: leadId }, 200, cors);
}

async function upsertLead(db, payload, now) {
  const profile = payload.profile || {};
  const report = payload.report || {};
  const intake = payload.intake || {};
  const leadId = profile.email.toLowerCase();
  await db.prepare(`
    INSERT INTO leads (
      id, source, name, email, phone, region, role, industry, birthdate,
      disc_type, life_number, problems_json, goals_json, report_json,
      course_path_json, consent_version, updated_at, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      source=excluded.source,
      name=excluded.name,
      phone=excluded.phone,
      region=excluded.region,
      role=excluded.role,
      industry=excluded.industry,
      birthdate=excluded.birthdate,
      disc_type=excluded.disc_type,
      life_number=excluded.life_number,
      problems_json=excluded.problems_json,
      goals_json=excluded.goals_json,
      report_json=excluded.report_json,
      course_path_json=excluded.course_path_json,
      consent_version=excluded.consent_version,
      updated_at=excluded.updated_at
  `).bind(
    leadId,
    payload.source || 'unknown',
    profile.name || '',
    profile.email || '',
    profile.phone || '',
    profile.region || '',
    profile.role || '',
    profile.industry || '',
    profile.birthdate || '',
    report.disc_type || '',
    report.life_number || '',
    JSON.stringify(intake.problems || []),
    JSON.stringify(intake.goals || []),
    JSON.stringify(report || null),
    JSON.stringify(payload.course_path || []),
    payload.consent_version || '',
    now,
    now
  ).run();
  return leadId;
}

async function handleAdminLeads(request, env, cors) {
  const auth = request.headers.get('Authorization') || '';
  if (!env.ADMIN_TOKEN || auth !== `Bearer ${env.ADMIN_TOKEN}`) {
    return json({ error: 'unauthorized' }, 401, cors);
  }
  const limit = Math.min(Number(new URL(request.url).searchParams.get('limit') || 50), 200);
  const result = await env.DB.prepare(`
    SELECT id, source, name, email, phone, region, role, industry, disc_type,
           life_number, problems_json, goals_json, course_path_json, updated_at
    FROM leads
    ORDER BY updated_at DESC
    LIMIT ?
  `).bind(limit).all();
  return json({ ok: true, leads: result.results || [] }, 200, cors);
}

function buildCors(origin) {
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://orikan347.github.io';
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin'
  };
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}
