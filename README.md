# ISANOMAR STORE — Vercel Ready 5.2

Arquitectura: Vercel + Express Serverless + PostgreSQL + Vercel Blob.

O checkout do cliente não exige login.

## Variáveis de produção
- NODE_ENV=production
- DATABASE_URL
- JWT_SECRET
- ADMIN_PASSWORD_HASH
- CORS_ORIGIN
- BLOB_READ_WRITE_TOKEN

Nunca publique `.env` nem credenciais no GitHub.

## Local
1. Crie um PostgreSQL local.
2. Copie `.env.example` para `.env` e preencha `DATABASE_URL`.
3. `npm install`
4. `npm start`

## Vercel
Importe o repositório GitHub e configure as variáveis acima no projecto. O banco é inicializado automaticamente na primeira execução a partir de `data/seed-data.json`.

O seed preserva os produtos/categorias/encomendas existentes na versão estável e não cria lotes nem stock fictício.
