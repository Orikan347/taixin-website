CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  region TEXT,
  role TEXT,
  industry TEXT,
  birthdate TEXT,
  disc_type TEXT,
  life_number TEXT,
  problems_json TEXT,
  goals_json TEXT,
  report_json TEXT,
  course_path_json TEXT,
  consent_version TEXT,
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lead_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source TEXT,
  source_page TEXT,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at);
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON lead_events(created_at);
