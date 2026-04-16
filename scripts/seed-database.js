#!/usr/bin/env node
// scripts/seed-database.js — Seeding complet via GraphQL Gateway (avec auth Keycloak)
// Usage: node scripts/seed-database.js
// Prérequis: docker compose up -d (tous les services healthy)

const KEYCLOAK_URL = 'http://localhost:8080/realms/flotte/protocol/openid-connect/token';
const GRAPHQL_URL  = 'http://localhost:4000/graphql';

// Ports réels selon docker-compose.yaml
const BASE = {
  vehicles:    'http://localhost:3000',
  conducteurs: 'http://localhost:3001',
  maintenance: 'http://localhost:3002',
  // location-service port 3003 non exposé hôte → on passe par GraphQL
  graphql:     GRAPHQL_URL,
};

let token = '';
let created = 0, skipped = 0, errors = 0;

// ── UTILITAIRES ──────────────────────────────────────────────
async function getToken() {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id:  'flotte-app',
    username:   'admin',
    password:   'admin123',
  });
  const res = await fetch(KEYCLOAK_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
  });
  if (!res.ok) throw new Error(`Keycloak auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}

async function restPost(url, body) {
  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
}

async function gql(query, variables = {}) {
  const res = await fetch(GRAPHQL_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function insertRest(label, url, body) {
  try {
    const { status, data } = await restPost(url, body);
    if (status === 201 || status === 200) {
      console.log(`  ✅ ${label}`);
      created++;
      return data;
    } else if (status === 409 || (status === 400 && JSON.stringify(data).includes('existe'))) {
      console.log(`  ⏭️  ${label} (déjà existant)`);
      skipped++;
      return null;
    } else {
      console.log(`  ❌ ${label} → HTTP ${status}: ${JSON.stringify(data).slice(0, 80)}`);
      errors++;
      return null;
    }
  } catch (e) {
    console.log(`  ❌ ${label} → ${e.message}`);
    errors++;
    return null;
  }
}

async function insertGql(label, mutation, variables) {
  try {
    const res = await gql(mutation, variables);
    if (res.data && !res.errors) {
      console.log(`  ✅ ${label}`);
      created++;
      return Object.values(res.data)[0];
    } else {
      const msg = res.errors?.[0]?.message || JSON.stringify(res);
      if (msg.includes('existe') || msg.includes('duplicate') || msg.includes('already')) {
        console.log(`  ⏭️  ${label} (déjà existant)`);
        skipped++;
      } else {
        console.log(`  ❌ ${label} → ${msg.slice(0, 100)}`);
        errors++;
      }
      return null;
    }
  } catch (e) {
    console.log(`  ❌ ${label} → ${e.message}`);
    errors++;
    return null;
  }
}

// ── DONNÉES ──────────────────────────────────────────────────

// Statuts valides (vehicle-service): AVAILABLE, IN_USE, MAINTENANCE, RETIRED
const VEHICLES = [
  { immatriculation: 'AA-001-BB', marque: 'Renault',    modele: 'Kangoo',   statut: 'IN_USE' },
  { immatriculation: 'CC-002-DD', marque: 'Peugeot',    modele: 'Partner',  statut: 'IN_USE' },
  { immatriculation: 'EE-003-FF', marque: 'Citroen',    modele: 'Berlingo', statut: 'IN_USE' },
  { immatriculation: 'GG-004-HH', marque: 'Ford',       modele: 'Transit',  statut: 'MAINTENANCE' },
  { immatriculation: 'II-005-JJ', marque: 'Volkswagen', modele: 'Crafter',  statut: 'IN_USE' },
  { immatriculation: 'KK-006-LL', marque: 'Mercedes',   modele: 'Sprinter', statut: 'AVAILABLE' },
  { immatriculation: 'MM-007-NN', marque: 'Renault',    modele: 'Master',   statut: 'IN_USE' },
  { immatriculation: 'OO-008-PP', marque: 'Peugeot',    modele: 'Boxer',    statut: 'AVAILABLE' },
  { immatriculation: 'QQ-009-RR', marque: 'Toyota',     modele: 'Proace',   statut: 'IN_USE' },
  { immatriculation: 'SS-010-TT', marque: 'Nissan',     modele: 'NV300',    statut: 'RETIRED' },
];

const CONDUCTEURS = [
  { nom: 'Martin',   prenom: 'Alice',   numeroPermis: 'PERM001AA', statut: 'actif' },
  { nom: 'Dubois',   prenom: 'Pierre',  numeroPermis: 'PERM002BB', statut: 'actif' },
  { nom: 'Leroy',    prenom: 'Sophie',  numeroPermis: 'PERM003CC', statut: 'actif' },
  { nom: 'Bernard',  prenom: 'Thomas',  numeroPermis: 'PERM004DD', statut: 'actif' },
  { nom: 'Petit',    prenom: 'Marie',   numeroPermis: 'PERM005EE', statut: 'actif' },
  { nom: 'Moreau',   prenom: 'Lucas',   numeroPermis: 'PERM006FF', statut: 'inactif' },
  { nom: 'Simon',    prenom: 'Emma',    numeroPermis: 'PERM007GG', statut: 'actif' },
  { nom: 'Laurent',  prenom: 'Hugo',    numeroPermis: 'PERM008HH', statut: 'actif' },
];

// Positions GPS autour de Rouen (lat 49.4431, lng 1.0993)
function generatePositions(vehiculeId, count = 10) {
  const positions = [];
  const now = Date.now();
  let lat = 49.4431 + (Math.random() - 0.5) * 0.04;
  let lng = 1.0993 + (Math.random() - 0.5) * 0.05;
  for (let i = count; i >= 0; i--) {
    lat += (Math.random() - 0.5) * 0.003;
    lng += (Math.random() - 0.5) * 0.004;
    positions.push({
      vehiculeId: String(vehiculeId),
      latitude:   parseFloat(lat.toFixed(6)),
      longitude:  parseFloat(lng.toFixed(6)),
      timestamp:  new Date(now - i * 3 * 60 * 1000).toISOString(),
    });
  }
  return positions;
}

// ── MAIN ─────────────────────────────────────────────────────
(async () => {
  console.log('\n🌱 DÉMARRAGE DU SEEDING — Fleet Management System');
  console.log('   Université de Rouen M1 GIL 2025-2026\n');

  // 0. Obtenir le token Keycloak
  console.log('🔑 Obtention du token Keycloak (admin)...');
  try {
    token = await getToken();
    console.log(`  ✅ Token obtenu (${token.length} chars)\n`);
  } catch (e) {
    console.error(`  ❌ FATAL: ${e.message}`);
    console.error('  Vérifiez que Keycloak tourne sur :8080 (docker compose ps)');
    process.exit(1);
  }

  // 1. Véhicules via REST (vehicle-service :3000)
  console.log('🚗 Insertion des véhicules (vehicle-service :3000)...');
  const vehiculeIds = [];
  for (const v of VEHICLES) {
    const result = await insertRest(
      `Véhicule ${v.immatriculation} (${v.marque} ${v.modele})`,
      `${BASE.vehicles}/vehicles`,
      v
    );
    if (result?.id) vehiculeIds.push(result.id);
  }

  // Si REST en 400 (champs manquants selon la validation), tenter via GraphQL
  if (vehiculeIds.length === 0) {
    console.log('\n  → Tentative via GraphQL createVehicule...');
    for (const v of VEHICLES) {
      const result = await insertGql(
        `Véhicule ${v.immatriculation} (GraphQL)`,
        `mutation($input: VehiculeInput!) { createVehicule(input: $input) { id immatriculation } }`,
        { input: v }
      );
      if (result?.id) vehiculeIds.push(result.id);
    }
  }

  // Récupérer les IDs existants si aucun créé
  if (vehiculeIds.length === 0) {
    console.log('  ℹ️  Récupération des véhicules existants...');
    try {
      const existing = await gql('{ vehicules { id immatriculation } }');
      const list = existing?.data?.vehicules || [];
      list.forEach(v => vehiculeIds.push(v.id));
      console.log(`  ✅ ${list.length} véhicules existants trouvés`);
    } catch {}
  }

  // 2. Conducteurs via REST (driver-service :3001)
  console.log('\n👤 Insertion des conducteurs (driver-service :3001)...');
  const conducteurIds = [];
  for (const c of CONDUCTEURS) {
    const result = await insertRest(
      `Conducteur ${c.prenom} ${c.nom}`,
      `${BASE.conducteurs}/conducteurs`,
      c
    );
    if (result?.id) conducteurIds.push(result.id);
  }

  if (conducteurIds.length === 0) {
    console.log('  ℹ️  Récupération des conducteurs existants...');
    try {
      const existing = await gql('{ conducteurs { id nom prenom } }');
      const list = existing?.data?.conducteurs || [];
      list.forEach(c => conducteurIds.push(c.id));
      console.log(`  ✅ ${list.length} conducteurs existants trouvés`);
    } catch {}
  }

  // 3. Maintenances via GraphQL (MaintenanceInput: vehicleId, date, type, status, cost)
  // Types valides: vidange, revision, pneus, freins, autre
  // Statuts valides: planifiee, en_cours, terminee, annulee
  console.log('\n🔧 Insertion des maintenances (GraphQL createMaintenance)...');
  const maintenances = [
    { vehicleId: vehiculeIds[0] || '1', date: '2026-03-01', type: 'vidange',  status: 'terminee',  cost: 115 },
    { vehicleId: vehiculeIds[3] || '4', date: '2026-04-10', type: 'freins',   status: 'en_cours',  cost: 350 },
    { vehicleId: vehiculeIds[1] || '2', date: '2026-04-20', type: 'revision', status: 'planifiee', cost: 280 },
    { vehicleId: vehiculeIds[2] || '3', date: '2026-05-05', type: 'autre',    status: 'planifiee', cost: 80  },
    { vehicleId: vehiculeIds[6] || '7', date: '2026-02-15', type: 'vidange',  status: 'terminee',  cost: 108 },
    { vehicleId: vehiculeIds[4] || '5', date: '2026-04-25', type: 'pneus',    status: 'planifiee', cost: 220 },
  ];

  for (const m of maintenances) {
    await insertGql(
      `Maintenance ${m.type} (véhicule ${m.vehicleId}) — ${m.status}`,
      `mutation($input: MaintenanceInput!) { createMaintenance(input: $input) { id type status } }`,
      { input: m }
    );
  }

  // 4. Positions GPS via GraphQL createLocalisation
  console.log('\n📍 Insertion des positions GPS (GraphQL createLocalisation)...');
  const vehiclesSample = vehiculeIds.slice(0, 5);
  for (let i = 0; i < vehiclesSample.length; i++) {
    const vid = vehiclesSample[i];
    const positions = generatePositions(vid, 8); // 8 points par véhicule
    for (const pos of positions) {
      await insertGql(
        `GPS v${vid.slice(0,8)} @${pos.timestamp.slice(11,16)}`,
        `mutation($input: LocalisationInput!) { createLocalisation(input: $input) { id vehiculeId latitude longitude } }`,
        { input: pos }
      );
    }
  }

  // 5. Évènements via GraphQL createEvenement
  // Types valides (evenement-service): alerte, panne, accident, revision, autre
  console.log('\n📋 Insertion des évènements...');
  const evenements = [
    { vehiculeId: vehiculeIds[0] || '1', type: 'alerte',   description: 'Sortie de zone autorisée (géofencing)',  date: new Date(Date.now() - 86400000).toISOString() },
    { vehiculeId: vehiculeIds[1] || '2', type: 'alerte',   description: 'Vitesse limite dépassée: 92 km/h',       date: new Date(Date.now() - 3600000).toISOString() },
    { vehiculeId: vehiculeIds[2] || '3', type: 'revision', description: 'Révision planifiée dans 500 km',         date: new Date(Date.now() - 7200000).toISOString() },
    { vehiculeId: vehiculeIds[4] || '5', type: 'autre',    description: 'Entrée en zone restreinte détectée',      date: new Date(Date.now() - 1800000).toISOString() },
    { vehiculeId: vehiculeIds[6] || '7', type: 'panne',    description: 'Voyant moteur allumé - diagnostic requis',date: new Date(Date.now() - 43200000).toISOString() },
  ];

  for (const e of evenements) {
    await insertGql(
      `Évènement ${e.type} (v${String(e.vehiculeId).slice(0,8)})`,
      `mutation($input: EvenementInput!) { createEvenement(input: $input) { id type } }`,
      { input: e }
    );
  }

  // 6. Rapport final
  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  SEEDING TERMINÉ`);
  console.log(`  ✅ Créés  : ${created}`);
  console.log(`  ⏭️  Skippés: ${skipped}`);
  console.log(`  ❌ Erreurs: ${errors}`);
  console.log('═══════════════════════════════════════════════════');

  // Vérification finale
  console.log('\n📊 État final des données :');
  try {
    const check = await gql(
      '{ vehicules { id } conducteurs { id } maintenances { id } localisations { id } evenements { id } }'
    );
    const d = check.data || {};
    console.log(`  Véhicules     : ${(d.vehicules || []).length}`);
    console.log(`  Conducteurs   : ${(d.conducteurs || []).length}`);
    console.log(`  Maintenances  : ${(d.maintenances || []).length}`);
    console.log(`  Localisations : ${(d.localisations || []).length}`);
    console.log(`  Évènements    : ${(d.evenements || []).length}`);
  } catch (e) {
    console.log('  ⚠️  Impossible de vérifier (GraphQL inaccessible)');
  }

  if (errors > 0) {
    console.log('\n⚠️  Des erreurs sont survenues. Vérifiez :');
    console.log('   - Les services sont-ils démarrés ? (docker compose ps)');
    console.log('   - Les tokens Keycloak sont-ils valides ?');
  } else {
    console.log('\n🎉 Base de données prête pour la démonstration !');
  }
})();
