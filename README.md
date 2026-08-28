# Riddy

Fundação da plataforma P2P de aluguel de carros e motocicletas.

## Requisitos

- Node.js 22.12 ou superior
- pnpm 11
- Docker Desktop

## Início rápido

1. Copie `.env.example` para `.env`.
2. Instale as dependências com `pnpm install`.
3. Inicie banco, storage privado e Redis com `pnpm infra:up`.
4. Aplique as migrações com `pnpm db:migrate`.
5. Carregue os dados fictícios com `pnpm db:seed`.
6. Inicie frontend e API com `pnpm dev`.

O seed local também cria a anfitriã `anfitriao.demo@riddy.local` (`RiddyDemo@2026`) e o administrador `admin.demo@riddy.local` (`RiddyAdmin@2026`) para testes. O comando de seed é bloqueado em produção.

Por padrão:

- Web: `http://localhost:3000`
- PostgreSQL/PostGIS: `localhost:5433`
- API health: `http://localhost:4000/api/v1/health`
- API liveness: `http://localhost:4000/api/v1/health/live`
- API readiness: `http://localhost:4000/api/v1/health/ready`
- API veículos: `http://localhost:4000/api/v1/vehicles`
- Marketplace: `http://localhost:3000/buscar`
- Detalhes de um veículo: `http://localhost:3000/veiculos/{id}`
- Entrar: `http://localhost:3000/entrar`
- Criar conta: `http://localhost:3000/cadastro`
- Recuperar senha: `http://localhost:3000/recuperar-senha`
- Perfil autenticado: `http://localhost:3000/perfil`
- Documentos e KYC: `http://localhost:3000/perfil/documentos`
- Fila de análise KYC: `http://localhost:3000/verificacoes/kyc`
- Área do anfitrião: `http://localhost:3000/anfitriao`
- Mensagens: `http://localhost:3000/mensagens`
- Administração: `http://localhost:3000/admin`
- Minhas reservas: `http://localhost:3000/reservas`
- Checkout: `http://localhost:3000/checkout?vehicleId={id}&pickupDate=AAAA-MM-DD&returnDate=AAAA-MM-DD`
- Pagamento: `http://localhost:3000/pagamentos/{bookingId}`
- OpenAPI: `http://localhost:4000/api/v1/docs`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`
- Redis: `localhost:6379`

## Comandos

| Comando             | Função                                       |
| ------------------- | -------------------------------------------- |
| `pnpm dev`          | Inicia Web e API em modo de desenvolvimento  |
| `pnpm dev:worker`   | Inicia somente o worker BullMQ em modo watch |
| `pnpm start:worker` | Inicia o build do worker BullMQ              |
| `pnpm build`        | Gera os builds de produção                   |
| `pnpm lint`         | Executa ESLint em todos os apps              |
| `pnpm typecheck`    | Valida TypeScript strict                     |
| `pnpm test`         | Executa os testes disponíveis                |
| `pnpm format:check` | Verifica a formatação                        |
| `pnpm db:up`        | Inicia PostgreSQL/PostGIS                    |
| `pnpm storage:up`   | Inicia o storage privado MinIO               |
| `pnpm redis:up`     | Inicia o Redis                               |
| `pnpm infra:up`     | Inicia PostgreSQL/PostGIS, MinIO e Redis     |
| `pnpm db:migrate`   | Aplica as migrações pendentes                |
| `pnpm db:seed`      | Carrega dados fictícios de desenvolvimento   |
| `pnpm db:check`     | Valida os arquivos de migração               |
| `pnpm db:down`      | Encerra os contêineres locais                |

## Estrutura

```text
apps/
  api/                 NestJS + Fastify
  web/                 Next.js + Tailwind + shadcn/ui
packages/
  config/              Presets TypeScript
  eslint-config/       Presets ESLint
docs/
  architecture.md      Decisões da fundação
  database.md          Banco, migrações e módulo Vehicles
  marketplace.md       Catálogo, filtros e parâmetros de busca
  vehicle-details.md   Página pública de detalhes e estimativa de reserva
  authentication.md    Sessões, credenciais, OAuth e recuperação
  profile.md           Perfil básico do usuário autenticado
  bookings.md          Disponibilidade, preço e ciclo básico da reserva
  checkout.md          Revisão autenticada e confirmação sem cobrança
  payments.md          Mercado Pago, cartão, Pix, webhook e estornos
  kyc.md               Documentos privados, uploads e análise KYC
  hosts.md             Perfil, veículos, agenda e financeiro do anfitrião
  messages.md          Conversas privadas vinculadas às reservas
  admin.md             Backoffice, papéis, suspensão e auditoria
  jobs-and-redis.md    Cache, throttling distribuído, filas e workers
  hardening.md         Segurança, observabilidade, CI e checklist produtivo
```

## Estado atual

As etapas concluídas são:

- **Etapa 1 — Fundação**;
- **Etapa 2 — Design System**;
- **Etapa 3 — Layout Público**;
- **Etapa 4 — Home**;
- **Etapa 5 — Banco de Dados e Vehicles**;
- **Etapa 6 — Marketplace**;
- **Etapa 7 — Detalhes do Veículo**;
- **Etapa 8 — Autenticação**;
- **Etapa 9 — Perfil**;
- **Etapa 10 — Reservas**;
- **Etapa 11 — Checkout**;
- **Etapa 12 — Mercado Pago**;
- **Etapa 13 — KYC e Documentos**;
- **Etapa 14 — Área do Anfitrião**;
- **Etapa 15 — Mensagens**;
- **Etapa 16 — Admin**;
- **Etapa 17 — Jobs e Redis**.
- **Etapa 18 — Hardening**.

A biblioteca visual pode ser acessada em `http://localhost:3000/design-system` durante o desenvolvimento. A Home pública possui Hero, busca integrada ao catálogo, veículos reais em destaque, funcionamento, confiança e CTA para proprietários. O Marketplace inclui catálogo responsivo, busca, filtros, ordenação, paginação e URLs compartilháveis. Cada card leva a uma página pública com galeria, informações, características, comodidades, anfitrião, localização aproximada e consulta de datas. A autenticação oferece cadastro, login, logout, recuperação, sessão revogável e integração Google configurável por ambiente. O usuário autenticado pode editar o perfil, revisar veículo, período, preço e dados pessoais no checkout, pagar por cartão ou Pix via Mercado Pago, acompanhar status e solicitar cancelamento ou reembolso integral. O fluxo KYC usa storage privado, uploads e visualizações por URLs temporárias, validação de conteúdo, auditoria e fila restrita para decisão. A área do anfitrião reúne onboarding, cadastro e publicação de veículos, reservas recebidas, bloqueios de calendário, indicadores financeiros brutos e configurações. Locatário e anfitrião podem conversar em um histórico privado vinculado à reserva, com mensagens não lidas e atualização periódica. O backoffice administrativo reúne indicadores, usuários, veículos, reservas, pagamentos, KYC e auditoria, com suspensão de conta e revogação imediata de sessões. Redis compartilha cache e limitação de requisições entre instâncias, enquanto BullMQ processa recuperação de senha e limpeza periódica de autenticação. A Etapa 18 adicionou headers de segurança, rastreabilidade, health checks completos, SEO, acessibilidade, testes do Web e CI. As 18 etapas do plano estão concluídas; a publicação depende do checklist operacional de `docs/hardening.md`. Mapas interativos ainda não fazem parte do projeto.
