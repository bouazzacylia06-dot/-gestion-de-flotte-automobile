CREATE TABLE IF NOT EXISTS geo_alertes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  UUID NOT NULL REFERENCES vehicules(id) ON DELETE CASCADE,
  zone_id     TEXT,
  type        TEXT NOT NULL CHECK (type IN ('ZONE_EXIT', 'FORBIDDEN', 'SPEED')),
  latitude    DECIMAL(10, 7),
  longitude   DECIMAL(10, 7),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  TEXT DEFAULT 'system'
);
CREATE INDEX IF NOT EXISTS idx_geo_alertes_created_at ON geo_alertes(created_at DESC);
