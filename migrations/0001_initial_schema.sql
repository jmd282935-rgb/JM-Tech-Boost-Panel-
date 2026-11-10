CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  license_key_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','expired')),
  plan TEXT NOT NULL DEFAULT 'basic',
  expires_at TEXT,
  max_devices INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activations (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  device_id_hash TEXT NOT NULL,
  activated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(license_id, device_id_hash)
);

CREATE TABLE IF NOT EXISTS app_config (
  config_key TEXT PRIMARY KEY,
  config_value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS update_releases (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  download_url TEXT NOT NULL,
  release_notes TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activations_license_id ON activations(license_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
