# Pagamentos com Mercado Pago

A Etapa 12 adiciona pagamentos por cartão e Pix em `/pagamentos/{bookingId}`. O frontend usa o Payment Brick oficial para tokenizar os dados financeiros, enquanto a API NestJS envia somente os dados mínimos para a API de Pagamentos do Mercado Pago.

## Configuração

Preencha no `.env`:

```dotenv
MERCADO_PAGO_PUBLIC_KEY=TEST-...
MERCADO_PAGO_ACCESS_TOKEN=TEST-...
MERCADO_PAGO_WEBHOOK_SECRET=...
MERCADO_PAGO_WEBHOOK_URL=https://seu-dominio.example/api/v1/payments/webhook/mercado-pago
MERCADO_PAGO_API_URL=https://api.mercadopago.com
```

A Public Key é retornada ao usuário autenticado para inicializar o Brick. O Access Token e o segredo do webhook ficam exclusivamente na API. Sem as duas credenciais principais, a tela apresenta um estado de configuração e não renderiza campos financeiros.

O webhook precisa de uma URL HTTPS pública para os testes externos. A URL local `localhost` não pode receber notificações do Mercado Pago sem um túnel seguro.

## Fluxo

- o navegador recebe cartão ou Pix pelo Payment Brick;
- cartão chega à Riddy apenas como token descartável;
- valor, e-mail e referência da reserva são obtidos no backend;
- cada chamada envia `X-Idempotency-Key` e também é deduplicada no PostgreSQL;
- cartão aprovado confirma a reserva;
- Pix pendente exibe QR Code, Pix Copia e Cola e atualização de status;
- pagamentos recusados ou com falha permitem uma nova tentativa independente;
- webhooks assinados consultam o pagamento diretamente no provedor antes de atualizar o estado local.

## API

- `GET /api/v1/payments/booking/:bookingId`: contexto financeiro da reserva;
- `POST /api/v1/payments`: cria cartão ou Pix;
- `POST /api/v1/payments/:id/cancel`: cancela pagamento pendente;
- `POST /api/v1/payments/:id/refund`: reembolso integral de pagamento aprovado;
- `POST /api/v1/payments/webhook/mercado-pago`: notificação assinada do provedor.

Criação, cancelamento e reembolso exigem sessão, origem confiável e UUID idempotente. O webhook é público, mas exige `x-signature` e `x-request-id` válidos.

## Persistência e concorrência

As tabelas `payments`, `payment_actions` e `payment_webhook_events` preservam tentativas, operações e notificações. Índices únicos protegem a chave idempotente, o identificador externo e a existência de apenas um pagamento ativo por reserva.

Nenhum PAN, CVV ou validade de cartão é armazenado. QR Code Pix e identificadores do provedor ficam vinculados somente à reserva do usuário autenticado.

## Testes

A suíte automatizada cobre:

- cartão aprovado e recusado;
- Pix pendente e dados de QR Code;
- preço e e-mail autoritativos do backend;
- repetição idempotente;
- falha de rede/provedor;
- assinatura e repetição de webhook;
- cancelamento;
- reembolso integral;
- chamadas REST e headers do gateway.

O teste real no sandbox exige credenciais de teste da conta Mercado Pago. Use apenas usuários e cartões de teste indicados no painel da integração; nunca teste com cartões reais.

## Referências oficiais

- [Inicialização do Checkout Bricks](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/common-initialization)
- [Envio de pagamentos com cartão](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/card-payment-brick/payment-submission)
- [Pagamento por Pix](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/payment-brick/payment-submission/pix)
- [Validação de Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
- [Cancelamentos e reembolsos](https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/additional-content/payment-management/cancellations-and-refunds)
