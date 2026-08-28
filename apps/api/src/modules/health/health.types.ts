export type HealthStatus = {
  dependencies: {
    postgres: HealthDependency;
    redis: HealthDependency;
  };
  service: 'riddy-api';
  status: 'degraded' | 'ok';
  timestamp: string;
  uptimeSeconds: number;
  version: string;
};

export type LivenessStatus = Omit<HealthStatus, 'dependencies' | 'status'> & {
  status: 'ok';
};

export type HealthDependency = {
  latencyMs: number;
  status: 'error' | 'ok';
};
