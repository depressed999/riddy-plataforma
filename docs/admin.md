# Administração

A Etapa 16 adiciona um backoffice separado em `/admin`, protegido no frontend e, de forma autoritativa, na API. Somente usuários com `role = 'admin'` acessam os endpoints administrativos.

## Módulos

- Visão geral com indicadores de usuários, veículos, reservas, pagamentos, KYC e mensagens.
- Usuários com busca, filtro, alteração de função, suspensão e reativação.
- Veículos com busca, filtro e moderação de status.
- Reservas e pagamentos para acompanhamento operacional somente leitura.
- Fila KYC usando o fluxo privado já existente.
- Auditoria das mudanças administrativas com autor, alvo, motivo, estado anterior e novo estado.

O painel mostra apenas contagens de conversas e mensagens. Administradores não recebem acesso implícito ao conteúdo privado das conversas.

## Segurança

- `SessionAuthGuard` autentica a sessão e `AdminGuard` exige o papel administrativo.
- Alterações exigem origem confiável e motivo entre 10 e 500 caracteres.
- O administrador não pode suspender, reativar ou alterar a função da própria conta.
- Suspender uma conta revoga todas as suas sessões imediatamente.
- Contas suspensas não entram por senha, Google OAuth ou sessão antiga e não recebem link de recuperação.
- A ativação administrativa de veículo exige anfitrião ativo e KYC aprovado.
- Reservas e pagamentos não possuem mutações genéricas no admin; decisões financeiras continuam nos fluxos específicos já auditáveis.

## Endpoints

Todos usam o prefixo `/api/v1/admin`:

- `GET /dashboard`
- `GET /users`
- `PATCH /users/{id}/role`
- `PATCH /users/{id}/status`
- `GET /vehicles`
- `PATCH /vehicles/{id}/status`
- `GET /bookings`
- `GET /payments`
- `GET /audit`

As listagens aceitam `page`, `pageSize`, `query` e, quando aplicável, `status`.

## Desenvolvimento local

O seed cria somente para desenvolvimento:

- e-mail: `admin.demo@riddy.local`
- senha: `RiddyAdmin@2026`

O seed é bloqueado quando `NODE_ENV=production`. Em produção, o primeiro administrador deve ser provisionado por um procedimento operacional controlado, com credencial individual e registro externo da autorização.

## Banco de dados

A migração `0010_cool_texas_twister.sql` adiciona o status da conta, dados de suspensão e `admin_audit_events`. A trilha administrativa deve fazer parte da política de retenção, backup e monitoração do ambiente produtivo.
