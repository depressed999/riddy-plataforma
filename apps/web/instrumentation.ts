import type { Instrumentation } from 'next';

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const message = error instanceof Error ? error.message : String(error);
  const digest =
    typeof error === 'object' && error !== null && 'digest' in error
      ? String(error.digest)
      : undefined;
  console.error(
    JSON.stringify({
      context: {
        renderSource: context.renderSource,
        routePath: context.routePath,
        routeType: context.routeType,
      },
      digest,
      level: 'error',
      message,
      request: { method: request.method, path: request.path },
      service: 'riddy-web',
    }),
  );
};
