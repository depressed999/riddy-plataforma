# Hardening e preparação operacional

A Etapa 18 fecha o plano funcional com proteções de aplicação, observabilidade básica, SEO, acessibilidade, testes e integração contínua. Ela reduz riscos no código, mas não substitui a preparação do ambiente onde a Riddy será publicada.

## Segurança

- A API usa Helmet, limite de corpo configurável (1 MiB por padrão), CORS explícito, cookies HttpOnly e validação estrita dos DTOs.
- Respostas privadas e endpoints operacionais usam `Cache-Control: no-store`; somente o catálogo público recebe cache curto.
- Cada requisição recebe ou preserva `x-request-id`, que também aparece nos erros e logs.
- Cabeçalhos de autenticação e cookies são removidos dos logs estruturados.
- Erros inesperados são registrados no servidor sem expor detalhes internos ao cliente.
- Swagger permanece habilitado localmente e fica desabilitado por padrão em produção.
- A inicialização falha cedo quando variáveis de produção obrigatórias estão ausentes, URLs públicas não usam HTTPS ou credenciais conhecidas de desenvolvimento continuam configuradas.
- O worker valida apenas PostgreSQL, Redis e o webhook de recuperação, seguindo o princípio do menor conjunto de segredos.
- O Web envia CSP, `Permissions-Policy`, `Referrer-Policy`, proteção contra framing e MIME sniffing. Rotas autenticadas recebem `private, no-store`.
- O navegador acessa a API pelo proxy de mesma origem `/api/v1`, evitando cookies de sessão third-party entre serviços de hospedagem distintos.

### Política de conteúdo

A CSP remove `unsafe-eval` em produção e restringe rede, frames e scripts às origens da aplicação, storage e Mercado Pago. `unsafe-inline` ainda é aceito para compatibilidade com a estratégia estática atual do Next.js e com o checkout. A evolução recomendada é uma CSP baseada em nonce depois de validar todo o fluxo do Mercado Pago em homologação.

## Performance

- O catálogo público é revalidado a cada 30 segundos e também utiliza o cache Redis da API.
- Respostas privadas não entram em cache compartilhado.
- O Next.js produz imagens AVIF/WebP e artefato `standalone` para implantação em contêiner.
- A API recusa corpos excessivos antes de processá-los.
- Compressão deve ser habilitada no proxy, ingress ou CDN de produção, evitando custo duplicado em cada instância da API.

## SEO e acessibilidade

- Home, busca e veículo possuem título, descrição, canonical e dados Open Graph coerentes.
- `robots.txt`, `sitemap.xml` e manifesto são gerados pelo App Router.
- Login, cadastro, perfil, checkout, mensagens, pagamentos, reservas, KYC, anfitrião, admin e design system usam `noindex`.
- A interface possui link para pular ao conteúdo, landmarks, hierarquia de títulos, estados globais de carregamento/erro e suporte a `prefers-reduced-motion`.
- O QA móvel em 390 × 844 aprovou Home e login sem rolagem horizontal e sem erros no console.

## Observabilidade e saúde

- `GET /api/v1/health/live` comprova que o processo responde sem consultar dependências.
- `GET /api/v1/health/ready` e `GET /api/v1/health` verificam PostgreSQL e Redis e retornam a latência de cada dependência.
- Logs estruturados incluem o request ID e preservam o erro completo apenas no servidor.
- Erros de renderização do Next.js são registrados pelo hook de instrumentação sem copiar headers ou dados de sessão.

Em produção, os logs devem ser enviados para um coletor central e os endpoints de readiness devem alimentar probes e alertas. A solução de monitoramento não foi escolhida porque o provedor de hospedagem ainda não foi definido.

## Testes e integração contínua

O workflow `.github/workflows/ci.yml` roda a cada pull request e push na branch `main` com permissões somente de leitura. A pipeline instala exatamente o lockfile e exige:

1. formatação;
2. lint;
3. TypeScript strict;
4. testes da API e do Web;
5. integridade das migrações;
6. auditoria das dependências de produção;
7. builds de produção.

O Dependabot acompanha dependências npm/pnpm e GitHub Actions semanalmente. Um job de deploy não foi inventado sem destino, conta, política de promoção e segredos definidos; ele deve ser conectado à pipeline quando a infraestrutura for escolhida.

## Checklist antes de publicar

- Definir domínio, TLS, proxy confiável e as origens HTTPS de Web, API, Google OAuth e Mercado Pago. No Web, `API_URL` deve apontar somente para a origem interna ou pública da API; não exponha essa URL como variável `NEXT_PUBLIC_*`.
- Substituir todas as credenciais locais e armazená-las no gerenciador de segredos do provedor.
- Usar PostgreSQL, Redis e storage gerenciados ou operados com backup, criptografia, retenção e restauração testada.
- Aplicar migrações como uma etapa controlada antes de liberar a nova versão.
- Rodar API e worker como processos separados, com probes de liveness/readiness e política de reinício.
- Configurar coletor de logs, métricas, alertas e resposta a incidentes.
- Validar pagamento, webhook, estorno, OAuth, recuperação de senha e uploads no ambiente de homologação.
- Revisar termos, privacidade, retenção de KYC e autorização de operadores com responsáveis jurídicos e de negócio.
- Executar teste de carga, restauração de backup e smoke test pós-deploy.

Enquanto esses itens externos não forem atendidos, a aplicação está pronta para homologação controlada, não para receber tráfego real irrestrito.
