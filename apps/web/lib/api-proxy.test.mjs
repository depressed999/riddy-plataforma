import assert from 'node:assert/strict';
import test from 'node:test';

import { createApiProxyDestination } from './api-proxy.ts';

test('cria o destino do proxy com a origem configurada', () => {
  assert.equal(
    createApiProxyDestination('https://riddy-api.example.com'),
    'https://riddy-api.example.com/api/v1/:path*',
  );
});

test('aceita barra final e usa a API local por padrão', () => {
  assert.equal(
    createApiProxyDestination('https://riddy-api.example.com/'),
    'https://riddy-api.example.com/api/v1/:path*',
  );
  assert.equal(
    createApiProxyDestination(),
    'http://localhost:4000/api/v1/:path*',
  );
});

test('recusa protocolo ou caminho inválido', () => {
  assert.throws(
    () => createApiProxyDestination('ftp://riddy-api.example.com'),
    /HTTP ou HTTPS/,
  );
  assert.throws(
    () => createApiProxyDestination('https://riddy-api.example.com/base'),
    /apenas a origem/,
  );
});
