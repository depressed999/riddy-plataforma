# Checkpoint concluído — Etapa 1 (Fundação)

Pausa solicitada e retomada em 24/08/2026. A Etapa 1 foi concluída.

## Concluído até aqui

- `DESIGN.md` localizado e lido integralmente.
- Tokens principais identificados: ciano `#00FFFF`, superfícies neutras, bordas slate, Geist + Inter e raios discretos.
- Monorepo pnpm/Turborepo criado.
- App Web Next.js criado com App Router, Tailwind CSS, configuração shadcn/ui e página inicial mínima.
- App API NestJS/Fastify criado com prefixo `/api/v1`, Swagger e módulo de health.
- Comunicação Web → `GET /api/v1/health` implementada no código.
- Configurações de TypeScript strict, ESLint, Prettier, ambiente, documentação e teste unitário inicial criadas.
- Lockfile gerado e pacotes baixados/vinculados.

## Ponto que foi retomado

A instalação havia terminado de vincular os pacotes, mas o pnpm bloqueou scripts de build. A retomada configurou `allowBuilds` de forma restrita: telemetria bloqueada e somente os scripts necessários autorizados.

## Validações concluídas

- Instalação pnpm: concluída.
- Prettier: aprovado.
- ESLint: aprovado sem avisos.
- TypeScript strict: aprovado.
- Teste unitário da API: 1 aprovado.
- Build Next.js e NestJS: aprovado.
- `GET /api/v1/health`: HTTP 200 e status `ok`.
- Swagger `/api/v1/docs`: HTTP 200.
- Web `/`: HTTP 200 e estado “API conectada” renderizado.
- Servidores temporários: encerrados após a verificação.

## Próxima etapa prevista

Etapa 2 — Design System. Não iniciada automaticamente.

## Escopo ainda não iniciado

Banco de dados, autenticação, marketplace, veículos, reservas, pagamentos, KYC, mapas, chat e admin.

---

# Retomada concluída — Etapa 2

Pausa solicitada em 24/08/2026 durante a implementação visual. A Etapa 2 foi retomada e concluída em 25/08/2026.

## Concluído desde a última retomada

- Material visual da Home e `DESIGN.md` relidos.
- Imagens originais dos três veículos de referência baixadas para `apps/web/public/vehicles/` e conferidas.
- Dependências Radix instaladas para componentes acessíveis.
- Componentes iniciais do design system criados:
  - Button;
  - Input;
  - Select;
  - Badge;
  - Card;
  - Dialog;
  - Sheet;
  - DropdownMenu;
  - Skeleton;
  - Alert;
  - EmptyState;
  - PageHeader.

## Resultado da retomada

A biblioteca foi formatada, corrigida e reunida em uma página interna de demonstração em `/design-system`. Foram adicionados estados de foco, erro, carregamento, sucesso, alerta e componentes acessíveis baseados em Radix.

## Próxima etapa prevista

Etapa 3 — Layout Público: Header, navegação desktop, menu móvel, Footer, containers e estrutura pública. Não iniciada automaticamente.

---

# Etapa 3 concluída — Layout Público

Concluída em 25/08/2026.

## Implementado

- Route group público em `app/(public)`.
- Header com identidade Riddy.
- Navegação desktop.
- Menu móvel acessível em Sheet.
- Ações estruturais de entrada e cadastro.
- Link para saltar ao conteúdo principal.
- Container fluido com largura máxima de 1440px.
- Footer institucional responsivo.
- Página do Design System mantida fora do layout público.

## Validações

- Prettier: aprovado.
- ESLint: aprovado.
- TypeScript strict e tipos de rotas: aprovados.
- Testes existentes: aprovados.
- Build Next.js e NestJS: aprovado.
- Rota `/`: HTTP 200.
- Rota `/design-system`: HTTP 200.

## Próxima etapa prevista

Etapa 4 — Home: Hero, busca, veículos em destaque, como funciona, confiança, CTA e Footer. Não iniciada automaticamente.

---

# Etapa 4 concluída — Home

Concluída em 25/08/2026.

## Implementado

- Hero baseado no material visual fornecido.
- Busca local por localização e data, com validação e feedback acessível.
- Indicadores de confiança.
- Veículos em destaque com as três imagens originais do material.
- Cards responsivos e prévia de detalhes em Dialog.
- Seção “Como funciona”.
- Bloco de confiança e transparência.
- CTA para proprietários com demonstração local sem persistência.
- Conteúdo fictício isolado em `features/home`.

## Validações

- Prettier: aprovado.
- ESLint: aprovado.
- TypeScript strict e tipos de rotas: aprovados.
- Testes existentes: aprovados.
- Build Next.js e NestJS: aprovado.
- Home `/`: HTTP 200.
- Design System `/design-system`: HTTP 200.
- Imagens locais de veículos: HTTP 200.

## Próxima etapa prevista

Etapa 5 — Banco e domínio de veículos: PostgreSQL, PostGIS, Drizzle, migrations e módulo Vehicles. Não iniciada automaticamente.

---

# Etapa 5 concluída — Banco de Dados e Vehicles

Concluída em 25/08/2026.

## Implementado

- PostgreSQL 17 com PostGIS em ambiente Docker Compose.
- Porta local `5433` para não conflitar com o PostgreSQL já instalado na máquina.
- Drizzle ORM, Drizzle Kit e driver `postgres` integrados à API.
- Schema e migração versionada de `vehicles` e `vehicle_images`.
- Ponto geográfico e índice espacial GiST para localização.
- Status de ciclo de vida e tipos de veículo modelados como enums.
- Seed idempotente com três veículos fictícios e respectivas imagens.
- Módulo NestJS Vehicles com repository, service, controller e DTOs OpenAPI.
- Endpoints públicos de listagem e detalhe somente para veículos ativos.
- Testes unitários do serviço de veículos.
- Instruções de banco e comandos de operação documentados.

## Validações

- Migração aplicada e registrada com sucesso.
- PostGIS ativo e três coordenadas consultadas no banco.
- API temporária: health HTTP 200, lista com três veículos e detalhe HTTP 200.
- Veículo inexistente: HTTP 404; identificador inválido: HTTP 400.
- OpenAPI: HTTP 200.
- Prettier, ESLint, TypeScript strict, testes e builds: aprovados.

## Estado do ambiente

- O contêiner PostgreSQL/PostGIS do Riddy permanece ativo na porta `5433`.
- Uma instância antiga da API já estava ativa na porta `4000`; ela precisa ser reiniciada para ler a nova configuração do banco.

## Próxima etapa prevista

Etapa 6 — Marketplace. Não iniciada automaticamente.

---

# Etapa 6 concluída — Marketplace

Concluída em 25/08/2026.

## Implementado

- Catálogo público em `/buscar` conectado à API real.
- Busca por marca, modelo, descrição, cidade ou estado.
- Filtros por tipo, câmbio, combustível, lugares e faixa de preço.
- Ordenação por data e valor da diária.
- Paginação com seis veículos por página.
- Estado completo sincronizado em parâmetros da URL.
- Filtros laterais no desktop e gaveta inferior no mobile.
- Cards reais com imagem, características, localização, preço e prévia.
- Home integrada ao Marketplace e destaques carregados da API.
- Seed ampliado para oito veículos sem duplicação.
- Resposta paginada e validada no endpoint `GET /api/v1/vehicles`.

## Validações

- API: oito veículos, duas páginas, filtros e ordenação aprovados.
- Faixa de preço invertida: HTTP 400.
- Home → Marketplace com localização e data: aprovado.
- URL limpa e compartilhável após aplicar filtros: aprovado.
- Desktop e viewport móvel de 390 × 844 verificados visualmente.
- Gaveta de filtros, ordenação, paginação e prévia interativa testadas.
- Nenhum erro ou aviso no console durante os testes.
- Prettier, ESLint, TypeScript strict, testes e builds: aprovados.

## Estado do ambiente

- PostgreSQL/PostGIS permanece saudável na porta `5433`.
- As instâncias temporárias usadas nas portas `3010` e `4010` devem ser encerradas após a validação.
- A instância antiga da API na porta `4000` precisa ser reiniciada para carregar o contrato paginado atual.

## Próxima etapa prevista

Etapa 7 — Detalhes do Veículo. Não iniciada automaticamente.

---

# Etapa 7 concluída — Detalhes do Veículo

Concluída em 25/08/2026.

## Implementado

- Rota pública dinâmica `/veiculos/[id]` conectada ao endpoint real de detalhe.
- Navegação dos cards do Marketplace para a página completa do veículo.
- Galeria responsiva preparada para uma ou várias imagens, com fallback neutro quando não houver foto.
- Informações gerais, características técnicas e comodidades vindas do banco.
- Blocos de anfitrião e avaliações com estados honestos, sem criar identidade, nota ou depoimento fictício.
- Localização aproximada sem exposição de endereço exato.
- Painel responsivo de reserva com seleção de datas, validação e cálculo local do valor estimado.
- Página específica para veículo inexistente.
- Migração incremental para a coluna `amenities` e seed idempotente atualizado.

## Validações

- Migração e seed aplicados com sucesso.
- API de detalhe validada com veículo existente e identificador inexistente.
- Navegação Marketplace → detalhe aprovada.
- Layout desktop e móvel verificados, sem rolagem horizontal no viewport móvel.
- Carregamento de imagem, fallback e página de veículo inexistente conferidos.
- Nenhum erro ou aviso no console durante a verificação visual.
- Prettier, ESLint, TypeScript strict, testes e builds aprovados.

## Limites mantidos nesta etapa

- O painel apenas estima o preço; ele não cria reserva nem realiza cobrança.
- Não foram inventadas avaliações ou informações pessoais de anfitriões.
- Mapa interativo e endereço exato permanecem fora do escopo.

## Próxima etapa prevista

Etapa 8 — Autenticação. Não iniciada automaticamente.

---

# Etapa 8 concluída — Autenticação

Concluída em 25/08/2026.

## Implementado

- Cadastro e login com e-mail e senha.
- Hash de senha com `scrypt` e salt aleatório.
- Sessões opacas e revogáveis armazenadas no PostgreSQL.
- Cookie HttpOnly, SameSite Lax e Secure em produção.
- Endpoint protegido e `SessionAuthGuard` reutilizável.
- Logout com remoção da sessão no banco e no navegador.
- Recuperação de senha com token expirante, descartável e armazenado somente como hash.
- Revogação de todas as sessões após alteração de senha.
- Google OAuth com Authorization Code, `state` e PKCE, ativado por configuração.
- Rate limiting global e limites mais restritos nos endpoints sensíveis.
- Proteção de origem para requisições mutáveis do navegador.
- Páginas responsivas de entrar, cadastro, recuperação e redefinição.
- Header integrado ao estado real da sessão.

## Validações

- Migração de usuários, contas OAuth, sessões e tokens aplicada com sucesso.
- Cadastro, sessão, logout e login validados no navegador.
- Recuperação completa validada: token único, nova senha aceita e senha anterior rejeitada.
- Endpoint protegido sem sessão: HTTP 401.
- Origem não confiável: HTTP 403.
- Google sem credenciais: HTTP 503 e botão desabilitado de forma explícita.
- Treze testes unitários aprovados.
- Layout móvel verificado sem rolagem horizontal.

## Limites mantidos nesta etapa

- O perfil completo do usuário não foi iniciado.
- Credenciais Google precisam ser fornecidas pelo ambiente para o OAuth real.
- A entrega de e-mail depende do webhook configurável; o token local exige opt-in de desenvolvimento.

## Próxima etapa prevista

Etapa 9 — Perfil. Não iniciada automaticamente.

---

# Etapa 9 concluída — Perfil

Concluída em 25/08/2026.

## Implementado

- Rota autenticada `/perfil` com redirecionamento para login e retorno ao destino original.
- Consulta e atualização protegidas do perfil da sessão atual.
- Nome, telefone, cidade, estado e apresentação curta editáveis.
- E-mail exibido como identidade não editável.
- Normalização de telefone, estado e campos opcionais antes da persistência.
- Resumo da conta, localização, data de entrada e indicador de preenchimento.
- Acesso ao perfil pelo cabeçalho desktop e pelo menu móvel.
- Atualização imediata do nome exibido na sessão após salvar.
- Migração incremental com os campos básicos do perfil.

## Validações

- Drizzle Kit e migração: aprovados.
- Prettier, ESLint e TypeScript strict: aprovados.
- Dezessete testes unitários da API aprovados, incluindo quatro do perfil.
- Build de produção e fluxo real no navegador verificados.

## Limites mantidos nesta etapa

- O e-mail não é alterado sem um fluxo específico de reverificação.
- Upload de avatar, CPF, CNH, endereço completo, documentos e KYC não foram iniciados.
- Reservas e pagamentos permanecem fora do escopo.

## Próxima etapa prevista

Etapa 10 — Reservas. Não iniciada automaticamente.

---

# Etapa 10 concluída — Reservas

Concluída em 26/08/2026.

## Implementado

- Domínio Booking com datas, preço congelado, locatário e status.
- Status `pending`, `confirmed`, `cancelled` e `completed` modelados.
- Cotação pública de disponibilidade e preço calculado no backend.
- Criação autenticada de reservas pendentes, sem cobrança.
- Bloqueio de reservas no próprio veículo.
- Detecção de conflito por intervalos de retirada e devolução.
- Restrição GiST no PostgreSQL contra sobreposição concorrente.
- Página do veículo integrada à disponibilidade e à criação real.
- Área autenticada `/reservas` com histórico, valores e status.
- Cancelamento confirmado por diálogo e liberação imediata do período.
- Navegação desktop e móvel integrada a “Minhas reservas”.

## Validações

- Migração aplicada com sucesso.
- Disponibilidade antes da criação: aprovada.
- Reserva pendente com três diárias e preço de servidor: aprovada.
- Mesmo período indisponível após criação: aprovado.
- Listagem da reserva: aprovada.
- Cancelamento e liberação do período: aprovados.
- Layout móvel de 390 × 844 sem rolagem horizontal.
- Console do navegador sem erros ou avisos da aplicação.
- Conta e reservas temporárias de QA removidas.

## Limites mantidos nesta etapa

- Nenhum checkout ou pagamento foi integrado.
- Confirmação e conclusão não são alteradas automaticamente.
- Contrato, proteção comercial e captura de cartão permanecem fora do escopo.

## Próxima etapa prevista

Etapa 11 — Checkout. Não iniciada automaticamente.

---

# Etapa 11 concluída — Checkout

Concluída em 26/08/2026.

## Implementado

- Rota dinâmica `/checkout` com veículo e período preservados na URL.
- Validação de parâmetros antes de carregar o fluxo.
- Proteção por sessão com retorno ao mesmo checkout após o login.
- Nova cotação de preço e disponibilidade no backend durante a revisão.
- Resumo visual do veículo, período, locatário e valor total.
- Dados do próprio perfil com atalho para edição.
- Etapa de pagamento sinalizada como futura, sem coletar dados financeiros.
- Confirmação explícita obrigatória antes de criar a reserva.
- Criação integrada ao domínio Booking existente, sempre com status pendente.
- Estados de carregamento, erro, indisponibilidade e sucesso.
- Painel do veículo alterado para encaminhar ao checkout em vez de criar diretamente.

## Validações

- Redirecionamento para login preservando veículo e datas: aprovado.
- Cotação autenticada com três diárias e total calculado pelo servidor: aprovada.
- Botão bloqueado antes da confirmação explícita: aprovado.
- Criação pendente sem cobrança e tela de sucesso: aprovadas.
- Mesmo período indisponível após a criação: aprovado.
- Layout móvel de 390 × 844 sem rolagem horizontal.
- Conta e reserva temporárias de QA removidas.
- ESLint, TypeScript strict, 24 testes e builds de produção: aprovados.

## Limites mantidos nesta etapa

- Nenhum pagamento, cartão ou cobrança foi implementado.
- Mercado Pago não foi iniciado.
- A confirmação financeira da reserva continua fora do fluxo atual.

## Próxima etapa prevista

Etapa 12 — Mercado Pago. Não iniciada automaticamente.

---

# Etapa 12 concluída — Mercado Pago

Concluída em 26/08/2026.

## Implementado

- Módulo financeiro separado do checkout e do domínio Booking.
- Payment Brick oficial para cartão e Pix.
- Tokenização de cartão sem persistência de PAN, CVV ou validade na Riddy.
- Valor, e-mail e reserva obtidos pelo backend, sem confiar no navegador.
- Tentativas de pagamento com status, detalhe e identificador do provedor.
- Pix com QR Code, código Copia e Cola e link de pagamento.
- Idempotência no cliente, no banco e no header enviado ao Mercado Pago.
- Restrição no PostgreSQL contra dois pagamentos ativos na mesma reserva.
- Webhook com validação HMAC, deduplicação e consulta ao provedor.
- Confirmação automática da reserva após pagamento aprovado.
- Estados explícitos de aprovação, pendência, análise, recusa, falha, cancelamento, reembolso e contestação.
- Cancelamento de pagamentos pendentes.
- Reembolso integral de pagamentos aprovados.
- Bloqueio do cancelamento genérico de reservas com operação financeira ativa.
- Rota autenticada `/pagamentos/[bookingId]` e atalhos no checkout e em `/reservas`.

## Validações

- Migrações `0005_rapid_proteus.sql` e `0006_blue_magma.sql` aplicadas.
- Cartão aprovado e recusado: cobertos por testes automatizados.
- Pix pendente e QR Code: cobertos por testes automatizados.
- Headers REST, idempotência e falha do provedor: cobertos.
- Webhook assinado e evento repetido: cobertos.
- Cancelamento e reembolso integral: cobertos.
- Proteção por autenticação e estado sem credenciais: aprovados no navegador.
- Layout móvel de 390 × 844 sem rolagem horizontal.
- Conta e reserva temporárias de QA removidas.

## Configuração externa pendente

- Credenciais de teste do Mercado Pago não estão presentes no ambiente.
- A execução real no sandbox de cartão, Pix e webhook depende de Public Key, Access Token, segredo de webhook e URL HTTPS pública.
- Nenhuma credencial ou dado financeiro real foi criado ou armazenado.

## Próxima etapa prevista

Etapa 13 — KYC e Documentos. Não iniciada automaticamente.

---

# Etapa 13 concluída — KYC e Documentos

Concluída em 26/08/2026.

## Implementado

- Storage privado S3 compatível com MinIO no desenvolvimento.
- Bucket sem acesso público e URLs assinadas com duração curta para upload e visualização.
- Upload direto do navegador ao storage, sem transportar o arquivo pela API NestJS.
- Validação de nome, extensão, MIME, limite de 8 MB, assinatura binária, tamanho e checksum SHA-256.
- CNH frente, CNH verso e selfie obrigatórios; comprovante de residência opcional.
- Processo KYC com rascunho, análise pendente, aprovação, rejeição e reenvio.
- Metadados privados separados da resposta pública, sem exposição da chave do objeto ou checksum.
- Autorização por papéis `user`, `reviewer` e `admin` aplicada no backend.
- Fila de análise restrita com visualização temporária, aprovação e rejeição com motivo.
- Trilha de auditoria para uploads, visualizações, exclusões, submissões e decisões.
- Áreas responsivas `/perfil/documentos` e `/verificacoes/kyc` integradas ao perfil e ao cabeçalho.
- Migração `0007_dear_shockwave.sql` e documentação operacional.

## Validações

- Drizzle Kit e migração PostgreSQL: aprovados.
- Prettier, ESLint e TypeScript strict da API e do frontend: aprovados.
- Quarenta e três testes aprovados, incluindo sete específicos do serviço KYC.
- Builds de produção da API e do frontend: aprovados.
- MinIO saudável e CORS de upload direto validado.
- Upload assinado, validação, visualização assinada e exclusão validados no fluxo real.
- Proteção por sessão, área do usuário e restrição da fila de análise verificadas no navegador.
- Layout desktop e móvel de 390 × 844 sem rolagem horizontal e console sem erros.
- Conta, processo e arquivo temporários de QA removidos.

## Preparação produtiva pendente

- Credenciais, bucket e endpoint S3 reais precisam ser configurados por ambiente.
- HTTPS, criptografia gerenciada, política de retenção, backup e varredura antimalware devem ser definidos antes de documentos reais.
- Os papéis de analista devem ser provisionados por um fluxo administrativo controlado.

## Próxima etapa prevista

Etapa 14 — não iniciada automaticamente.

---

# Etapa 14 concluída — Área do Anfitrião

Concluída em 27/08/2026.

## Implementado

- Perfil de anfitrião separado da autorização administrativa da plataforma.
- Onboarding com aceite de termos e ativação vinculada à aprovação do KYC.
- Dashboard com indicadores reais de veículos, reservas e receita bruta aprovada.
- Cadastro e edição de carros e motocicletas, sempre iniciando em rascunho.
- Publicação protegida por propriedade, perfil ativo e KYC aprovado.
- Listagem das reservas recebidas com período, locatário, preço e status.
- Calendário com criação e remoção de bloqueios por veículo.
- Indisponibilidade pública integrada aos bloqueios do anfitrião.
- Restrição GiST contra bloqueios sobrepostos em concorrência.
- Resumo financeiro derivado dos pagamentos reais, sem inventar taxas ou repasses.
- Configurações de nome público, apresentação e telefone de suporte.
- Navegação responsiva própria, integrada ao cabeçalho e ao CTA da Home.
- Migração `0008_pale_living_mummy.sql` e documentação operacional.

## Validações

- Migração PostgreSQL e Drizzle Kit: aprovados.
- Oito testes específicos do serviço de anfitrião: aprovados.
- Prettier, ESLint, TypeScript strict, suíte completa e builds de produção: aprovados.
- Fluxos autenticados e layout desktop/móvel: aprovados no navegador.

## Limites mantidos nesta etapa

- Mensagens pertencem à Etapa 15 e não foram iniciadas.
- Fotos novas de veículos ainda não são enviadas pelo formulário do anfitrião.
- O financeiro não calcula taxas, saldo disponível ou repasse sem regra comercial definida.
- Uma garantia transacional cruzada entre reservas e bloqueios poderá ser reforçada para alta concorrência.

## Próxima etapa prevista

Etapa 15 — Mensagens. Não iniciada automaticamente.

---

# Etapa 15 concluída — Mensagens

Concluída em 27/08/2026.

## Implementado

- Uma conversa privada e idempotente para cada reserva.
- Participantes derivados do locatário e do proprietário do veículo.
- Autorização no backend sem acesso implícito para terceiros ou administradores.
- Mensagens de texto com limite de 2.000 caracteres e restrição no banco.
- Caixa de entrada com última mensagem, veículo e quantidade não lida.
- Histórico das 100 mensagens mais recentes em ordem cronológica.
- Marcação de leitura e confirmação “Lida” para o remetente.
- Limite específico de envio para reduzir abuso.
- Atualização REST periódica apenas enquanto a página está visível.
- Rotas responsivas `/mensagens` e `/mensagens/[id]`.
- Integração em “Minhas reservas”, “Reservas recebidas”, cabeçalho público e menu do anfitrião.
- Atalho `Ctrl + Enter` ou `Cmd + Enter` no compositor.
- Migração `0009_wooden_gunslinger.sql` e documentação técnica.
- Anfitriã autenticável no seed local para responder às conversas dos veículos de demonstração.

## Avaliação de WebSocket

- WebSocket não foi adicionado nesta etapa.
- O polling REST atende o MVP atual sem exigir conexão persistente e nova infraestrutura operacional.
- Socket.IO/WebSocket deverá ser reavaliado junto de Redis quando presença, digitação ou escala horizontal criarem necessidade concreta.

## Validações

- Migração PostgreSQL e Drizzle Kit: aprovados.
- Oito testes específicos do serviço de mensagens: aprovados.
- Fluxo real de dois participantes, leitura, resposta e idempotência: aprovado.
- Tentativa de acesso por terceira conta retornando recurso não encontrado: aprovada.
- Envio, caixa de entrada e navegação verificados no navegador sem erros de console.
- Layout móvel de 390 × 844 sem rolagem horizontal.
- Prettier, ESLint, TypeScript strict, suíte completa e builds de produção: aprovados.
- Contas, veículo, reserva, conversa e mensagens temporários de QA removidos.

## Limites mantidos nesta etapa

- Sem anexos, busca, edição, exclusão, reações ou notificações push.
- Sem presença online ou indicador de digitação.
- Sem paginação além das 100 mensagens recentes.
- Moderação e acesso excepcional do suporte não foram criados sem política e auditoria específicas.

## Próxima etapa prevista

Etapa 16 — Admin. Não iniciada automaticamente.

---

# Etapa 16 concluída — Administração

Concluída em 27/08/2026.

## Implementado

- Backoffice separado e responsivo em `/admin`.
- Autorização administrativa obrigatória também na API.
- Dashboard com indicadores de usuários, veículos, reservas, pagamentos, KYC e volume de mensagens.
- Gestão paginada e pesquisável de usuários com função, suspensão e reativação.
- Revogação imediata das sessões ao suspender uma conta.
- Bloqueio de login por senha e Google, recuperação e sessões antigas para contas suspensas.
- Proteção contra auto-suspensão e alteração da própria função administrativa.
- Moderação de status dos veículos, exigindo perfil de anfitrião ativo e KYC aprovado para ativação.
- Acompanhamento somente leitura de reservas e pagamentos.
- Fila KYC integrada ao backoffice.
- Auditoria administrativa com autor, alvo, motivo e transição de estado.
- Conteúdo privado das conversas mantido fora do acesso administrativo.
- Migração `0010_cool_texas_twister.sql` e documentação operacional.
- Conta administrativa criada apenas pelo seed de desenvolvimento.

## Validações

- Migração aplicada e seed idempotente executado.
- Sessenta e seis testes da API aprovados, incluindo regras administrativas e suspensão.
- Acesso sem sessão e acesso de usuário comum bloqueados.
- Proteção contra auto-bloqueio aprovada.
- Suspensão, revogação de sessão, bloqueio de novo login, reativação e login restaurado aprovados no fluxo real.
- Dashboard e todos os módulos administrativos carregados com dados reais.
- Busca e filtros administrativos aprovados após correção do metadado de DTO encontrada durante o QA.
- Layout móvel de 390 × 844 aprovado sem rolagem horizontal da página.
- Console do navegador sem erros ou avisos.
- Prettier, ESLint, TypeScript strict e builds de produção aprovados.

## Limites mantidos nesta etapa

- Reservas e pagamentos não recebem ações administrativas genéricas sem uma política operacional específica.
- Administradores não podem ler mensagens privadas.
- O primeiro administrador de produção exige provisionamento controlado fora do seed.
- Alertas, filas assíncronas, Redis e jobs pertencem à próxima etapa.

## Próxima etapa prevista

Etapa 17 — Jobs e Redis. Não iniciada automaticamente.

---

# Etapa 17 concluída — Jobs e Redis

Concluída em 28/08/2026.

## Implementado

- Redis 8.2 no Docker Compose com senha, AOF, health check e política `noeviction`.
- Cliente Redis global e verificação da dependência no health da API.
- Cache compartilhado das buscas e dos detalhes públicos de veículos.
- Lock curto contra estouro de cache e invalidação após alterações do anfitrião ou da administração.
- Storage Redis atômico para o rate limiting global do NestJS.
- BullMQ com fila, produtor, worker embutido configurável e entrypoint de worker dedicado.
- Entrega assíncrona do link de recuperação de senha por webhook, com idempotência, retentativas e backoff exponencial.
- Job Scheduler para limpeza periódica de sessões expiradas e tokens antigos de recuperação.
- Configuração, comandos locais, operação produtiva e separação API/worker documentados.

## Validações

- Redis saudável, autenticado e respondendo `PONG` com `maxmemory-policy=noeviction`.
- Duas instâncias da API compartilharam o contador: três respostas HTTP 200 seguidas de HTTP 429 na quarta requisição.
- Duas instâncias compartilharam a mesma entrada de cache do catálogo.
- Worker BullMQ concluiu onze execuções do job recorrente de QA sem falhas.
- Sessões temporárias das três APIs de QA foram encerradas após a validação.
- Sessenta e nove testes da API aprovados.
- Prettier, ESLint, TypeScript strict, suíte completa e builds de produção do monorepo aprovados.

## Limites mantidos nesta etapa

- WebSocket continua fora do escopo enquanto o polling atender ao MVP.
- E-mail real depende da configuração do webhook de entrega.
- Redis gerenciado, TLS, observabilidade e alarmes devem ser configurados no ambiente de produção.
- Alertas e hardening geral pertencem à próxima etapa.

## Próxima etapa prevista

Etapa 18 — Hardening. Não iniciada automaticamente.

---

# Etapa 18 concluída — Hardening

Concluída em 28/08/2026.

## Implementado

- Helmet, limite de payload, CORS explícito, logs com redaction e respostas de erro seguras na API.
- Correlação ponta a ponta com `x-request-id` e cache privado `no-store` por padrão.
- Validação fail-fast das variáveis e credenciais de produção, separada entre API e worker.
- Liveness independente e readiness com PostgreSQL, Redis, latência, versão e uptime.
- CSP e cabeçalhos defensivos no Web, cache privado nas áreas autenticadas e artefato standalone.
- Metadata, canonical, Open Graph, robots, sitemap, manifesto e `noindex` nas rotas privadas.
- Estados globais de loading, erro e not-found, além de suporte a movimento reduzido.
- Testes de configuração, readiness, tratamento de erros, URL pública e política de segurança.
- CI para formatação, lint, tipos, testes, migrações, auditoria e build; Dependabot semanal.
- Guia de hardening e checklist operacional de publicação.

## Validações

- Formatação, ESLint e TypeScript strict aprovados.
- Migrações Drizzle aprovadas.
- Setenta e oito testes da API e cinco testes do Web aprovados.
- Auditoria das dependências de produção sem vulnerabilidades conhecidas.
- Builds de produção da API e do Web aprovados; 29 páginas estáticas geradas pelo Next.js.
- Readiness real respondeu HTTP 200 com PostgreSQL e Redis saudáveis.
- Headers CSP/Helmet, request ID e políticas de cache verificados nas respostas HTTP.
- Home e login aprovados em 390 × 844 sem rolagem horizontal e sem erros no console.
- Home indexável com canonical; login bloqueado para indexação; landmarks e skip link presentes.

## Limites mantidos nesta etapa

- A infraestrutura de produção, domínio, certificados, segredos, backups, coletor de logs e alarmes dependem do provedor escolhido.
- O deploy automatizado será ligado ao CI somente após definir ambiente, conta e política de promoção.
- A CSP ainda aceita estilos e scripts inline compatíveis com o Next.js e Mercado Pago; migração para nonces exige homologação específica.
- Teste de carga, restauração de backup, pentest e validação jurídica de KYC devem ocorrer antes do go-live.

## Estado do plano

As 18 etapas previstas foram concluídas. O produto está pronto para homologação controlada. Uso em produção depende da execução do checklist em `docs/hardening.md`.
