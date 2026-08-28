# Área do anfitrião

A Etapa 14 adiciona uma área autenticada para o proprietário administrar sua operação na Riddy. O acesso começa em `/anfitriao` e funciona para a mesma conta de usuário já usada como locatário.

## Módulos

- **Visão geral:** onboarding, estado do KYC, indicadores de veículos, reservas e receita bruta aprovada.
- **Veículos:** cadastro em rascunho, edição e alteração entre rascunho, publicado, pausado e manutenção.
- **Reservas:** histórico dos pedidos recebidos, período, locatário, valor e status.
- **Calendário:** bloqueios próprios por veículo e consulta consolidada da indisponibilidade.
- **Financeiro:** valores brutos aprovados, pendentes e reembolsados a partir dos pagamentos reais.
- **Configurações:** nome público, telefone de suporte e apresentação do anfitrião.

O menu é responsivo e está disponível no cabeçalho autenticado e no CTA da Home.

## Onboarding e publicação

O perfil do anfitrião é criado somente após o aceite explícito dos termos. Uma conta pode preparar o perfil e cadastrar veículos em rascunho antes da análise de identidade terminar, mas só consegue publicar um veículo quando:

1. o KYC da conta está aprovado;
2. o perfil do anfitrião está ativo;
3. o veículo pertence à própria conta.

Quando o KYC é aprovado, um perfil em onboarding é promovido para ativo ao entrar na área do anfitrião. Perfis suspensos não acessam os módulos operacionais.

## Disponibilidade

Os bloqueios usam intervalos com a data final exclusiva, da mesma forma que as reservas. A API impede bloqueios no passado, períodos inválidos, conflitos com reservas ativas e sobreposição com outro bloqueio.

Além da validação na aplicação, o PostgreSQL possui uma restrição GiST para impedir dois bloqueios sobrepostos em concorrência. A cotação pública de reserva também consulta esses bloqueios.

## API

Todas as rotas exigem cookie de sessão. As mutações também validam a origem da requisição.

- `GET /api/v1/hosts/dashboard` — perfil, KYC e indicadores;
- `POST /api/v1/hosts/onboarding` — cria ou retoma o perfil;
- `PATCH /api/v1/hosts/profile` — atualiza dados públicos;
- `GET /api/v1/hosts/vehicles` — lista os veículos próprios;
- `POST /api/v1/hosts/vehicles` — cria um veículo em rascunho;
- `PATCH /api/v1/hosts/vehicles/:id` — edita o veículo próprio;
- `PATCH /api/v1/hosts/vehicles/:id/status` — publica, pausa ou envia para manutenção;
- `GET /api/v1/hosts/bookings` — lista reservas recebidas;
- `GET /api/v1/hosts/availability-blocks` — lista bloqueios;
- `POST /api/v1/hosts/availability-blocks` — cria um bloqueio;
- `DELETE /api/v1/hosts/availability-blocks/:id` — remove um bloqueio próprio;
- `GET /api/v1/hosts/finance` — resumo financeiro bruto.

## Limites desta etapa

- O financeiro mostra valores brutos reais; taxas, repasses e saque não foram inventados sem uma regra comercial definida.
- Mensagens entre locatário e anfitrião estão disponíveis na caixa unificada `/mensagens` implementada na Etapa 15.
- Upload e gestão de fotos dos veículos ainda não fazem parte do formulário do anfitrião; imagens já existentes continuam sendo exibidas.
- A criação de bloqueio e de reserva é protegida individualmente contra concorrência; uma transação única entre as duas tabelas será necessária para garantias mais fortes em alta escala.
