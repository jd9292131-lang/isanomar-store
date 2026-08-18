# AUDITORIA VERCEL 5.2 — ISANOMAR STORE

## Resultado

A aplicação foi adaptada da v5.1 estável para uma arquitectura compatível com Vercel:

- Express exportado como função serverless em `api/index.js`.
- PostgreSQL em vez de SQLite.
- Vercel Blob para imagens.
- Segredos apenas por environment variables.
- Rate limit persistente em PostgreSQL.
- Checkout sem login de cliente.
- Stock reservado dentro de transacção PostgreSQL com locks de lote.
- Entrega permitida apenas em 48h/72h.
- 7% de taxa de entrega mantida.
- 3 prestações mantidas.

## Dados

O seed foi extraído da base da v5.1 antes da remoção do SQLite:

- 12 produtos
- 8 categorias
- 0 lotes
- 0 stock fictício
- 2 encomendas existentes, preservadas

O SQLite não é distribuído no pacote.

## Verificações estáticas executadas

- `server/server.js` — sintaxe OK
- `api/index.js` — sintaxe OK
- `public/app.js` — sintaxe OK
- `public/admin.js` — sintaxe OK
- `public/dashboard.js` — sintaxe OK
- `public/api.js` — sintaxe OK
- `public/dashboard.js` — sintaxe OK
- `data/seed-data.json` — JSON válido
- `.env` real — ausente
- `.env.example` — presente
- `better-sqlite3` — ausente do código, package e lock
- `isanomar.sqlite` — ausente
- `2449XXXXXXXX` — ausente
- `store.refresh` — ausente
- `S().refresh` — ausente
- `app.listen` — usado apenas no modo local quando o ficheiro é executado directamente; não é usado pelo entrypoint Vercel
- `vercel.json` — presente
- `api/index.js` — presente

## Validação que NÃO foi possível executar nesta sessão

Não foi possível executar `npm install` completamente porque o registry npm não respondeu dentro do limite de execução deste ambiente. Portanto não foi possível executar um teste end-to-end com PostgreSQL e Vercel Blob reais nesta sessão.

Também não foi possível fazer um deploy real numa conta Vercel.

Consequentemente, este pacote deve ser tratado como **Vercel Ready / Deployment Candidate**, não como certificado 100% em produção.

## Próximo teste real

Depois de ligar Neon/PostgreSQL e Vercel Blob no projecto Vercel, testar:

1. `/api/health`
2. `/api/ready`
3. login do operador
4. `/api/admin/me`
5. criação de produto
6. criação e edição de lote
7. upload de imagem
8. catálogo com stock 0/stock > 0
9. encomenda concorrente da última unidade
10. cancelamento e devolução de stock
11. 7% de entrega
12. 48h/72h
13. prestações
14. dashboard
15. tema claro/escuro
16. telemóvel
