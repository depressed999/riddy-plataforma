import {
  createOpaqueToken,
  createPkceChallenge,
  hashOpaqueToken,
  hashPassword,
  verifyPassword,
} from './auth.crypto';

describe('auth crypto', () => {
  it('hashes and verifies a password without storing the original value', async () => {
    const password = 'Riddy@2026';
    const passwordHash = await hashPassword(password);

    expect(passwordHash).not.toContain(password);
    await expect(verifyPassword(password, passwordHash)).resolves.toBe(true);
    await expect(verifyPassword('SenhaErrada@1', passwordHash)).resolves.toBe(
      false,
    );
  });

  it('creates opaque tokens and deterministic SHA-256 hashes', () => {
    const token = createOpaqueToken();

    expect(token).toHaveLength(43);
    expect(hashOpaqueToken(token)).toHaveLength(64);
    expect(createPkceChallenge(token)).toHaveLength(43);
  });
});
