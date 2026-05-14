ALTER TABLE conducteurs
  ADD COLUMN IF NOT EXISTS vehicule_id UUID REFERENCES vehicules(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_conducteurs_vehicule_id ON conducteurs(vehicule_id);
