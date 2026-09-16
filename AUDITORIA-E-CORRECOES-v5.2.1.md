# ISANOMAR Store — Auditoria e correções v5.2.1

Esta versão foi corrigida de forma cirúrgica sobre a v5.2 com foco em operação real.

## Correções executadas

- Mantida a autenticação do operador corrigida e as rotas administrativas protegidas por JWT.
- Corrigida a persistência das definições de máximo de prestações e taxa de entrega para outras províncias.
- Corrigido o cálculo de entrega no servidor: o backend passou a usar as definições reais guardadas pela loja, em vez de aplicar uma taxa fixa de 7%.
- O backend continua a calcular preços e totais a partir dos produtos reais da base de dados, sem confiar no preço enviado pelo navegador.
- O número de prestações passou a respeitar o máximo definido nas configurações da loja.
- Criado controlo de acesso individual para consulta pública de encomendas: cada nova encomenda recebe um token aleatório próprio. A consulta de encomendas exige agora o ID e o token correspondente, reduzindo a exposição de dados de clientes por IDs previsíveis.
- O navegador guarda apenas os tokens das encomendas do próprio dispositivo para continuar a mostrar o histórico do cliente.
- Removidos do pacote os ficheiros locais de ambiente, a pasta `.git` e os metadados `.vercel`, evitando a distribuição acidental de credenciais e dados internos.

## Antes da publicação

Configure as variáveis de ambiente na plataforma de produção:

- DATABASE_URL
- JWT_SECRET
- ADMIN_PASSWORD_HASH
- CORS_ORIGIN
- BLOB_READ_WRITE_TOKEN
- NODE_ENV=production

Use `.env.example` apenas como modelo. Não volte a enviar ou publicar ficheiros `.env.local`, `.env.preview.local` ou `.env.development.local` com credenciais reais.

## Compatibilidade

Encomendas criadas antes desta versão não possuem token individual de consulta e podem não aparecer no histórico público antigo. Os dados continuam na base de dados e permanecem acessíveis ao painel administrativo. As novas encomendas usam o controlo de acesso corrigido.
