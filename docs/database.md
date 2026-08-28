# Banco de dados e Vehicles

A etapa 5 introduz o PostgreSQL 17 com PostGIS para persistência e o Drizzle ORM para schema, consultas e migrações versionadas.

## Ambiente local

O serviço `postgres` é definido em `compose.yaml` e exposto na porta `5433`. Essa porta evita conflito com instalações locais que normalmente usam `5432`.

Fluxo recomendado:

```bash
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

O seed é exclusivo para desenvolvimento, pode ser repetido sem duplicar registros e cria oito veículos fictícios para exercitar catálogo, filtros e paginação.

## Modelo inicial

- `vehicles`: dados do veículo, diária, comodidades, status e ponto geográfico;
- `vehicle_images`: referências ordenadas das imagens e indicação da capa;
- `users`: identidade, credenciais, verificação de e-mail e campos básicos de perfil;
- `oauth_accounts`: vínculos entre usuário e provedor social;
- `auth_sessions`: sessões revogáveis identificadas por hash do token;
- `password_reset_tokens`: tokens descartáveis e expirantes de recuperação;
- `bookings`: períodos, preço congelado, locatário e status das reservas;
- `vehicle_type`: `car` ou `motorcycle`;
- `vehicle_status`: `draft`, `active`, `inactive` ou `maintenance`.

As coordenadas seguem a convenção WGS 84: longitude no eixo X e latitude no eixo Y. A localização possui índice espacial GiST para as futuras buscas por proximidade.

`owner_id` já está preparado no modelo, mas permanece sem chave estrangeira até a criação do domínio de usuários em uma etapa posterior.

## API

Os endpoints públicos retornam somente veículos com status `active`:

- `GET /api/v1/vehicles`, com busca, filtros, ordenação e paginação;
- `GET /api/v1/vehicles/:id`.

Um identificador inexistente, inativo ou em formato inválido não expõe nenhum registro privado. A documentação interativa continua disponível em `/api/v1/docs`.

## Migrações

O schema principal fica em `apps/api/src/database/schema`. A migração inicial habilita o PostGIS antes de criar as tabelas e fica versionada em `apps/api/drizzle`.

Ao alterar o schema:

```bash
pnpm db:generate
pnpm db:check
pnpm db:migrate
```

A migração incremental `0001_pale_saracen.sql` acrescenta `amenities` como uma lista de texto não nula. O seed atualiza essa lista mesmo quando os veículos já existem, preservando a repetibilidade do ambiente de desenvolvimento.

A migração `0002_petite_quentin_quire.sql` cria as quatro tabelas de autenticação, suas chaves estrangeiras e índices. Tokens de sessão e recuperação nunca são persistidos em texto puro: somente o hash SHA-256 é armazenado.

A migração `0003_lean_songbird.sql` acrescenta telefone, biografia, cidade e estado ao usuário. Todos são opcionais; validação e normalização acontecem no módulo de perfil antes da persistência.

A migração `0004_funny_the_anarchist.sql` cria o enum e a tabela de reservas. Ela também habilita `btree_gist` e adiciona uma restrição de exclusão por veículo e intervalo de datas para impedir sobreposição entre reservas pendentes ou confirmadas.
