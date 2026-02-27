# Entrega 3 — PDF + Segurança P0

## Aplicar o patch

```bash
# Na raiz do arc-mvp
git am 0001-entrega3-pdf-security.patch

# Se houver conflitos de contexto:
git apply --reject 0001-entrega3-pdf-security.patch
# Resolver .rej manualmente
```

## Estrutura adicionada

```
pdf-service/              ← microserviço Python (FastAPI + WeasyPrint)
  main.py                 ← app FastAPI, /render e /health
  models.py               ← Pydantic com sanitização bleach em todos os campos
  renderer.py             ← Jinja2 autoescape=True
  radar.py                ← SVG do radar gerado server-side
  url_fetcher.py          ← bloqueia file://, ftp://, qualquer non-http/data
  templates/report.html   ← template com 7 seções + page breaks + footer paginado
  Dockerfile
  requirements.txt
  tests/test_security.py

src/
  routers/report.ts       ← tRPC: generatePdf (BOLA check) + deleteMyData
  routes/pdf.ts           ← Express GET /api/users/:id/report.pdf
  routes/privacy.ts       ← Express DELETE /api/me/data
  services/pdfClient.ts   ← HTTP client interno para o pdf-service
  services/reportBuilder.ts
  db/schema/responses_evidence.ts   ← coluna retention_until adicionada
  db/migrations/0004_add_retention_and_privacy.ts

tests/
  pdf-ownership.test.ts   ← Jest: P0 BOLA + delete account

docker-compose.yml
```

## Rodar localmente

```bash
# 1. Subir tudo
docker compose up --build

# 2. Rodar migration de retention
pnpm drizzle-kit push
# ou manualmente:
pnpm tsx src/db/migrations/0004_add_retention_and_privacy.ts

# 3. Testes Node (BOLA + delete)
pnpm test tests/pdf-ownership.test.ts

# 4. Testes Python (sanitização, URL fetcher, headers)
pip install pytest
pytest pdf-service/tests/
```

## Variáveis de ambiente necessárias

| Variável | Exemplo | Obrigatória |
|---|---|---|
| `PDF_SERVICE_URL` | `http://pdf-service:8001` | Sim |
| `DATABASE_URL` | `mysql://arc:pass@db:3306/arc_mvp` | Sim |
| `SESSION_SECRET` | string aleatória ≥ 32 chars | Sim |

## O que cada requisito P0 cobre

| Requisito | Arquivo | Como |
|---|---|---|
| Sanitização bleach zero-tags | `models.py` | `field_validator` em todos os campos string/list |
| Jinja2 autoescape | `renderer.py` | `autoescape=select_autoescape(["html","xml"])` |
| WeasyPrint URL fetcher restrito | `url_fetcher.py` + `main.py` | Bloqueia tudo fora de http/https/data |
| BOLA 404 (ownership) | `routes/pdf.ts` + `routers/report.ts` | `sessionUserId !== requestedUserId → 404` |
| Headers Cache-Control + nosniff | `routes/pdf.ts` + `main.py` | Ambas as camadas retornam os headers |
| retention_until | `0004_add_retention_and_privacy.ts` | Coluna DATE NOT NULL, default hoje+90d |
| DELETE /me/data | `routes/privacy.ts` | Transação que apaga todas as tabelas do usuário em cascade |

## Nota sobre radar SVG

O SVG é gerado 100% server-side em `radar.py` com valores numéricos clampados `[0, 5]`.
Ele é marcado `| safe` no template porque **não vem do usuário** — vem do nosso cálculo interno.
Todo texto do usuário passa por `bleach.clean(..., tags=[], strip=True)` antes de chegar ao template.
