const localSiteUrl = 'http://localhost:3000';

export function getSiteUrl(value?: string): string {
  const candidate = value?.trim() || localSiteUrl;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new Error('NEXT_PUBLIC_SITE_URL deve ser uma URL válida.');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('NEXT_PUBLIC_SITE_URL deve usar HTTP ou HTTPS.');
  }
  if (parsed.origin !== candidate.replace(/\/$/, '')) {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL deve conter apenas a origem do site.',
    );
  }
  return parsed.origin;
}

export function configuredSiteUrl(): string {
  return getSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}
