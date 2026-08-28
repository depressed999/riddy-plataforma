# Perfil do usuário

A Etapa 9 adiciona a área autenticada de perfil em `/perfil`. Usuários sem sessão são enviados para `/entrar?next=/perfil` e retornam ao perfil após o login.

## Dados disponíveis

O perfil permite consultar e atualizar somente informações básicas:

- nome;
- telefone;
- cidade;
- estado;
- apresentação curta, limitada a 500 caracteres.

O e-mail é exibido como identidade da conta, mas não pode ser alterado por esse formulário. A URL de avatar existente é preservada no contrato, sem fluxo de upload nesta etapa.

Campos vazios opcionais são persistidos como `null`. O telefone é reduzido a `+` e dígitos, e a sigla do estado é normalizada em letras maiúsculas.

## API protegida

- `GET /api/v1/profile`: retorna o perfil da sessão atual;
- `PATCH /api/v1/profile`: atualiza os campos básicos permitidos.

Os dois endpoints exigem uma sessão válida. A atualização também exige origem confiável, seguindo a mesma proteção usada nos demais endpoints mutáveis de autenticação.

## Limites desta etapa

Documentos pessoais, CPF, CNH, endereço completo, upload de avatar e verificação KYC não pertencem ao perfil básico. Esses dados exigem armazenamento e fluxos protegidos próprios em etapas posteriores.
