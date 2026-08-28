# Fundação arquitetural

A Riddy começa como um monorepo pnpm organizado em dois aplicativos independentes:

- `apps/web`: Next.js com App Router, Tailwind CSS e configuração shadcn/ui;
- `apps/api`: NestJS sobre Fastify, API REST prefixada por `/api/v1` e OpenAPI.

O Turborepo coordena desenvolvimento e validações sem acoplar os processos. A comunicação inicial acontece no servidor do Next.js por `GET /api/v1/health`.

## Decisões da etapa 1

- O backend permanece independente do frontend; Server Actions não substituem a API.
- A API lê configuração por ambiente e aceita origens CORS explícitas.
- Os tokens visuais vieram do `DESIGN.md`: ciano como ação, superfícies neutras, bordas slate, Geist em títulos e Inter em corpo.
- PostgreSQL, PostGIS, Drizzle, Redis e integrações externas ficam para as etapas correspondentes.
