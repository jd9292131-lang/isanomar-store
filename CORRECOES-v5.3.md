# ISANOMAR STORE v5.3 — Correções aplicadas

## Painel do Operador
- Mantido o acesso secreto com **9 cliques rápidos** no logótipo.
- Corrigido o comentário interno para corresponder à regra real.
- Adicionada proteção contra falha de carregamento quando os elementos de login ainda não existem.
- Adicionado rótulo para **MULTICAIXA Express** nas encomendas do operador.

## Encomendas e stock
- Uma encomenda **cancelada não pode ser reativada**. Isto evita inconsistências de stock depois da devolução automática aos lotes.
- Criado/normalizado o campo `updated_at` nas encomendas para permitir rastrear alterações posteriores à criação.
- Alterações de estado e prazo atualizam `updated_at`.
- Pagamentos não podem ser registados em encomendas canceladas.

## Lotes
- Bloqueada a criação/edição com `availableQty > receivedQty`.
- A regra válida é: `0 <= availableQty <= receivedQty`.

## Cliente e carrinho
- O detalhe do produto agora utiliza a mesma função central de validação de stock do catálogo.
- O botão de aumentar quantidade no detalhe não ultrapassa o stock disponível.

## Entrega
- O cálculo de entrega de 7% permanece como regra ativa do checkout. A estrutura antiga de municípios não foi removida nesta versão por compatibilidade com dados existentes, mas não interfere no cálculo atual.

## Verificação técnica
- `node --check public/app.js` ✓
- `node --check public/admin.js` ✓
- `node --check public/dashboard.js` ✓
- `node --check server/server.js` ✓

## Nota
Antes de publicar, teste com as variáveis de produção configuradas na Vercel: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_PASSWORD` ou `ADMIN_PASSWORD_HASH`, `CORS_ORIGIN` e `BLOB_READ_WRITE_TOKEN`.
