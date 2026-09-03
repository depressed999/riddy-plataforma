# Autenticação

A Etapa 8 adiciona autenticação própria na API NestJS e telas públicas no Next.js. O domínio cobre cadastro, login, logout, recuperação de senha, Google OAuth, sessão e guards, sem antecipar o perfil da Etapa 9.

## Arquitetura da sessão

A API gera um token opaco aleatório, armazena apenas seu hash SHA-256 em `auth_sessions` e envia o valor original em um cookie `riddy_session`. O cookie é HttpOnly, SameSite Lax, restrito ao caminho raiz e recebe a flag Secure em produção. O navegador não grava tokens em `localStorage`.

No navegador, todas as chamadas usam `/api/v1/...` na própria origem do Web. O rewrite do Next.js encaminha essas requisições para a origem configurada em `API_URL`. Isso mantém o cookie como first-party mesmo quando Web e API são publicados em serviços ou subdomínios diferentes, evitando perda de sessão por políticas de cookies entre sites.

As sessões são verificadas no banco pelo `SessionAuthGuard`, podem ser revogadas no logout e são todas removidas após uma redefinição de senha. O endpoint protegido `GET /api/v1/auth/me` demonstra o uso do guard e retorna somente o DTO público do usuário.

## Endpoints

- `POST /api/v1/auth/register`;
- `POST /api/v1/auth/login`;
- `GET /api/v1/auth/me`;
- `POST /api/v1/auth/logout`;
- `POST /api/v1/auth/recovery/request`;
- `POST /api/v1/auth/recovery/confirm`;
- `GET /api/v1/auth/google`;
- `GET /api/v1/auth/google/callback`.

Cadastro e login recebem limites específicos de tentativas. Requisições mutáveis originadas no navegador passam pelo `TrustedOriginGuard`, que compara `Origin` com `CORS_ORIGIN`. Mensagens de recuperação são deliberadamente genéricas para não confirmar se um e-mail está cadastrado.

## Senhas e recuperação

Senhas são derivadas com `scrypt`, salt aleatório e comparação resistente a timing attacks. A política atual exige pelo menos oito caracteres, uma letra, um número e um símbolo.

O token de recuperação expira por padrão em 30 minutos e só pode ser usado uma vez. `AUTH_RESET_WEBHOOK_URL` pode apontar para o serviço de entrega de e-mail; um job BullMQ durável envia JSON com `email` e `resetUrl`, com retentativas exponenciais. O segredo opcional é enviado como Bearer por `AUTH_RESET_WEBHOOK_SECRET`.

Para testes locais, `AUTH_EXPOSE_RESET_TOKEN=true` devolve um link de desenvolvimento na interface. Essa opção é desativada por padrão e sempre ignorada em produção.

## Google OAuth

O fluxo usa Authorization Code, `state` e PKCE. Para habilitá-lo:

1. configure `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`;
2. registre `GOOGLE_REDIRECT_URI` no console Google usando a origem do Web e o caminho `/api/v1/auth/google/callback` (por exemplo, `https://app.example.com/api/v1/auth/google/callback`);
3. defina `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` no Web;
4. mantenha `WEB_URL` apontando para a origem pública do frontend.

Sem credenciais, o endpoint responde `503` e o botão permanece desabilitado. Nenhum segredo Google é enviado ao frontend.

## Rotas da interface

- `/entrar`;
- `/cadastro`;
- `/recuperar-senha`;
- `/redefinir-senha?token=...`.

O Header consulta a sessão ativa, apresenta o primeiro nome do usuário e permite logout. Perfil, documentos e demais dados pessoais permanecem para a Etapa 9.
