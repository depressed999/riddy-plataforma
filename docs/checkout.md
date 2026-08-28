# Checkout

A Etapa 11 adiciona a rota `/checkout` para revisar e confirmar uma reserva. O fluxo recebe `vehicleId`, `pickupDate` e `returnDate` pela URL, preserva esses parâmetros durante a autenticação e rejeita links incompletos ou inválidos.

## Revisão

Depois que a sessão é validada, o checkout consulta novamente o backend e apresenta:

- veículo e localização aproximada;
- datas de retirada e devolução;
- quantidade de diárias e preço calculado pelo servidor;
- nome, e-mail, telefone e localização do próprio locatário;
- aviso de que os dados financeiros serão coletados somente na tela protegida seguinte;
- confirmação consciente de que a solicitação será pendente e sem cobrança.

O botão final permanece desabilitado até o usuário marcar que revisou os dados. A criação usa o endpoint existente de Booking, que recalcula e persiste o preço e aplica novamente a proteção contra conflito de período.

## Estados do fluxo

- sem sessão: redireciona para `/entrar` e retorna ao mesmo checkout;
- parâmetros inválidos: orienta a refazer a escolha pelo catálogo;
- período indisponível: volta ao veículo para escolher novas datas;
- falha ou sessão expirada: apresenta mensagem ou retorna ao login;
- sucesso: exibe datas, total, status pendente e acesso direto ao pagamento.

## Continuidade

O checkout não recebe cartão nem Pix. Depois de criar a reserva, ele encaminha para `/pagamentos/{bookingId}`, mantendo a separação entre a confirmação do pedido e a operação financeira.
