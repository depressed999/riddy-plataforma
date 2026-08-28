import assert from 'node:assert/strict';
import test from 'node:test';

import { getSiteUrl } from './site-url.ts';

test('normaliza a URL pública do site', () => {
  assert.equal(
    getSiteUrl('https://riddy.example.com/'),
    'https://riddy.example.com',
  );
});

test('usa localhost quando a URL não foi configurada', () => {
  assert.equal(getSiteUrl(), 'http://localhost:3000');
});

test('rejeita protocolos e caminhos inválidos', () => {
  assert.throws(() => getSiteUrl('javascript:alert(1)'));
  assert.throws(() => getSiteUrl('https://riddy.example.com/app'));
});
