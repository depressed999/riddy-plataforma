# Reservas

A Etapa 10 introduz o domínio Booking sem pagamento. A página do veículo permite consultar disponibilidade e preço, o checkout da Etapa 11 concentra a revisão e criação, e `/reservas` reúne as solicitações do usuário autenticado.

## Datas e preço

O período usa retirada inclusiva e devolução exclusiva. Uma reserva de 10 a 13 de setembro possui três diárias. O backend valida que:

- a retirada não está no passado;
- a devolução é posterior à retirada;
- o veículo está ativo;
- o usuário não está reservando o próprio veículo;
- não existe outra reserva pendente ou confirmada que sobreponha o período.

A diária é lida do veículo no momento da criação. Diária, quantidade de dias e valor total são persistidos como um retrato da reserva; nenhum valor enviado pelo navegador é aceito como fonte de preço.

## Status

O modelo suporta `pending`, `confirmed`, `cancelled` e `completed`. Novas reservas são criadas como `pending`; um webhook de pagamento aprovado altera a reserva para `confirmed`. Cancelamento ou reembolso do pagamento altera a reserva para `cancelled`.

Reservas canceladas deixam de bloquear o período. Uma restrição de exclusão GiST no PostgreSQL impede sobreposição de reservas ativas mesmo quando duas criações concorrentes passam pela consulta de disponibilidade ao mesmo tempo.

## API

- `GET /api/v1/bookings/quote`: disponibilidade, diárias e preço calculado;
- `POST /api/v1/bookings`: cria uma reserva pendente para a sessão atual;
- `GET /api/v1/bookings/mine`: lista as reservas da sessão atual;
- `PATCH /api/v1/bookings/:id/cancel`: cancela uma reserva futura do próprio usuário.

Criação, listagem e cancelamento exigem sessão. As duas mutações também exigem origem confiável. Uma reserva com pagamento ativo não pode ser cancelada pelo endpoint genérico: o usuário deve usar o fluxo financeiro apropriado para cancelar ou reembolsar.

## Criação pelo checkout

O painel do veículo não cria mais a reserva diretamente. Ele envia veículo e datas para `/checkout`, onde o backend recalcula preço e disponibilidade antes de apresentar a confirmação. O `POST` continua sendo a autoridade final e pode rejeitar o período caso outra reserva tenha sido criada durante a revisão.

## Integração financeira

A Etapa 12 mantém o preço congelado na reserva como fonte de verdade e integra o ciclo financeiro em um módulo separado. Dados de cartão nunca são persistidos pela Riddy; o backend recebe apenas o token descartável gerado pelo Mercado Pago.

Contrato, proteção comercial e regras administrativas de disputa permanecem fora do escopo.
