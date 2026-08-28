# KYC e documentos privados

A Etapa 13 adiciona o fluxo de verificação de identidade da Riddy. O locatário envia CNH e selfie em `/perfil/documentos`; analistas e administradores tratam a fila protegida em `/verificacoes/kyc`.

## Storage local

O desenvolvimento usa MinIO, compatível com a API S3. Inicie banco e storage com:

```bash
pnpm infra:up
pnpm db:migrate
pnpm dev
```

Endereços padrão:

- API S3: `http://localhost:9000`;
- console MinIO: `http://localhost:9001`;
- bucket privado: `riddy-kyc`.

As credenciais locais de exemplo estão em `.env.example`. Não reutilize esses valores em ambientes publicados. Em produção, configure credenciais exclusivas, bucket privado, HTTPS e as políticas de acesso do provedor S3.

## Fluxo de upload

1. O navegador informa nome, tipo MIME, tamanho e categoria do documento à API.
2. A API valida a solicitação, cria uma chave aleatória e devolve uma URL de upload assinada com expiração curta.
3. O navegador envia o arquivo diretamente ao storage, sem transportar o conteúdo pela API NestJS.
4. A API baixa e valida o objeto antes de concluir o upload: tamanho exato, assinatura binária JPEG/PNG/PDF e SHA-256.
5. O banco armazena somente metadados, checksum, estado e chave interna; a chave nunca é devolvida ao usuário.
6. A visualização usa uma URL de leitura temporária. O bucket não possui acesso público.

Arquivos permitidos: JPEG, PNG ou PDF com até 8 MB. CNH frente, CNH verso e selfie são obrigatórios; comprovante de residência é opcional nesta etapa.

## Estados e análise

O processo passa por `draft`, `pending_review`, `approved` ou `rejected`. O documento passa por `upload_pending`, `uploaded`, `pending_review`, `approved` ou `rejected`.

Ao submeter, os arquivos ficam bloqueados para o usuário. Um analista pode visualizar cada documento por URL temporária e aprovar ou solicitar reenvio com motivo. Toda preparação, conclusão, visualização, exclusão, submissão e decisão cria um evento de auditoria.

O papel padrão de uma conta é `user`. Para preparar uma conta de analista no ambiente local:

```sql
UPDATE users SET role = 'reviewer' WHERE email = 'analista@example.com';
```

Somente `reviewer` e `admin` acessam as rotas de análise. A API faz a autorização; ocultar o link no frontend é apenas uma conveniência visual.

## API

Rotas do usuário autenticado:

- `GET /api/v1/kyc` — estado atual;
- `POST /api/v1/kyc/documents/upload-url` — prepara upload assinado;
- `POST /api/v1/kyc/documents/:id/complete` — valida o objeto enviado;
- `GET /api/v1/kyc/documents/:id/view-url` — cria acesso temporário;
- `DELETE /api/v1/kyc/documents/:id` — remove antes da análise;
- `POST /api/v1/kyc/submit` — envia para a fila.

Rotas restritas ao analista:

- `GET /api/v1/kyc/review/cases` — lista pendências;
- `GET /api/v1/kyc/review/cases/:id` — detalhe da pendência;
- `POST /api/v1/kyc/review/cases/:id/approve` — aprova;
- `POST /api/v1/kyc/review/cases/:id/reject` — rejeita com motivo.

As mutações exigem cookie de sessão e origem confiável. Consultar documento de outra conta responde como não encontrado para não revelar sua existência.

## Variáveis

```dotenv
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=riddy-development
S3_SECRET_KEY=riddy-development-secret
S3_KYC_BUCKET=riddy-kyc
S3_FORCE_PATH_STYLE=true
S3_SIGNED_URL_TTL_SECONDS=300
```

Em produção, a API exige explicitamente `S3_ACCESS_KEY` e `S3_SECRET_KEY` e não cria o bucket automaticamente. Antivírus/antimalware, política de retenção, criptografia gerenciada, backups e trilhas externas de conformidade continuam sendo requisitos da preparação produtiva.
