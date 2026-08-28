# Mensagens por reserva

A Etapa 15 adiciona comunicação privada entre o locatário e o anfitrião. A caixa de entrada unificada fica em `/mensagens`, e cada conversa possui uma URL própria em `/mensagens/{conversationId}`.

## Modelo e permissões

Cada reserva pode possuir exatamente uma conversa. A criação é idempotente: abrir a conversa novamente retorna o mesmo identificador, sem duplicar o histórico.

Os participantes são determinados pelo próprio domínio da reserva:

- o locatário é `bookings.renter_id`;
- o anfitrião é o proprietário do veículo reservado.

Somente esses dois usuários podem criar, listar, ler ou enviar mensagens. Uma conta externa recebe resposta de recurso não encontrado, evitando revelar a existência da conversa. Administradores não ganham acesso implícito ao conteúdo.

As mensagens são texto puro, limitadas a 2.000 caracteres e escapadas pelo React na exibição. O banco também aplica uma restrição contra mensagens vazias ou acima do limite. O endpoint de envio possui limite específico de requisições para reduzir abuso.

## Experiência

- A conversa pode ser iniciada em “Minhas reservas” ou “Reservas recebidas”.
- A caixa de entrada mostra participante, veículo, última mensagem e quantidade não lida.
- O histórico exibe as 100 mensagens mais recentes em ordem cronológica.
- Mensagens recebidas são marcadas como lidas ao abrir a conversa.
- O remetente vê a confirmação “Lida” após a próxima atualização.
- `Ctrl + Enter` ou `Cmd + Enter` envia a mensagem pelo compositor.
- A interface se atualiza a cada cinco segundos na conversa e oito segundos na caixa de entrada enquanto a página está visível.

## Decisão sobre WebSocket

WebSocket foi avaliado nesta etapa, mas não foi adicionado. Para o volume e a infraestrutura atuais, consultas REST periódicas entregam atualização quase em tempo real com menos dependências, reconexão mais simples e a mesma autorização HTTP já consolidada.

Socket.IO/WebSocket passa a fazer sentido quando houver necessidade comprovada de presença online, digitação em tempo real, notificações instantâneas em grande escala ou múltiplas instâncias coordenadas. Nesse cenário, a infraestrutura de Redis prevista na Etapa 17 deve participar do desenho para distribuição de eventos.

## API

Todas as rotas exigem sessão. As mutações também validam a origem.

- `GET /api/v1/messages/conversations` — lista a caixa de entrada;
- `POST /api/v1/messages/conversations` — inicia ou recupera a conversa de uma reserva;
- `GET /api/v1/messages/conversations/:id` — retorna resumo e histórico recente;
- `POST /api/v1/messages/conversations/:id/messages` — envia texto;
- `POST /api/v1/messages/conversations/:id/read` — marca mensagens recebidas como lidas.

## Teste local com o catálogo de demonstração

Após `pnpm db:seed`, os oito veículos locais pertencem à conta de desenvolvimento `anfitriao.demo@riddy.local`, senha `RiddyDemo@2026`. Essa credencial existe somente no seed bloqueado em produção e permite entrar como anfitrião para responder às conversas abertas por outra conta nos veículos de demonstração.

## Limites desta etapa

- Não há anexos, edição, exclusão, reações ou busca no histórico.
- Não há presença online, indicador de digitação ou push notification.
- A interface carrega as 100 mensagens mais recentes; paginação de histórico será necessária para conversas longas.
- Moderação e acesso excepcional do suporte exigem política, auditoria e implementação próprias; não foram incluídos implicitamente.
