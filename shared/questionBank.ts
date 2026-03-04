// ─── CORE: 6 Dimensões de Agilidade ────────────────────────────
// Regra: 8 itens (6 diretos + 2 invertidos) + 2 evidências por dimensão

export interface LikertItem {
  id: string;
  dimension: string;
  text: string;
  reverse: boolean;
}

export interface EvidencePrompt {
  id: string;
  dimension: string;
  text: string;
}

export interface BigFiveItem {
  id: string;
  trait: string;
  text: string;
  reverse: boolean;
}

export const DIMENSIONS = [
  {
    key: "self_management",
    label: "Autogestão",
    description: "Capacidade de operar com consistência mesmo sob pressão, ambiguidade ou imprevistos.",
  },
  {
    key: "mental",
    label: "Agilidade Mental",
    description: "Velocidade de aprender, sintetizar e aplicar frameworks em contextos novos.",
  },
  {
    key: "people",
    label: "Agilidade com Pessoas",
    description: "Capacidade de ler contextos relacionais, adaptar comunicação e construir confiança.",
  },
  {
    key: "change",
    label: "Agilidade com Mudanças",
    description: "Tolerância à ambiguidade e capacidade de navegar instabilidade sem travar.",
  },
  {
    key: "results",
    label: "Agilidade com Resultados",
    description: "Foco, priorização e execução consistente — escolher o que importa e entregar.",
  },
  {
    key: "innovation",
    label: "Agilidade com Inovação",
    description: "Disposição de questionar o status quo e testar hipóteses com recursos limitados.",
  },
] as const;

export type DimensionKey = typeof DIMENSIONS[number]["key"];

export const LIKERT_SCALE = [
  { value: 1, label: "Discordo totalmente" },
  { value: 2, label: "Discordo" },
  { value: 3, label: "Neutro" },
  { value: 4, label: "Concordo" },
  { value: 5, label: "Concordo totalmente" },
] as const;

export const CORE_LIKERT_ITEMS: LikertItem[] = [
  // A) Autogestão
  { id: "sm_1", dimension: "self_management", text: "Eu consigo descrever com clareza meus pontos fortes e fracos no trabalho.", reverse: false },
  { id: "sm_2", dimension: "self_management", text: "Eu costumo refletir sobre como minhas ações impactam outras pessoas.", reverse: false },
  { id: "sm_3", dimension: "self_management", text: "Eu cumpro combinados mesmo quando ninguém está cobrando.", reverse: false },
  { id: "sm_4", dimension: "self_management", text: "Eu reconheço cedo quando estou reagindo emocionalmente e ajusto a forma de agir.", reverse: false },
  { id: "sm_5", dimension: "self_management", text: "Eu consigo manter consistência mesmo com queda de motivação.", reverse: false },
  { id: "sm_6", dimension: "self_management", text: "Eu tenho um método para me organizar e priorizar.", reverse: false },
  { id: "sm_7", dimension: "self_management", text: "Eu geralmente \"vou no feeling\" e só depois percebo que errei na forma de agir.", reverse: true },
  { id: "sm_8", dimension: "self_management", text: "Eu frequentemente deixo coisas importantes para resolver em cima da hora.", reverse: true },

  // B) Agilidade Mental
  { id: "ma_1", dimension: "mental", text: "Eu consigo simplificar problemas complexos em partes claras.", reverse: false },
  { id: "ma_2", dimension: "mental", text: "Eu faço perguntas para entender causas, não só sintomas.", reverse: false },
  { id: "ma_3", dimension: "mental", text: "Eu conecto diferentes áreas/variáveis antes de decidir.", reverse: false },
  { id: "ma_4", dimension: "mental", text: "Eu aprendo rápido quando o tema tem aplicação prática.", reverse: false },
  { id: "ma_5", dimension: "mental", text: "Eu busco melhorar processos sem precisar \"reinventar a roda\".", reverse: false },
  { id: "ma_6", dimension: "mental", text: "Eu consigo gerar alternativas quando o plano original falha.", reverse: false },
  { id: "ma_7", dimension: "mental", text: "Eu prefiro executar sem questionar para evitar complexidade.", reverse: true },
  { id: "ma_8", dimension: "mental", text: "Eu só consigo decidir quando tenho 100% das informações.", reverse: true },

  // C) Agilidade com Pessoas
  { id: "pa_1", dimension: "people", text: "Eu adapto minha comunicação ao perfil da pessoa (técnico vs executivo).", reverse: false },
  { id: "pa_2", dimension: "people", text: "Eu consigo discordar sem gerar atrito desnecessário.", reverse: false },
  { id: "pa_3", dimension: "people", text: "Eu peço e ofereço feedback de forma objetiva.", reverse: false },
  { id: "pa_4", dimension: "people", text: "Eu consigo conduzir conversas difíceis quando necessário.", reverse: false },
  { id: "pa_5", dimension: "people", text: "Eu facilito colaboração entre pessoas com visões diferentes.", reverse: false },
  { id: "pa_6", dimension: "people", text: "Eu consigo escutar de verdade antes de responder.", reverse: false },
  { id: "pa_7", dimension: "people", text: "Eu evito conversas difíceis mesmo quando sei que são necessárias.", reverse: true },
  { id: "pa_8", dimension: "people", text: "Eu frequentemente me frustro por achar que as pessoas \"não entendem o óbvio\".", reverse: true },

  // D) Agilidade com Mudanças
  { id: "ca_1", dimension: "change", text: "Eu me adapto rápido quando prioridades mudam.", reverse: false },
  { id: "ca_2", dimension: "change", text: "Eu consigo separar \"não gosto\" de \"não vou aceitar\".", reverse: false },
  { id: "ca_3", dimension: "change", text: "Eu encontro o que está no meu controle mesmo em cenários ruins.", reverse: false },
  { id: "ca_4", dimension: "change", text: "Eu consigo liderar pequenas mudanças no meu entorno.", reverse: false },
  { id: "ca_5", dimension: "change", text: "Eu consigo manter performance em ambientes instáveis.", reverse: false },
  { id: "ca_6", dimension: "change", text: "Eu busco aprender com mudanças inesperadas.", reverse: false },
  { id: "ca_7", dimension: "change", text: "Mudanças fora do meu controle costumam me travar por muito tempo.", reverse: true },
  { id: "ca_8", dimension: "change", text: "Eu me apego ao plano original mesmo quando fica claro que não faz mais sentido.", reverse: true },

  // E) Agilidade com Resultados
  { id: "ra_1", dimension: "results", text: "Eu priorizo com clareza o que gera mais impacto.", reverse: false },
  { id: "ra_2", dimension: "results", text: "Eu transformo objetivos em entregas e prazos.", reverse: false },
  { id: "ra_3", dimension: "results", text: "Eu tomo decisões mesmo com incerteza moderada.", reverse: false },
  { id: "ra_4", dimension: "results", text: "Eu acompanho progresso com métricas simples.", reverse: false },
  { id: "ra_5", dimension: "results", text: "Eu gosto de resolver problemas com entregas concretas.", reverse: false },
  { id: "ra_6", dimension: "results", text: "Eu consigo dizer \"não\" para proteger o que é prioridade.", reverse: false },
  { id: "ra_7", dimension: "results", text: "Eu começo muitas coisas e termino poucas.", reverse: true },
  { id: "ra_8", dimension: "results", text: "Eu confundo \"estar ocupado\" com \"gerar resultado\".", reverse: true },

  // F) Agilidade com Inovação
  { id: "ia_1", dimension: "innovation", text: "Eu questiono processos mesmo quando eles \"sempre funcionaram assim\".", reverse: false },
  { id: "ia_2", dimension: "innovation", text: "Eu consigo testar uma ideia com poucos recursos antes de escalar.", reverse: false },
  { id: "ia_3", dimension: "innovation", text: "Eu proponho soluções diferentes das óbvias mesmo com risco de errar.", reverse: false },
  { id: "ia_4", dimension: "innovation", text: "Eu aprendo com experimentos que não deram certo sem me travar.", reverse: false },
  { id: "ia_5", dimension: "innovation", text: "Eu consigo agir com 60% das informações quando necessário.", reverse: false },
  { id: "ia_6", dimension: "innovation", text: "Eu abandono intencionalmente o que não funciona para liberar energia para o que importa.", reverse: false },
  { id: "ia_7", dimension: "innovation", text: "Eu prefiro manter o que já funciona a arriscar algo novo.", reverse: true },
  { id: "ia_8", dimension: "innovation", text: "Eu evito propor mudanças para não gerar conflito ou resistência.", reverse: true },
];

export const CORE_EVIDENCE_PROMPTS: EvidencePrompt[] = [
  // A) Autogestão
  { id: "sm_ev1", dimension: "self_management", text: "Conte 1 situação recente em que você mudou de ideia após refletir (o que te fez mudar?)." },
  { id: "sm_ev2", dimension: "self_management", text: "Cite 2 combinados que você cumpre bem e 1 que você tem falhado (e por quê)." },

  // B) Agilidade Mental
  { id: "ma_ev1", dimension: "mental", text: "Dê um exemplo de um problema que você resolveu fazendo boas perguntas." },
  { id: "ma_ev2", dimension: "mental", text: "Cite um processo que você melhorou e qual foi o ganho concreto." },

  // C) Agilidade com Pessoas
  { id: "pa_ev1", dimension: "people", text: "Conte 1 feedback difícil que você deu/recebeu e o que mudou depois." },
  { id: "pa_ev2", dimension: "people", text: "Cite 1 conflito que você ajudou a resolver (como você agiu?)." },

  // D) Agilidade com Mudanças
  { id: "ca_ev1", dimension: "change", text: "Conte uma mudança recente que te afetou e como você se reajustou." },
  { id: "ca_ev2", dimension: "change", text: "O que mais te irrita em mudanças? (e o que você faz com isso?)" },

  // E) Agilidade com Resultados
  { id: "ra_ev1", dimension: "results", text: "Cite 2 entregas repetidas que você faz bem e 1 que você evita." },
  { id: "ra_ev2", dimension: "results", text: "Conte um caso em que você teve que priorizar e o que cortou." },

  // F) Agilidade com Inovação
  { id: "ia_ev1", dimension: "innovation", text: "Descreva uma situação em que você propôs ou implementou algo diferente do padrão." },
  { id: "ia_ev2", dimension: "innovation", text: "Cite um experimento que você tentou e não funcionou — o que aprendeu com ele?" },
];

// ─── Big Five Mini-IPIP ─────────────────────────────────────────

export const BIG_FIVE_TRAITS = [
  { key: "extraversion", label: "Extroversão" },
  { key: "agreeableness", label: "Amabilidade" },
  { key: "conscientiousness", label: "Conscienciosidade" },
  { key: "neuroticism", label: "Neuroticismo" },
  { key: "intellect", label: "Abertura / Intelecto" },
] as const;

export const BIG_FIVE_ITEMS: BigFiveItem[] = [
  // Extraversion
  { id: "bf_e1", trait: "extraversion", text: "Sou a vida da festa.", reverse: false },
  { id: "bf_e2", trait: "extraversion", text: "Falo com muitas pessoas diferentes nas festas.", reverse: false },
  { id: "bf_e3", trait: "extraversion", text: "Não falo muito.", reverse: true },
  { id: "bf_e4", trait: "extraversion", text: "Fico em segundo plano nas festas.", reverse: true },

  // Agreeableness
  { id: "bf_a1", trait: "agreeableness", text: "Simpatizo com os sentimentos dos outros.", reverse: false },
  { id: "bf_a2", trait: "agreeableness", text: "Tenho um coração gentil.", reverse: false },
  { id: "bf_a3", trait: "agreeableness", text: "Não me interesso pelos problemas dos outros.", reverse: true },
  { id: "bf_a4", trait: "agreeableness", text: "Não me importo muito com os outros.", reverse: true },

  // Conscientiousness
  { id: "bf_c1", trait: "conscientiousness", text: "Sigo um cronograma.", reverse: false },
  { id: "bf_c2", trait: "conscientiousness", text: "Gosto de ordem.", reverse: false },
  { id: "bf_c3", trait: "conscientiousness", text: "Frequentemente esqueço de colocar as coisas no lugar.", reverse: true },
  { id: "bf_c4", trait: "conscientiousness", text: "Faço bagunça com as coisas.", reverse: true },

  // Neuroticism
  { id: "bf_n1", trait: "neuroticism", text: "Tenho mudanças frequentes de humor.", reverse: false },
  { id: "bf_n2", trait: "neuroticism", text: "Fico chateado(a) facilmente.", reverse: false },
  { id: "bf_n3", trait: "neuroticism", text: "Estou relaxado(a) a maior parte do tempo.", reverse: true },
  { id: "bf_n4", trait: "neuroticism", text: "Raramente me sinto triste.", reverse: true },

  // Intellect / Imagination
  { id: "bf_i1", trait: "intellect", text: "Tenho uma imaginação vívida.", reverse: false },
  { id: "bf_i2", trait: "intellect", text: "Tenho dificuldade em entender ideias abstratas.", reverse: true },
  { id: "bf_i3", trait: "intellect", text: "Não me interesso por ideias abstratas.", reverse: true },
  { id: "bf_i4", trait: "intellect", text: "Não tenho uma boa imaginação.", reverse: true },
];

// ─── IKIGAI: 4 Círculos ────────────────────────────────────────

export const IKIGAI_CIRCLES = [
  {
    key: "love" as const,
    label: "O que eu amo",
    emoji: "❤️",
    color: "#E74C3C",
    prompts: [
      "Quais 5 atividades você faz e perde a noção do tempo?",
      "Quais temas você consome espontaneamente toda semana?",
    ],
  },
  {
    key: "good_at" as const,
    label: "No que sou bom",
    emoji: "⭐",
    color: "#F39C12",
    prompts: [
      "Quais 5 problemas as pessoas te procuram para resolver?",
      "Quais entregas você já repetiu com consistência (2–3 exemplos)?",
    ],
  },
  {
    key: "world_needs" as const,
    label: "O que o mundo precisa",
    emoji: "🌍",
    color: "#27AE60",
    prompts: [
      "Qual problema humano/social/organizacional mais te indigna?",
      "Que tipo de melhoria você gostaria de ver no seu contexto?",
    ],
  },
  {
    key: "paid_for" as const,
    label: "Pelo que posso ser pago",
    emoji: "💰",
    color: "#2980B9",
    prompts: [
      "Quais 3 tipos de trabalho pagariam por isso hoje?",
      "Qual nível de estabilidade/remuneração você busca no próximo ciclo?",
    ],
  },
] as const;

export type IkigaiCircleKey = typeof IKIGAI_CIRCLES[number]["key"];

export const IKIGAI_ZONES = [
  { key: "passion" as const, label: "Paixão", description: "O que você ama + No que é bom", circles: ["love", "good_at"] },
  { key: "profession" as const, label: "Profissão", description: "No que é bom + Pelo que pode ser pago", circles: ["good_at", "paid_for"] },
  { key: "mission" as const, label: "Missão", description: "O que você ama + O que o mundo precisa", circles: ["love", "world_needs"] },
  { key: "vocation" as const, label: "Vocação", description: "O que o mundo precisa + Pelo que pode ser pago", circles: ["world_needs", "paid_for"] },
] as const;

export type IkigaiZoneKey = typeof IKIGAI_ZONES[number]["key"];


export interface LikertItem {
  id: string;
  dimension: string;
  text: string;
  reverse: boolean;
}

export interface EvidencePrompt {
  id: string;
  dimension: string;
  text: string;
}

export interface BigFiveItem {
  id: string;
  trait: string;
  text: string;
  reverse: boolean;
}

export const DIMENSIONS = [
  {
    key: "self_management",
    label: "Autoconhecimento / Autogestão",
    description: "Capacidade de se conhecer, autorregular e manter consistência mesmo sob pressão.",
  },
  {
    key: "mental_agility",
    label: "Agilidade Mental",
    description: "Capacidade de aprender rápido, simplificar o complexo e gerar alternativas criativas.",
  },
  {
    key: "people_agility",
    label: "Agilidade com Pessoas",
    description: "Capacidade de se comunicar, influenciar e construir relações de forma deliberada.",
  },
  {
    key: "change_agility",
    label: "Agilidade com Mudanças",
    description: "Tolerância à ambiguidade e capacidade de navegar instabilidade sem travar.",
  },
  {
    key: "results_agility",
    label: "Agilidade com Resultados",
    description: "Foco, priorização e capacidade de entregar impacto de forma consistente.",
  },
] as const;

export type DimensionKey = typeof DIMENSIONS[number]["key"];

export const LIKERT_SCALE = [
  { value: 1, label: "Discordo totalmente" },
  { value: 2, label: "Discordo" },
  { value: 3, label: "Neutro" },
  { value: 4, label: "Concordo" },
  { value: 5, label: "Concordo totalmente" },
] as const;

export const CORE_LIKERT_ITEMS: LikertItem[] = [
  // A) Autoconhecimento / Autogestão
  { id: "sm_1", dimension: "self_management", text: "Eu consigo descrever com clareza meus pontos fortes e fracos no trabalho.", reverse: false },
  { id: "sm_2", dimension: "self_management", text: "Eu costumo refletir sobre como minhas ações impactam outras pessoas.", reverse: false },
  { id: "sm_3", dimension: "self_management", text: "Eu cumpro combinados mesmo quando ninguém está cobrando.", reverse: false },
  { id: "sm_4", dimension: "self_management", text: "Eu reconheço cedo quando estou reagindo emocionalmente e ajusto a forma de agir.", reverse: false },
  { id: "sm_5", dimension: "self_management", text: "Eu consigo manter consistência mesmo com queda de motivação.", reverse: false },
  { id: "sm_6", dimension: "self_management", text: "Eu tenho um método para me organizar e priorizar.", reverse: false },
  { id: "sm_7", dimension: "self_management", text: "Eu geralmente \"vou no feeling\" e só depois percebo que errei na forma de agir.", reverse: true },
  { id: "sm_8", dimension: "self_management", text: "Eu frequentemente deixo coisas importantes para resolver em cima da hora.", reverse: true },

  // B) Agilidade Mental
  { id: "ma_1", dimension: "mental_agility", text: "Eu consigo simplificar problemas complexos em partes claras.", reverse: false },
  { id: "ma_2", dimension: "mental_agility", text: "Eu faço perguntas para entender causas, não só sintomas.", reverse: false },
  { id: "ma_3", dimension: "mental_agility", text: "Eu conecto diferentes áreas/variáveis antes de decidir.", reverse: false },
  { id: "ma_4", dimension: "mental_agility", text: "Eu aprendo rápido quando o tema tem aplicação prática.", reverse: false },
  { id: "ma_5", dimension: "mental_agility", text: "Eu busco melhorar processos sem precisar \"reinventar a roda\".", reverse: false },
  { id: "ma_6", dimension: "mental_agility", text: "Eu consigo gerar alternativas quando o plano original falha.", reverse: false },
  { id: "ma_7", dimension: "mental_agility", text: "Eu prefiro executar sem questionar para evitar complexidade.", reverse: true },
  { id: "ma_8", dimension: "mental_agility", text: "Eu só consigo decidir quando tenho 100% das informações.", reverse: true },

  // C) Agilidade com Pessoas
  { id: "pa_1", dimension: "people_agility", text: "Eu adapto minha comunicação ao perfil da pessoa (técnico vs executivo).", reverse: false },
  { id: "pa_2", dimension: "people_agility", text: "Eu consigo discordar sem gerar atrito desnecessário.", reverse: false },
  { id: "pa_3", dimension: "people_agility", text: "Eu peço e ofereço feedback de forma objetiva.", reverse: false },
  { id: "pa_4", dimension: "people_agility", text: "Eu consigo conduzir conversas difíceis quando necessário.", reverse: false },
  { id: "pa_5", dimension: "people_agility", text: "Eu facilito colaboração entre pessoas com visões diferentes.", reverse: false },
  { id: "pa_6", dimension: "people_agility", text: "Eu consigo escutar de verdade antes de responder.", reverse: false },
  { id: "pa_7", dimension: "people_agility", text: "Eu evito conversas difíceis mesmo quando sei que são necessárias.", reverse: true },
  { id: "pa_8", dimension: "people_agility", text: "Eu frequentemente me frustro por achar que as pessoas \"não entendem o óbvio\".", reverse: true },

  // D) Agilidade com Mudanças
  { id: "ca_1", dimension: "change_agility", text: "Eu me adapto rápido quando prioridades mudam.", reverse: false },
  { id: "ca_2", dimension: "change_agility", text: "Eu consigo separar \"não gosto\" de \"não vou aceitar\".", reverse: false },
  { id: "ca_3", dimension: "change_agility", text: "Eu encontro o que está no meu controle mesmo em cenários ruins.", reverse: false },
  { id: "ca_4", dimension: "change_agility", text: "Eu consigo liderar pequenas mudanças no meu entorno.", reverse: false },
  { id: "ca_5", dimension: "change_agility", text: "Eu consigo manter performance em ambientes instáveis.", reverse: false },
  { id: "ca_6", dimension: "change_agility", text: "Eu busco aprender com mudanças inesperadas.", reverse: false },
  { id: "ca_7", dimension: "change_agility", text: "Mudanças fora do meu controle costumam me travar por muito tempo.", reverse: true },
  { id: "ca_8", dimension: "change_agility", text: "Eu me apego ao plano original mesmo quando fica claro que não faz mais sentido.", reverse: true },

  // E) Agilidade com Resultados
  { id: "ra_1", dimension: "results_agility", text: "Eu priorizo com clareza o que gera mais impacto.", reverse: false },
  { id: "ra_2", dimension: "results_agility", text: "Eu transformo objetivos em entregas e prazos.", reverse: false },
  { id: "ra_3", dimension: "results_agility", text: "Eu tomo decisões mesmo com incerteza moderada.", reverse: false },
  { id: "ra_4", dimension: "results_agility", text: "Eu acompanho progresso com métricas simples.", reverse: false },
  { id: "ra_5", dimension: "results_agility", text: "Eu gosto de resolver problemas com entregas concretas.", reverse: false },
  { id: "ra_6", dimension: "results_agility", text: "Eu consigo dizer \"não\" para proteger o que é prioridade.", reverse: false },
  { id: "ra_7", dimension: "results_agility", text: "Eu começo muitas coisas e termino poucas.", reverse: true },
  { id: "ra_8", dimension: "results_agility", text: "Eu confundo \"estar ocupado\" com \"gerar resultado\".", reverse: true },
];

export const CORE_EVIDENCE_PROMPTS: EvidencePrompt[] = [
  // A) Autoconhecimento / Autogestão
  { id: "sm_ev1", dimension: "self_management", text: "Conte 1 situação recente em que você mudou de ideia após refletir (o que te fez mudar?)." },
  { id: "sm_ev2", dimension: "self_management", text: "Cite 2 combinados que você cumpre bem e 1 que você tem falhado (e por quê)." },

  // B) Agilidade Mental
  { id: "ma_ev1", dimension: "mental_agility", text: "Dê um exemplo de um problema que você resolveu fazendo boas perguntas." },
  { id: "ma_ev2", dimension: "mental_agility", text: "Cite um processo que você melhorou e qual foi o ganho concreto." },

  // C) Agilidade com Pessoas
  { id: "pa_ev1", dimension: "people_agility", text: "Conte 1 feedback difícil que você deu/recebeu e o que mudou depois." },
  { id: "pa_ev2", dimension: "people_agility", text: "Cite 1 conflito que você ajudou a resolver (como você agiu?)." },

  // D) Agilidade com Mudanças
  { id: "ca_ev1", dimension: "change_agility", text: "Conte uma mudança recente que te afetou e como você se reajustou." },
  { id: "ca_ev2", dimension: "change_agility", text: "O que mais te irrita em mudanças? (e o que você faz com isso?)" },

  // E) Agilidade com Resultados
  { id: "ra_ev1", dimension: "results_agility", text: "Descreva uma entrega recente de alto impacto (o que você fez diferente?)." },
  { id: "ra_ev2", dimension: "results_agility", text: "Cite uma prioridade que você abandonou conscientemente (e por quê foi certo?)." },
];

// ─── Big Five Mini-IPIP ─────────────────────────────────────────

export const BIG_FIVE_TRAITS = [
  { key: "extraversion", label: "Extroversão" },
  { key: "agreeableness", label: "Amabilidade" },
  { key: "conscientiousness", label: "Conscienciosidade" },
  { key: "neuroticism", label: "Neuroticismo" },
  { key: "intellect", label: "Abertura / Intelecto" },
] as const;

export const BIG_FIVE_ITEMS: BigFiveItem[] = [
  // Extraversion
  { id: "bf_e1", trait: "extraversion", text: "Sou a vida da festa.", reverse: false },
  { id: "bf_e2", trait: "extraversion", text: "Falo com muitas pessoas diferentes nas festas.", reverse: false },
  { id: "bf_e3", trait: "extraversion", text: "Não falo muito.", reverse: true },
  { id: "bf_e4", trait: "extraversion", text: "Fico em segundo plano nas festas.", reverse: true },

  // Agreeableness
  { id: "bf_a1", trait: "agreeableness", text: "Simpatizo com os sentimentos dos outros.", reverse: false },
  { id: "bf_a2", trait: "agreeableness", text: "Tenho um coração gentil.", reverse: false },
  { id: "bf_a3", trait: "agreeableness", text: "Não me interesso pelos problemas dos outros.", reverse: true },
  { id: "bf_a4", trait: "agreeableness", text: "Não me importo muito com os outros.", reverse: true },

  // Conscientiousness
  { id: "bf_c1", trait: "conscientiousness", text: "Sigo um cronograma.", reverse: false },
  { id: "bf_c2", trait: "conscientiousness", text: "Gosto de ordem.", reverse: false },
  { id: "bf_c3", trait: "conscientiousness", text: "Frequentemente esqueço de colocar as coisas no lugar.", reverse: true },
  { id: "bf_c4", trait: "conscientiousness", text: "Faço bagunça com as coisas.", reverse: true },

  // Neuroticism
  { id: "bf_n1", trait: "neuroticism", text: "Tenho mudanças frequentes de humor.", reverse: false },
  { id: "bf_n2", trait: "neuroticism", text: "Fico chateado(a) facilmente.", reverse: false },
  { id: "bf_n3", trait: "neuroticism", text: "Estou relaxado(a) a maior parte do tempo.", reverse: true },
  { id: "bf_n4", trait: "neuroticism", text: "Raramente me sinto triste.", reverse: true },

  // Intellect / Imagination
  { id: "bf_i1", trait: "intellect", text: "Tenho uma imaginação vívida.", reverse: false },
  { id: "bf_i2", trait: "intellect", text: "Tenho dificuldade em entender ideias abstratas.", reverse: true },
  { id: "bf_i3", trait: "intellect", text: "Não me interesso por ideias abstratas.", reverse: true },
  { id: "bf_i4", trait: "intellect", text: "Não tenho uma boa imaginação.", reverse: true },
];

// ─── IKIGAI: 4 Círculos ────────────────────────────────────────

export const IKIGAI_CIRCLES = [
  {
    key: "love" as const,
    label: "O que eu amo",
    emoji: "❤️",
    color: "#E74C3C",
    prompts: [
      "Quais 5 atividades você faz e perde a noção do tempo?",
      "Quais temas você consome espontaneamente toda semana?",
    ],
  },
  {
    key: "good_at" as const,
    label: "No que sou bom",
    emoji: "⭐",
    color: "#F39C12",
    prompts: [
      "Quais 5 problemas as pessoas te procuram para resolver?",
      "Quais entregas você já repetiu com consistência (2–3 exemplos)?",
    ],
  },
  {
    key: "world_needs" as const,
    label: "O que o mundo precisa",
    emoji: "🌍",
    color: "#27AE60",
    prompts: [
      "Qual problema humano/social/organizacional mais te indigna?",
      "Que tipo de melhoria você gostaria de ver no seu contexto?",
    ],
  },
  {
    key: "paid_for" as const,
    label: "Pelo que posso ser pago",
    emoji: "💰",
    color: "#2980B9",
    prompts: [
      "Quais 3 tipos de trabalho pagariam por isso hoje?",
      "Qual nível de estabilidade/remuneração você busca no próximo ciclo?",
    ],
  },
] as const;

export type IkigaiCircleKey = typeof IKIGAI_CIRCLES[number]["key"];

export const IKIGAI_ZONES = [
  { key: "passion" as const, label: "Paixão", description: "O que você ama + No que é bom", circles: ["love", "good_at"] },
  { key: "profession" as const, label: "Profissão", description: "No que é bom + Pelo que pode ser pago", circles: ["good_at", "paid_for"] },
  { key: "mission" as const, label: "Missão", description: "O que você ama + O que o mundo precisa", circles: ["love", "world_needs"] },
  { key: "vocation" as const, label: "Vocação", description: "O que o mundo precisa + Pelo que pode ser pago", circles: ["world_needs", "paid_for"] },
] as const;

export type IkigaiZoneKey = typeof IKIGAI_ZONES[number]["key"];
