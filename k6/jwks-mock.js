const http = require('node:http');
const crypto = require('node:crypto');

const PORT = parseInt(process.env.PORT || '8080', 10);
const ISSUER = process.env.KEYCLOAK_ISSUER || 'http://localhost:8080/realms/ds-2026-realm';
const AUDIENCE = process.env.KEYCLOAK_CLIENT_ID || 'grupo-08';
const KID = 'k6-mock-kid';

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

const publicJwk = publicKey.export({ format: 'jwk' });
publicJwk.kid = KID;
publicJwk.use = 'sig';
publicJwk.alg = 'RS256';

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(sub, roles) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: KID }));
  const payload = base64Url(
    JSON.stringify({
      iss: ISSUER,
      aud: AUDIENCE,
      sub,
      roles,
      iat: now,
      exp: now + 86400,
    })
  );
  const data = `${header}.${payload}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(data), privateKey);
  return `${data}.${base64Url(signature)}`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (url.pathname.endsWith('/certs')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ keys: [publicJwk] }));
    return;
  }

  if (url.pathname === '/token') {
    const sub = url.searchParams.get('sub') || 'cliente-k6-1';
    const rolesParam = url.searchParams.get('roles') || 'CLIENTE';
    const roles = rolesParam.split(',').map((r) => r.trim()).filter(Boolean);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ token: signJwt(sub, roles) }));
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`JWKS mock escuchando en puerto ${PORT}`);
});
