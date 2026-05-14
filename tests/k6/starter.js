import http from 'k6/http';
import { check, sleep } from 'k6';

const profile = __ENV.PROFILE || 'smoke';

const PROFILE_OPTIONS = {
  smoke: {
    vus: 1,
    duration: '30s',
  },
  load: {
    stages: [
      { duration: '30s', target: 10 },
      { duration: '1m', target: 10 },
      { duration: '20s', target: 0 },
    ],
  },
  spike: {
    stages: [
      { duration: '10s', target: 2 },
      { duration: '20s', target: 30 },
      { duration: '30s', target: 30 },
      { duration: '10s', target: 0 },
    ],
  },
};

const selectedProfile = PROFILE_OPTIONS[profile] || PROFILE_OPTIONS.smoke;

export const options = {
  ...selectedProfile,
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1200'],
    checks: ['rate>0.95'],
  },
};

const KEYCLOAK_URL = __ENV.KEYCLOAK_URL || 'http://127.0.0.1:8080';
const REALM = __ENV.KEYCLOAK_REALM || 'flotte';
const CLIENT_ID = __ENV.KEYCLOAK_CLIENT_ID || 'flotte-app';
const USERNAME = __ENV.KEYCLOAK_USERNAME || 'admin';
const PASSWORD = __ENV.KEYCLOAK_PASSWORD || 'admin123';

const VEHICLE_URL = __ENV.VEHICLE_URL || 'http://127.0.0.1:18081';
const CONDUCTEUR_URL = __ENV.CONDUCTEUR_URL || 'http://127.0.0.1:18082';

function getAccessToken() {
  const tokenUrl = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;
  const payload = [
    `client_id=${encodeURIComponent(CLIENT_ID)}`,
    `username=${encodeURIComponent(USERNAME)}`,
    `password=${encodeURIComponent(PASSWORD)}`,
    'grant_type=password',
  ].join('&');

  const response = http.post(tokenUrl, payload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    tags: { name: 'keycloak_token' },
  });

  const ok = check(response, {
    'token status is 200': (r) => r.status === 200,
    'token present': (r) => {
      const json = r.json();
      return Boolean(json && json.access_token);
    },
  });

  if (!ok) {
    throw new Error(`Impossible d'obtenir un token Keycloak (status=${response.status})`);
  }

  return response.json('access_token');
}

export function setup() {
  const token = getAccessToken();
  return { token };
}

export default function (data) {
  const authHeaders = {
    Authorization: `Bearer ${data.token}`,
  };

  const listVehiclesResponse = http.get(`${VEHICLE_URL}/vehicles`, {
    headers: authHeaders,
    tags: { name: 'vehicles_list' },
  });

  check(listVehiclesResponse, {
    'GET /vehicles status 200': (r) => r.status === 200,
  });

  if (__ITER % 10 === 0) {
    const suffix = `${Date.now()}-${__VU}-${__ITER}`;
    const conducteurPayload = JSON.stringify({
      nom: 'K6',
      prenom: 'User',
      numeroPermis: `K6-${suffix}`,
      statut: 'actif',
    });

    const createConducteurResponse = http.post(
      `${CONDUCTEUR_URL}/conducteurs`,
      conducteurPayload,
      {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        tags: { name: 'conducteur_create' },
      }
    );

    check(createConducteurResponse, {
      'POST /conducteurs status 201': (r) => r.status === 201,
    });
  }

  sleep(1);
}
