# Marketplace

A etapa 6 conecta a experiência pública à API real de veículos. O catálogo fica disponível em `/buscar`.

## Busca e URL

O estado da busca é representado por parâmetros na URL. Isso permite atualizar a página, navegar entre páginas e compartilhar uma seleção sem perder o contexto.

Parâmetros suportados:

- `query`: marca, modelo ou texto da descrição;
- `location`: cidade ou estado;
- `type`: carro ou motocicleta;
- `transmission`: câmbio;
- `fuelType`: combustível;
- `seats`: quantidade mínima de lugares;
- `minPrice` e `maxPrice`: faixa da diária;
- `sort`: mais recentes, menor preço ou maior preço;
- `page`: página atual;
- `pickupDate` e `returnDate`: contexto preservado para a futura disponibilidade.

Campos vazios são removidos antes da navegação para manter URLs legíveis.

## Responsividade

No desktop, os filtros permanecem em um painel lateral e os resultados usam uma grade de até três colunas. Em telas menores, os filtros abrem em uma gaveta inferior e os cards passam para uma ou duas colunas.

## Limites desta etapa

As datas ainda não consultam disponibilidade, pois essa regra será implementada com o domínio Booking. A prévia do card não substitui a página completa de detalhes, prevista para a etapa 7.

Os três veículos originais mantêm suas imagens locais. Os demais itens do seed exibem um estado visual neutro enquanto não possuem mídia cadastrada, sem usar imagens fictícias incorretas.
