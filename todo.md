# Arc MVP - TODO

## Entrega 1: Frontend + Data Model

- [x] Design system (cores, tipografia, tema)
- [x] Data Model completo (schema.ts com todas as tabelas)
- [x] DB push (migrations)
- [x] Backend API: routers tRPC com LGPD row-level filtering
- [x] Backend API: salvar respostas Likert
- [x] Backend API: salvar respostas evidências
- [x] Backend API: salvar itens IKIGAI com ranking
- [x] Backend API: salvar escolhas do usuário (zona, foco)
- [x] Backend API: audit logs
- [x] Backend API: consentimento LGPD
- [x] Frontend: Landing page / Login com consentimento LGPD
- [x] Frontend: Questionário CORE - 5 dimensões agilidades (Likert + invertidos)
- [x] Frontend: Questionário CORE - Big Five Mini-IPIP (20 itens)
- [x] Frontend: IKIGAI Worksheet (4 círculos com ranking)
- [x] Frontend: Tela de Review
- [x] Frontend: Submit e confirmação
- [x] Frontend: Navegação entre etapas (stepper/progress)
- [x] Testes vitest para routers

## Entrega 2: PDF sem IA (futuro)

- [ ] Geração PDF com WeasyPrint (Radar + Big Five + IKIGAI + Plano 90D templateado)
- [ ] Zona escolhida no PDF
- [ ] Plano 90 dias templateado (70/20/10) com escolhas do usuário

## Entrega 3: IA opcional (futuro)

- [ ] Integração com motor de IA via API
- [ ] Prompts versionados
- [ ] Guardrails anti-determinismo
- [ ] Personalização do plano 90 dias via IA

## Entrega 4: Piloto fechado (futuro)

- [ ] Deploy privado
- [ ] Coleta de feedback

## P0 Bugs (bloqueadores)

- [x] P0: Likert/Big Five não persistem após reload — dados não carregam do DB
- [x] P0: Review mostra "—/5" mesmo com dados existentes no backend
- [x] P0: Submit desabilitado mesmo com seções completas
- [x] P0: Resume session — "Continuar avaliação" voltando ao último step incompleto
- [x] P0: Backend retornar status por seção (counts + missing items)

## P1 Melhorias

- [x] P1-3: Barra de progresso global (% concluído) persistente em todas as telas
- [x] P1-4: Evidências — mínimo 80 chars + exemplo colapsável (situação→ação→impacto)
- [x] P1-5: Microintervenções "ARC ensina a pensar" em cada etapa (por que, armadilha, como)

## P0 Bug #2

- [x] Bug: "Voltar ao início" na tela Submitted leva de volta ao submitted (loop infinito por resume session)
