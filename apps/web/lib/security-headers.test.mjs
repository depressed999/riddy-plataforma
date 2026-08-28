import assert from 'node:assert/strict';
import test from 'node:test';

import { createSecurityHeaders } from './security-headers.ts';

test('a política restringe framing e inclui as integrações configuradas', () => {
  const headers = createSecurityHeaders({
    apiUrl: 'https://api.riddy.example.com/v1',
    development: false,
    storageOrigin: 'https://storage.riddy.example.com/private',
  });
  const csp = headers.find(
    (header) => header.key === 'Content-Security-Policy',
  );

  assert.match(csp.value, /frame-ancestors 'none'/);
  assert.match(csp.value, /https:\/\/api\.riddy\.example\.com/);
  assert.match(csp.value, /https:\/\/storage\.riddy\.example\.com/);
  assert.match(csp.value, /upgrade-insecure-requests/);
  assert.doesNotMatch(csp.value, /unsafe-eval/);
});

test('unsafe-eval fica restrito ao desenvolvimento', () => {
  const headers = createSecurityHeaders({ development: true });
  assert.match(headers[0].value, /unsafe-eval/);
});
