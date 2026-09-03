const localApiUrl = 'http://localhost:4000';

export function createApiProxyDestination(apiUrl?: string): string {
  const configuredUrl = apiUrl?.trim() || localApiUrl;
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(configuredUrl);
  } catch {
    throw new Error(`API_URL deve ser uma URL válida: ${configuredUrl}.`);
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('API_URL deve usar HTTP ou HTTPS.');
  }

  if (
    parsedUrl.origin !== configuredUrl.replace(/\/$/, '') ||
    parsedUrl.pathname !== '/'
  ) {
    throw new Error('API_URL deve conter apenas a origem da API.');
  }

  return `${parsedUrl.origin}/api/v1/:path*`;
}
