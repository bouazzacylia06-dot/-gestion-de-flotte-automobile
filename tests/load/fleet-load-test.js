// tests/load/fleet-load-test.js — Test de charge K6 — Fleet Management System
// Ports réels: vehicle-service :3000, driver :3001, maintenance :3002, gateway :4000
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate    = new Rate('errors');
const gqlDuration  = new Trend('graphql_duration');
const restDuration = new Trend('rest_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10  },  // Montée progressive
    { duration: '1m',  target: 50  },  // Charge normale
    { duration: '30s', target: 100 },  // Pic de charge
    { duration: '30s', target: 0   },  // Descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% des requêtes < 500ms
    errors:            ['rate<0.05'],   // Moins de 5% d'erreurs
    graphql_duration:  ['p(99)<1000'],  // GraphQL < 1s au 99e percentile
    rest_duration:     ['p(95)<300'],   // REST < 300ms au 95e percentile
  },
};

// Adapter selon l'environnement
const GRAPHQL_URL  = __ENV.GRAPHQL_URL  || 'http://localhost:4000/graphql';
const VEHICLE_URL  = __ENV.VEHICLE_URL  || 'http://localhost:3000';
const DRIVER_URL   = __ENV.DRIVER_URL   || 'http://localhost:3001';
const MAINT_URL    = __ENV.MAINT_URL    || 'http://localhost:3002';

// Token JWT Keycloak (à pré-générer avant le test)
// Exemple: export K6_TOKEN=$(curl -s -X POST http://localhost:8080/... | jq -r .access_token)
const TOKEN = __ENV.K6_TOKEN || '';

const authHeaders = {
  'Content-Type':  'application/json',
  'Authorization': TOKEN ? `Bearer ${TOKEN}` : '',
};

// ── SCÉNARIOS ─────────────────────────────────────────────────

// Scénario 1 : Lectures GraphQL (lecture de tous les véhicules)
export function testGraphQLVehicules() {
  const payload = JSON.stringify({
    query: '{ vehicules { id immatriculation marque modele statut } }',
  });
  const res = http.post(GRAPHQL_URL, payload, { headers: authHeaders });
  const ok = check(res, {
    'GraphQL status 200':  r => r.status === 200,
    'GraphQL has data':    r => {
      try { return JSON.parse(r.body).data !== null; } catch { return false; }
    },
    'GraphQL < 500ms':     r => r.timings.duration < 500,
    'Pas d\'erreur GQL':   r => {
      try { return !JSON.parse(r.body).errors; } catch { return false; }
    },
  });
  errorRate.add(!ok);
  gqlDuration.add(res.timings.duration);
  sleep(1);
}

// Scénario 2 : Lectures GraphQL mixtes (conducteurs + maintenances)
export function testGraphQLMixed() {
  const payload = JSON.stringify({
    query: '{ conducteurs { id nom prenom statut } maintenances { id type status cost } }',
  });
  const res = http.post(GRAPHQL_URL, payload, { headers: authHeaders });
  const ok = check(res, {
    'Mixed GraphQL 200': r => r.status === 200,
    'Mixed < 800ms':     r => r.timings.duration < 800,
  });
  errorRate.add(!ok);
  gqlDuration.add(res.timings.duration);
  sleep(0.5);
}

// Scénario 3 : Lecture REST vehicle-service
export function testRESTHealth() {
  const vHealth = http.get(`${VEHICLE_URL}/health`);
  check(vHealth, {
    'Vehicle health 200': r => r.status === 200,
    'Vehicle health < 100ms': r => r.timings.duration < 100,
  });

  const dHealth = http.get(`${DRIVER_URL}/health`);
  check(dHealth, {
    'Driver health 200': r => r.status === 200,
  });

  const mHealth = http.get(`${MAINT_URL}/health`);
  check(mHealth, {
    'Maintenance health 200': r => r.status === 200,
  });

  restDuration.add(vHealth.timings.duration);
  sleep(0.3);
}

// Scénario 4 : Lecture liste véhicules REST
export function testRESTVehicles() {
  const res = http.get(`${VEHICLE_URL}/vehicles`, { headers: authHeaders });
  const ok = check(res, {
    'REST vehicles 200 ou 401': r => r.status === 200 || r.status === 401,
    'REST vehicles < 300ms':    r => r.timings.duration < 300,
  });
  restDuration.add(res.timings.duration);
  errorRate.add(res.status !== 200 && res.status !== 401);
  sleep(0.5);
}

// Scénario 5 : Mutation GraphQL (création véhicule)
export function testGraphQLMutation() {
  const immat = `LOAD-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
  const payload = JSON.stringify({
    query: `mutation { createVehicule(input: {
      immatriculation: "${immat}",
      marque: "LoadTest",
      modele: "K6",
      statut: "disponible"
    }) { id immatriculation } }`,
  });
  const res = http.post(GRAPHQL_URL, payload, { headers: authHeaders });
  const ok = check(res, {
    'Mutation 200':   r => r.status === 200,
    'Mutation < 1s':  r => r.timings.duration < 1000,
    'No GQL errors':  r => {
      try { return !JSON.parse(r.body).errors; } catch { return false; }
    },
  });
  errorRate.add(!ok);
  gqlDuration.add(res.timings.duration);
  sleep(2); // Pause plus longue pour les mutations
}

// ── FONCTION PRINCIPALE (mix des scénarios) ────────────────────
export default function() {
  const rand = Math.random();
  if (rand < 0.40) {
    testGraphQLVehicules();  // 40% : lecture GraphQL véhicules
  } else if (rand < 0.60) {
    testGraphQLMixed();      // 20% : lecture GraphQL mixte
  } else if (rand < 0.75) {
    testRESTHealth();        // 15% : health checks REST
  } else if (rand < 0.90) {
    testRESTVehicles();      // 15% : liste REST véhicules
  } else {
    testGraphQLMutation();   // 10% : mutations GraphQL
  }
}

// ── HOOKS DE RAPPORT ──────────────────────────────────────────
export function handleSummary(data) {
  const p95 = data.metrics?.http_req_duration?.values?.['p(95)'] || 0;
  const errRate = data.metrics?.errors?.values?.rate || 0;
  const reqCount = data.metrics?.http_reqs?.values?.count || 0;

  const report = {
    timestamp: new Date().toISOString(),
    service:   'fleet-management',
    results: {
      totalRequests:  reqCount,
      errorRate:      `${(errRate * 100).toFixed(2)}%`,
      p95Duration:    `${p95.toFixed(0)}ms`,
      passed:         p95 < 500 && errRate < 0.05,
    },
    thresholds: {
      'p(95) < 500ms': p95 < 500 ? '✅ PASS' : '❌ FAIL',
      'error rate < 5%': errRate < 0.05 ? '✅ PASS' : '❌ FAIL',
    },
  };

  return {
    'tests/load/results.json': JSON.stringify(report, null, 2),
    stdout: `\n🏁 TEST DE CHARGE TERMINÉ
Requêtes : ${reqCount}
P95      : ${p95.toFixed(0)}ms (seuil: 500ms)
Erreurs  : ${(errRate * 100).toFixed(2)}% (seuil: 5%)
Statut   : ${report.results.passed ? '✅ PASS' : '❌ FAIL'}\n`,
  };
}
