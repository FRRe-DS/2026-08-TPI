import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://api-k6:8089';
const JWKS_MOCK_URL = __ENV.JWKS_MOCK_URL || 'http://jwks-mock:8080';
const VUS = parseInt(__ENV.K6_VUS || '10', 10);
const DURATION = __ENV.K6_DURATION || '15s';

let vuToken = null;

function generarUuidV4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function obtenerTokenCliente(clienteId) {
  if (!vuToken) {
    const res = http.get(`${JWKS_MOCK_URL}/token?sub=${encodeURIComponent(clienteId)}&roles=CLIENTE`);
    if (res.status === 200) {
      vuToken = res.json('token');
    }
  }
  return vuToken;
}

export const options = {
  vus: VUS,
  duration: DURATION,
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const clienteId = `cliente-k6-${__VU}`;
  const token = obtenerTokenCliente(clienteId);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // 1. Healthcheck
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health 200': (r) => r.status === 200,
  });

  // 2. Crear reserva
  const fechaFutura = new Date(Date.now() + 4 * 3600 * 1000).toISOString();
  const payloadCrear = JSON.stringify({
    claveIdempotencia: generarUuidV4(),
    clienteId,
    origen: {
      direccion: 'Av. Sarmiento 1500',
      latitud: -27.4606,
      longitud: -58.9839,
    },
    destino: {
      direccion: 'Av. 25 de Mayo 800',
      latitud: -27.4512,
      longitud: -58.9867,
    },
    tipoVehiculo: 'AUTO',
    fechaHora: fechaFutura,
    zonaHoraria: 'America/Argentina/Buenos_Aires',
  });

  const createRes = http.post(`${BASE_URL}/reservas`, payloadCrear, { headers });
  const createdOk = check(createRes, {
    'crear reserva 201': (r) => r.status === 201,
    'devuelve reserva.id': (r) => Boolean(r.json('reserva.id')),
  });

  if (createdOk) {
    const reservaId = createRes.json('reserva.id');

    // 3. Consultar detalle de la reserva
    const getRes = http.get(`${BASE_URL}/reservas/${reservaId}`, { headers });
    check(getRes, {
      'consultar reserva 200': (r) => r.status === 200,
    });

    // 4. Cancelar reserva para cerrar ciclo de vida
    const cancelRes = http.post(
      `${BASE_URL}/reservas/${reservaId}/cancelar`,
      JSON.stringify({ motivo: 'Prueba de carga local k6' }),
      { headers }
    );
    check(cancelRes, {
      'cancelar reserva 200': (r) => r.status === 200,
    });
  }

  sleep(0.5);
}
