# Detalhes do veículo

A Etapa 7 adiciona a rota pública dinâmica `/veiculos/[id]`. Ela busca o veículo ativo pelo identificador na API e apresenta a experiência completa de consulta antes da autenticação e da criação de reservas.

## Conteúdo da página

- galeria responsiva, preparada para uma ou várias imagens;
- fallback visual neutro quando o veículo ainda não possui foto;
- descrição, características técnicas e comodidades;
- estado provisório do anfitrião sem identidade fictícia;
- cidade e estado, sem revelar endereço exato;
- estado vazio de avaliações quando não há dados reais;
- painel de datas conectado à disponibilidade e ao preço do backend.

Os cards do Marketplace apontam diretamente para essa rota. Veículos inexistentes, inativos ou com identificador inválido recebem uma página de não encontrado e não expõem informações privadas.

## Reserva

O painel faz uma cotação no backend, que valida o período, verifica conflitos e calcula o valor com base na diária atual do veículo. A devolução deve ser posterior à retirada, e a data mínima considera o calendário local do usuário.

Quando o período está disponível, o painel encaminha veículo e datas para `/checkout`. A reserva pendente só é criada depois que o usuário autenticado revisa o pedido e confirma a solicitação; nenhuma cobrança é iniciada no painel.

## Dados ainda indisponíveis

Não há domínio de avaliações nem perfil público completo de anfitrião. Por isso, a página apresenta estados informativos honestos em vez de gerar notas, depoimentos ou dados pessoais fictícios. O mapa interativo também permanece fora do escopo; apenas a localização aproximada é exibida.
