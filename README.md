# ARC — Sistema de Autoliderança de Carreira

> **"O sistema gera hipóteses, não respostas."**  
> ARC não diz quem você deve ser. Ajuda você a descobrir o que vale testar.

---

## O que é o ARC?

ARC é uma plataforma interativa de desenvolvimento de carreira baseada em autoconhecimento estruturado e raciocínio assistido por IA. O sistema conduz o usuário por módulos progressivos — da análise de agilidades ao plano de ação em 90 dias — sempre entregando **hipóteses estruturadas**, nunca um "destino profissional definitivo".

**O sistema nunca entrega:**
- Profissão definitiva
- Tipo psicológico fechado
- "Propósito final"

**O sistema entrega:**
- Hipóteses estruturadas com raciocínio explícito
- Cruzamentos lógicos entre competências, sentido e mercado
- Plano experimental de 90 dias (modelo 70/20/10)
- Perguntas de validação para o usuário refutar ou confirmar suas hipóteses

---

## Arquitetura Modular

```
CORE ──────► SENTIDO ──────► VOCAÇÃO ──────► AÇÃO ──────► OUTPUT
(Agilidades   (Ikigai          (Trilhas         (Plano        (PDF +
 + Big Five)   estruturado)     plausíveis)      90 dias)      Mapa Mental)
```

Cada módulo é independente mas alimenta o seguinte via `UserProfile` — objeto de dados interno por sessão/usuário.

---

## Módulos

### 1. CORE — Agilidades + Traços de Personalidade

**Agilidades (5 dimensões):**
- Mental, Resultados, Pessoas, Mudanças, Autogestão
- 8–12 perguntas por dimensão (Escala Likert 1–5, 20% invertidas)
- 2–3 perguntas abertas pedindo evidência comportamental

**Output:**
- Radar visual por dimensão
- Top 2 dimensões dominantes → gera Arquétipo
- Score bruto + percentil interno + z-score

**Arquétipos (MVP):**

| Top 2 Dimensões | Arquétipo |
|---|---|
| Mental + Resultados | Explorador Analítico |
| Pessoas + Autogestão | Líder Empático |
| Mudanças + Autogestão | Adaptador Resiliente |
| Resultados + Pessoas | Executor Focado |

> Se `Autogestão < p30` → adicionar tag **"Sob Alta Pressão"**

**Big Five (IPIP):** scores por traço usados como nuance nas hipóteses. Nunca apresentado como "tipo".

---

### 2. SENTIDO — Ikigai Estruturado

**Parte A:** Perguntas abertas sobre energia e sentido → tagging via ESCO/O*NET → ranking 1–5.

**Parte B:** Worksheet dos 4 círculos do Ikigai:
1. Amo
2. Sou bom
3. Mundo precisa
4. Posso ser pago

**Regras:**
- Forçar lista curta (3–5 itens por círculo)
- Gerar cruzamentos parciais e identificar zonas: Paixão, Profissão, Missão, Vocação
- **Nunca** gerar "Centro Ideal" — sempre lista de possibilidades + perguntas de escolha

---

### 3. VOCAÇÃO — Mapeamento de Mercado

**Input:** Tags + Competências + Top 2 Agilidades + Zona escolhida

**Processo:**
1. Mapear para clusters ocupacionais (base O*NET/ESCO)
2. Gerar 3–5 trilhas plausíveis

**Por trilha, retornar:**
- Por que faz sentido (baseado nas respostas do usuário)
- Competências exigidas
- Ambiente típico
- Riscos

**Sempre finalizar com:** *"Qual dessas você testaria nos próximos 90 dias?"*

---

### 4. AÇÃO — Plano 90 dias (70/20/10)

O usuário escolhe 1 trilha. O sistema gera:

| Componente | Peso | Conteúdo |
|---|---|---|
| Experiência | 70% | 3–5 experimentos práticos, divididos por semanas, com métricas simples |
| Pessoas | 20% | Perfis sugeridos para contato/mentoria, com justificativa e validação de coerência |
| Educação | 10% | Livros e cursos sugeridos, com inclusão manual permitida |

**Output final:**
- Cronograma consolidado
- 3 checkpoints de revisão
- Perguntas de revisão quinzenal

---

### 5. OUTPUT — Exportações

**PDF (seções):**
1. Radar de Agilidades
2. Arquétipo narrativo
3. Ikigai (vida + worksheet carreira)
4. Trilhas plausíveis
5. Zona escolhida
6. Plano 90 dias
7. Guia de autoprogressão

**Mapa Mental:**
```
Agilidades → Evidências → Ikigai → Trilhas → Plano 90 dias → Checkpoints
```
Formato compatível com Mermaid e OPML.

---

## Motor de IA — Regras Obrigatórias

A IA **deve:**
1. Gerar 3–5 hipóteses com raciocínio explícito
2. Pedir que o usuário escolha
3. Pedir justificativa da escolha
4. Converter em plano de ação
5. Inserir perguntas de validação

A IA **não pode usar:**
- ❌ "Você deve…"
- ❌ "A profissão ideal é…"
- ❌ "Seu propósito é…"

A IA **sempre usa:**
- ✅ "Hipótese"
- ✅ "Possibilidade"
- ✅ "Teste"

---

## Data Model — UserProfile

```typescript
interface UserProfile {
  id: string;                    // UUID isolado por usuário
  agilitiesScores: {
    mental: number;
    resultados: number;
    pessoas: number;
    mudancas: number;
    autogestao: number;
    percentiles: Record<string, number>;
    zscores: Record<string, number>;
  };
  bigFiveScores: Record<string, number>;
  evidenceStatements: string[];  // Texto sensível — armazenar isolado
  ikigaiInputs: {
    amo: string[];
    souBom: string[];
    mundoPrecisa: string[];
    possoSerPago: string[];
  };
  rankedLists: Record<string, string[]>; // Top 3–5 por categoria
  selectedZone: 'paixao' | 'profissao' | 'missao' | 'vocacao' | null;
  chosenHypothesis: string | null;
  plan90Days: {
    experiencias: Experiment[];
    pessoas: ContactProfile[];
    educacao: EducationItem[];
    checkpoints: Checkpoint[];
  };
  reviewLogs: ReviewLog[];
  consentTimestamp: string;      // LGPD
  anonymizedForAnalytics: boolean;
}
```

> **Regra crítica:** Nunca armazenar dados de forma cruzada entre usuários. Texto sensível deve ser isolado e, se possível, anonimizado para análise agregada.

---

## Segurança e LGPD (Fase Piloto)

- Acesso por convite (invite-only)
- Dados completamente isolados por usuário
- Consentimento explícito antes da coleta
- Política de retenção clara e visível
- Anonimização de dados para analytics agregados
- Textos sensíveis (respostas abertas) separados de dados estruturais

---

## Stack Recomendada (MVP)

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Frontend | Next.js + Tailwind | SSR, DX rápido, Vercel-ready |
| Backend/API | FastAPI (Python) ou Next.js API Routes | Leve, tipado, deploy simples |
| Banco de dados | PostgreSQL (Supabase) | RLS nativo para isolamento por usuário |
| IA | OpenAI API (GPT-4o) ou Anthropic Claude API | Custo/qualidade MVP |
| PDF | WeasyPrint (Python) ou Puppeteer | Geração server-side de qualidade |
| Mapa Mental | Mermaid (render client-side) | Zero dependência externa |
| Autenticação | Supabase Auth ou Clerk | Invite-only com magic link |
| Hosting | Vercel + Supabase Free Tier | Custo zero no piloto |

---

## Estrutura de Pastas (Sugestão)

```
arc/
├── apps/
│   ├── web/                  # Next.js frontend
│   │   ├── components/
│   │   │   ├── modules/      # CORE, SENTIDO, VOCAÇÃO, AÇÃO
│   │   │   ├── charts/       # Radar, gráficos
│   │   │   └── pdf/          # Template de exportação
│   │   └── pages/
│   └── api/                  # FastAPI (opcional, se separado)
├── packages/
│   ├── scoring/              # Lógica de scores, percentis, arquétipos
│   ├── ai-engine/            # Prompts e validações do motor de IA
│   └── pdf-generator/        # Geração de PDF
├── docs/
│   ├── DESIGN_SPEC.md        # Spec completo do produto
│   ├── LGPD.md               # Política de dados
│   └── PROMPTS.md            # Prompts do motor de IA
└── README.md
```

---

## Instalação e Desenvolvimento

```bash
# Clone
git clone https://github.com/seu-org/arc.git
cd arc

# Instalar dependências
npm install   # ou pnpm install

# Variáveis de ambiente
cp .env.example .env.local
# Preencher: DATABASE_URL, OPENAI_API_KEY (ou ANTHROPIC_API_KEY), NEXT_PUBLIC_SUPABASE_URL, etc.

# Subir em desenvolvimento
npm run dev
```

---

## Roadmap MVP

- [ ] Módulo CORE (Agilidades + Arquétipo)
- [ ] Módulo SENTIDO (Ikigai simplificado)
- [ ] Motor de IA gerando hipóteses
- [ ] Módulo VOCAÇÃO (3 trilhas)
- [ ] Módulo AÇÃO (Plano 90 dias)
- [ ] Exportação PDF
- [ ] Exportação Mapa Mental (Mermaid)
- [ ] Sistema de invite + autenticação
- [ ] Analytics anonimizados

---

## Princípios do Produto

> ARC não é um quiz de carreira.  
> É um sistema de pensamento estruturado que respeita a complexidade humana.  
> O usuário sai com mais clareza sobre o que testar — não com uma resposta pronta.

---

## Licença

Privado — uso restrito ao time de desenvolvimento. Não distribuir externamente sem autorização.

---

*Documento mantido pelo time técnico. Última revisão: Q1 2025.*
