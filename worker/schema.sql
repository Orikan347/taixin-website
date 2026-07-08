CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  birthdate TEXT,
  region TEXT,
  role TEXT,
  industry TEXT,
  consent_version TEXT,
  source TEXT,
  source_page TEXT,
  disc_type TEXT,
  life_number TEXT,
  primary_disc TEXT,
  problems_json TEXT,
  goals_json TEXT,
  report_json TEXT,
  course_path_json TEXT,
  conversation_json TEXT,
  last_event_type TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lead_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  source TEXT,
  source_page TEXT,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at);
CREATE INDEX IF NOT EXISTS idx_leads_disc_type ON leads(disc_type);
CREATE INDEX IF NOT EXISTS idx_leads_region ON leads(region);
CREATE INDEX IF NOT EXISTS idx_lead_events_lead_id ON lead_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_events_created_at ON lead_events(created_at);
