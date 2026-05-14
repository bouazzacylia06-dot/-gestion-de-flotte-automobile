// =============================================================================
// tests/unit/conducteur.test.js
// Tests unitaires du service Conducteur (Express + in-memory)
// Couvre : GET, POST, PUT, PATCH /assign, DELETE + vehiculeId (TASK 3)
// =============================================================================

// ─── Mocks hoistés (avant tout require) ──────────────────────────────────────

jest.mock('../../src/tracing', () => {}); // no-op OTel

jest.mock('../../src/middleware/authMiddleware', () => ({
  authenticate:  (_req, _res, next) => next(),
  requireRole:   ()  => (_req, _res, next) => next(),
}));

jest.mock('../../src/metrics', () => ({
  httpMetricsMiddleware: (_req, _res, next) => next(),
  recordUserCreated:     jest.fn(),
}));

// ─── Setup ───────────────────────────────────────────────────────────────────

const request = require('supertest');
const { app }  = require('../../src/app');

// Payload valide réutilisable
const BASE = { nom: 'Dupont', prenom: 'Jean', numeroPermis: '07-TEST-001', statut: 'actif' };

// =============================================================================
describe('GET /', () => {
// =============================================================================

  test('✅ retourne un message de bienvenue', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/conducteur/i);
  });
});

// =============================================================================
describe('GET /health', () => {
// =============================================================================

  test('✅ retourne { status: ok }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('conducteur-service');
  });
});

// =============================================================================
describe('GET /conducteurs', () => {
// =============================================================================

  test('✅ retourne un tableau non vide (seeds)', async () => {
    const res = await request(app).get('/conducteurs');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('✅ chaque conducteur possède le champ vehiculeId (TASK 3)', async () => {
    const res = await request(app).get('/conducteurs');
    res.body.forEach((c) => {
      expect(Object.prototype.hasOwnProperty.call(c, 'vehiculeId')).toBe(true);
    });
  });

  test('✅ les seeds ont vehiculeId à null', async () => {
    const res = await request(app).get('/conducteurs');
    res.body.forEach((c) => {
      expect(c.vehiculeId).toBeNull();
    });
  });

  test('✅ chaque conducteur a les champs obligatoires', async () => {
    const res = await request(app).get('/conducteurs');
    res.body.forEach((c) => {
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('nom');
      expect(c).toHaveProperty('prenom');
      expect(c).toHaveProperty('numeroPermis');
      expect(c).toHaveProperty('statut');
    });
  });
});

// =============================================================================
describe('GET /conducteurs/:id', () => {
// =============================================================================

  let seedId;

  beforeAll(async () => {
    const res = await request(app).get('/conducteurs');
    seedId = res.body[0].id;
  });

  test('✅ retourne le conducteur par son id', async () => {
    const res = await request(app).get(`/conducteurs/${seedId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(seedId);
  });

  test('✅ inclut vehiculeId dans la réponse', async () => {
    const res = await request(app).get(`/conducteurs/${seedId}`);
    expect(Object.prototype.hasOwnProperty.call(res.body, 'vehiculeId')).toBe(true);
  });

  test('❌ retourne 404 pour un id inexistant', async () => {
    const res = await request(app).get('/conducteurs/00000000-0000-4000-b000-000000000000');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });
});

// =============================================================================
describe('POST /conducteurs', () => {
// =============================================================================

  test('✅ crée un conducteur sans vehiculeId → vehiculeId null', async () => {
    const res = await request(app).post('/conducteurs').send(BASE);
    expect(res.status).toBe(201);
    expect(res.body.nom).toBe('Dupont');
    expect(res.body.vehiculeId).toBeNull();
    expect(res.body.id).toBeDefined();
  });

  test('✅ crée un conducteur AVEC vehiculeId (TASK 3)', async () => {
    const vId = 'aaaaaaaa-0001-4000-b000-000000000001';
    const res = await request(app).post('/conducteurs').send({ ...BASE, vehiculeId: vId, numeroPermis: '07-TEST-002' });
    expect(res.status).toBe(201);
    expect(res.body.vehiculeId).toBe(vId);
  });

  test('✅ trim des champs nom / prenom / numeroPermis', async () => {
    const res = await request(app).post('/conducteurs').send({
      nom: '  Martin  ', prenom: '  Alice  ', numeroPermis: '  07-TEST-003  ', statut: 'actif',
    });
    expect(res.status).toBe(201);
    expect(res.body.nom).toBe('Martin');
    expect(res.body.prenom).toBe('Alice');
    expect(res.body.numeroPermis).toBe('07-TEST-003');
  });

  test('❌ 400 si nom manquant', async () => {
    const res = await request(app).post('/conducteurs').send({ prenom: 'Jean', numeroPermis: '07-X', statut: 'actif' });
    expect(res.status).toBe(400);
  });

  test('❌ 400 si statut invalide', async () => {
    const res = await request(app).post('/conducteurs').send({ ...BASE, statut: 'inconnu' });
    expect(res.status).toBe(400);
  });

  test('❌ 400 si body vide', async () => {
    const res = await request(app).post('/conducteurs').send({});
    expect(res.status).toBe(400);
  });

  test('✅ les 3 statuts valides sont acceptés', async () => {
    for (const statut of ['actif', 'inactif', 'suspendu']) {
      const res = await request(app).post('/conducteurs').send({
        nom: 'T', prenom: 'T', numeroPermis: `07-${statut.toUpperCase()}`, statut,
      });
      expect(res.status).toBe(201);
    }
  });
});

// =============================================================================
describe('PUT /conducteurs/:id', () => {
// =============================================================================

  let conducteurId;
  const VID = 'bbbbbbbb-0001-4000-b000-000000000001';

  beforeAll(async () => {
    const res = await request(app).post('/conducteurs').send({ ...BASE, numeroPermis: '07-PUT-001' });
    conducteurId = res.body.id;
  });

  test('✅ met à jour les champs de base', async () => {
    const res = await request(app)
      .put(`/conducteurs/${conducteurId}`)
      .send({ ...BASE, nom: 'Modifié', numeroPermis: '07-PUT-001' });
    expect(res.status).toBe(200);
    expect(res.body.nom).toBe('Modifié');
  });

  test('✅ ajoute vehiculeId via PUT (TASK 3)', async () => {
    const res = await request(app)
      .put(`/conducteurs/${conducteurId}`)
      .send({ ...BASE, vehiculeId: VID, numeroPermis: '07-PUT-001' });
    expect(res.status).toBe(200);
    expect(res.body.vehiculeId).toBe(VID);
  });

  test('✅ préserve vehiculeId existant si PUT sans vehiculeId (TASK 3)', async () => {
    // 1. Assigner un vehiculeId
    await request(app).put(`/conducteurs/${conducteurId}`).send({ ...BASE, vehiculeId: VID, numeroPermis: '07-PUT-001' });
    // 2. PUT sans vehiculeId → doit préserver
    const res = await request(app).put(`/conducteurs/${conducteurId}`).send({ ...BASE, numeroPermis: '07-PUT-001' });
    expect(res.status).toBe(200);
    expect(res.body.vehiculeId).toBe(VID);
  });

  test('✅ peut supprimer vehiculeId avec null via PUT', async () => {
    const res = await request(app)
      .put(`/conducteurs/${conducteurId}`)
      .send({ ...BASE, vehiculeId: null, numeroPermis: '07-PUT-001' });
    expect(res.status).toBe(200);
    expect(res.body.vehiculeId).toBeNull();
  });

  test('❌ 404 pour un id inexistant', async () => {
    const res = await request(app).put('/conducteurs/00000000-0000-4000-b000-000000000000').send(BASE);
    expect(res.status).toBe(404);
  });

  test('❌ 400 si payload invalide sur PUT', async () => {
    const res = await request(app).put(`/conducteurs/${conducteurId}`).send({ nom: 'seul' });
    expect(res.status).toBe(400);
  });
});

// =============================================================================
describe('PATCH /conducteurs/:id/assign — TASK 3', () => {
// =============================================================================

  let conducteurId;

  beforeAll(async () => {
    const res = await request(app).post('/conducteurs').send({ ...BASE, numeroPermis: '07-ASSIGN-001' });
    conducteurId = res.body.id;
  });

  test('✅ assigne un vehiculeId à un conducteur', async () => {
    const vId = 'cccccccc-0001-4000-b000-000000000001';
    const res = await request(app).patch(`/conducteurs/${conducteurId}/assign`).send({ vehiculeId: vId });
    expect(res.status).toBe(200);
    expect(res.body.vehiculeId).toBe(vId);
    expect(res.body.id).toBe(conducteurId);
  });

  test('✅ désassigne le véhicule en passant vehiculeId: null', async () => {
    const res = await request(app).patch(`/conducteurs/${conducteurId}/assign`).send({ vehiculeId: null });
    expect(res.status).toBe(200);
    expect(res.body.vehiculeId).toBeNull();
  });

  test('✅ désassigne avec body vide (absence de vehiculeId = null)', async () => {
    // D'abord assigner
    await request(app).patch(`/conducteurs/${conducteurId}/assign`).send({ vehiculeId: 'dddddddd-0001-4000-b000-000000000001' });
    // Désassigner
    const res = await request(app).patch(`/conducteurs/${conducteurId}/assign`).send({});
    expect(res.status).toBe(200);
    expect(res.body.vehiculeId).toBeNull();
  });

  test('✅ retourne tous les champs du conducteur après assignation', async () => {
    const vId = 'eeeeeeee-0001-4000-b000-000000000001';
    const res = await request(app).patch(`/conducteurs/${conducteurId}/assign`).send({ vehiculeId: vId });
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('nom');
    expect(res.body).toHaveProperty('prenom');
    expect(res.body).toHaveProperty('statut');
    expect(res.body).toHaveProperty('vehiculeId', vId);
  });

  test('✅ le changement est persisté (GET après PATCH)', async () => {
    const vId = 'ffffffff-0001-4000-b000-000000000001';
    await request(app).patch(`/conducteurs/${conducteurId}/assign`).send({ vehiculeId: vId });
    const get = await request(app).get(`/conducteurs/${conducteurId}`);
    expect(get.body.vehiculeId).toBe(vId);
  });

  test('❌ 404 pour un conducteur inexistant', async () => {
    const res = await request(app).patch('/conducteurs/00000000-0000-4000-b000-000000000000/assign').send({ vehiculeId: null });
    expect(res.status).toBe(404);
  });
});

// =============================================================================
describe('DELETE /conducteurs/:id', () => {
// =============================================================================

  test('✅ supprime un conducteur existant (204)', async () => {
    const created = await request(app).post('/conducteurs').send({ ...BASE, numeroPermis: '07-DEL-001' });
    const id = created.body.id;
    const del = await request(app).delete(`/conducteurs/${id}`);
    expect(del.status).toBe(204);
  });

  test('✅ le conducteur n\'est plus accessible après suppression', async () => {
    const created = await request(app).post('/conducteurs').send({ ...BASE, numeroPermis: '07-DEL-002' });
    const id = created.body.id;
    await request(app).delete(`/conducteurs/${id}`);
    const get = await request(app).get(`/conducteurs/${id}`);
    expect(get.status).toBe(404);
  });

  test('❌ 404 pour un id inexistant', async () => {
    const res = await request(app).delete('/conducteurs/00000000-0000-4000-b000-000000000000');
    expect(res.status).toBe(404);
  });
});

// =============================================================================
describe('PATCH /conducteurs/:id/assign — permis expiré', () => {
// =============================================================================

  // Garcia (c9) a dateExpirationPermis: '2023-06-15' (expirée)
  const GARCIA_ID = 'c1000000-0001-4000-b000-000000000009';

  test('✅ les seeds ont le champ dateExpirationPermis', async () => {
    const res = await request(app).get('/conducteurs');
    res.body.forEach((c) => {
      expect(Object.prototype.hasOwnProperty.call(c, 'dateExpirationPermis')).toBe(true);
    });
  });

  test('✅ Garcia a une date de permis expirée dans les seeds', async () => {
    const res = await request(app).get(`/conducteurs/${GARCIA_ID}`);
    expect(res.status).toBe(200);
    expect(new Date(res.body.dateExpirationPermis) < new Date()).toBe(true);
  });

  test('❌ 422 si le permis est expiré (conducteur actif, permis expiré)', async () => {
    const created = await request(app).post('/conducteurs').send({
      nom: 'Expiré', prenom: 'Test', numeroPermis: '07-EXPIRED-ACTIF-001',
      statut: 'actif', dateExpirationPermis: '2023-06-15',
    });
    const res = await request(app)
      .patch(`/conducteurs/${created.body.id}/assign`)
      .send({ vehiculeId: 'aaaaaaaa-0001-4000-b000-000000000001' });
    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/permis expiré/i);
    expect(res.body).toHaveProperty('expiredAt', '2023-06-15');
  });

  test('✅ conducteur avec permis valide (futur) peut être assigné', async () => {
    const created = await request(app).post('/conducteurs').send({
      ...BASE,
      numeroPermis: '07-VALID-PERMIT-001',
      dateExpirationPermis: '2027-12-31',
    });
    const vId = 'aaaaaaaa-9999-4000-b000-000000000099';
    const res = await request(app)
      .patch(`/conducteurs/${created.body.id}/assign`)
      .send({ vehiculeId: vId });
    expect(res.status).toBe(200);
    expect(res.body.vehiculeId).toBe(vId);
  });

  test('✅ conducteur sans dateExpirationPermis (null) peut être assigné', async () => {
    const created = await request(app).post('/conducteurs').send({
      ...BASE,
      numeroPermis: '07-NO-EXPIRY-001',
    });
    const vId = 'bbbbbbbb-9999-4000-b000-000000000099';
    const res = await request(app)
      .patch(`/conducteurs/${created.body.id}/assign`)
      .send({ vehiculeId: vId });
    expect(res.status).toBe(200);
    expect(res.body.vehiculeId).toBe(vId);
  });

  test('❌ 404 avant le check permis si conducteur inexistant', async () => {
    const res = await request(app)
      .patch('/conducteurs/00000000-0000-4000-b000-000000000099/assign')
      .send({ vehiculeId: 'aaaaaaaa-0001-4000-b000-000000000001' });
    expect(res.status).toBe(404);
  });
});

// =============================================================================
describe('PATCH /conducteurs/:id/assign — conducteur suspendu', () => {
// =============================================================================

  // Simon (c6) a statut: 'inactif' — on crée un suspendu spécifique
  // Garcia (c9) a statut: 'suspendu' ET permis expiré — on utilise un conducteur
  // suspendu avec permis valide pour tester le check statut indépendamment

  test('❌ 422 si conducteur suspendu (seed Garcia)', async () => {
    const GARCIA_ID = 'c1000000-0001-4000-b000-000000000009';
    const res = await request(app)
      .patch(`/conducteurs/${GARCIA_ID}/assign`)
      .send({ vehiculeId: 'aaaaaaaa-0001-4000-b000-000000000001' });
    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/suspendu/i);
  });

  test('❌ 422 si conducteur suspendu avec permis valide', async () => {
    const created = await request(app).post('/conducteurs').send({
      nom: 'Suspendu', prenom: 'Test', numeroPermis: '07-SUSP-001',
      statut: 'suspendu', dateExpirationPermis: '2030-01-01',
    });
    const res = await request(app)
      .patch(`/conducteurs/${created.body.id}/assign`)
      .send({ vehiculeId: 'aaaaaaaa-0001-4000-b000-000000000002' });
    expect(res.status).toBe(422);
    expect(res.body.message).toMatch(/suspendu/i);
  });

  test('✅ conducteur inactif (non suspendu) peut être assigné', async () => {
    const created = await request(app).post('/conducteurs').send({
      nom: 'Inactif', prenom: 'Test', numeroPermis: '07-INACT-001',
      statut: 'inactif', dateExpirationPermis: '2030-01-01',
    });
    const res = await request(app)
      .patch(`/conducteurs/${created.body.id}/assign`)
      .send({ vehiculeId: 'aaaaaaaa-0001-4000-b000-000000000003' });
    expect(res.status).toBe(200);
  });

  test('✅ conducteur actif peut être assigné normalement', async () => {
    const created = await request(app).post('/conducteurs').send({
      nom: 'Actif', prenom: 'Test', numeroPermis: '07-ACTIF-SUSP-001',
      statut: 'actif', dateExpirationPermis: '2030-01-01',
    });
    const res = await request(app)
      .patch(`/conducteurs/${created.body.id}/assign`)
      .send({ vehiculeId: 'aaaaaaaa-0001-4000-b000-000000000004' });
    expect(res.status).toBe(200);
  });
});

// =============================================================================
describe('POST /conducteurs — dateExpirationPermis', () => {
// =============================================================================

  test('✅ accepte une dateExpirationPermis ISO 8601 valide', async () => {
    const res = await request(app).post('/conducteurs').send({
      ...BASE,
      numeroPermis: '07-DATE-001',
      dateExpirationPermis: '2027-06-30',
    });
    expect(res.status).toBe(201);
    expect(res.body.dateExpirationPermis).toBe('2027-06-30');
  });

  test('✅ dateExpirationPermis est null si non fourni', async () => {
    const res = await request(app).post('/conducteurs').send({
      ...BASE,
      numeroPermis: '07-DATE-002',
    });
    expect(res.status).toBe(201);
    expect(res.body.dateExpirationPermis).toBeNull();
  });

  test('❌ 400 si dateExpirationPermis est une string non-date', async () => {
    const res = await request(app).post('/conducteurs').send({
      ...BASE,
      numeroPermis: '07-DATE-003',
      dateExpirationPermis: 'not-a-date',
    });
    expect(res.status).toBe(400);
  });

  test('❌ 400 si dateExpirationPermis est un nombre et non une string', async () => {
    const res = await request(app).post('/conducteurs').send({
      ...BASE,
      numeroPermis: '07-DATE-004',
      dateExpirationPermis: 20271231,
    });
    expect(res.status).toBe(400);
  });
});

// =============================================================================
describe('PUT /conducteurs/:id — dateExpirationPermis', () => {
// =============================================================================

  let conducteurId;

  beforeAll(async () => {
    const res = await request(app).post('/conducteurs').send({
      ...BASE,
      numeroPermis: '07-PUT-DATE-001',
      dateExpirationPermis: '2026-01-01',
    });
    conducteurId = res.body.id;
  });

  test('✅ met à jour dateExpirationPermis via PUT', async () => {
    const res = await request(app)
      .put(`/conducteurs/${conducteurId}`)
      .send({ ...BASE, numeroPermis: '07-PUT-DATE-001', dateExpirationPermis: '2028-06-30' });
    expect(res.status).toBe(200);
    expect(res.body.dateExpirationPermis).toBe('2028-06-30');
  });

  test('✅ préserve dateExpirationPermis si PUT sans ce champ', async () => {
    // S'assurer qu'il y a une date
    await request(app).put(`/conducteurs/${conducteurId}`)
      .send({ ...BASE, numeroPermis: '07-PUT-DATE-001', dateExpirationPermis: '2028-06-30' });
    // PUT sans dateExpirationPermis → doit préserver
    const res = await request(app)
      .put(`/conducteurs/${conducteurId}`)
      .send({ ...BASE, numeroPermis: '07-PUT-DATE-001' });
    expect(res.status).toBe(200);
    expect(res.body.dateExpirationPermis).toBe('2028-06-30');
  });
});

// =============================================================================
describe('404 handler — routes inconnues', () => {
// =============================================================================

  test('❌ route inexistante retourne 404', async () => {
    const res = await request(app).get('/inexistant');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message');
  });
});
